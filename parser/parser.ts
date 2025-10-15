import { RX } from "./regex";
import { normalizeDob, normalizeDate, clean } from "./normalizers";
import type { ParsedDoc, Visit, OwnerCandidate } from "./types";

export function parseNoteV4(raw: string, keepRaw = false): ParsedDoc {
  const owners = extractOwners(raw);
  const pets = extractPetsFlexible(raw);
  const out: ParsedDoc = { owners, pets };
  if (keepRaw) out.raw = raw;
  return out;
}

// ------- owners (come già fatto prima) -------
function extractOwners(raw: string): OwnerCandidate[] {
  const header = raw.slice(0, 900);
  const cfMatches = Array.from(header.matchAll(RX.cf));
  const emailMatches = Array.from(header.matchAll(RX.email));
  const phoneMatches = Array.from(header.matchAll(RX.phone));
  const tokens = [...cfMatches, ...emailMatches, ...phoneMatches].sort(
    (a, b) => (a.index || 0) - (b.index || 0)
  );

  const owners: OwnerCandidate[] = [];
  for (const t of tokens) {
    const idx = t.index ?? 0;
    const win = header.slice(Math.max(0, idx - 160), idx + 180);
    const name = bestNameAround(win);
    const cf =
      nearestCF(win) ||
      (t[0].length === 16 && /^[A-Z]/.test(t[0]) ? t[0] : undefined);
    const emails = Array.from(win.matchAll(RX.email)).map((m) => m[0]);
    const phones = Array.from(win.matchAll(RX.phone)).map((m) => m[0]);
    const address = findAddress(header);

    const existingIdx = owners.findIndex(
      (o) =>
        (cf && o.taxCode === cf) ||
        (name && o.fullName === name) ||
        (emails.length && o.emails?.some((e) => emails.includes(e))) ||
        (phones.length && o.phones?.some((p) => phones.includes(p)))
    );

    const oc: OwnerCandidate = {
      fullName: name || undefined,
      taxCode: cf || undefined,
      emails: dedup([...(owners[existingIdx]?.emails || []), ...emails]),
      phones: dedup([...(owners[existingIdx]?.phones || []), ...phones]),
      address: address || owners[existingIdx]?.address,
    };

    if (existingIdx >= 0)
      owners[existingIdx] = { ...owners[existingIdx], ...oc };
    else owners.push(oc);
  }

  const tr = header.match(RX.transfer);
  if (tr) {
    const startDate = tr[2] && tr[3] ? `${tr[3]}-${tr[2]}-01` : undefined;
    const newName = tr[5];
    const ex = owners.find(
      (o) => o.fullName?.toLowerCase() === newName.toLowerCase()
    );
    if (ex) {
      ex.role = "primary";
      ex.startDate = startDate;
    } else {
      owners.push({ fullName: newName, role: "primary", startDate });
    }
  }
  if (!owners.some((o) => o.role === "primary") && owners.length)
    owners[0].role = "primary";
  return owners;
}
function bestNameAround(text: string): string | undefined {
  const matches = Array.from(text.matchAll(RX.name2)).map((m) => m[0]);
  if (!matches.length) return undefined;
  const good = matches.find((s) => /[A-Z][a-z]/.test(s));
  return good || matches[0];
}
function nearestCF(text: string): string | undefined {
  const m = text.match(/[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]/);
  return m?.[0];
}
function findAddress(text: string): string | undefined {
  const head = text;
  const street =
    /(\b(v\.?|via|viale|piazza|p\.?zza|p\.za|corso|c\.?so|largo|l\.?go|vicolo|vico|strada|s\.?da|piazzale|p\.?le)\b)/gi;
  const stops = [
    /(?:\+?39)?\s?3\d{8,10}/,
    /[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]/,
    /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/,
    /(\bGT|\bCT|\bCG|\bCN)\s+/,
    /\b\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4}\b/,
  ];
  const candidates: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = street.exec(head)) !== null) {
    const start = m.index;
    const slice = head.slice(start, start + 180);
    let end = slice.length;
    for (const st of stops) {
      const sm = st.exec(slice);
      if (sm && sm.index < end) end = sm.index;
      st.lastIndex = 0;
    }
    let cand = slice
      .slice(0, end)
      .replace(/^v\./i, "Via")
      .replace(/^c\.?\s?so/i, "Corso")
      .replace(/^p\.?zza/i, "Piazza")
      .replace(/^p\.?le/i, "P.le");
    cand = cand.replace(/[\s\t]{2,}/g, " ").trim();
    if (
      /\d+/.test(cand) &&
      cand.length <= 120 &&
      cand.length >= 8 &&
      cand.indexOf("@") === -1
    ) {
      candidates.push(cand);
    }
  }
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

// ------- pets (header flessibile) -------
function extractPetsFlexible(raw: string): ParsedDoc["pets"] {
  const parts = raw.split(/\n(?=\s*(GT|CT|CG|CN)\b)/i);
  const pets: ParsedDoc["pets"] = [];
  for (const part of parts) {
    const firstLine = part.split(/\n/)[0]?.trim() || "";
    if (!RX.codePrefix.test(firstLine)) continue;

    const header = parsePetHeaderFlexible(firstLine);
    if (!header) continue;

    const microchip = (part.match(RX.microchip) || [])[0];
    const sterilized = detectSterilization(firstLine);
    const visits = extractVisits(part);

    pets.push({
      name: header.name,
      species: header.species,
      breed: header.breed,
      sex: header.sex,
      dob: header.dob,
      color: header.color,
      sterilized,
      microchip,
      visits,
    });
  }
  return pets;
}

