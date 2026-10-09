"use client";

import { useState } from "react";
import { addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } from "@/lib/actions/payment";
import { CardIcon, TrashIcon } from "@/components/Icons";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import type { PaymentMethod } from "@/lib/types";
import { ActionForm, SubmitButton } from "./forms";

/** Formulaire d'ajout. Aucun numéro complet ni cryptogramme n'est demandé : seulement les 4 derniers chiffres. */
export function AddPaymentMethodForm() {
  const { t: dict } = useI18n();
  const t = dict.client.payments;
  const [kind, setKind] = useState<"card" | "bank">("card");
  return (
    <ActionForm action={addPaymentMethod} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <div className="inline-flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label={t.kindLabel}>
        {(["card", "bank"] as const).map((k) => (
          <button
            key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${kind === k ? "bg-white text-ink shadow-sm" : "text-slate-500"}`}
          >
            {k === "card" ? t.card : t.bank}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {kind === "card" ? (
          <div>
            <label className="label" htmlFor="pm-label">{t.brand}</label>
            <select id="pm-label" name="label" required defaultValue={t.brands[0]} className="input">
              {t.brands.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="label" htmlFor="pm-label">{t.bankName}</label>
            <input id="pm-label" name="label" required maxLength={40} className="input" placeholder={t.bankPlaceholder} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="pm-holder">{t.holder}</label>
          <input id="pm-holder" name="holder" required minLength={2} maxLength={80} className="input" autoComplete="cc-name" />
        </div>
        <div>
          <label className="label" htmlFor="pm-last4">{kind === "card" ? t.last4Card : t.last4Bank}</label>
          <input id="pm-last4" name="last4" required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} className="input font-mono tracking-widest" placeholder="1234" autoComplete="off" />
        </div>
        {kind === "card" && (
          <div>
            <label className="label" htmlFor="pm-expiry">{t.expiry}</label>
            <input id="pm-expiry" name="expiry" required pattern="(0[1-9]|1[0-2])/[0-9]{2}" maxLength={5} className="input font-mono" placeholder="08/28" autoComplete="cc-exp" />
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">{t.security}</p>
      <SubmitButton className="btn btn-primary w-full sm:w-auto">{t.submit}</SubmitButton>
    </ActionForm>
  );
}

/** Une ligne de la liste : infos masquées + actions (par défaut, supprimer). */
export function PaymentMethodItem({ method }: { method: PaymentMethod }) {
  const { t: dict } = useI18n();
  const t = dict.client.payments;
  const title = method.kind === "card" ? `${method.label} •••• ${method.last4}` : `${method.label} • ${t.iban} •••• ${method.last4}`;
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><CardIcon /></span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            <span className="truncate">{title}</span>
            {method.is_default && <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-up">{t.isDefault}</span>}
          </p>
          <p className="truncate text-sm text-slate-500">
            {method.holder}{method.expiry ? ` · ${fmt(t.expires, { date: method.expiry })}` : ""}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {!method.is_default && (
          <ActionForm action={setDefaultPaymentMethod}>
            <input type="hidden" name="id" value={method.id} />
            <SubmitButton className="btn btn-ghost !py-2 !text-xs">{t.makeDefault}</SubmitButton>
          </ActionForm>
        )}
        <ActionForm action={deletePaymentMethod}>
          <input type="hidden" name="id" value={method.id} />
          <SubmitButton className="btn btn-ghost !py-2 !text-xs !text-down">
            <TrashIcon className="h-4 w-4" />{t.remove}
          </SubmitButton>
        </ActionForm>
      </div>
    </li>
  );
}
