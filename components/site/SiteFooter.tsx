import Link from "next/link";
import Logo from "@/components/Logo";

const CONTENT = {
  client: {
    home: "/",
    blurb: "Votre portefeuille crypto en FCFA, les marchés en direct et des retraits sécurisés par code.",
    columns: [
      {
        title: "Découvrir",
        links: [
          { href: "#acces", label: "Obtenir mon accès" },
          { href: "#fonctionnalites", label: "Fonctionnalités" },
          { href: "#marches", label: "Marchés en direct" },
        ],
      },
      {
        title: "Mon espace",
        links: [{ href: "/login", label: "Me connecter" }],
      },
    ],
  },
  admin: {
    home: "/admin",
    blurb: "Créez vos clients, créditez leurs comptes et générez leurs codes de retrait depuis un seul espace.",
    columns: [
      {
        title: "Espace admin",
        links: [
          { href: "#outils", label: "Outils" },
          { href: "#etapes", label: "Étapes" },
          { href: "#tarifs", label: "Packs" },
        ],
      },
      {
        title: "Mon compte",
        links: [
          { href: "/signup", label: "Devenir admin" },
          { href: "/login", label: "Me connecter" },
        ],
      },
    ],
  },
} as const;

/** Pied de page des landings. Le footer client ne contient aucun lien vers l'espace admin. */
export default function SiteFooter({ audience }: { audience: "client" | "admin" }) {
  const c = CONTENT[audience];
  return (
    <footer className="border-t border-slate-200 bg-surface">
      <div className="mx-auto grid max-w-[1160px] gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <div>
          <Link href={c.home} aria-label="Accueil"><Logo className="h-14" /></Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">{c.blurb}</p>
        </div>

        {c.columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold text-ink">{col.title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-500">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  {l.href.startsWith("#") ? (
                    <a href={l.href} className="transition hover:text-brand">{l.label}</a>
                  ) : (
                    <Link href={l.href} className="transition hover:text-brand">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h3 className="text-sm font-semibold text-ink">Données de marché</h3>
          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            Cours des cryptos en direct via Binance, taux de change publiés par la Banque centrale européenne, convertis en FCFA.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-400 sm:flex-row">
          <p>© 2026 CoinPulse. Tous droits réservés.</p>
          <a href="#top" className="font-medium text-slate-500 transition hover:text-brand">Retour en haut ↑</a>
        </div>
      </div>
    </footer>
  );
}
