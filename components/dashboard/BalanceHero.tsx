"use client";

import { useSyncExternalStore } from "react";
import { num } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { EyeIcon, EyeOffIcon } from "@/components/Icons";
import DepositButton from "./DepositModal";

// Le choix "solde masqué" est mémorisé sur l'appareil (localStorage), sans jamais quitter le navigateur.
const KEY = "coinpulse-balance-hidden";
const EVENT = "coinpulse:balance-visibility";

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
};
const getSnapshot = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};
const getServerSnapshot = () => false;

function toggleHidden(next: boolean) {
  try {
    localStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    /* stockage indisponible : le choix vaut pour cette session seulement */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Portefeuille dessiné (SVG, sans image externe). */
function WalletArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 110" className={className} aria-hidden>
      <rect x="22" y="10" width="86" height="62" rx="10" fill="#fff" opacity="0.28" transform="rotate(-8 65 41)" />
      <rect x="10" y="26" width="112" height="76" rx="16" fill="#fff" opacity="0.38" />
      <rect x="10" y="34" width="112" height="68" rx="16" fill="#fff" opacity="0.22" />
      <path d="M96 56h26a0 0 0 0 1 0 0v26a0 0 0 0 1 0 0H96a13 13 0 0 1 0-26Z" fill="#fff" opacity="0.55" />
      <circle cx="98" cy="69" r="5.5" fill="#fff" opacity="0.95" />
    </svg>
  );
}

/** Carte du solde : "Solde disponible", montant masquable, portefeuille, actions Déposer / Retirer. */
export default function BalanceHero({ balance }: { balance: number }) {
  const { locale, t: dict } = useI18n();
  const t = dict.client.balance;
  const hidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark px-5 py-5 text-white shadow-[0_18px_44px_rgba(53,99,233,0.28)] sm:px-8 sm:py-6">
      <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-white/10" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-base font-medium sm:text-lg">{t.label}</p>
            <button
              type="button"
              onClick={() => toggleHidden(!hidden)}
              aria-label={hidden ? t.show : t.hide}
              aria-pressed={hidden}
              className="rounded-full p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {hidden ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          <p className="mt-2 flex items-baseline gap-2">
            <span className="break-all text-4xl font-bold leading-none sm:text-5xl">{hidden ? "••••••" : num(balance, locale)}</span>
            <span className="text-base font-semibold text-white/80 sm:text-xl">€</span>
          </p>

          <div className="mt-5 flex gap-3">
            <DepositButton className="btn bg-white !px-6 !py-2.5 !text-brand hover:bg-slate-100">{t.deposit}</DepositButton>
            <a href="#retrait" className="btn border border-white/50 !px-6 !py-2.5 text-white hover:bg-white/10">{t.withdraw}</a>
          </div>
        </div>

        <WalletArt className="animate-float h-20 w-24 shrink-0 sm:h-28 sm:w-36" />
      </div>
    </section>
  );
}
