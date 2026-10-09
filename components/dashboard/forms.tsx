"use client";

import { useActionState, useCallback, useEffect, useRef, type ReactNode } from "react";
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

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * useActionState + conservation des saisies en cas d'erreur.
 * React réinitialise un formulaire à la fin de chaque action ; sans ceci, une simple faute de frappe
 * efface tous les champs. En cas d'échec on remet donc les valeurs saisies (sauf les mots de passe).
 */
export function useActionFormState(action: Action) {
  const snapshot = useRef<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const wrapped = useCallback<Action>(
    async (prev, formData) => {
      snapshot.current = Object.fromEntries([...formData.entries()].filter((e): e is [string, string] => typeof e[1] === "string"));
      return action(prev, formData);
    },
    [action],
  );
  const [state, formAction] = useActionState(wrapped, null);

  useEffect(() => {
    if (!state || state.ok || !formRef.current) return;
    for (const el of Array.from(formRef.current.elements)) {
      if (
        (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) &&
        el.name && el.type !== "password" && el.type !== "hidden" && el.name in snapshot.current
      ) {
        el.value = snapshot.current[el.name];
      }
    }
  }, [state]);

  // Action qui renvoie une adresse de paiement : on garde les identifiants du client le temps du paiement
  // (sessionStorage du navigateur de l'admin, jamais stockés en clair côté serveur), puis on part chez FedaPay.
  useEffect(() => {
    if (!state?.ok || !state.redirectTo) return;
    if (state.credentials) {
      try {
        sessionStorage.setItem(`cp-credentials:${state.credentials.clientId}`, JSON.stringify(state.credentials));
      } catch {
        /* stockage indisponible : l'admin devra communiquer le mot de passe lui-même */
      }
    }
    window.location.assign(state.redirectTo);
  }, [state]);

  return [state, formAction, formRef] as const;
}

/** Formulaire branché sur une Server Action, avec retour utilisateur. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, formRef] = useActionFormState(action);
  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
      <Feedback state={state} />
    </form>
  );
}
