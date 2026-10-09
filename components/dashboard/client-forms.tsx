"use client";

import { useActionState, useState } from "react";
import { deposit, withdraw } from "@/lib/actions/client";
import type { ActionState } from "@/lib/types";
import { ActionForm, Feedback, SubmitButton } from "./forms";

export function DepositForm() {
  return (
    <ActionForm action={deposit} className="space-y-3">
      <div>
        <label className="label" htmlFor="dep-amount">Montant (FCFA)</label>
        <input id="dep-amount" name="amount" inputMode="numeric" required className="input" placeholder="ex. 50000" />
      </div>
      <SubmitButton className="btn btn-primary w-full">Déposer</SubmitButton>
    </ActionForm>
  );
}

/** Retrait en deux temps : montant -> message "contactez votre admin" -> saisie du code. */
export function WithdrawFlow() {
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState("");
  const [state, formAction] = useActionState(withdraw, null);
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
          Nouveau retrait
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-3">
        <div>
          <label className="label" htmlFor="wd-amount">Montant à retirer (FCFA)</label>
          <input
            id="wd-amount" inputMode="numeric" className="input" placeholder="ex. 20000"
            value={amount} onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button
          type="button" className="btn btn-ghost w-full" disabled={!/^\d+$/.test(amount.trim()) || Number(amount) <= 0}
          onClick={() => setStep(2)}
        >
          Demander un retrait
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Contactez votre admin pour obtenir un code de retrait.
      </p>
      <input type="hidden" name="amount" value={amount} />
      <p className="text-sm text-slate-500">Montant demandé : <span className="font-mono text-white">{amount} FCFA</span></p>
      <div>
        <label className="label" htmlFor="wd-code">Code de retrait</label>
        <input id="wd-code" name="code" required autoComplete="off" className="input font-mono uppercase tracking-widest" placeholder="ABCD2345" />
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Retour</button>
        <SubmitButton className="btn btn-primary flex-1">Valider le retrait</SubmitButton>
      </div>
      {state && !state.ok && <Feedback state={state} />}
    </form>
  );
}
