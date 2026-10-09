"use client";

import CoinIcon from "@/components/CoinIcon";
import { COINS, formatEuro, formatPrice, useBinanceTickers, useFxRates } from "@/lib/market";

function Change({ pct }: { pct: number }) {
  return <span className={pct >= 0 ? "text-up" : "text-down"}>{pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%</span>;
}

/** Bandeau défilant des cours en direct. */
export function LiveTicker() {
  const { tickers } = useBinanceTickers();
  const items = COINS.map((c) => ({ ...c, t: tickers[c.symbol] }));
  const row = (suffix: string) =>
    items.map((c) => (
      <span key={c.symbol + suffix} className="mx-6 inline-flex items-center gap-2 whitespace-nowrap font-mono text-sm">
        <CoinIcon short={c.short} size={20} /><b>{c.short}</b>
        {c.t ? (
          <>
            <span className="text-slate-700">{formatPrice(c.t.price)}</span>
            <Change pct={c.t.changePct} />
          </>
        ) : (
          <span className="text-slate-400">…</span>
        )}
      </span>
    ));
  return (
    <div className="overflow-hidden border-y border-slate-200 bg-white py-2.5" aria-label="Cours en direct">
      <div className="animate-marquee flex w-max">
        <div className="flex">{row("a")}</div>
        <div className="flex" aria-hidden>{row("b")}</div>
      </div>
    </div>
  );
}

/** Cartes "marchés en direct" (landing page). */
export function MarketsGrid() {
  const { tickers, live } = useBinanceTickers();
  const { eurPerUsd } = useFxRates();
  return (
    <div>
      <p className="mb-4 flex items-center justify-center gap-2 text-sm text-slate-500">
        <span className={`h-2 w-2 rounded-full ${live ? "bg-up animate-pulse" : "bg-slate-300"}`} />
        {live ? "Flux Binance en direct" : "Connexion au flux…"}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COINS.map((c) => {
          const t = tickers[c.symbol];
          return (
            <div key={c.symbol} className="card p-5 transition hover:-translate-y-1 hover:border-brand/40">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold"><CoinIcon short={c.short} />{c.name}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{c.short}</span>
              </div>
              <p className="mt-3 font-mono text-xl">{t ? `${formatPrice(t.price)} $` : "…"}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {t && eurPerUsd ? `≈ ${formatEuro(t.price * eurPerUsd)}` : " "}
              </p>
              <p className="mt-2 text-sm">{t ? <Change pct={t.changePct} /> : null}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
