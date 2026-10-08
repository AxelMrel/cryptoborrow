"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HOME } from "@/lib/dal";
import type { ActionState, Profile } from "@/lib/types";
import { isEmail } from "@/lib/validation";

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!isEmail(email) || !password) return { ok: false, message: "Email et mot de passe requis." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, message: "Email ou mot de passe incorrect." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  const role = (profile as Pick<Profile, "role"> | null)?.role;
  if (!role) {
    await supabase.auth.signOut();
    return { ok: false, message: "Compte sans profil. Contactez l'administrateur." };
  }
  redirect(HOME[role]);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
