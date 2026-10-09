"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/types";
import { callRpc, errorMessage, fail } from "@/lib/rpc";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isEmail } from "@/lib/validation";
import { withLocale } from "@/i18n/config";
import { getActionContext } from "@/i18n/server";

/** Inscription GRATUITE d'un admin : compte créé, connexion automatique, direction son espace. */
export async function signupAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { locale, m, e } = await getActionContext();
  const name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2 || name.length > 100) return fail(m.nameInvalid);
  if (!isEmail(email)) return fail(m.emailInvalid);
  if (password.length < 8) return fail(m.passwordShort);

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

  const r = await callRpc("rpc_register_admin", { p_user: data.user.id, p_email: email, p_name: name });
  if (!r.ok) {
    await sb.auth.admin.deleteUser(data.user.id);
    return fail(r.error === "SERVER" ? m.migration004 : errorMessage(r.error, e));
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  redirect(withLocale(locale, signInError ? "/login" : "/dashboard/admin"));
}
