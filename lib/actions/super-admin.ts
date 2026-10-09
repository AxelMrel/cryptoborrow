"use server";

import type { ActionState } from "@/lib/types";
import { callRpc, done, errorMessage, fail, guard, refreshDashboard } from "@/lib/rpc";
import { isUuid, parseAmount } from "@/lib/validation";
import { fmt, num } from "@/i18n/format";
import { getActionContext } from "@/i18n/server";

export async function grantAdminCredits(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { locale, m, e } = await getActionContext();
  const me = await guard("super_admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const adminId = String(formData.get("admin_id") ?? "");
  const amount = parseAmount(formData.get("amount"), 100_000_000);
  if (!isUuid(adminId)) return fail(errorMessage("NOT_FOUND", e));
  if (!amount) return fail(errorMessage("INVALID_AMOUNT", e));
  const r = await callRpc("rpc_grant_admin_credits", { p_super: me.id, p_admin: adminId, p_amount: amount });
  if (!r.ok) return fail(errorMessage(r.error, e));
  refreshDashboard();
  return done(fmt(m.creditsGranted, { amount: num(amount, locale) }));
}

export async function setMaxClients(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { m, e } = await getActionContext();
  const me = await guard("super_admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const adminId = String(formData.get("admin_id") ?? "");
  const max = Number(String(formData.get("max_clients") ?? ""));
  if (!isUuid(adminId)) return fail(errorMessage("NOT_FOUND", e));
  if (!Number.isInteger(max) || max < 0 || max > 100_000) return fail(m.quotaInvalid);
  const r = await callRpc("rpc_set_max_clients", { p_super: me.id, p_admin: adminId, p_max: max });
  if (!r.ok) return fail(errorMessage(r.error, e));
  refreshDashboard();
  return done(fmt(m.quotaSet, { n: max }));
}

const SETTING_KEYS = ["withdrawal_code_fee", "withdrawal_code_ttl_minutes", "max_operation_amount"];

export async function updateSetting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { m, e } = await getActionContext();
  const me = await guard("super_admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const key = String(formData.get("key") ?? "");
  const value = String(formData.get("value") ?? "").trim();
  if (!SETTING_KEYS.includes(key)) return fail(m.settingUnknown);
  const r = await callRpc("rpc_update_setting", { p_super: me.id, p_key: key, p_value: value });
  if (!r.ok) return fail(errorMessage(r.error, e));
  refreshDashboard();
  return done(m.settingUpdated);
}
