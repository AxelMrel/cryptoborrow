"use client";

import { useEffect, useRef, useState } from "react";
import { AreaSeries, ColorType, createChart } from "lightweight-charts";
import { FX_CURRENCIES, fetchFxHistory, type FxCurrency } from "@/lib/market";
import { intlLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";

/** Taux de change de l'euro sur 30 jours (taux Frankfurter / Banque centrale européenne). */
export default function FxChart({ perEur }: { perEur: Record<string, number> | null }) {
  const box = useRef<HTMLDivElement>(null);
  const { locale, t: dict } = useI18n();
  const [cur, setCur] = useState<FxCurrency>("USD");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!box.current) return;
    setFailed(false);
    const chart = createChart(box.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#62748e" },
      grid: { vertLines: { color: "#eef1f7" }, horzLines: { color: "#eef1f7" } },
      rightPriceScale: { borderColor: "#e2e8f0" },
      timeScale: { borderColor: "#e2e8f0" },
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#3563e9", topColor: "rgba(53,99,233,0.28)", bottomColor: "rgba(53,99,233,0)",
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
    });
    let closed = false;
    fetchFxHistory(cur)
      .then((d) => {
        if (closed) return;
        series.setData(d);
        chart.timeScale().fitContent();
      })
      .catch(() => !closed && setFailed(true));
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
        1 € = {perEur?.[cur]?.toLocaleString(intlLocale(locale), { maximumFractionDigits: 4 }) ?? "…"}{" "}
        <span className="text-xs text-slate-400">{cur}</span>
      </p>
      {failed && <p className="mb-2 text-sm text-down">{dict.market.fxError}</p>}
      <div className="relative h-72 w-full min-w-0 overflow-hidden"><div ref={box} className="absolute inset-0" /></div>
    </div>
  );
}
