"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/types";
import { callRpc, done, errorMessage, fail, guard } from "@/lib/rpc";
import { isUuid, parseAmount } from "@/lib/validation";
import { num } from "@/lib/format";

const refresh = () => revalidatePath("/dashboard/super-admin");

export async function grantAdminCredits(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("super_admin");
  if (!me) return fail(errorMessage("FORBIDDEN"));
  const adminId = String(formData.get("admin_id") ?? "");
  const amount = parseAmount(formData.get("amount"), 100_000_000);
  if (!isUuid(adminId)) return fail(errorMessage("NOT_FOUND"));
  if (!amount) return fail(errorMessage("INVALID_AMOUNT"));
  const r = await callRpc("rpc_grant_admin_credits", { p_super: me.id, p_admin: adminId, p_amount: amount });
  if (!r.ok) return fail(errorMessage(r.error));
  refresh();
  return done(`${num(amount)} crédits attribués.`);
}

export async function setMaxClients(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("super_admin");
  if (!me) return fail(errorMessage("FORBIDDEN"));
  const adminId = String(formData.get("admin_id") ?? "");
  const max = Number(String(formData.get("max_clients") ?? ""));
  if (!isUuid(adminId)) return fail(errorMessage("NOT_FOUND"));
  if (!Number.isInteger(max) || max < 0 || max > 100_000) return fail("Quota invalide.");
  const r = await callRpc("rpc_set_max_clients", { p_super: me.id, p_admin: adminId, p_max: max });
  if (!r.ok) return fail(errorMessage(r.error));
  refresh();
  return done(`Quota fixé à ${max}.`);
}

const SETTING_KEYS = ["withdrawal_code_fee", "withdrawal_code_ttl_minutes", "max_operation_amount"];

export async function updateSetting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("super_admin");
  if (!me) return fail(errorMessage("FORBIDDEN"));
  const key = String(formData.get("key") ?? "");
  const value = String(formData.get("value") ?? "").trim();
  if (!SETTING_KEYS.includes(key)) return fail("Paramètre inconnu.");
  const r = await callRpc("rpc_update_setting", { p_super: me.id, p_key: key, p_value: value });
  if (!r.ok) return fail(errorMessage(r.error));
  refresh();
  return done("Tarif mis à jour.");
}
