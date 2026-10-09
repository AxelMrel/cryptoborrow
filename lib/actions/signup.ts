"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/types";
import { callRpc, errorMessage, fail } from "@/lib/rpc";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";
import { isEmail } from "@/lib/validation";
import { withLocale } from "@/i18n/config";
import { getActionContext } from "@/i18n/server";

/**
 * Inscription d'un admin depuis la landing : choix d'un pack, paiement sans débit réel,
 * création du compte Auth + du profil (crédits et quota du pack), puis connexion automatique.
 */
export async function signupAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { locale, m, e } = await getActionContext();
  const name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const planId = String(formData.get("plan_id") ?? "");
  if (name.length < 2 || name.length > 100) return fail(m.nameInvalid);
  if (!isEmail(email)) return fail(m.emailInvalid);
  if (password.length < 8) return fail(m.passwordShort);
  const plan = getPlan(planId);
  if (!plan) return fail(m.pickPlan);

  const sb = createAdminClient();
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { full_name: name },
  });
  if (error || !data.user) {
    return fail(/already|registered|exists/i.test(error?.message ?? "") ? m.emailTaken : m.createFailed);
  }

  // Crédits et quota viennent du pack (côté serveur, jamais du formulaire).
  const { data: platform } = await sb.from("profiles").select("id").eq("role", "super_admin").limit(1).single();
  const r = platform
    ? await callRpc("rpc_create_admin", {
        p_super: platform.id, p_user: data.user.id, p_email: email, p_name: name,
        p_credits: plan.credits, p_max_clients: plan.max_clients,
      })
    : { ok: false, error: "SERVER" };
  if (!r.ok) {
    await sb.auth.admin.deleteUser(data.user.id);
    return fail(errorMessage(r.error, e));
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) redirect(withLocale(locale, "/login"));
  redirect(withLocale(locale, "/dashboard/admin"));
}
