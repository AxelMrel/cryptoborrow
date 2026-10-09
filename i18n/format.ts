import { intlLocale, type Locale } from "./config";

/** Montant en euros, ex. "10 000 €" (fr) ou "€10,000" (en). */
export const money = (n: number, locale: Locale) =>
  new Intl.NumberFormat(intlLocale(locale), { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Math.round(n));

export const num = (n: number, locale: Locale) => new Intl.NumberFormat(intlLocale(locale)).format(n);

/** Prix en euros : peu de décimales pour les grosses valeurs, davantage pour les petites cryptos. */
export const formatEuro = (n: number, locale: Locale) =>
  new Intl.NumberFormat(intlLocale(locale), { style: "currency", currency: "EUR", maximumFractionDigits: n >= 100 ? 0 : n >= 1 ? 2 : 4 }).format(n);

export const formatPrice = (p: number, locale: Locale) =>
  new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: p >= 100 ? 2 : p >= 1 ? 3 : 5, minimumFractionDigits: p >= 100 ? 2 : 0 }).format(p);

/** Date et heure UTC, ex. "09/10/2026 07:12 UTC". */
export const dateTime = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso)) + " UTC";

/** Date courte pour les tableaux serrés : "09/10 07:12" (UTC). */
export const dateShort = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)} ${iso.slice(11, 16)}`;

/** Remplace {nom} par sa valeur : fmt("Bonjour {name}", { name: "Awa" }). */
export const fmt = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

/** Statut affiché d'un code : un code actif mais dépassé est présenté comme expiré. */
export function codeStatus(c: { status: "active" | "used" | "expired"; expires_at: string }, now = Date.now()) {
  return c.status === "active" && new Date(c.expires_at).getTime() <= now ? "expired" : c.status;
}
