"use client";

import { useEffect, useRef, useState } from "react";
import { CandlestickSeries, ColorType, createChart, type UTCTimestamp } from "lightweight-charts";
import { COINS } from "@/lib/market";
import { formatEuro } from "@/i18n/format";
import { intlLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";

type Candle = { time: UTCTimestamp; open: number; high: number; low: number; close: number };

/** Bougies 1 min : historique REST Binance + mise à jour en direct via WebSocket (Lightweight Charts). */
export default function CryptoChart({ eurPerUsd }: { eurPerUsd?: number | null }) {
  const box = useRef<HTMLDivElement>(null);
  const { locale, t: dict } = useI18n();
  const [symbol, setSymbol] = useState<string>(COINS[0].symbol);
  const [last, setLast] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!box.current) return;
    setFailed(false);
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
      .catch(() => !closed && setFailed(true));

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
          {last.toLocaleString(intlLocale(locale), { maximumFractionDigits: 4 })} <span className="text-xs text-slate-400">USDT</span>
          {eurPerUsd ? (
            <span className="ml-3 text-sm text-slate-500">≈ {formatEuro(last * eurPerUsd, locale)}</span>
          ) : null}
        </p>
      )}
      {failed && <p className="mb-2 text-sm text-down">{dict.market.cryptoError}</p>}
      <div className="relative h-72 w-full min-w-0 overflow-hidden"><div ref={box} className="absolute inset-0" /></div>
    </div>
  );
}
