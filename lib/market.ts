"use client";

import { useEffect, useState } from "react";

export const COINS = [
  { symbol: "BTCUSDT", name: "Bitcoin", short: "BTC" },
  { symbol: "ETHUSDT", name: "Ethereum", short: "ETH" },
  { symbol: "BNBUSDT", name: "BNB", short: "BNB" },
  { symbol: "SOLUSDT", name: "Solana", short: "SOL" },
  { symbol: "XRPUSDT", name: "XRP", short: "XRP" },
  { symbol: "ADAUSDT", name: "Cardano", short: "ADA" },
  { symbol: "DOGEUSDT", name: "Dogecoin", short: "DOGE" },
  { symbol: "TRXUSDT", name: "TRON", short: "TRX" },
] as const;

export const FX_CURRENCIES = ["USD", "GBP", "CHF", "JPY", "CAD", "CNY"] as const;
export type FxCurrency = (typeof FX_CURRENCIES)[number];

export type Ticker = { price: number; open: number; changePct: number };

const FRANKFURTER = "https://api.frankfurter.dev/v1";

/** Cours temps réel des cryptos via le WebSocket public Binance (sans clé), avec reconnexion. */
export function useBinanceTickers() {
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [live, setLive] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout>;
    let closed = false;
    const streams = COINS.map((c) => `${c.symbol.toLowerCase()}@miniTicker`).join("/");

    const connect = () => {
      ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      ws.onopen = () => setLive(true);
      ws.onmessage = (ev) => {
        const d = JSON.parse(ev.data)?.data;
        if (!d?.s) return;
        const price = Number(d.c);
        const open = Number(d.o);
        setTickers((prev) => ({ ...prev, [d.s]: { price, open, changePct: open ? ((price - open) / open) * 100 : 0 } }));
      };
      ws.onclose = () => {
        setLive(false);
        if (!closed) timer = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws?.close();
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, []);

  return { tickers, live };
}

/** Taux EUR -> devises (Frankfurter) rafraîchis toutes les 5 min. */
export function useFxRates() {
  const [perEur, setPerEur] = useState<Record<string, number> | null>(null);
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`${FRANKFURTER}/latest?base=EUR&symbols=${FX_CURRENCIES.join(",")}`);
        const j = await r.json();
        if (!cancelled && j.rates) {
          setPerEur(j.rates);
          setDate(j.date);
        }
      } catch {
        /* réseau indisponible : on garde les dernières valeurs */
      }
    };
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  /** Valeur de 1 dollar en euros (pour afficher l'équivalent en euros des cryptos cotées en USD). */
  const eurPerUsd = perEur?.USD ? 1 / perEur.USD : null;
  return { perEur, date, eurPerUsd };
}

export async function fetchFxHistory(cur: FxCurrency, days = 30) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const r = await fetch(`${FRANKFURTER}/${iso(start)}..${iso(end)}?base=EUR&symbols=${cur}`);
  const j = await r.json();
  return Object.entries(j.rates as Record<string, Record<string, number>>)
    .map(([time, v]) => ({ time, value: v[cur] }))
    .sort((a, b) => a.time.localeCompare(b.time));
}
