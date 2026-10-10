"use server";

import type { ActionState } from "@/lib/types";
import { callRpc, done, errorMessage, fail, guard, refreshDashboard } from "@/lib/rpc";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFedaPayConfigured } from "@/lib/fedapay";
import { createFeeCheckout, type CheckoutError } from "@/lib/payments";
import { MIN_CREDIT, isEmail, isUuid, parseAmount } from "@/lib/validation";
import { fmt, money } from "@/i18n/format";
import { getActionContext } from "@/i18n/server";

type Ctx = Awaited<ReturnType<typeof getActionContext>>;

function checkoutError(code: CheckoutError, { m, e }: Ctx) {
  if (code === "MIGRATION") return m.migration004;
  if (code === "NOT_FOUND") return errorMessage("NOT_FOUND", e);
  if (code === "CLIENT_PENDING") return errorMessage("CLIENT_PENDING", e);
  if (code === "INVALID_AMOUNT") return errorMessage("INVALID_AMOUNT", e);
  return m.paymentFailed;
}

/**
 * Création d'un client PAYANTE (5 000 FCFA, via FedaPay).
 * Le compte est créé tout de suite mais reste "pending" (le client ne peut ni se connecter ni être crédité)
 * jusqu'à la confirmation du paiement. Les identifiants sont renvoyés au navigateur de l'admin, qui les garde
 * le temps du paiement : le mot de passe n'est jamais stocké en clair côté serveur.
 */
export async function createClientAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await getActionContext();
  const { locale, m, e } = ctx;
  const me = await guard("admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));

  const name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2 || name.length > 100) return fail(m.nameInvalid);
  if (!isEmail(email)) return fail(m.emailInvalid);
  if (password.length < 8) return fail(m.passwordShort);
  if (!isFedaPayConfigured()) return fail(m.paymentUnavailable); // inutile de créer un client qu'on ne pourra pas facturer

  const sb = createAdminClient();
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "client" },
    user_metadata: { full_name: name },
  });
  if (error || !data.user) {
    return fail(/already|registered|exists/i.test(error?.message ?? "") ? m.emailTaken : m.createFailed);
  }
  const clientId = data.user.id;

  const r = await callRpc("rpc_create_pending_client", { p_admin: me.id, p_user: clientId, p_email: email, p_name: name });
  if (!r.ok) {
    await sb.auth.admin.deleteUser(clientId);
    return fail(r.error === "SERVER" ? m.migration004 : errorMessage(r.error, e));
  }

  const checkout = await createFeeCheckout(me, "client_creation", clientId, locale);
  if (!checkout.ok) {
    await sb.auth.admin.deleteUser(clientId); // rien n'a été payé : on annule proprement (le profil disparaît en cascade)
    return fail(checkoutError(checkout.error, ctx));
  }
  refreshDashboard();
  return { ok: true, message: m.redirectingToPayment, redirectTo: checkout.url, credentials: { clientId, name, email, password } };
}

/** Relance le paiement d'un client resté "pending" (paiement abandonné ou refusé). */
export async function payForPendingClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await getActionContext();
  const { locale, m, e } = ctx;
  const me = await guard("admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const clientId = String(formData.get("client_id") ?? "");
  if (!isUuid(clientId)) return fail(errorMessage("NOT_FOUND", e));
  if (!isFedaPayConfigured()) return fail(m.paymentUnavailable);

  const checkout = await createFeeCheckout(me, "client_creation", clientId, locale);
  if (!checkout.ok) return fail(checkoutError(checkout.error, ctx));
  return { ok: true, message: m.redirectingToPayment, redirectTo: checkout.url };
}

/** Supprime un client jamais payé (compte Auth + profil). Refusé si le client est déjà actif. */
export async function removePendingClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { m, e } = await getActionContext();
  const me = await guard("admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const clientId = String(formData.get("client_id") ?? "");
  if (!isUuid(clientId)) return fail(errorMessage("NOT_FOUND", e));

  const sb = createAdminClient();
  const { data: target } = await sb.from("profiles").select("id").eq("id", clientId).eq("role", "client")
    .eq("created_by", me.id).eq("status", "pending").maybeSingle();
  if (!target) return fail(errorMessage("NOT_FOUND", e));
  const { error } = await sb.auth.admin.deleteUser(clientId);
  if (error) return fail(m.createFailed);
  refreshDashboard();
  return done(m.pendingRemoved);
}

/** Crédite le compte d'un client actif : gratuit pour l'admin. */
export async function creditClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { locale, m, e } = await getActionContext();
  const me = await guard("admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const clientId = String(formData.get("client_id") ?? "");
  const amount = parseAmount(formData.get("amount"));
  if (!isUuid(clientId)) return fail(errorMessage("NOT_FOUND", e));
  if (!amount) return fail(errorMessage("INVALID_AMOUNT", e));
  if (amount < MIN_CREDIT) return fail(errorMessage("AMOUNT_TOO_LOW", e));

  const r = await callRpc("rpc_admin_credit_client", { p_admin: me.id, p_client: clientId, p_amount: amount });
  if (!r.ok) return fail(errorMessage(r.error, e));
  refreshDashboard();
  return done(fmt(m.credited, { amount: money(amount, locale) }));
}

/**
 * Achat d'un code de retrait (1 000 FCFA, via FedaPay). Le code n'existe pas encore : il est généré par la base
 * quand le paiement est confirmé, puis affiché sur la page de retour et dans la liste des codes.
 */
export async function buyWithdrawalCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await getActionContext();
  const { locale, m, e } = ctx;
  const me = await guard("admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const clientId = String(formData.get("client_id") ?? "");
  if (!isUuid(clientId)) return fail(errorMessage("NOT_FOUND", e));
  const rawAmount = String(formData.get("amount") ?? "").trim();
  const amount = rawAmount ? parseAmount(rawAmount) : null;
  if (rawAmount && !amount) return fail(errorMessage("INVALID_AMOUNT", e));
  if (!isFedaPayConfigured()) return fail(m.paymentUnavailable);

  const checkout = await createFeeCheckout(me, "withdrawal_code", clientId, locale, amount);
  if (!checkout.ok) return fail(checkoutError(checkout.error, ctx));
  return { ok: true, message: m.redirectingToPayment, redirectTo: checkout.url };
}
