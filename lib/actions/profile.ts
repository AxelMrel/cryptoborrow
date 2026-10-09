"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/types";
import { callRpc, done, errorMessage, fail, guard } from "@/lib/rpc";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN"));
  const name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (name.length < 2 || name.length > 100) return fail("Nom complet requis (2 à 100 caractères).");
  if (phone && !/^[0-9+ ()-]{6,24}$/.test(phone)) return fail("Numéro de téléphone invalide.");

  const r = await callRpc("rpc_update_profile", { p_user: me.id, p_name: name, p_phone: phone });
  if (!r.ok) {
    return fail(r.error === "SERVER" ? "Profil indisponible : la migration SQL 002 n'a pas encore été exécutée." : errorMessage(r.error));
  }
  revalidatePath("/dashboard", "layout"); // met à jour le nom affiché dans l'en-tête
  return done("Profil mis à jour.");
}

/** Changement de mot de passe : le mot de passe actuel est revérifié avant toute modification. */
export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN"));
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!current) return fail("Saisissez votre mot de passe actuel.");
  if (next.length < 8) return fail("Nouveau mot de passe : 8 caractères minimum.");
  if (next !== confirm) return fail("La confirmation ne correspond pas au nouveau mot de passe.");
  if (next === current) return fail("Le nouveau mot de passe doit être différent de l'actuel.");

  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({ email: me.email, password: current });
  if (check.error) return fail("Mot de passe actuel incorrect.");
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return fail("Impossible de modifier le mot de passe. Réessayez.");
  return done("Mot de passe modifié.");
}
