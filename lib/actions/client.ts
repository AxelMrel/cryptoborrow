"use server";

import type { ActionState } from "@/lib/types";
import { callRpc, done, errorMessage, fail, guard, refreshDashboard } from "@/lib/rpc";
import { parseAmount } from "@/lib/validation";
import { fmt, money } from "@/i18n/format";
import { getActionContext } from "@/i18n/server";

export async function withdraw(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { locale, m, e } = await getActionContext();
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const amount = parseAmount(formData.get("amount"));
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!amount) return fail(errorMessage("INVALID_AMOUNT", e));
  if (!/^[A-Z0-9-]{4,20}$/.test(code)) return fail(errorMessage("CODE_INVALID", e));

  // Validation du code + débit du solde : une seule transaction SQL atomique.
  const r = await callRpc("rpc_client_withdraw", { p_client: me.id, p_amount: amount, p_code: code });
  if (!r.ok) {
    const extra = r.error === "CODE_AMOUNT_MISMATCH" ? fmt(m.expectedAmount, { amount: money(Number(r.expected), locale) }) : "";
    return fail(errorMessage(r.error, e) + extra);
  }
  refreshDashboard();
  return done(fmt(m.withdrawn, { amount: money(amount, locale) }));
}
