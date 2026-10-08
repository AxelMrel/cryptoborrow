import { Suspense } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import SignupForm from "@/components/SignupForm";
import { PLANS } from "@/lib/plans";

export const metadata = { title: "Devenir admin | CryptoBO" };

async function SignupContent({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
  const { plan } = await searchParams;
  return <SignupForm plans={PLANS} defaultPlanId={typeof plan === "string" ? plan : undefined} />;
}

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <AuthShell
      title="Ouvrez votre espace admin"
      subtitle="Choisissez un pack : vos crédits et votre quota de clients sont activés immédiatement."
      photo="/images/partners.jpg"
      quote="Accompagnez vos clients et développez votre activité."
      homeHref="/admin"
    >
      <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-slate-100" />}>
        <SignupContent searchParams={searchParams} />
      </Suspense>
      <p className="mt-6 text-center text-sm text-slate-500">
        Déjà un compte ? <Link href="/login" className="font-medium text-brand hover:underline">Se connecter</Link>
      </p>
    </AuthShell>
  );
}
