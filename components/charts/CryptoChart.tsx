"use client";

import { useEffect, useRef, useState } from "react";
import { CandlestickSeries, ColorType, createChart, type UTCTimestamp } from "lightweight-charts";
import { COINS } from "@/lib/market";

type Candle = { time: UTCTimestamp; open: number; high: number; low: number; close: number };

/** Bougies 1 min : historique REST Binance + mise à jour en direct via WebSocket (Lightweight Charts). */
export default function CryptoChart({ xofPerUsd }: { xofPerUsd?: number | null }) {
  const box = useRef<HTMLDivElement>(null);
  const [symbol, setSymbol] = useState<string>(COINS[0].symbol);
  const [last, setLast] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!box.current) return;
    setError(null);
    const chart = createChart(box.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#62748e" },
      grid: { vertLines: { color: "#eef1f7" }, horzLines: { color: "#eef1f7" } },
      rightPriceScale: { borderColor: "#e2e8f0" },
      timeScale: { borderColor: "#e2e8f0", timeVisible: true },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#12a150", downColor: "#e5484d", borderVisible: false, wickUpColor: "#12a150", wickDownColor: "#e5484d",
    });

    let ws: WebSocket | null = null;
    let closed = false;

    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=200`)
      .then((r) => r.json())
      .then((rows: [number, string, string, string, string][]) => {
        if (closed) return;
        const data: Candle[] = rows.map((k) => ({
          time: Math.floor(k[0] / 1000) as UTCTimestamp,
          open: +k[1], high: +k[2], low: +k[3], close: +k[4],
        }));
        series.setData(data);
        setLast(data.at(-1)?.close ?? null);
        chart.timeScale().fitContent();

        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1m`);
        ws.onmessage = (ev) => {
          const k = JSON.parse(ev.data)?.k;
          if (!k) return;
          series.update({
            time: Math.floor(k.t / 1000) as UTCTimestamp,
            open: +k.o, high: +k.h, low: +k.l, close: +k.c,
          });
          setLast(+k.c);
        };
      })
      .catch(() => !closed && setError("Données de marché indisponibles (Binance injoignable)."));

    return () => {
      closed = true;
      ws?.close();
      chart.remove();
    };
  }, [symbol]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {COINS.map((c) => (
          <button
            key={c.symbol}
            onClick={() => setSymbol(c.symbol)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              symbol === c.symbol ? "bg-brand/10 text-brand" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {c.short}
          </button>
        ))}
      </div>
      {last !== null && (
        <p className="mb-2 font-mono text-lg">
          {last.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} <span className="text-xs text-slate-400">USDT</span>
          {xofPerUsd ? (
            <span className="ml-3 text-sm text-slate-500">≈ {Math.round(last * xofPerUsd).toLocaleString("fr-FR")} FCFA</span>
          ) : null}
        </p>
      )}
      {error && <p className="mb-2 text-sm text-down">{error}</p>}
      <div ref={box} className="h-72 w-full" />
    </div>
  );
}
