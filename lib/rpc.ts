import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/dal";
import type { ActionState, Profile, Role } from "@/lib/types";

const MESSAGES: Record<string, string> = {
  FORBIDDEN: "Action non autorisée.",
  NOT_FOUND: "Utilisateur introuvable ou n'appartenant pas à votre périmètre.",
  INVALID_AMOUNT: "Montant invalide (entier positif, dans la limite autorisée).",
  NO_CREDITS: "Votre solde de crédits est épuisé. Contactez le super admin.",
  QUOTA_REACHED: "Quota de clients atteint. Contactez le super admin pour l'augmenter.",
  QUOTA_BELOW_CURRENT: "Le quota ne peut pas être inférieur au nombre de clients existants.",
  INSUFFICIENT_CREDITS: "Crédits insuffisants pour générer un code de retrait.",
  CODE_COLLISION: "Collision de code, veuillez réessayer.",
  CODE_INVALID: "Code de retrait invalide.",
  CODE_USED: "Ce code a déjà été utilisé.",
  CODE_EXPIRED: "Ce code a expiré. Demandez-en un nouveau à votre admin.",
  CODE_AMOUNT_MISMATCH: "Le montant ne correspond pas à celui prévu par ce code.",
  INSUFFICIENT_BALANCE: "Solde insuffisant.",
  PLAN_NOT_FOUND: "Ce pack n'existe plus ou n'est plus disponible.",
};

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

export const errorMessage = (code?: string) => MESSAGES[code ?? ""] ?? "Une erreur est survenue. Réessayez.";

export const fail = (message: string): ActionState => ({ ok: false, message });
export const done = (message: string): ActionState => ({ ok: true, message });

/** Vérifie côté serveur que l'appelant a bien le rôle requis. */
export async function guard(role: Role): Promise<Profile | null> {
  const me = await getCurrentProfile();
  return me && me.role === role ? me : null;
}
