import Link from "next/link";
import { CheckIcon } from "@/components/Icons";
import { getFees } from "@/lib/fees";
import { withLocale } from "@/i18n/config";
import { fcfa } from "@/i18n/format";
import { getDictionary, getLocale } from "@/i18n/server";

/** Tarifs à l'usage : inscription gratuite, puis un prix par client créé et par code de retrait. */
export default async function FeeCards() {
  const [t, locale, fees] = await Promise.all([getDictionary(), getLocale(), getFees()]);
  const p = t.adminLanding.pricing;
  const cards = [
    { name: p.free.name, price: p.free.price, text: p.free.text, unit: null, highlight: false },
    { name: p.client.name, price: fcfa(fees.clientCreation, locale), text: p.client.text, unit: p.perUnit, highlight: true },
    { name: p.code.name, price: fcfa(fees.withdrawalCode, locale), text: p.code.text, unit: p.perUnit, highlight: false },
  ];
  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-6 md:grid-cols-3 md:items-center">
        {cards.map((c) => (
          <div
            key={c.name}
            className={`flex flex-col rounded-3xl p-8 transition hover:-translate-y-1 ${
              c.highlight ? "bg-brand text-white shadow-[0_24px_60px_rgba(53,99,233,0.35)] md:py-12" : "border border-slate-200 bg-white shadow-[0_10px_36px_rgba(18,22,58,0.06)]"
            }`}
          >
            <h3 className="text-lg font-semibold">{c.name}</h3>
            <p className="mt-4 text-4xl font-bold">{c.price}</p>
            <p className={`mt-1 h-4 text-xs ${c.highlight ? "text-white/70" : "text-slate-400"}`}>{c.unit}</p>
            <p className={`mt-5 flex items-start gap-2 text-sm ${c.highlight ? "text-white/90" : "text-slate-700"}`}>
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" /><span>{c.text}</span>
            </p>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-slate-500">{t.billing.secure}</p>
      <div className="mt-6 text-center">
        <Link href={withLocale(locale, "/signup")} className="btn btn-primary !px-8 !py-3 text-base">{p.cta}</Link>
      </div>
    </div>
  );
}
