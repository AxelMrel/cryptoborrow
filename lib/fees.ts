import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/** Rendement des soldes (réglages du super admin). Même étiquette de cache que les tarifs. */
export async function getYieldConfig() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fees");
  const { data } = await createAdminClient()
    .from("settings").select("key,value").in("key", ["yield_rate_percent", "yield_period_minutes"]);
  const v = Object.fromEntries((data ?? []).map((r) => [r.key, Number(r.value)]));
  return { ratePercent: v.yield_rate_percent ?? 0, periodMinutes: v.yield_period_minutes ?? 0 };
}

export const DEFAULT_FEES = { clientCreation: 5000, withdrawalCode: 1000 }; // francs CFA (XOF)

/**
 * Tarifs affichés (landing, dashboards). La source de vérité est la table `settings` ; le montant réellement
 * facturé est, lui, décidé par la base au moment du paiement (rpc_create_fee_payment). Mis en cache,
 * invalidé par updateTag("fees") quand le super admin modifie un tarif.
 */
export async function getFees() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fees");
  const { data } = await createAdminClient()
    .from("settings").select("key,value").in("key", ["client_creation_fee_xof", "withdrawal_code_fee_xof"]);
  const v = Object.fromEntries((data ?? []).map((r) => [r.key, Number(r.value)]));
  return {
    clientCreation: v.client_creation_fee_xof || DEFAULT_FEES.clientCreation,
    withdrawalCode: v.withdrawal_code_fee_xof || DEFAULT_FEES.withdrawalCode,
  };
}
