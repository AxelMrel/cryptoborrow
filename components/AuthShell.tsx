import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { withLocale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";
import type { ReactNode } from "react";

/** Mise en page des pages connexion / inscription : formulaire à gauche, photo humaine à droite. */
export default async function AuthShell({ title, subtitle, photo, quote, homeHref = "/", children }: {
  title: string;
  subtitle: string;
  photo: string;
  quote: string;
  homeHref?: string;
  children: ReactNode;
}) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-between">
            <Link href={withLocale(locale, homeHref)} aria-label={t.auth.home}><Logo className="h-16" /></Link>
            <LanguageSwitcher />
          </div>
          <h1 className="mt-10 text-3xl font-semibold">{title}</h1>
          <p className="mb-7 mt-2 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
      </section>
      <aside className="relative hidden lg:block">
        <Image src={photo} alt="" fill sizes="50vw" priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand/80 via-brand/10 to-transparent" />
        <p className="absolute bottom-10 left-10 right-10 text-2xl font-semibold leading-snug text-white">{quote}</p>
      </aside>
    </main>
  );
}
