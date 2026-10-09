"use server";

import { randomInt } from "node:crypto";
import type { ActionState } from "@/lib/types";
import { callRpc, done, errorMessage, fail, guard, refreshDashboard } from "@/lib/rpc";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmail, isUuid, parseAmount } from "@/lib/validation";
import { fmt, money, num } from "@/i18n/format";
import { getActionContext } from "@/i18n/server";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I
const newCode = () =>
  Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

export async function createClientAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { m, e } = await getActionContext();
  const me = await guard("admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));

  const name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2 || name.length > 100) return fail(m.nameInvalid);
  if (!isEmail(email)) return fail(m.emailInvalid);
  if (password.length < 8) return fail(m.passwordShort);

  // Pré-contrôle rapide (le vrai contrôle atomique est dans rpc_create_client).
  if (me.credits <= 0) return fail(errorMessage("NO_CREDITS", e));

  const sb = createAdminClient();
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "client" },
    user_metadata: { full_name: name },
  });
  if (error || !data.user) {
    return fail(/already|registered|exists/i.test(error?.message ?? "") ? m.emailTaken : m.createFailed);
  }

  const r = await callRpc("rpc_create_client", { p_admin: me.id, p_user: data.user.id, p_email: email, p_name: name });
  if (!r.ok) {
    await sb.auth.admin.deleteUser(data.user.id); // annule l'utilisateur Auth orphelin
    return fail(errorMessage(r.error, e));
  }
  refreshDashboard();
  // Renvoyé une seule fois à l'admin pour qu'il transmette les accès au client.
  return { ok: true, message: fmt(m.clientCreated, { name }), credentials: { name, email, password } };
}

export async function creditClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { locale, m, e } = await getActionContext();
  const me = await guard("admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const clientId = String(formData.get("client_id") ?? "");
  const amount = parseAmount(formData.get("amount"));
  if (!isUuid(clientId)) return fail(errorMessage("NOT_FOUND", e));
  if (!amount) return fail(errorMessage("INVALID_AMOUNT", e));

  const r = await callRpc("rpc_admin_credit_client", { p_admin: me.id, p_client: clientId, p_amount: amount });
  if (!r.ok) return fail(errorMessage(r.error, e));
  refreshDashboard();
  return done(fmt(m.credited, { amount: money(amount, locale) }));
}

export async function generateWithdrawalCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { locale, m, e } = await getActionContext();
  const me = await guard("admin");
  if (!me) return fail(errorMessage("FORBIDDEN", e));
  const clientId = String(formData.get("client_id") ?? "");
  if (!isUuid(clientId)) return fail(errorMessage("NOT_FOUND", e));
  const rawAmount = String(formData.get("amount") ?? "").trim();
  const amount = rawAmount ? parseAmount(rawAmount) : null;
  if (rawAmount && !amount) return fail(errorMessage("INVALID_AMOUNT", e));

  for (let i = 0; i < 3; i++) {
    const r = await callRpc("rpc_generate_withdrawal_code", {
      p_admin: me.id, p_client: clientId, p_code: newCode(), p_amount: amount,
    });
    if (r.ok) {
      refreshDashboard();
      return done(fmt(m.codeGenerated, { code: String(r.code), fee: num(Number(r.fee), locale) }));
    }
    if (r.error !== "CODE_COLLISION") {
      const extra = r.error === "INSUFFICIENT_CREDITS"
        ? fmt(m.needCredits, { fee: num(Number(r.fee), locale), credits: num(Number(r.credits), locale) }) : "";
      return fail(errorMessage(r.error, e) + extra);
    }
  }
  return fail(errorMessage("CODE_COLLISION", e));
}
