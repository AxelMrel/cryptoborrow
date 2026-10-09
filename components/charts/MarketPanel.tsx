"use client";

import { useState } from "react";
import { useFxRates } from "@/lib/market";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import CryptoChart from "./CryptoChart";
import FxChart from "./FxChart";

/** Graphes temps réel du dashboard client : cryptos (Binance WS) et devises (Frankfurter). */
export default function MarketPanel() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"crypto" | "fx">("crypto");
  const { perEur, eurPerUsd, date } = useFxRates();
  return (
    <div className="card min-w-0 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(["crypto", "fx"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === k ? "bg-white text-ink shadow-sm" : "text-slate-500"
              }`}
            >
              {k === "crypto" ? t.market.tabs.crypto : t.market.tabs.fx}
            </button>
          ))}
        </div>
        {tab === "fx" && date && <span className="text-xs text-slate-400">{fmt(t.market.ecbRates, { date })}</span>}
      </div>
      {tab === "crypto" ? <CryptoChart eurPerUsd={eurPerUsd} /> : <FxChart perEur={perEur} />}
    </div>
  );
}
