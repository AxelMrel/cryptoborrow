import type { ReactNode } from "react";
import { TX_LABEL, dateShort, dateTime, num } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card min-w-0 p-5 ${className}`}>
      {title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Badge({ tone, children }: { tone: "green" | "red" | "gray" | "cyan"; children: ReactNode }) {
  const tones = {
    green: "bg-emerald-50 text-up",
    red: "bg-rose-50 text-down",
    gray: "bg-slate-100 text-slate-500",
    cyan: "bg-brand/10 text-brand",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Table({ head, children, empty, minWidth = "min-w-[520px]" }: { head: string[]; children: ReactNode; empty?: string; minWidth?: string }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${minWidth} text-left text-sm`}>
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
            {head.map((h) => (
              <th key={h} className="px-2 py-2 font-medium sm:px-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
      {!hasRows && <p className="px-3 py-6 text-center text-sm text-slate-400">{empty ?? "Aucune donnée."}</p>}
    </div>
  );
}
export const Td = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <td className={`px-2 py-2.5 align-middle sm:px-3 ${className}`}>{children}</td>
);

/**
 * Historique des transactions : 3 colonnes (Date, Type, Montant) pour rester lisible sur mobile.
 * Pour l'admin et le super admin (pas de `viewerId`), le nom de la personne concernée
 * s'affiche en petit sous le type. `names` : id -> nom (ce que la RLS laisse voir).
 */
export function TransactionsTable({
  txs,
  names,
  viewerId,
}: {
  txs: Transaction[];
  names: Record<string, string>;
  viewerId?: string;
}) {
  const positive = (t: Transaction) =>
    viewerId ? t.to_user === viewerId : t.type === "deposit" || t.type === "client_credit" || t.type === "admin_credit";
  const subject = (t: Transaction) => (viewerId ? null : names[t.to_user ?? t.from_user ?? ""] ?? null);
  return (
    <Table head={["Date", "Type", "Montant (€)"]} empty="Aucune transaction pour le moment." minWidth="min-w-0">
      {txs.map((t) => (
        <tr key={t.id}>
          <Td className="whitespace-nowrap text-slate-500"><span title={dateTime(t.created_at)}>{dateShort(t.created_at)}</span></Td>
          <Td>
            <Badge tone={t.type === "withdrawal" || t.type === "admin_fee" ? "red" : "green"}>{TX_LABEL[t.type]}</Badge>
            {subject(t) && <p className="mt-1 text-xs text-slate-400">{subject(t)}</p>}
          </Td>
          <Td className="whitespace-nowrap font-mono">
            <span className={positive(t) ? "text-up" : "text-down"}>
              {positive(t) ? "+" : "−"}{num(t.amount)}
            </span>
          </Td>
        </tr>
      ))}
    </Table>
  );
}
