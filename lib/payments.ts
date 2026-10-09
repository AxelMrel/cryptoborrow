import "server-only";
import { headers } from "next/headers";
import { callRpc } from "@/lib/rpc";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTransaction, generatePaymentUrl, retrieveTransaction, toSettleStatus } from "@/lib/fedapay";
import type { PaymentKind } from "@/lib/types";
import { withLocale, type Locale } from "@/i18n/config";

/** URL publique du site (callback FedaPay). NEXT_PUBLIC_SITE_URL est prioritaire : on évite de se fier à l'en-tête Host. */
async function siteOrigin() {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fixed) return fixed;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export type CheckoutError = "MIGRATION" | "NOT_FOUND" | "CLIENT_PENDING" | "INVALID_AMOUNT" | "FAILED";

const DESCRIPTION: Record<"client_creation" | "withdrawal_code", string> = {
  client_creation: "CoinPulse - creation d'un client",
  withdrawal_code: "CoinPulse - code de retrait",
};

/**
 * Ouvre un paiement et renvoie l'adresse de la page de paiement FedaPay.
 * Le MONTANT est décidé par la base (table settings) : ni le navigateur ni ce code ne le choisissent.
 * Aucun effet métier ici : le client n'est activé / le code n'est généré qu'au règlement du paiement.
 */
export async function createFeeCheckout(
  admin: { id: string; email: string; full_name: string },
  kind: "client_creation" | "withdrawal_code",
  targetClientId: string,
  locale: Locale,
  codeAmount: number | null = null,
): Promise<{ ok: true; url: string } | { ok: false; error: CheckoutError }> {
  const created = await callRpc("rpc_create_fee_payment", {
    p_user: admin.id, p_kind: kind, p_target: targetClientId, p_code_amount: codeAmount,
  });
  if (!created.ok) {
    const e = created.error;
    if (e === "SERVER") return { ok: false, error: "MIGRATION" };
    if (e === "NOT_FOUND" || e === "CLIENT_PENDING" || e === "INVALID_AMOUNT") return { ok: false, error: e };
    return { ok: false, error: "FAILED" };
  }

  try {
    const [firstname, ...rest] = admin.full_name.trim().split(/\s+/);
    const tx = await createTransaction({
      description: DESCRIPTION[kind],
      amountXof: Number(created.amount_xof),
      callbackUrl: `${await siteOrigin()}${withLocale(locale, "/dashboard/admin/payment/return")}`,
      customer: { firstname, lastname: rest.join(" ") || firstname, email: admin.email },
    });
    const attached = await callRpc("rpc_attach_fedapay", { p_payment: String(created.id), p_fedapay_id: tx.id });
    if (!attached.ok) return { ok: false, error: "FAILED" };
    return { ok: true, url: await generatePaymentUrl(tx.id) };
  } catch (e) {
    console.error("[checkout]", e instanceof Error ? e.message : e);
    return { ok: false, error: "FAILED" };
  }
}

export type SettleResult =
  | { state: "approved"; kind: PaymentKind; paymentId: string; targetClientId: string | null; already: boolean }
  | { state: "pending" | "declined" | "canceled"; kind: PaymentKind }
  | { state: "unknown" | "error" };

/**
 * Relit la transaction chez FedaPay (source de vérité) puis règle le paiement en base, de façon atomique
 * et idempotente. Appelée par la page de retour ET par le webhook : les deux chemins sont équivalents,
 * et aucun ne fait confiance aux paramètres reçus du navigateur ou de l'appelant.
 *
 * @param ownerId si fourni, le paiement doit appartenir à cet utilisateur (page de retour).
 */
export async function settleFromFedaPay(fedapayId: number, ownerId?: string): Promise<SettleResult> {
  if (!Number.isInteger(fedapayId) || fedapayId <= 0) return { state: "unknown" };

  const sb = createAdminClient();
  const { data: payment } = await sb.from("payments").select("id,user_id").eq("fedapay_id", fedapayId).maybeSingle();
  if (!payment || (ownerId && payment.user_id !== ownerId)) return { state: "unknown" };

  try {
    const tx = await retrieveTransaction(fedapayId);
    const r = await callRpc("rpc_settle_payment", {
      p_fedapay_id: fedapayId, p_status: toSettleStatus(tx.status), p_amount_xof: tx.amount,
    });
    if (!r.ok) return { state: "error" };
    const kind = r.kind as PaymentKind;
    const status = r.status as "approved" | "declined" | "canceled" | "pending";
    return status === "approved"
      ? { state: "approved", kind, paymentId: String(r.payment), targetClientId: (r.target as string | null) ?? null, already: Boolean(r.already) }
      : { state: status, kind };
  } catch (e) {
    console.error("[settle]", e instanceof Error ? e.message : e);
    return { state: "error" };
  }
}
