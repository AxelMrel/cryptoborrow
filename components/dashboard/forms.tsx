"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/types";

export function SubmitButton({
  children,
  className = "btn btn-primary",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus(); // désactive le bouton pendant l'envoi : anti double-clic
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "…" : children}
    </button>
  );
}

export function Feedback({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <p
      role="status"
      className={`mt-2 rounded-lg px-3 py-2 text-sm break-words ${
        state.ok ? "bg-emerald-50 text-up" : "bg-rose-50 text-down"
      }`}
    >
      {state.message}
    </p>
  );
}

/** Formulaire branché sur une Server Action, avec retour utilisateur. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      <Feedback state={state} />
    </form>
  );
}
