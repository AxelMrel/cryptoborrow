import Link from "next/link";
import { withLocale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";

/** En-tête des sous-pages du dashboard : retour + titre. */
export default async function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  return (
    <div>
      <Link href={withLocale(locale, "/dashboard/client")} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-brand">
        <span aria-hidden>←</span> {t.dash.back}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}
