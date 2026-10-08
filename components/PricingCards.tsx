import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { fcfa, num } from "@/lib/format";
import { CheckIcon } from "@/components/Icons";

/** Cartes de pricing de la landing (définies dans lib/plans.ts). */
export default function PricingCards() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3 md:items-center">
      {PLANS.map((p) => (
        <div
          key={p.id}
          className={`relative flex flex-col rounded-3xl p-8 transition hover:-translate-y-1 ${
            p.highlight
              ? "bg-brand text-white shadow-[0_24px_60px_rgba(53,99,233,0.35)] md:py-12"
              : "border border-slate-200 bg-white shadow-[0_10px_36px_rgba(18,22,58,0.06)]"
          }`}
        >
          {p.highlight && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-300 px-3 py-0.5 text-xs font-bold text-ink">
              Le plus choisi
            </span>
          )}
          <h3 className="text-lg font-semibold">{p.name}</h3>
          <p className="mt-4 text-4xl font-bold">{fcfa(p.price)}</p>
          <p className={`mt-1 text-xs ${p.highlight ? "text-white/70" : "text-slate-400"}`}>paiement unique (simulé)</p>
          <ul className={`mt-6 flex-1 space-y-3 text-sm ${p.highlight ? "text-white/90" : "text-slate-700"}`}>
            <li className="flex items-start gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0" /><span><b>{num(p.credits)}</b> crédits inclus</span></li>
            <li className="flex items-start gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0" /><span>Jusqu&apos;à <b>{num(p.max_clients)}</b> clients</span></li>
            <li className="flex items-start gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0" /><span>Codes de retrait pour vos clients</span></li>
            <li className="flex items-start gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0" /><span>Dashboard et graphes complets</span></li>
          </ul>
          <Link
            href={`/signup?plan=${p.id}`}
            className={`btn mt-8 ${p.highlight ? "bg-white !text-brand hover:bg-slate-100" : "btn-primary"}`}
          >
            Choisir {p.name}
          </Link>
        </div>
      ))}
    </div>
  );
}
