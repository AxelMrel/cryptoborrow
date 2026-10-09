import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/dal";
import type { ActionState, Profile, Role } from "@/lib/types";

type RpcResult = { ok: boolean; error?: string; [k: string]: unknown };

/** Appel d'une fonction SQL atomique avec la clé service_role (serveur uniquement). */
export async function callRpc(fn: string, args: Record<string, unknown>): Promise<RpcResult> {
  const { data, error } = await createAdminClient().rpc(fn, args);
  if (error) {
    console.error(`[rpc ${fn}]`, error.message);
    return { ok: false, error: "SERVER" };
  }
  return data as RpcResult;
}

/** Message d'erreur traduit pour un code métier (e = dictionnaire `errors` de la langue courante). */
export const errorMessage = (code: string | undefined, e: { generic: string; codes: Record<string, string> }) =>
  e.codes[code ?? ""] ?? e.generic;

export const fail = (message: string): ActionState => ({ ok: false, message });
export const done = (message: string): ActionState => ({ ok: true, message });

/** Vérifie côté serveur que l'appelant a bien le rôle requis. */
export async function guard(role: Role): Promise<Profile | null> {
  const me = await getCurrentProfile();
  return me && me.role === role ? me : null;
}

/** Rafraîchit tous les dashboards (toutes langues) après une modification. */
export const refreshDashboard = () => revalidatePath("/[lang]/dashboard", "layout");
