import AuthShell from "@/components/AuthShell";
import { ActionForm, SubmitButton } from "@/components/dashboard/forms";
import { signIn } from "@/lib/actions/auth";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getDictionary()).auth.login.meta };
}

export default async function LoginPage() {
  const t = (await getDictionary()).auth.login;
  return (
    <AuthShell title={t.title} subtitle={t.subtitle} scene="market" quote={t.quote}>
      <ActionForm action={signIn} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">{t.email}</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder={t.emailPlaceholder} />
        </div>
        <div>
          <label className="label" htmlFor="password">{t.password}</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
        </div>
        <SubmitButton className="btn btn-primary w-full !py-3">{t.submit}</SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
