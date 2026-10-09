"use client";

import { useEffect, useRef, useState } from "react";
import { AreaSeries, ColorType, createChart } from "lightweight-charts";
import { FX_CURRENCIES, fetchFxHistory, type FxCurrency } from "@/lib/market";

/** Valeur en FCFA d'une devise sur 30 jours (taux Frankfurter / BCE, parité EUR-XOF fixe). */
export default function FxChart({ xofPer }: { xofPer: (cur: string) => number | null }) {
  const box = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState<FxCurrency>("USD");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!box.current) return;
    setError(null);
    const chart = createChart(box.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#62748e" },
      grid: { vertLines: { color: "#eef1f7" }, horzLines: { color: "#eef1f7" } },
      rightPriceScale: { borderColor: "#e2e8f0" },
      timeScale: { borderColor: "#e2e8f0" },
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#3563e9", topColor: "rgba(53,99,233,0.28)", bottomColor: "rgba(53,99,233,0)",
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });
    let closed = false;
    fetchFxHistory(cur)
      .then((d) => {
        if (closed) return;
        series.setData(d);
        chart.timeScale().fitContent();
      })
      .catch(() => !closed && setError("Taux de change indisponibles."));
    return () => {
      closed = true;
      chart.remove();
    };
  }, [cur]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FX_CURRENCIES.map((c) => (
          <button
            key={c}
            onClick={() => setCur(c)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              cur === c ? "bg-brand/10 text-brand" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="mb-2 font-mono text-lg">
        1 {cur} = {xofPer(cur)?.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) ?? "…"}{" "}
        <span className="text-xs text-slate-400">FCFA</span>
      </p>
      {error && <p className="mb-2 text-sm text-down">{error}</p>}
      <div className="relative h-72 w-full min-w-0 overflow-hidden"><div ref={box} className="absolute inset-0" /></div>
    </div>
  );
}
