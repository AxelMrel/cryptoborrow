"use client";

import { changePassword, updateProfile } from "@/lib/actions/profile";
import { useI18n } from "@/i18n/provider";
import { ActionForm, SubmitButton } from "./forms";

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const { t: dict } = useI18n();
  const t = dict.client.profile;
  return (
    <ActionForm action={updateProfile} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="pf-name">{t.fullName}</label>
        <input id="pf-name" name="full_name" required minLength={2} maxLength={100} defaultValue={fullName} className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="pf-phone">{t.phone}</label>
        <input id="pf-phone" name="phone" type="tel" defaultValue={phone} className="input" placeholder={t.phonePlaceholder} autoComplete="tel" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="pf-email">{t.email}</label>
        <input id="pf-email" value={email} readOnly disabled className="input" />
        <p className="mt-1 text-xs text-slate-400">{t.emailNote}</p>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton className="btn btn-primary w-full sm:w-auto">{t.save}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PasswordForm() {
  const { t: dict } = useI18n();
  const t = dict.client.profile;
  return (
    <ActionForm action={changePassword} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="pw-current">{t.current}</label>
        <input id="pw-current" name="current" type="password" required autoComplete="current-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="pw-next">{t.next}</label>
        <input id="pw-next" name="next" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="pw-confirm">{t.confirm}</label>
        <input id="pw-confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton className="btn btn-primary w-full sm:w-auto">{t.changePassword}</SubmitButton>
      </div>
    </ActionForm>
  );
}
