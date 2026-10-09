import { fcfa } from "@/lib/format";

/** Bloc principal du dashboard client : le solde du portefeuille est l'information centrale. */
export default function BalanceHero({ name, balance, received, withdrawn }: {
  name: string;
  balance: number;
  received: number;
  withdrawn: number;
}) {
  const first = name.split(/\s+/)[0];
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-[0_24px_60px_rgba(53,99,233,0.3)] sm:p-10">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/5" />

      <div className="relative">
        <p className="text-sm text-white/75">Bonjour {first}</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-white/70">Solde de mon portefeuille</p>
        <p className="mt-2 break-words text-4xl font-bold leading-tight sm:text-6xl">{fcfa(balance)}</p>
        <p className="mt-1 text-xs text-white/60">Solde simulé, aucun fonds réel</p>

        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#depot" className="btn bg-white !px-6 !py-3 !text-brand hover:bg-slate-100">Déposer</a>
          <a href="#retrait" className="btn border border-white/50 !px-6 !py-3 text-white hover:bg-white/10">Retirer</a>
        </div>

        <dl className="mt-8 grid max-w-md grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/10 p-4">
            <dt className="text-xs text-white/70">Total reçu</dt>
            <dd className="mt-1 text-lg font-semibold">{fcfa(received)}</dd>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <dt className="text-xs text-white/70">Total retiré</dt>
            <dd className="mt-1 text-lg font-semibold">{fcfa(withdrawn)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
