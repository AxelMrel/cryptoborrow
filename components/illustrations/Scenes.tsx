/**
 * Illustrations vectorielles (SVG pur, aucune image externe) aux couleurs de CoinPulse.
 * `tone="dark"` : version pour fond bleu (halos blancs) ; `tone="light"` : pour fond clair.
 */
type Tone = "light" | "dark";
type Props = { className?: string; tone?: Tone };

const BRAND = "#3563e9";
const NAVY = "#12163a";
const UP = "#12a150";
const DOWN = "#e5484d";

const Halos = ({ tone }: { tone: Tone }) => {
  const f = tone === "dark" ? "#ffffff" : BRAND;
  const o = tone === "dark" ? 0.1 : 0.08;
  return (
    <>
      <circle cx="240" cy="200" r="178" fill={f} opacity={o} />
      <circle cx="240" cy="200" r="124" fill={f} opacity={o} />
    </>
  );
};

/** Pièce avec symbole. */
const Coin = ({ cx, cy, r, color, ring, glyph }: { cx: number; cy: number; r: number; color: string; ring: string; glyph: string }) => (
  <g>
    <circle cx={cx} cy={cy + r * 0.12} r={r} fill="#000" opacity="0.12" />
    <circle cx={cx} cy={cy} r={r} fill={color} />
    <circle cx={cx} cy={cy} r={r * 0.78} fill="none" stroke={ring} strokeWidth={Math.max(2, r * 0.07)} opacity="0.7" />
    <text x={cx} y={cy + r * 0.34} textAnchor="middle" fontSize={r * 1.0} fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">{glyph}</text>
  </g>
);

const Sparkle = ({ x, y, s = 6, o = 0.9 }: { x: number; y: number; s?: number; o?: number }) => (
  <path d={`M${x} ${y - s}V${y + s}M${x - s} ${y}H${x + s}`} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity={o} />
);

// bougies : [x, ouverture, clôture, haut, bas] (y croissant vers le bas)
const CANDLES: [number, number, number, number, number][] = [
  [190, 262, 240, 232, 270], [206, 244, 252, 236, 262], [222, 252, 226, 218, 258], [238, 228, 236, 214, 244],
  [254, 238, 210, 202, 246], [270, 214, 196, 188, 222], [286, 200, 214, 192, 222], [302, 210, 178, 168, 216],
];

function Phone({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <rect x="160" y="26" width="160" height="350" rx="28" fill={NAVY} />
      <rect x="168" y="44" width="144" height="314" rx="19" fill="#fff" />
      <rect x="222" y="32" width="36" height="6" rx="3" fill="#2b3160" />
      {children}
    </>
  );
}

/** Marché : téléphone avec graphique en bougies et pièces qui flottent. */
export function MarketScene({ className, tone = "light" }: Props) {
  return (
    <svg viewBox="0 0 480 400" className={className} aria-hidden>
      <Halos tone={tone} />
      <Phone>
        <rect x="182" y="62" width="50" height="8" rx="4" fill="#e2e8f0" />
        <rect x="182" y="78" width="96" height="18" rx="6" fill={NAVY} />
        <rect x="284" y="81" width="26" height="13" rx="6.5" fill={UP} opacity="0.2" />
        <path d="M290 90l5-5 4 3 5-6" stroke={UP} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {[130, 160, 190, 220, 250].map((y) => <line key={y} x1="180" x2="302" y1={y} y2={y} stroke="#eef1f7" />)}
        {CANDLES.map(([x, o, c, h, l]) => {
          const up = c < o;
          const col = up ? UP : DOWN;
          return (
            <g key={x}>
              <line x1={x} x2={x} y1={h} y2={l} stroke={col} strokeWidth="2" strokeLinecap="round" />
              <rect x={x - 5} y={Math.min(o, c)} width="10" height={Math.max(Math.abs(o - c), 4)} rx="2" fill={col} />
            </g>
          );
        })}
        <path d="M188 258 C 215 250, 232 232, 254 226 S 290 196, 306 176" stroke={BRAND} strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="182" y="288" width="60" height="28" rx="14" fill={BRAND} />
        <rect x="250" y="288" width="60" height="28" rx="14" fill="#eef1f7" />
        <rect x="182" y="326" width="128" height="8" rx="4" fill="#eef1f7" />
      </Phone>
      <Coin cx={92} cy={132} r={44} color="#f7931a" ring="#fff" glyph="₿" />
      <Coin cx={392} cy={246} r={36} color="#627eea" ring="#fff" glyph="Ξ" />
      <Coin cx={372} cy={88} r={22} color="#f3ba2f" ring="#fff" glyph="B" />
      <Coin cx={112} cy={304} r={26} color={UP} ring="#fff" glyph="€" />
      <Sparkle x={52} y={226} /><Sparkle x={436} y={150} s={5} /><Sparkle x={330} y={354} s={5} o={0.7} /><Sparkle x={150} y={52} s={4} o={0.7} />
    </svg>
  );
}

