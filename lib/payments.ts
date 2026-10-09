import "server-only";
import { headers } from "next/headers";
import { callRpc } from "@/lib/rpc";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTransaction, eurToXof, generatePaymentUrl, retrieveTransaction, toSettleStatus } from "@/lib/fedapay";
import type { Plan } from "@/lib/types";
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

export type CheckoutError = "UNAVAILABLE" | "MIGRATION" | "FAILED";

/**
 * Prépare un paiement : enregistre un paiement "en attente", crée la transaction chez FedaPay,
 * puis renvoie l'adresse de la page de paiement. Les crédits ne sont PAS accordés ici.
 */
export async function createCheckout(
  admin: { id: string; email: string; full_name: string },
  plan: Plan,
  locale: Locale,
): Promise<{ ok: true; url: string } | { ok: false; error: CheckoutError }> {
  const amountXof = eurToXof(plan.price);

  const created = await callRpc("rpc_create_payment", {
    p_user: admin.id, p_plan: plan.id, p_amount_eur: plan.price, p_amount_xof: amountXof,
    p_credits: plan.credits, p_max_clients: plan.max_clients,
  });
  if (!created.ok) return { ok: false, error: created.error === "SERVER" ? "MIGRATION" : "FAILED" };

  try {
    const [firstname, ...rest] = admin.full_name.trim().split(/\s+/);
    const tx = await createTransaction({
      description: `CoinPulse - pack ${plan.name}`,
      amountXof,
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
  | { state: "approved"; credits: number; already: boolean }
  | { state: "pending" | "declined" | "canceled" }
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
  const { data: payment } = await sb.from("payments").select("id,user_id,credits,status").eq("fedapay_id", fedapayId).maybeSingle();
  if (!payment || (ownerId && payment.user_id !== ownerId)) return { state: "unknown" };

  try {
    const tx = await retrieveTransaction(fedapayId);
    const r = await callRpc("rpc_settle_payment", {
      p_fedapay_id: fedapayId, p_status: toSettleStatus(tx.status), p_amount_xof: tx.amount,
    });
    if (!r.ok) return { state: "error" };
    const status = r.status as "approved" | "declined" | "canceled" | "pending";
    return status === "approved"
      ? { state: "approved", credits: Number(payment.credits), already: Boolean(r.already) }
      : { state: status };
  } catch (e) {
    console.error("[settle]", e instanceof Error ? e.message : e);
    return { state: "error" };
  }
}
