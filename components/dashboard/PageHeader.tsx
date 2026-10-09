import Link from "next/link";

/** En-tête des sous-pages du dashboard : retour + titre. */
export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <Link href="/dashboard/client" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-brand">
        <span aria-hidden>←</span> Mon portefeuille
      </Link>
      <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}
