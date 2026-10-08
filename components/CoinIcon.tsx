const STYLE: Record<string, { bg: string; glyph: string }> = {
  BTC: { bg: "#f7931a", glyph: "₿" },
  ETH: { bg: "#627eea", glyph: "Ξ" },
  BNB: { bg: "#f3ba2f", glyph: "B" },
  SOL: { bg: "#7c4dff", glyph: "S" },
  XRP: { bg: "#23292f", glyph: "X" },
  ADA: { bg: "#0033ad", glyph: "A" },
  DOGE: { bg: "#c2a633", glyph: "Ð" },
  TRX: { bg: "#e50914", glyph: "T" },
};

/** Pastille de coin (couleur + symbole), sans image externe. */
export default function CoinIcon({ short, size = 32 }: { short: string; size?: number }) {
  const s = STYLE[short] ?? { bg: "#3563e9", glyph: short.slice(0, 1) };
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm"
      style={{ width: size, height: size, background: s.bg, fontSize: size * 0.5 }}
    >
      {s.glyph}
    </span>
  );
}
