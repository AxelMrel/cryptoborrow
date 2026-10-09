import Link from "next/link";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { withLocale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";

/**
 * Navbar des pages publiques. Le site client ne contient AUCUN lien vers l'espace admin :
 * la landing admin est une adresse à part (/admin) que l'on communique aux admins.
 */
export default async function SiteNav({ audience }: { audience: "client" | "admin" }) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const n = t.site.nav;
  const menu =
    audience === "client"
      ? { home: "/", links: [{ href: "#acces", label: n.client.access }, { href: "#fonctionnalites", label: n.client.features }, { href: "#marches", label: n.client.markets }] }
      : { home: "/admin", links: [{ href: "#outils", label: n.admin.tools }, { href: "#etapes", label: n.admin.steps }, { href: "#tarifs", label: n.admin.packs }] };

  return (
    <nav className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto flex h-[68px] max-w-[1208px] items-center justify-between rounded-2xl border border-slate-200/60 bg-white px-4 shadow-[0_10px_36px_rgba(18,22,58,0.08)] sm:px-5">
        <Link href={withLocale(locale, menu.home)} aria-label={n.home}><Logo className="h-14" /></Link>
        <div className="hidden items-center gap-7 text-sm font-medium md:flex">
          {menu.links.map((l) => (
            <a key={l.href} href={l.href} className="text-slate-700 hover:text-brand">{l.label}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href={withLocale(locale, "/login")} className={audience === "client" ? "btn btn-primary !py-2" : "btn btn-ghost !py-2"}>{n.login}</Link>
          {audience === "admin" && <Link href={withLocale(locale, "/signup")} className="btn btn-primary !py-2 max-sm:hidden">{n.becomeAdmin}</Link>}
        </div>
      </div>
    </nav>
  );
}
