import Link from "next/link";

export const Logo = () => (
  <span className="flex items-center gap-2 text-lg font-bold">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg text-white">₿</span>
    <span>Crypto<span className="text-brand">BO</span></span>
  </span>
);

/**
 * Navbar des pages publiques. Le site client ne contient AUCUN lien vers l'espace admin :
 * la landing admin est une adresse à part (/admin) que l'on communique aux admins.
 */
const MENU = {
  client: {
    home: "/",
    links: [
      { href: "#acces", label: "Obtenir mon accès" },
      { href: "#fonctionnalites", label: "Fonctionnalités" },
      { href: "#marches", label: "Marchés" },
    ],
  },
  admin: {
    home: "/admin",
    links: [
      { href: "#outils", label: "Outils" },
      { href: "#etapes", label: "Étapes" },
      { href: "#tarifs", label: "Packs" },
    ],
  },
} as const;

export default function SiteNav({ audience }: { audience: "client" | "admin" }) {
  const menu = MENU[audience];
  return (
    <nav className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto flex h-[68px] max-w-[1208px] items-center justify-between rounded-2xl border border-slate-200/60 bg-white px-5 shadow-[0_10px_36px_rgba(18,22,58,0.08)]">
        <Link href={menu.home}><Logo /></Link>
        <div className="hidden items-center gap-7 text-sm font-medium md:flex">
          {menu.links.map((l) => (
            <a key={l.href} href={l.href} className="text-slate-700 hover:text-brand">{l.label}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className={audience === "client" ? "btn btn-primary !py-2" : "btn btn-ghost !py-2"}>Connexion</Link>
          {audience === "admin" && <Link href="/signup" className="btn btn-primary !py-2 max-sm:hidden">Devenir admin</Link>}
        </div>
      </div>
    </nav>
  );
}
