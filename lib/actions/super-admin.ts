"use server";

import { updateTag } from "next/cache";
import type { ActionState } from "@/lib/types";
import { callRpc, done, errorMessage, fail, guard, refreshDashboard } from "@/lib/rpc";
import { getActionContext } from "@/i18n/server";

const SETTING_KEYS = ["client_creation_fee_xof", "withdrawal_code_fee_xof", "withdrawal_code_ttl_minutes", "max_operation_amount"];

export async function updateSetting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { m, e } = await getActionContext();
  const me = await guard("super_admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const key = String(formData.get("key") ?? "");
  const value = String(formData.get("value") ?? "").trim();
  if (!SETTING_KEYS.includes(key)) return fail(m.settingUnknown);
  const r = await callRpc("rpc_update_setting", { p_super: me.id, p_key: key, p_value: value });
  if (!r.ok) return fail(errorMessage(r.error, e));
  updateTag("fees"); // la landing et les dashboards affichent le nouveau tarif
  refreshDashboard();
  return done(m.settingUpdated);
}
