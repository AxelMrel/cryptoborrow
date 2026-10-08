"use client";

import { useEffect, useState } from "react";
import CoinIcon from "@/components/CoinIcon";
import { formatPrice, useBinanceTickers, useFxRates } from "@/lib/market";

/** Carte "Bitcoin en direct" avec mini-courbe (historique 1 min Binance + ticks WebSocket). */
export default function LiveBtcCard() {
  const { tickers } = useBinanceTickers();
  const { xofPerUsd } = useFxRates();
  const [hist, setHist] = useState<number[]>([]);
  const t = tickers["BTCUSDT"];

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=60")
      .then((r) => r.json())
      .then((rows: string[][]) => !cancelled && setHist(rows.map((k) => +k[4])))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const pts = t ? [...hist.slice(0, -1), t.price] : hist;
  const min = Math.min(...pts), max = Math.max(...pts);
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i / Math.max(pts.length - 1, 1)) * 100},${34 - ((p - min) / (max - min || 1)) * 30}`)
    .join(" ");
  const up = (t?.changePct ?? 0) >= 0;

  return (
    <div className="w-60 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_44px_rgba(18,22,58,0.14)]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold"><CoinIcon short="BTC" size={26} />Bitcoin</span>
        <span className="flex items-center gap-1 text-[11px] text-slate-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" />direct</span>
      </div>
      <p className="mt-3 font-mono text-xl font-semibold">{t ? `${formatPrice(t.price)} $` : "…"}</p>
      <p className="font-mono text-[11px] text-slate-500">
        {t && xofPerUsd ? `≈ ${Math.round(t.price * xofPerUsd).toLocaleString("fr-FR")} FCFA` : " "}
      </p>
      <svg viewBox="0 0 100 36" className="mt-2 h-10 w-full" preserveAspectRatio="none" aria-hidden>
        {pts.length > 1 && <path d={path} fill="none" stroke={up ? "#12a150" : "#e5484d"} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />}
      </svg>
      {t && <p className={`text-xs font-medium ${up ? "text-up" : "text-down"}`}>{up ? "▲" : "▼"} {Math.abs(t.changePct).toFixed(2)}% sur 24 h</p>}
    </div>
  );
}
