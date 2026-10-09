"use client";

import { useRef } from "react";
import { createClientAccount, creditClient, buyWithdrawalCode, payForPendingClient, removePendingClient } from "@/lib/actions/admin";
import { fcfa, fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { ActionForm, Feedback, SubmitButton, useActionFormState } from "./forms";

const PWD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
function randomPassword(len = 12) {
  const bytes = crypto.getRandomValues(new Uint32Array(len));
  return Array.from(bytes, (n) => PWD_ALPHABET[n % PWD_ALPHABET.length]).join("");
}

/** Création d'un client : payante. Après validation, l'admin est redirigé vers la page de paiement FedaPay. */
export function CreateClientForm({ fee }: { fee: number }) {
  const { locale, t: dict } = useI18n();
  const t = dict.admin.form;
  const b = dict.billing;
  const [state, formAction, formRef] = useActionFormState(createClientAccount);
  const pass = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{b.createClient.explain}</p>
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
          <SubmitButton className="btn btn-primary w-full">{fmt(b.createClient.submit, { fee: fcfa(fee, locale) })}</SubmitButton>
        </div>
      </form>
      <p className="text-xs text-slate-400">{b.secure}</p>
      {state && <Feedback state={state} />}
    </div>
  );
}

/** Actions d'un client ACTIF : créditer son compte (gratuit) / acheter un code de retrait. */
export function ActiveClientActions({ clientId, fee }: { clientId: string; fee: number }) {
  const { locale, t: dict } = useI18n();
  const t = dict.admin.clientActions;
  const c = dict.billing.code;
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
      <ActionForm action={buyWithdrawalCode} className="space-y-2">
        <input type="hidden" name="client_id" value={clientId} />
        <label className="label" htmlFor={`wc-${clientId}`}>{fmt(c.label, { fee: fcfa(fee, locale) })}</label>
        <div className="flex gap-2">
          <input id={`wc-${clientId}`} name="amount" inputMode="numeric" className="input" placeholder={c.placeholder} />
          <SubmitButton className="btn btn-primary whitespace-nowrap">{fmt(c.buy, { fee: fcfa(fee, locale) })}</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}

/** Client en attente de paiement : relancer le paiement ou supprimer le compte jamais payé. */
export function PendingClientActions({ clientId, fee }: { clientId: string; fee: number }) {
  const { locale, t: dict } = useI18n();
  const t = dict.billing.pending;
  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <p className="mb-3 text-sm text-amber-800">{fmt(t.text, { fee: fcfa(fee, locale) })}</p>
      <div className="flex flex-wrap gap-2">
        <ActionForm action={payForPendingClient}>
          <input type="hidden" name="client_id" value={clientId} />
          <SubmitButton className="btn btn-primary !py-2">{fmt(t.pay, { fee: fcfa(fee, locale) })}</SubmitButton>
        </ActionForm>
        <ActionForm action={removePendingClient}>
          <input type="hidden" name="client_id" value={clientId} />
          <SubmitButton className="btn btn-ghost !py-2 !text-down">{t.remove}</SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
