"use client";

import { useState } from "react";
import { useFxRates } from "@/lib/market";
import CryptoChart from "./CryptoChart";
import FxChart from "./FxChart";

/** Graphes temps réel du dashboard client : cryptos (Binance WS) et devises (Frankfurter). */
export default function MarketPanel() {
  const [tab, setTab] = useState<"crypto" | "fx">("crypto");
  const { perEur, eurPerUsd, date } = useFxRates();
  return (
    <div className="card min-w-0 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(["crypto", "fx"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === t ? "bg-white text-ink shadow-sm" : "text-slate-500"
              }`}
            >
              {t === "crypto" ? "Cryptos" : "Devises"}
            </button>
          ))}
        </div>
        {tab === "fx" && date && <span className="text-xs text-slate-400">Taux BCE du {date}</span>}
      </div>
      {tab === "crypto" ? <CryptoChart eurPerUsd={eurPerUsd} /> : <FxChart perEur={perEur} />}
    </div>
  );
}
