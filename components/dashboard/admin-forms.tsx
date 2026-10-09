"use client";

import { useRef, useState } from "react";
import { createClientAccount, creditClient, generateWithdrawalCode } from "@/lib/actions/admin";
import { CopyIcon, SendIcon } from "@/components/Icons";
import { fmt, num } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import type { Credentials } from "@/lib/types";
import { ActionForm, Feedback, SubmitButton, useActionFormState } from "./forms";

const PWD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
function randomPassword(len = 12) {
  const bytes = crypto.getRandomValues(new Uint32Array(len));
  return Array.from(bytes, (n) => PWD_ALPHABET[n % PWD_ALPHABET.length]).join("");
}

/** Création d'un client + remise de ses coordonnées (copie, WhatsApp, e-mail). */
export function CreateClientForm() {
  const { t: dict } = useI18n();
  const t = dict.admin.form;
  const [state, formAction, formRef] = useActionFormState(createClientAccount);
  const pass = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">{t.fullName}</label>
          <input id="c-name" name="full_name" required minLength={2} maxLength={100} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="c-email">{t.clientEmail}</label>
          <input id="c-email" name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="c-pass">{t.initialPassword}</label>
          <div className="flex gap-2">
            <input id="c-pass" ref={pass} name="password" type="text" required minLength={8} autoComplete="off" className="input font-mono" />
            <button type="button" className="btn btn-ghost whitespace-nowrap" onClick={() => { if (pass.current) pass.current.value = randomPassword(); }}>
              {t.generate}
            </button>
          </div>
        </div>
        <div className="flex items-end">
          <SubmitButton className="btn btn-primary w-full">{t.create}</SubmitButton>
        </div>
      </form>
      {state && !state.ok && <Feedback state={state} />}
      {state?.ok && state.credentials && <CredentialsCard key={state.credentials.email} credentials={state.credentials} />}
    </div>
  );
}

/** Message d'accès prêt à envoyer au client. Le mot de passe n'est affiché que maintenant. */
function CredentialsCard({ credentials }: { credentials: Credentials }) {
  const { t: dict } = useI18n();
  const t = dict.admin.credentials;
  const [copied, setCopied] = useState(false);
  const first = credentials.name.split(/\s+/)[0];
  const link = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname.split("/").slice(0, 2).join("/")}/login` : "/login";
  const text = fmt(t.message, { first, email: credentials.email, password: credentials.password, link });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* presse-papiers indisponible : le texte reste sélectionnable */
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
      <p className="font-semibold text-up">{t.created}</p>
      <p className="mt-1 text-xs text-slate-500">{t.once}</p>
      <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{text}</pre>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="btn btn-ghost"><CopyIcon className="h-4 w-4" />{copied ? t.copied : t.copy}</button>
        <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text)}`}>
          <SendIcon className="h-4 w-4" />{t.whatsapp}
        </a>
        <a className="btn btn-ghost" href={`mailto:${credentials.email}?subject=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(text)}`}>
          <SendIcon className="h-4 w-4" />{t.email}
        </a>
      </div>
    </div>
  );
}

/** Actions d'un client : créditer son compte / générer un code de retrait. */
export function ClientActions({ clientId, fee }: { clientId: string; fee: number }) {
  const { locale, t: dict } = useI18n();
  const t = dict.admin.clientActions;
  return (
    <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
      <ActionForm action={creditClient} className="space-y-2">
        <input type="hidden" name="client_id" value={clientId} />
        <label className="label" htmlFor={`cr-${clientId}`}>{t.creditLabel}</label>
        <div className="flex gap-2">
          <input id={`cr-${clientId}`} name="amount" inputMode="numeric" required className="input" placeholder={t.creditPlaceholder} />
          <SubmitButton className="btn btn-ghost whitespace-nowrap">{t.credit}</SubmitButton>
        </div>
      </ActionForm>
      <ActionForm action={generateWithdrawalCode} className="space-y-2">
        <input type="hidden" name="client_id" value={clientId} />
        <label className="label" htmlFor={`wc-${clientId}`}>{fmt(t.codeLabel, { fee: num(fee, locale) })}</label>
        <div className="flex gap-2">
          <input id={`wc-${clientId}`} name="amount" inputMode="numeric" className="input" placeholder={t.codePlaceholder} />
          <SubmitButton className="btn btn-primary whitespace-nowrap">{t.generate}</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
