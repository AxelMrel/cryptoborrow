"use client";

import { useSyncExternalStore } from "react";
import { signIn } from "@/lib/actions/auth";
import { useI18n } from "@/i18n/provider";
import { ActionForm, SubmitButton } from "@/components/dashboard/forms";

const noopSubscribe = () => () => {};

/** Formulaire de connexion. Le lien envoyé par l'admin préremplit l'e-mail (?email=...). */
export default function LoginForm() {
  const { t: dict } = useI18n();
  const t = dict.auth.login;
  const prefill = useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("email") ?? "",
    () => "",
  );
  return (
    <ActionForm action={signIn} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">{t.email}</label>
        <input key={prefill} id="email" name="email" type="email" required autoComplete="email" className="input" placeholder={t.emailPlaceholder} defaultValue={prefill} />
      </div>
      <div>
        <label className="label" htmlFor="password">{t.password}</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" autoFocus={Boolean(prefill)} />
      </div>
      <SubmitButton className="btn btn-primary w-full !py-3">{t.submit}</SubmitButton>
    </ActionForm>
  );
}
