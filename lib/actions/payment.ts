"use server";

import type { ActionState } from "@/lib/types";
import { callRpc, done, errorMessage, fail, guard, refreshDashboard } from "@/lib/rpc";
import { isUuid } from "@/lib/validation";
import { getActionContext } from "@/i18n/server";

/**
 * Enregistre un moyen de paiement. Par conception on ne reçoit JAMAIS un numéro complet
 * ni un cryptogramme : uniquement les 4 derniers chiffres, le titulaire, la marque et l'expiration.
 */
export async function addPaymentMethod(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { m, e } = await getActionContext();
  const msg = (code?: string) => (code === "SERVER" ? m.migration : errorMessage(code, e));
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const kind = String(formData.get("kind") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const holder = String(formData.get("holder") ?? "").trim();
  const last4 = String(formData.get("last4") ?? "").trim();
  const expiry = String(formData.get("expiry") ?? "").trim();

  if (kind !== "card" && kind !== "bank") return fail(errorMessage("INVALID_INPUT", e));
  if (label.length < 1 || label.length > 40) return fail(kind === "card" ? m.pickBrand : m.bankName);
  if (holder.length < 2 || holder.length > 80) return fail(m.holderRequired);
  if (!/^\d{4}$/.test(last4)) return fail(m.last4Only);
  if (kind === "card") {
    const x = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry);
    if (!x) return fail(m.expiryFormat);
    const now = new Date();
    const year = 2000 + Number(x[2]);
    const month = Number(x[1]);
    if (year < now.getUTCFullYear() || (year === now.getUTCFullYear() && month < now.getUTCMonth() + 1)) return fail(m.cardExpired);
  }

  const r = await callRpc("rpc_add_payment_method", {
    p_user: me.id, p_kind: kind, p_label: label, p_holder: holder, p_last4: last4, p_expiry: kind === "card" ? expiry : "",
  });
  if (!r.ok) return fail(msg(r.error));
  refreshDashboard();
  return done(m.pmAdded);
}

export async function deletePaymentMethod(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { m, e } = await getActionContext();
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return fail(errorMessage("NOT_FOUND", e));
  const r = await callRpc("rpc_delete_payment_method", { p_user: me.id, p_id: id });
  if (!r.ok) return fail(r.error === "SERVER" ? m.migration : errorMessage(r.error, e));
  refreshDashboard();
  return done(m.pmDeleted);
}

export async function setDefaultPaymentMethod(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { m, e } = await getActionContext();
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return fail(errorMessage("NOT_FOUND", e));
  const r = await callRpc("rpc_set_default_payment_method", { p_user: me.id, p_id: id });
  if (!r.ok) return fail(r.error === "SERVER" ? m.migration : errorMessage(r.error, e));
  refreshDashboard();
  return done(m.pmDefault);
}
