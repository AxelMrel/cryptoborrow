import type { TxType, WithdrawalCode } from "./types";

const nf = new Intl.NumberFormat("fr-FR");
const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
export const money = (n: number) => eur.format(Math.round(n));
export const num = (n: number) => nf.format(n);

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso)) + " UTC";

/** Date courte pour les tableaux serrés : "09/10 06:59" (UTC). */
export const dateShort = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)} ${iso.slice(11, 16)}`;

export const TX_LABEL: Record<TxType, string> = {
  deposit: "Dépôt",
  withdrawal: "Retrait",
  client_credit: "Crédit client",
  admin_credit: "Crédits admin",
  admin_fee: "Frais code retrait",
};

/** Statut affiché : un code actif mais dépassé est présenté comme expiré. */
export function codeStatus(c: Pick<WithdrawalCode, "status" | "expires_at">, now = Date.now()) {
  return c.status === "active" && new Date(c.expires_at).getTime() <= now ? "expired" : c.status;
}
