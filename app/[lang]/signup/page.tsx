import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import SignupForm from "@/components/SignupForm";
import { withLocale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getDictionary()).auth.signup.meta };
}

export default async function SignupPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.auth.signup;
  return (
    <AuthShell title={t.title} subtitle={t.subtitle} photo="/images/partners.jpg" quote={t.quote} homeHref="/admin">
      <SignupForm />
      <p className="mt-6 text-center text-sm text-slate-500">
        {t.haveAccount} <Link href={withLocale(locale, "/login")} className="font-medium text-brand hover:underline">{t.signIn}</Link>
      </p>
    </AuthShell>
  );
}
