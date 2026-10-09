import { pair } from "./_pair";

export const market = pair(
  {
    feedLive: "Flux Binance en direct",
    feedConnecting: "Connexion au flux…",
    tickerLabel: "Cours en direct",
    live: "direct",
    over24h: "sur 24 h",
    cryptoError: "Données de marché indisponibles (Binance injoignable).",
    fxError: "Taux de change indisponibles.",
    tabs: { crypto: "Cryptos", fx: "Devises" },
    ecbRates: "Taux BCE du {date}",
  },
  {
    feedLive: "Live Binance feed",
    feedConnecting: "Connecting to the feed…",
    tickerLabel: "Live prices",
    live: "live",
    over24h: "over 24 h",
    cryptoError: "Market data unavailable (Binance unreachable).",
    fxError: "Exchange rates unavailable.",
    tabs: { crypto: "Crypto", fx: "Currencies" },
    ecbRates: "ECB rates of {date}",
  },
);
