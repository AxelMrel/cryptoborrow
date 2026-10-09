"use client";

import { useState } from "react";
import { signupAdmin } from "@/lib/actions/signup";
import { money, num } from "@/lib/format";
import type { Plan } from "@/lib/types";
import { ActionForm, SubmitButton } from "@/components/dashboard/forms";

export default function SignupForm({ plans, defaultPlanId }: { plans: Plan[]; defaultPlanId?: string }) {
  const [planId, setPlanId] = useState(
    plans.find((p) => p.id === defaultPlanId)?.id ?? plans.find((p) => p.highlight)?.id ?? plans[0]?.id ?? "",
  );
  const plan = plans.find((p) => p.id === planId);

  return (
    <ActionForm action={signupAdmin} className="space-y-5">
      <input type="hidden" name="plan_id" value={planId} />
      <fieldset>
        <legend className="label">Votre pack</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {plans.map((p) => (
            <button
              type="button" key={p.id} onClick={() => setPlanId(p.id)} aria-pressed={p.id === planId}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                p.id === planId ? "border-brand bg-brand/5" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-slate-500">{money(p.price)}</p>
            </button>
          ))}
        </div>
        {plan && (
          <p className="mt-2 text-xs text-slate-500">
            {num(plan.credits)} crédits · {num(plan.max_clients)} clients max
          </p>
        )}
      </fieldset>
      <div>
        <label className="label" htmlFor="su-name">Nom complet</label>
        <input id="su-name" name="full_name" required minLength={2} maxLength={100} className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="su-email">Email</label>
        <input id="su-email" name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="su-pass">Mot de passe (8 caractères minimum)</label>
        <input id="su-pass" name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
      </div>
      <SubmitButton className="btn btn-primary w-full">
        {plan ? `Payer ${money(plan.price)} et créer mon espace` : "Créer mon espace"}
      </SubmitButton>
    </ActionForm>
  );
}
