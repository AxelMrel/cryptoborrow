/** Montant en euros entier strictement positif, sinon null. */
export function parseAmount(v: FormDataEntryValue | null, max = 10_000_000): number | null {
  const s = String(v ?? "").replace(/\s/g, "");
  if (!/^\d{1,12}$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n <= max ? n : null;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
