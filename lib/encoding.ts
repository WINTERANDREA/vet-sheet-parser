// lib/encoding.ts
import jschardet from "jschardet";
import iconv from "iconv-lite";

/**
 * Decodifica un Buffer in UTF-8 tentando prima UTF-8, poi l'encoding rilevato,
 * con fallback sensati (win1252/latin1).
 */
export function decodeToUtf8(buf: Buffer): string {
  // UTF-8 BOM
  if (
    buf.length >= 3 &&
    buf[0] === 0xef &&
    buf[1] === 0xbb &&
    buf[2] === 0xbf
  ) {
    return buf.toString("utf8");
  }

  // Prova UTF-8 “secca”. Se compaiono � (U+FFFD), non è UTF-8 valido.
  const utf8 = buf.toString("utf8");
  if (!utf8.includes("\uFFFD")) return utf8;

  // Rileva encoding
  const det = jschardet.detect(buf);
  let enc = (det.encoding || "").toLowerCase();

  // Normalizza etichette comuni
  if (!enc || enc === "ascii" || enc.includes("utf-8")) enc = "utf-8";
  if (enc.startsWith("iso-8859")) enc = "latin1";
  if (enc === "windows-1252" || enc === "cp1252") enc = "win1252";

  try {
    const decoded = iconv.decode(buf, enc);
    if (!decoded.includes("\uFFFD")) return decoded;
  } catch {
    /* ignore and fallback */
  }

  // Fallback pragmatici
  try {
    const cp = iconv.decode(buf, "win1252");
    if (!cp.includes("\uFFFD")) return cp;
  } catch {}
  try {
    const l1 = iconv.decode(buf, "latin1");
    if (!l1.includes("\uFFFD")) return l1;
  } catch {}

  // Ultimo fallback: quello “sbagliato”, ma almeno non crasha
  return utf8;
}
