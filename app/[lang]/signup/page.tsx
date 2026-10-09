import { Suspense } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import SignupForm from "@/components/SignupForm";
import { PLANS } from "@/lib/plans";
import { withLocale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getDictionary()).auth.signup.meta };
}

async function SignupContent({ searchParams }: { searchParams: PageProps<"/[lang]/signup">["searchParams"] }) {
  const { plan } = await searchParams;
  return <SignupForm plans={PLANS} defaultPlanId={typeof plan === "string" ? plan : undefined} />;
}

export default async function SignupPage({ searchParams }: PageProps<"/[lang]/signup">) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.auth.signup;
  return (
    <AuthShell title={t.title} subtitle={t.subtitle} photo="/images/partners.jpg" quote={t.quote} homeHref="/admin">
      <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-slate-100" />}>
        <SignupContent searchParams={searchParams} />
      </Suspense>
      <p className="mt-6 text-center text-sm text-slate-500">
        {t.haveAccount} <Link href={withLocale(locale, "/login")} className="font-medium text-brand hover:underline">{t.signIn}</Link>
      </p>
    </AuthShell>
  );
}
