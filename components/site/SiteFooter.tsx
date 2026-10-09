import Link from "next/link";
import Logo from "@/components/Logo";
import { withLocale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";

/** Pied de page des landings. Le footer client ne contient aucun lien vers l'espace admin. */
export default async function SiteFooter({ audience }: { audience: "client" | "admin" }) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const f = t.site.footer;
  const content =
    audience === "client"
      ? {
          home: "/",
          blurb: f.clientBlurb,
          columns: [
            { title: f.discover, links: [{ href: "#acces", label: f.access }, { href: "#fonctionnalites", label: f.features }, { href: "#marches", label: f.marketsLive }] },
            { title: f.myArea, links: [{ href: "/login", label: f.signIn }] },
          ],
        }
      : {
          home: "/admin",
          blurb: f.adminBlurb,
          columns: [
            { title: f.adminArea, links: [{ href: "#outils", label: f.tools }, { href: "#etapes", label: f.steps }, { href: "#tarifs", label: f.pricing }] },
            { title: f.myAccount, links: [{ href: "/signup", label: f.becomeAdmin }, { href: "/login", label: f.signIn }] },
          ],
        };

  return (
    <footer className="border-t border-slate-200 bg-surface">
      <div className="mx-auto grid max-w-[1160px] gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <div>
          <Link href={withLocale(locale, content.home)} aria-label={f.home}><Logo className="h-14" /></Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">{content.blurb}</p>
        </div>

        {content.columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold text-ink">{col.title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-500">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  {l.href.startsWith("#") ? (
                    <a href={l.href} className="transition hover:text-brand">{l.label}</a>
                  ) : (
                    <Link href={withLocale(locale, l.href)} className="transition hover:text-brand">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h3 className="text-sm font-semibold text-ink">{f.marketData}</h3>
          <p className="mt-4 text-sm leading-relaxed text-slate-500">{f.marketDataText}</p>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-400 sm:flex-row">
          <p>{f.rights}</p>
          <a href="#top" className="font-medium text-slate-500 transition hover:text-brand">{f.backToTop} ↑</a>
        </div>
      </div>
    </footer>
  );
}
