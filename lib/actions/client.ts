"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/types";
import { callRpc, done, errorMessage, fail, guard } from "@/lib/rpc";
import { parseAmount } from "@/lib/validation";
import { fcfa } from "@/lib/format";

export async function deposit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN"));
  const amount = parseAmount(formData.get("amount"));
  if (!amount) return fail(errorMessage("INVALID_AMOUNT"));

  const r = await callRpc("rpc_client_deposit", { p_client: me.id, p_amount: amount });
  if (!r.ok) return fail(errorMessage(r.error));
  revalidatePath("/dashboard/client");
  return done(`Dépôt de ${fcfa(amount)} effectué.`);
}

export async function withdraw(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("client");
  if (!me) return fail(errorMessage("FORBIDDEN"));
  const amount = parseAmount(formData.get("amount"));
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!amount) return fail(errorMessage("INVALID_AMOUNT"));
  if (!/^[A-Z0-9-]{4,20}$/.test(code)) return fail(errorMessage("CODE_INVALID"));

  // Validation du code + débit du solde : une seule transaction SQL atomique.
  const r = await callRpc("rpc_client_withdraw", { p_client: me.id, p_amount: amount, p_code: code });
  if (!r.ok) {
    const extra = r.error === "CODE_AMOUNT_MISMATCH" ? ` Montant attendu : ${fcfa(Number(r.expected))}.` : "";
    return fail(errorMessage(r.error) + extra);
  }
  revalidatePath("/dashboard/client");
  return done(`Retrait de ${fcfa(amount)} effectué.`);
}
