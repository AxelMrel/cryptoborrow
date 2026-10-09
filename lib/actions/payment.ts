"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/types";
import { callRpc, done, errorMessage, fail, guard } from "@/lib/rpc";
import { isUuid } from "@/lib/validation";

const PATH = "/dashboard/client/payment-methods";
const MIGRATION_HINT = "Fonctionnalité indisponible : la migration SQL 002 n'a pas encore été exécutée.";
const msg = (code?: string) => (code === "SERVER" ? MIGRATION_HINT : errorMessage(code));

/**
 * Enregistre un moyen de paiement. Par conception on ne reçoit JAMAIS un numéro complet
 * ni un cryptogramme : uniquement les 4 derniers chiffres, le titulaire, la marque et l'expiration.
 */
export async function addPaymentMethod(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN"));
  const kind = String(formData.get("kind") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const holder = String(formData.get("holder") ?? "").trim();
  const last4 = String(formData.get("last4") ?? "").trim();
  const expiry = String(formData.get("expiry") ?? "").trim();

  if (kind !== "card" && kind !== "bank") return fail(errorMessage("INVALID_INPUT"));
  if (label.length < 1 || label.length > 40) return fail(kind === "card" ? "Choisissez la marque de la carte." : "Indiquez le nom de la banque.");
  if (holder.length < 2 || holder.length > 80) return fail("Nom du titulaire requis.");
  if (!/^\d{4}$/.test(last4)) return fail("Saisissez uniquement les 4 derniers chiffres.");
  if (kind === "card") {
    const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry);
    if (!m) return fail("Date d'expiration au format MM/AA.");
    const now = new Date();
    const year = 2000 + Number(m[2]);
    const month = Number(m[1]);
    if (year < now.getUTCFullYear() || (year === now.getUTCFullYear() && month < now.getUTCMonth() + 1)) return fail("Cette carte est expirée.");
  }

  const r = await callRpc("rpc_add_payment_method", {
    p_user: me.id, p_kind: kind, p_label: label, p_holder: holder, p_last4: last4, p_expiry: kind === "card" ? expiry : "",
  });
  if (!r.ok) return fail(msg(r.error));
  revalidatePath(PATH);
  return done("Moyen de paiement enregistré.");
}

export async function deletePaymentMethod(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN"));
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return fail(errorMessage("NOT_FOUND"));
  const r = await callRpc("rpc_delete_payment_method", { p_user: me.id, p_id: id });
  if (!r.ok) return fail(msg(r.error));
  revalidatePath(PATH);
  return done("Moyen de paiement supprimé.");
}

export async function setDefaultPaymentMethod(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN"));
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return fail(errorMessage("NOT_FOUND"));
  const r = await callRpc("rpc_set_default_payment_method", { p_user: me.id, p_id: id });
  if (!r.ok) return fail(msg(r.error));
  revalidatePath(PATH);
  return done("Moyen de paiement par défaut mis à jour.");
}
