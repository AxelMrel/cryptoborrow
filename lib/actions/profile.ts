"use server";

import type { ActionState } from "@/lib/types";
import { callRpc, done, errorMessage, fail, guard, refreshDashboard } from "@/lib/rpc";
import { createClient } from "@/lib/supabase/server";
import { getActionContext } from "@/i18n/server";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { m, e } = await getActionContext();
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (name.length < 2 || name.length > 100) return fail(m.nameInvalid);
  if (phone && !/^[0-9+ ()-]{6,24}$/.test(phone)) return fail(m.phoneInvalid);

  const r = await callRpc("rpc_update_profile", { p_user: me.id, p_name: name, p_phone: phone });
  if (!r.ok) return fail(r.error === "SERVER" ? m.migration : errorMessage(r.error, e));
  refreshDashboard(); // met à jour le nom affiché dans l'en-tête
  return done(m.profileUpdated);
}

/** Changement de mot de passe : le mot de passe actuel est revérifié avant toute modification. */
export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { m, e } = await getActionContext();
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!current) return fail(m.currentRequired);
  if (next.length < 8) return fail(m.newShort);
  if (next !== confirm) return fail(m.mismatch);
  if (next === current) return fail(m.samePassword);

  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({ email: me.email, password: current });
  if (check.error) return fail(m.wrongCurrent);
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return fail(m.passwordFailed);
  return done(m.passwordChanged);
}
