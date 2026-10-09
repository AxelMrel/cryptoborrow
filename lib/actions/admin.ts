"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/types";
import { callRpc, done, errorMessage, fail, guard } from "@/lib/rpc";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmail, isUuid, parseAmount } from "@/lib/validation";
import { money, num } from "@/lib/format";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I
const newCode = () =>
  Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

export async function createClientAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("admin");
  if (!me) return fail(errorMessage("FORBIDDEN"));

  const name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2 || name.length > 100) return fail("Nom complet requis (2 à 100 caractères).");
  if (!isEmail(email)) return fail("Email invalide.");
  if (password.length < 8) return fail("Mot de passe : 8 caractères minimum.");

  // Pré-contrôle rapide (le vrai contrôle atomique est dans rpc_create_client).
  if (me.credits <= 0) return fail(errorMessage("NO_CREDITS"));

  const sb = createAdminClient();
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "client" },
    user_metadata: { full_name: name },
  });
  if (error || !data.user) {
    return fail(/already|registered|exists/i.test(error?.message ?? "") ? "Cet email est déjà utilisé." : "Création impossible.");
  }

  const r = await callRpc("rpc_create_client", { p_admin: me.id, p_user: data.user.id, p_email: email, p_name: name });
  if (!r.ok) {
    await sb.auth.admin.deleteUser(data.user.id); // annule l'utilisateur Auth orphelin
    return fail(errorMessage(r.error));
  }
  revalidatePath("/dashboard/admin");
  // Renvoyé une seule fois à l'admin pour qu'il transmette les accès au client.
  return { ok: true, message: `Client ${name} créé.`, credentials: { name, email, password } };
}

export async function creditClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("admin");
  if (!me) return fail(errorMessage("FORBIDDEN"));
  const clientId = String(formData.get("client_id") ?? "");
  const amount = parseAmount(formData.get("amount"));
  if (!isUuid(clientId)) return fail(errorMessage("NOT_FOUND"));
  if (!amount) return fail(errorMessage("INVALID_AMOUNT"));

  const r = await callRpc("rpc_admin_credit_client", { p_admin: me.id, p_client: clientId, p_amount: amount });
  if (!r.ok) return fail(errorMessage(r.error));
  revalidatePath("/dashboard/admin");
  return done(`Compte crédité de ${money(amount)}.`);
}

export async function generateWithdrawalCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await guard("admin");
  if (!me) return fail(errorMessage("FORBIDDEN"));
  const clientId = String(formData.get("client_id") ?? "");
  if (!isUuid(clientId)) return fail(errorMessage("NOT_FOUND"));
  const rawAmount = String(formData.get("amount") ?? "").trim();
  const amount = rawAmount ? parseAmount(rawAmount) : null;
  if (rawAmount && !amount) return fail(errorMessage("INVALID_AMOUNT"));

  for (let i = 0; i < 3; i++) {
    const r = await callRpc("rpc_generate_withdrawal_code", {
      p_admin: me.id, p_client: clientId, p_code: newCode(), p_amount: amount,
    });
    if (r.ok) {
      revalidatePath("/dashboard/admin");
      return done(`Code généré : ${r.code} (frais : ${num(Number(r.fee))} crédits). Communiquez-le au client.`);
    }
    if (r.error !== "CODE_COLLISION") {
      const extra = r.error === "INSUFFICIENT_CREDITS"
        ? ` Il faut ${num(Number(r.fee))} crédits, vous avez ${num(Number(r.credits))}.` : "";
      return fail(errorMessage(r.error) + extra);
    }
  }
  return fail(errorMessage("CODE_COLLISION"));
}