/** Portefeuille : portefeuille entrouvert, carte et pile de pièces. */
export function WalletScene({ className, tone = "light" }: Props) {
  return (
    <svg viewBox="0 0 480 400" className={className} aria-hidden>
      <Halos tone={tone} />
      <defs>
        <linearGradient id="wl-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a76f0" /><stop offset="1" stopColor="#2a53d6" />
        </linearGradient>
      </defs>
      <g transform="rotate(-7 230 120)">
        <rect x="136" y="64" width="190" height="118" rx="16" fill="#fff" />
        <rect x="136" y="84" width="190" height="20" fill={NAVY} opacity="0.9" />
        <rect x="152" y="124" width="60" height="9" rx="4.5" fill="#e2e8f0" />
        <rect x="152" y="142" width="96" height="9" rx="4.5" fill="#eef1f7" />
        <rect x="270" y="130" width="38" height="28" rx="6" fill="#f3ba2f" />
      </g>
      <rect x="100" y="140" width="290" height="196" rx="30" fill="#000" opacity="0.1" transform="translate(0 8)" />
      <rect x="100" y="140" width="290" height="196" rx="30" fill="url(#wl-body)" />
      <path d="M100 176c0-17 13-30 30-30h230c17 0 30 13 30 30v2H100z" fill="#fff" opacity="0.14" />
      <rect x="300" y="208" width="112" height="62" rx="31" fill="#fff" opacity="0.95" />
      <circle cx="334" cy="239" r="11" fill={BRAND} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse cx="420" cy={336 - i * 16} rx="40" ry="13" fill="#c9962a" />
          <ellipse cx="420" cy={330 - i * 16} rx="40" ry="13" fill="#f3ba2f" />
        </g>
      ))}
      <ellipse cx="420" cy="266" rx="40" ry="13" fill="#f7d36a" />
      <text x="420" y="271" textAnchor="middle" fontSize="16" fontWeight="700" fill="#a67712" fontFamily="system-ui, sans-serif">€</text>
      <Coin cx={86} cy={96} r={34} color="#f7931a" ring="#fff" glyph="₿" />
      <Coin cx={402} cy={92} r={22} color="#627eea" ring="#fff" glyph="Ξ" />
      <Sparkle x={56} y={236} /><Sparkle x={448} y={196} s={5} /><Sparkle x={180} y={368} s={5} o={0.7} />
    </svg>
  );
}

