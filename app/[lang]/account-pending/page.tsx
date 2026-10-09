import Link from "next/link";
import Logo from "@/components/Logo";
import { signOut } from "@/lib/actions/auth";
import { withLocale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getDictionary()).billing.pendingPage.title };
}

/** Un client dont l'admin n'a pas encore payé la création ne peut pas utiliser son espace. */
export default async function AccountPending() {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const p = t.billing.pendingPage;
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <Link href={withLocale(locale, "/")} className="inline-block" aria-label="CoinPulse"><Logo className="h-14" /></Link>
        <h1 className="mt-6 text-2xl font-semibold">{p.title}</h1>
        <p className="mt-3 text-sm text-slate-500">{p.text}</p>
        <form action={signOut} className="mt-7">
          <button className="btn btn-primary w-full">{p.logout}</button>
        </form>
      </div>
    </main>
  );
}
