"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HOME } from "@/lib/dal";
import { withLocale } from "@/i18n/config";
import { getActionContext } from "@/i18n/server";
import type { ActionState, Profile } from "@/lib/types";
import { isEmail } from "@/lib/validation";

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { locale, m } = await getActionContext();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!isEmail(email) || !password) return { ok: false, message: m.credsRequired };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, message: m.badCreds };

  const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", data.user.id).single();
  const { role, status } = (profile as Pick<Profile, "role" | "status"> | null) ?? {};
  if (!role) {
    await supabase.auth.signOut();
    return { ok: false, message: m.noProfile };
  }
  if (status === "pending") {
    await supabase.auth.signOut();
    return { ok: false, message: m.accountPending };
  }
  redirect(withLocale(locale, HOME[role]));
}

export async function signOut() {
  const { locale } = await getActionContext();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(withLocale(locale, "/login"));
}
