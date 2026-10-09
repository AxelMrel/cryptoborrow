"use client";

import { signupAdmin } from "@/lib/actions/signup";
import { useI18n } from "@/i18n/provider";
import { ActionForm, SubmitButton } from "@/components/dashboard/forms";

export default function SignupForm() {
  const { t: dict } = useI18n();
  const t = dict.auth.signup;
  return (
    <ActionForm action={signupAdmin} className="space-y-5">
      <div>
        <label className="label" htmlFor="su-name">{t.fullName}</label>
        <input id="su-name" name="full_name" required minLength={2} maxLength={100} className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="su-email">{t.email}</label>
        <input id="su-email" name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="su-pass">{t.password}</label>
        <input id="su-pass" name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
      </div>
      <SubmitButton className="btn btn-primary w-full !py-3">{t.create}</SubmitButton>
    </ActionForm>
  );
}
