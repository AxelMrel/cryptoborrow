"use client";

import { changePassword, updateProfile } from "@/lib/actions/profile";
import { ActionForm, SubmitButton } from "./forms";

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  return (
    <ActionForm action={updateProfile} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="pf-name">Nom complet</label>
        <input id="pf-name" name="full_name" required minLength={2} maxLength={100} defaultValue={fullName} className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="pf-phone">Téléphone</label>
        <input id="pf-phone" name="phone" type="tel" defaultValue={phone} className="input" placeholder="+33 6 12 34 56 78" autoComplete="tel" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="pf-email">E-mail</label>
        <input id="pf-email" value={email} readOnly disabled className="input" />
        <p className="mt-1 text-xs text-slate-400">L&apos;e-mail est celui que votre admin a utilisé pour créer votre compte. Il ne peut pas être modifié ici.</p>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton className="btn btn-primary w-full sm:w-auto">Enregistrer</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PasswordForm() {
  return (
    <ActionForm action={changePassword} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="pw-current">Mot de passe actuel</label>
        <input id="pw-current" name="current" type="password" required autoComplete="current-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="pw-next">Nouveau mot de passe (8 caractères minimum)</label>
        <input id="pw-next" name="next" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="pw-confirm">Confirmer le nouveau mot de passe</label>
        <input id="pw-confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton className="btn btn-primary w-full sm:w-auto">Modifier le mot de passe</SubmitButton>
      </div>
    </ActionForm>
  );
}
