import Link from "next/link";

export default function SiteFooter({ audience }: { audience: "client" | "admin" }) {
  return (
    <footer className="border-t border-slate-200 px-4 py-10 text-center text-xs text-slate-400">
      <div className="mb-3 flex justify-center gap-6 text-sm text-slate-500">
        <Link href="/login" className="hover:text-brand">Connexion</Link>
        {audience === "admin" && <Link href="/signup" className="hover:text-brand">Devenir admin</Link>}
      </div>
      CryptoBO est un projet pédagogique. Toutes les opérations sont simulées, aucun fonds réel n&apos;est manipulé.
      <br />Photos : Unsplash.
    </footer>
  );
}