function parsePetHeaderFlexible(line: string): {
  species?: string;
  sex?: string;
  breed?: string;
  name?: string;
  dob?: string;
  color?: string;
} | null {
  const codeM = line.match(RX.codePrefix);
  if (!codeM) return null;
  const code = codeM[1].toUpperCase();
  const species = code.startsWith("G") ? "Gatto" : "Cane";
  const rest = line.slice(codeM[0].length).trim();

  const sexM = rest.match(RX.sexAny);
  const sex = sexM ? sexM[1].toUpperCase() : undefined;
  const posSexEnd = sexM ? sexM.index! + sexM[0].length : -1;

  const dateM = rest.match(RX.dateAny);
  const posDateStart = dateM ? dateM.index ?? -1 : -1;
  const posDateEnd = dateM ? dateM.index! + dateM[0].length : -1;
  const dob = dateM ? normalizeDob(dateM[0]) : undefined;

  const before = posDateStart >= 0 ? rest.slice(0, posDateStart) : rest;
  const after = posDateEnd >= 0 ? rest.slice(posDateEnd) : "";

  const color = before.match(RX.colorWord)
    ? before.slice(before.search(RX.colorWord)).trim()
    : after.match(RX.colorWord)
    ? after.slice(after.search(RX.colorWord)).trim()
    : undefined;

  let name: string | undefined;
  if (after) {
    const cut = cutAtKeywords(after);
    const nm = (cut.match(RX.nameChunk) || [])[0];
    if (nm) name = nm.trim();
  }
  if (
    !name &&
    posSexEnd >= 0 &&
    posDateStart >= 0 &&
    posSexEnd < posDateStart
  ) {
    const mid = rest.slice(posSexEnd, posDateStart);
    const stopAtColor = cutAtColor(mid);
    const chunks = stopAtColor.trim().split(/\s+/);
    if (chunks.length) {
      const parenIdx = stopAtColor.indexOf("(");
      if (parenIdx >= 0) {
        const endP = stopAtColor.indexOf(")");
        name = stopAtColor
          .slice(
            parenIdx > 0 ? stopAtColor.lastIndexOf(" ", parenIdx - 1) + 1 : 0,
            endP > parenIdx ? endP + 1 : undefined
          )
          .trim();
      } else {
        name = chunks.slice(-2).join(" ").trim();
      }
    }
  }

  let breed: string | undefined;
  const baseForBreed = posDateStart >= 0 ? rest.slice(0, posDateStart) : rest;
  if (name) {
    const idx = baseForBreed.toLowerCase().lastIndexOf(name.toLowerCase());
    const slice = idx > 0 ? baseForBreed.slice(0, idx) : baseForBreed;
    breed = clean(removeSex(slice));
  } else {
    breed = clean(removeSex(baseForBreed.split(/\s+/).slice(0, 4).join(" ")));
  }

  return {
    species,
    sex,
    breed,
    name,
    dob,
    color: color ? clean(color) : undefined,
  };
}

function removeSex(s: string) {
  return s.replace(/\b(M|F)\b/gi, "").trim();
}
function cutAtColor(s: string) {
  const m = s.match(RX.colorWord);
  return m ? s.slice(0, m.index) : s;
}
function cutAtKeywords(s: string) {
  const m = s.match(/\b(STERILIZZAT[OA]|CASTRAT[OA]|INTERO|certa|incerta)\b/i);
  return m ? s.slice(0, m.index) : s;
}
function detectSterilization(line: string): boolean | undefined {
  const m = line.match(RX.steril);
  if (!m) return undefined;
  return m[1].toUpperCase() !== "INTERO";
}

// ------- visite -------
function extractVisits(block: string): Visit[] {
  const lines = block.split(/\n/);
  const visits: Visit[] = [];
  let current: {
    date?: string;
    desc: string[];
    exams: string[];
    prescr: string[];
    raw: string[];
    inExam: boolean;
  } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (current) current.raw.push(rawLine);
      continue;
    }
    if (RX.dateLine.test(line)) {
      if (current) visits.push(toVisit(current));
      current = {
        date: normalizeDate(line),
        desc: [],
        exams: [],
        prescr: [],
        raw: [rawLine],
        inExam: false,
      };
      continue;
    }
    if (!current) continue;

    if (RX.prescr.test(line)) {
      current.inExam = false;
      current.prescr.push(line);
      current.raw.push(rawLine);
      continue;
    }
    if (RX.examStart.test(line)) {
      current.inExam = true;
      current.exams.push(line);
      current.raw.push(rawLine);
      continue;
    }
    if (current.inExam) {
      current.exams.push(line);
      current.raw.push(rawLine);
      continue;
    }

    current.desc.push(line);
    current.raw.push(rawLine);
  }
  if (current) visits.push(toVisit(current));
  return visits;
}
function toVisit(s: {
  date?: string;
  desc: string[];
  exams: string[];
  prescr: string[];
  raw: string[];
  inExam: boolean;
}): Visit {
  return {
    visitedAt: s.date,
    description: s.desc.join("\n").trim(),
    examsText: s.exams.length ? s.exams.join("\n").trim() : undefined,
    prescriptionsText: s.prescr.length ? s.prescr.join("\n").trim() : undefined,
    rawText: s.raw.join("\n"),
  };
}

// helpers
function dedup<T>(arr: T[]): T[] {
  return Array.from(new Set(arr.filter(Boolean) as any)) as any;
}
