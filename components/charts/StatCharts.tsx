"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const BRAND = "#3563e9";
const axis = { fontSize: 11, fill: "#62748e" };
const nf = new Intl.NumberFormat("fr-FR");
const tooltipStyle = { borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(18,22,58,.08)", fontSize: 12 };
const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : n >= 1e3 ? `${Math.round(n / 1e3)} k` : String(n));

function Empty({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-slate-400">{text}</div>;
}

/** Courbe d'évolution (solde, crédits...). */
export function TrendArea({ data, unit = "€", empty = "Pas encore de données." }: { data: { label: string; value: number }[]; unit?: string; empty?: string }) {
  if (data.length < 2) return <div className="h-64"><Empty text={empty} /></div>;
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.3} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#eef1f7" vertical={false} />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={axis} tickLine={false} axisLine={false} width={48} tickFormatter={short} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${nf.format(Number(v))} ${unit}`, "Solde"]} />
          <Area type="monotone" dataKey="value" stroke={BRAND} strokeWidth={2.5} fill="url(#trendFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Entrées / sorties par jour. */
export function FlowBars({ data }: { data: { label: string; entrees: number; sorties: number }[] }) {
  if (data.every((d) => d.entrees === 0 && d.sorties === 0)) {
    return <div className="h-64"><Empty text="Aucun flux sur les 14 derniers jours." /></div>;
  }
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#eef1f7" vertical={false} />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={axis} tickLine={false} axisLine={false} width={48} tickFormatter={short} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${nf.format(Number(v))} €`} cursor={{ fill: "#f4f6fb" }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="entrees" name="Entrées" fill="#12a150" radius={[4, 4, 0, 0]} />
          <Bar dataKey="sorties" name="Sorties" fill="#e5484d" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barres horizontales : valeur par personne (soldes clients, crédits admins). */
export function RankBars({ data, unit = "€", empty = "Aucune donnée." }: { data: { name: string; value: number }[]; unit?: string; empty?: string }) {
  if (data.length === 0) return <div className="h-64"><Empty text={empty} /></div>;
  const h = Math.max(256, data.length * 40);
  return (
    <div className="w-full" style={{ height: h }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#eef1f7" horizontal={false} />
          <XAxis type="number" tick={axis} tickLine={false} axisLine={false} tickFormatter={short} />
          <YAxis type="category" dataKey="name" tick={axis} tickLine={false} axisLine={false} width={96} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${nf.format(Number(v))} ${unit}`} cursor={{ fill: "#f4f6fb" }} />
          <Bar dataKey="value" fill={BRAND} radius={[0, 6, 6, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Répartition (anneau). */
export function Donut({ data, empty = "Aucune transaction." }: { data: { name: string; value: number; color: string }[]; empty?: string }) {
  if (data.length === 0) return <div className="h-64"><Empty text={empty} /></div>;
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={3} stroke="none">
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
