import { fcfa } from "@/lib/format";
import DepositButton from "./DepositModal";

/** Carte du solde (fine) : le solde du portefeuille est l'information centrale du dashboard client. */
export default function BalanceHero({ name, balance }: { name: string; balance: number }) {
  const first = name.split(/\s+/)[0];
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark px-5 py-5 text-white shadow-[0_18px_44px_rgba(53,99,233,0.28)] sm:px-8 sm:py-6">
      <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-white/10" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">Solde de mon portefeuille</p>
          <p className="mt-1 break-words text-3xl font-bold leading-tight sm:text-5xl">{fcfa(balance)}</p>
          <p className="mt-1 text-sm text-white/70">Bonjour {first}</p>
        </div>

        <div className="flex gap-3">
          <DepositButton className="btn bg-white !px-6 !py-2.5 !text-brand hover:bg-slate-100">Déposer</DepositButton>
          <a href="#retrait" className="btn border border-white/50 !px-6 !py-2.5 text-white hover:bg-white/10">Retirer</a>
        </div>
      </div>
    </section>
  );
}
