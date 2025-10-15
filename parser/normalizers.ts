import { RX } from "./regex";

export function normalizeDate(s: string): string | undefined {
  // prova prima con la regex "loose" (con gruppi), poi con "dateLine"
  const m = s.match(RX.dateLoose) || s.match(RX.dateLine);
  if (!m) return undefined;

  const dRaw = m[1] ?? "";
  const moRaw = m[2] ?? "";
  const yRaw = m[3] ?? "";
  if (!dRaw || !moRaw || !yRaw) return undefined;

  const d = dRaw.padStart(2, "0");
  const mo = moRaw.padStart(2, "0");
  const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
  return `${y}-${mo}-${d}`;
}

export function normalizeDob(s: string): string | undefined {
  // supporta 1–2 cifre per giorno/mese
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m1) {
    const [, d, mo, y] = m1;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const m2 = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m2) {
    const [, mo, year] = m2;
    return `${year}-${mo.padStart(2, "0")}-01`;
  }
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  return undefined;
}

export function clean(s?: string) {
  return s?.replace(/[ \t]{2,}/g, " ").trim();
}