/** Tableau de bord : fenêtre avec indicateurs, barres et anneau. */
export function DashboardScene({ className, tone = "light" }: Props) {
  return (
    <svg viewBox="0 0 480 400" className={className} aria-hidden>
      <Halos tone={tone} />
      <rect x="56" y="64" width="368" height="272" rx="22" fill="#000" opacity="0.1" transform="translate(0 8)" />
      <rect x="56" y="64" width="368" height="272" rx="22" fill="#fff" />
      <path d="M56 86c0-12 10-22 22-22h324c12 0 22 10 22 22v14H56z" fill="#eef1f7" />
      {[78, 94, 110].map((x, i) => <circle key={x} cx={x} cy="82" r="5" fill={["#e5484d", "#f3ba2f", UP][i]} />)}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={76 + i * 112} y="118" width="100" height="56" rx="12" fill="#f4f6fb" />
          <rect x={88 + i * 112} y="130" width="40" height="7" rx="3.5" fill="#cbd5e1" />
          <rect x={88 + i * 112} y="146" width={[62, 48, 70][i]} height="14" rx="5" fill={[BRAND, UP, "#8b5cf6"][i]} />
        </g>
      ))}
      <rect x="76" y="190" width="212" height="128" rx="14" fill="#f4f6fb" />
      {[0.35, 0.55, 0.42, 0.7, 0.6, 0.86, 0.74].map((h, i) => (
        <rect key={i} x={94 + i * 28} y={304 - h * 100} width="16" height={h * 100} rx="5" fill={i === 5 ? BRAND : "#a9bdf5"} />
      ))}
      <rect x="300" y="190" width="104" height="128" rx="14" fill="#f4f6fb" />
      <circle cx="352" cy="244" r="30" fill="none" stroke="#e2e8f0" strokeWidth="14" />
      <circle cx="352" cy="244" r="30" fill="none" stroke={BRAND} strokeWidth="14" strokeDasharray="110 189" strokeLinecap="round" transform="rotate(-90 352 244)" />
      <circle cx="352" cy="244" r="30" fill="none" stroke={UP} strokeWidth="14" strokeDasharray="46 189" strokeDashoffset="-116" strokeLinecap="round" transform="rotate(-90 352 244)" />
      <rect x="320" y="290" width="64" height="8" rx="4" fill="#cbd5e1" />
      <Coin cx={412} cy={66} r={32} color="#f7931a" ring="#fff" glyph="₿" />
      <Coin cx={70} cy={338} r={26} color={UP} ring="#fff" glyph="€" />
      <Sparkle x={36} y={160} /><Sparkle x={448} y={300} s={5} /><Sparkle x={236} y={40} s={5} o={0.7} />
    </svg>
  );
}

/** Paiement : téléphone avec validation, pièces qui y entrent. */
export function PaymentScene({ className, tone = "light" }: Props) {
  return (
    <svg viewBox="0 0 480 400" className={className} aria-hidden>
      <Halos tone={tone} />
      <Phone>
        <rect x="182" y="64" width="50" height="8" rx="4" fill="#e2e8f0" />
        <rect x="182" y="82" width="128" height="60" rx="14" fill="#f4f6fb" />
        <rect x="194" y="96" width="44" height="8" rx="4" fill="#cbd5e1" />
        <rect x="194" y="112" width="84" height="16" rx="5" fill={NAVY} />
        <circle cx="240" cy="222" r="44" fill={UP} opacity="0.14" />
        <circle cx="240" cy="222" r="32" fill={UP} />
        <path d="M224 223l11 11 22-24" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="196" y="282" width="88" height="10" rx="5" fill={NAVY} opacity="0.85" />
        <rect x="182" y="312" width="128" height="30" rx="15" fill={BRAND} />
      </Phone>
      <path d="M40 300 C 70 240, 110 210, 156 214" stroke="#fff" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" fill="none" opacity={tone === "dark" ? 0.8 : 0} />
      <path d="M40 300 C 70 240, 110 210, 156 214" stroke={BRAND} strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" fill="none" opacity={tone === "dark" ? 0 : 0.5} />
      <Coin cx={76} cy={176} r={38} color="#f7931a" ring="#fff" glyph="₿" />
      <Coin cx={60} cy={296} r={26} color={UP} ring="#fff" glyph="€" />
      <Coin cx={402} cy={120} r={30} color="#f3ba2f" ring="#fff" glyph="B" />
      <Coin cx={396} cy={280} r={24} color="#627eea" ring="#fff" glyph="Ξ" />
      <Sparkle x={440} y={196} s={5} /><Sparkle x={120} y={84} s={5} o={0.7} /><Sparkle x={344} y={366} s={4} o={0.7} />
    </svg>
  );
}

export const SCENES = { market: MarketScene, wallet: WalletScene, dashboard: DashboardScene, payment: PaymentScene };
export type SceneName = keyof typeof SCENES;
