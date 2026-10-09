"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/types";
import { errorMessage, fail, guard } from "@/lib/rpc";
import { getPlan } from "@/lib/plans";
import { isFedaPayConfigured } from "@/lib/fedapay";
import { createCheckout } from "@/lib/payments";
import { getActionContext } from "@/i18n/server";

/** Achat d'un pack de crédits : crée la transaction FedaPay puis envoie l'admin sur la page de paiement. */
export async function startCheckout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { locale, m, e } = await getActionContext();
  const me = await guard("admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const plan = getPlan(String(formData.get("plan_id") ?? ""));
  if (!plan) return fail(m.pickPlan);
  if (!isFedaPayConfigured()) return fail(m.paymentUnavailable);

  const result = await createCheckout(me, plan, locale);
  if (!result.ok) return fail(result.error === "MIGRATION" ? m.migration003 : m.paymentFailed);
  redirect(result.url); // hors try/catch : redirect() fonctionne en levant une exception interne
}
