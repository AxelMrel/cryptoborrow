import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getFees } from "@/lib/fees";
import { codeStatus, dateTime, fcfa, fmt, money } from "@/i18n/format";
import { getDictionary, getLocale } from "@/i18n/server";
import type { Payment, Profile, Transaction, WithdrawalCode } from "@/lib/types";
import { Badge, Card, Stat, Table, Td, TransactionsTable } from "@/components/dashboard/ui";
import { ActiveClientActions, CreateClientForm, PendingClientActions } from "@/components/dashboard/admin-forms";
import Welcome from "@/components/dashboard/Welcome";
import { LiveTicker } from "@/components/charts/LiveTicker";
import { Donut, FlowBars, RankBars } from "@/components/charts/StatCharts";
import { dailyFlows, typeBreakdown } from "@/lib/stats";

// Pages authentifiées : le contenu dépend de la session, la navigation n'a pas besoin d'être "instantanée".
export const instant = false;

export async function generateMetadata() {
  return { title: (await getDictionary()).admin.meta };
}

export default async function AdminDashboard() {
  const [me, dict, locale, fees] = await Promise.all([requireRole("admin"), getDictionary(), getLocale(), getFees()]);
  const t = dict.admin;
  const b = dict.billing;
  const supabase = await createClient();

  // Toutes ces lectures passent par la RLS : l'admin ne reçoit que SES clients, codes et paiements.
  const [clientsRes, txRes, codesRes, payRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "client").order("created_at", { ascending: false }),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("withdrawal_codes").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(30),
  ]);
  const clients = ((clientsRes.data ?? []) as Profile[]).map((c) => ({ ...c, status: c.status ?? "active" }));
  const txs = (txRes.data ?? []) as Transaction[];
  const codes = (codesRes.data ?? []) as WithdrawalCode[];
  const payments = (payRes.data ?? []) as Payment[];

  const active = clients.filter((c) => c.status === "active");
  const pendingCount = clients.length - active.length;
  const names: Record<string, string> = { [me.id]: me.full_name };
  clients.forEach((c) => (names[c.id] = c.full_name));
  const spent = payments.filter((p) => p.status === "approved").reduce((s, p) => s + Number(p.amount_xof), 0);
  const activeCodes = codes.filter((c) => codeStatus(c) === "active").length;

  return (
    <>
      <Welcome name={me.full_name} scene="dashboard" subtitle={t.welcome} />
      <div className="-mx-4 overflow-hidden border-y border-slate-200 bg-white"><LiveTicker /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label={t.stats.clients} value={active.length} hint={pendingCount ? fmt(t.stats.pending, { n: pendingCount }) : undefined} />
        <Stat label={t.stats.codes} value={codes.length} hint={fmt(t.stats.activeCodes, { n: activeCodes })} />
        <Stat label={t.stats.spent} value={fcfa(spent, locale)} hint={t.stats.spentHint} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title={t.cards.flows} className="lg:col-span-2"><FlowBars data={dailyFlows(txs)} /></Card>
        <Card title={t.cards.breakdown}><Donut data={typeBreakdown(txs, dict.dash.txTypes)} /></Card>
      </div>

      <Card title={t.cards.balances}>
        <RankBars data={active.map((c) => ({ name: c.full_name, value: c.balance }))} empty={t.cards.balancesEmpty} />
      </Card>

      <Card title={fmt(b.createClient.price, { fee: fcfa(fees.clientCreation, locale) })}>
        <CreateClientForm fee={fees.clientCreation} />
      </Card>

      <Card title={fmt(t.cards.myClients, { n: clients.length })}>
        {clients.length === 0 && <p className="py-4 text-center text-sm text-slate-400">{t.cards.noClients}</p>}
        <div className="space-y-4">
          {clients.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{c.full_name}</p>
                  <p className="text-xs text-slate-500">{c.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {c.status === "pending" ? <Badge tone="gray">{b.pending.badge}</Badge> : <Badge tone="green">{t.clientActions.active}</Badge>}
                  {c.status === "active" && <p className="font-mono text-lg text-brand">{money(c.balance, locale)}</p>}
                </div>
              </div>
              {c.status === "pending"
                ? <PendingClientActions clientId={c.id} fee={fees.clientCreation} />
                : <ActiveClientActions clientId={c.id} fee={fees.withdrawalCode} />}
            </div>
          ))}
        </div>
      </Card>

      <Card title={t.cards.codes}>
        <Table head={t.codeHead} empty={t.cards.noCodes}>
          {codes.map((c) => {
            const st = codeStatus(c);
            return (
              <tr key={c.id}>
                <Td className="whitespace-nowrap text-slate-500">{dateTime(c.created_at, locale)}</Td>
                <Td>{names[c.client_id] ?? dict.dash.names.unknown}</Td>
                <Td className="font-mono tracking-widest">{c.code}</Td>
                <Td>{c.amount ? money(c.amount, locale) : dict.dash.free}</Td>
                <Td className="whitespace-nowrap text-slate-500">{dateTime(c.expires_at, locale)}</Td>
                <Td><Badge tone={st === "active" ? "cyan" : st === "used" ? "green" : "gray"}>{dict.dash.status[st]}</Badge></Td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Card title={b.history.title}>
        <Table head={b.history.head} empty={b.history.empty}>
          {payments.map((p) => (
            <tr key={p.id}>
              <Td className="whitespace-nowrap text-slate-500">{dateTime(p.created_at, locale)}</Td>
              <Td>
                {b.kinds[p.kind] ?? p.kind}
                {p.target_client_id && names[p.target_client_id] && <p className="text-xs text-slate-400">{names[p.target_client_id]}</p>}
              </Td>
              <Td className="whitespace-nowrap">{fcfa(Number(p.amount_xof), locale)}</Td>
              <Td><Badge tone={p.status === "approved" ? "green" : p.status === "pending" ? "gray" : "red"}>{b.status[p.status]}</Badge></Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title={t.cards.transactions}>
        <TransactionsTable txs={txs} names={names} />
      </Card>
    </>
  );
}
