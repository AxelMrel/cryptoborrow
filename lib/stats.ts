import type { Transaction, TxType } from "@/lib/types";

const day = (iso: string) => iso.slice(5, 10).split("-").reverse().join("/"); // "MM-DD" -> "DD/MM" (UTC)
const dayTime = (iso: string) => `${day(iso)} ${iso.slice(11, 16)}`; // "DD/MM HH:mm" (UTC)

/** Évolution du solde d'un utilisateur, reconstruite à partir de ses transactions (la plus ancienne en premier). */
export function balanceSeries(txs: Transaction[], viewerId: string, currentBalance: number, startLabel: string) {
  const asc = [...txs].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const delta = (t: Transaction) => (t.to_user === viewerId ? t.amount : -t.amount);
  let bal = currentBalance - asc.reduce((s, t) => s + delta(t), 0);
  const points = [{ label: startLabel, value: Math.max(bal, 0) }];
  for (const t of asc) {
    bal += delta(t);
    points.push({ label: dayTime(t.created_at), value: bal });
  }
  return points;
}

/** Flux d'argent des clients par jour sur les `days` derniers jours (entrées : dépôts/crédits, sorties : retraits). */
export function dailyFlows(txs: Transaction[], days = 14, now = new Date()) {
  const rows: { key: string; label: string; entrees: number; sorties: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000).toISOString();
    rows.push({ key: d.slice(0, 10), label: day(d), entrees: 0, sorties: 0 });
  }
  for (const t of txs) {
    const row = rows.find((r) => r.key === t.created_at.slice(0, 10));
    if (!row) continue;
    if (t.type === "deposit" || t.type === "client_credit" || t.type === "yield") row.entrees += t.amount;
    else if (t.type === "withdrawal") row.sorties += t.amount;
  }
  return rows;
}

const TYPE_COLOR: Record<TxType, string> = {
  deposit: "#12a150",
  client_credit: "#3563e9",
  withdrawal: "#e5484d",
  admin_credit: "#8b5cf6",
  admin_fee: "#f59e0b",
  yield: "#06b6d4",
};

/** Répartition des transactions par type (nombre). `labels` : libellés traduits par type. */
export function typeBreakdown(txs: Transaction[], labels: Record<TxType, string>) {
  const counts = new Map<TxType, number>();
  txs.forEach((t) => counts.set(t.type, (counts.get(t.type) ?? 0) + 1));
  return [...counts].map(([type, value]) => ({ name: labels[type], value, color: TYPE_COLOR[type] }));
}
