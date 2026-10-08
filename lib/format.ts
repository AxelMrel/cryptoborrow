import type { TxType, WithdrawalCode } from "./types";

const nf = new Intl.NumberFormat("fr-FR");
export const fcfa = (n: number) => `${nf.format(Math.round(n))} FCFA`;
export const num = (n: number) => nf.format(n);

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso)) + " UTC";

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
