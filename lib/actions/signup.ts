"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/types";
import { callRpc, errorMessage, fail } from "@/lib/rpc";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";
import { isEmail } from "@/lib/validation";

/**
 * Inscription d'un admin depuis la landing : choix d'un pack, paiement sans débit réel,
 * création du compte Auth + du profil (crédits et quota du pack), puis connexion automatique.
 */
export async function signupAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const planId = String(formData.get("plan_id") ?? "");
  if (name.length < 2 || name.length > 100) return fail("Nom complet requis (2 à 100 caractères).");
  if (!isEmail(email)) return fail("Email invalide.");
  if (password.length < 8) return fail("Mot de passe : 8 caractères minimum.");
  const plan = getPlan(planId);
  if (!plan) return fail("Choisissez un pack.");

  const sb = createAdminClient();
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { full_name: name },
  });
  if (error || !data.user) {
    return fail(/already|registered|exists/i.test(error?.message ?? "") ? "Cet email est déjà utilisé." : "Création impossible.");
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
    return fail(errorMessage(r.error));
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) redirect("/login");
  redirect("/dashboard/admin");
}
