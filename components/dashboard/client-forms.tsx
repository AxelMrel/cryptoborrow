"use client";

import { useState } from "react";
import { withdraw } from "@/lib/actions/client";
import { useI18n } from "@/i18n/provider";
import type { ActionState } from "@/lib/types";
import { Feedback, SubmitButton, useActionFormState } from "./forms";

/** Retrait en deux temps : montant -> message "contactez votre admin" -> saisie du code. */
export function WithdrawFlow() {
  const { t: dict } = useI18n();
  const t = dict.client.withdraw;
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState("");
  const [state, formAction, formRef] = useActionFormState(withdraw);
  const [dismissed, setDismissed] = useState<ActionState>(null);

  // Retrait réussi : écran de confirmation jusqu'à ce que le client en démarre un nouveau.
  if (state?.ok && state !== dismissed) {
    return (
      <div className="space-y-3">
        <Feedback state={state} />
        <button
          type="button" className="btn btn-ghost w-full"
          onClick={() => { setDismissed(state); setStep(1); setAmount(""); }}
        >
          {t.again}
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-3 sm:flex sm:items-end sm:gap-3 sm:space-y-0">
        <div className="sm:flex-1">
          <label className="label" htmlFor="wd-amount">{t.amountLabel}</label>
          <input
            id="wd-amount" inputMode="numeric" className="input" placeholder={t.amountPlaceholder}
            value={amount} onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button
          type="button" className="btn btn-primary w-full sm:w-auto sm:whitespace-nowrap" disabled={!/^\d+$/.test(amount.trim()) || Number(amount) <= 0}
          onClick={() => setStep(2)}
        >
          {t.request}
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="max-w-xl space-y-3">
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        {t.contactAdmin}
      </p>
      <input type="hidden" name="amount" value={amount} />
      <p className="text-sm text-slate-500">{t.requested} <span className="font-mono font-semibold text-ink">{amount} €</span></p>
      <div>
        <label className="label" htmlFor="wd-code">{t.codeLabel}</label>
        <input id="wd-code" name="code" required autoComplete="off" className="input font-mono uppercase tracking-widest" placeholder="ABCD2345" />
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>{t.back}</button>
        <SubmitButton className="btn btn-primary flex-1">{t.validate}</SubmitButton>
      </div>
      {state && !state.ok && <Feedback state={state} />}
    </form>
  );
}
