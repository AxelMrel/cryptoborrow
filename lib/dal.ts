import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withLocale } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import type { Profile, Role } from "@/lib/types";

/** Chemin (sans langue) de l'espace de chaque rôle. */
export const HOME: Record<Role, string> = {
  super_admin: "/dashboard/super-admin",
  admin: "/dashboard/admin",
  client: "/dashboard/client",
};

/**
 * Utilisateur courant, vérifié auprès de Supabase Auth (getUser = appel serveur,
 * pas seulement lecture du cookie) puis profil lu via la RLS.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  await connection(); // lecture dépendante de la requête (la session expire avec le temps)
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).single();
  return (data as Profile | null) ?? null;
});

/** Pages : redirige (dans la langue courante) si non connecté ou si le rôle ne correspond pas. */
export async function requireRole(role: Role): Promise<Profile> {
  const [me, locale] = await Promise.all([getCurrentProfile(), getLocale()]);
  if (!me) redirect(withLocale(locale, "/login"));
  if (me.role !== role) redirect(withLocale(locale, HOME[me.role]));
  return me;
}
