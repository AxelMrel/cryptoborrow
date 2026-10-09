import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { codeStatus, dateTime, fcfa, fmt, money, num } from "@/i18n/format";
import { getDictionary, getLocale } from "@/i18n/server";
import type { Payment, Profile, Transaction, WithdrawalCode } from "@/lib/types";
import { Badge, Card, Stat, Table, Td, TransactionsTable } from "@/components/dashboard/ui";
import { SettingForm } from "@/components/dashboard/super-admin-forms";
import Welcome from "@/components/dashboard/Welcome";
import MarketPanel from "@/components/charts/MarketPanel";
import { LiveTicker } from "@/components/charts/LiveTicker";
import { Donut, FlowBars, RankBars } from "@/components/charts/StatCharts";
import { dailyFlows, typeBreakdown } from "@/lib/stats";

// Pages authentifiées : le contenu dépend de la session, la navigation n'a pas besoin d'être "instantanée".
export const instant = false;

export async function generateMetadata() {
  return { title: (await getDictionary()).superAdmin.meta };
}

export default async function SuperAdminDashboard() {
  const [me, dict, locale] = await Promise.all([requireRole("super_admin"), getDictionary(), getLocale()]);
  const t = dict.superAdmin;
  const b = dict.billing;
  const supabase = await createClient();

  // Le super admin voit tout grâce à la policy RLS is_super_admin().
  const [profilesRes, txRes, txCountRes, codesRes, settingsRes, payRes] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("transactions").select("*", { count: "exact", head: true }),
    supabase.from("withdrawal_codes").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("settings").select("*").order("key"),
    supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(200),
  ]);
  const profiles = ((profilesRes.data ?? []) as Profile[]).map((p) => ({ ...p, status: p.status ?? "active" }));
  const admins = profiles.filter((p) => p.role === "admin");
  const clients = profiles.filter((p) => p.role === "client");
  const activeClients = clients.filter((c) => c.status === "active");
  const txs = (txRes.data ?? []) as Transaction[];
  const codes = (codesRes.data ?? []) as WithdrawalCode[];
  const payments = (payRes.data ?? []) as Payment[];
  const settings = ((settingsRes.data ?? []) as { key: string; value: string }[]).filter((s) => s.key in t.settings);

  const names: Record<string, string> = {};
  profiles.forEach((p) => (names[p.id] = p.full_name));
  const approved = payments.filter((p) => p.status === "approved");
  const revenue = approved.reduce((s, p) => s + Number(p.amount_xof), 0);
  const paidBy = (adminId: string) => approved.filter((p) => p.user_id === adminId).reduce((s, p) => s + Number(p.amount_xof), 0);
  const clientCount = (adminId: string) => clients.filter((c) => c.created_by === adminId).length;
  const settingLabels = t.settings as Record<string, string>;
  const activeCodes = codes.filter((c) => codeStatus(c) === "active").length;
  const pendingClients = clients.length - activeClients.length;
  const statusBadge = (st: "active" | "used" | "expired") => (
    <Badge tone={st === "active" ? "cyan" : st === "used" ? "green" : "gray"}>{dict.dash.status[st]}</Badge>
  );

  return (
    <>
      <Welcome name={me.full_name} photo="/images/man-smile.jpg" subtitle={t.welcome} />
      <div className="-mx-4 overflow-hidden border-y border-slate-200 bg-white"><LiveTicker /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.stats.admins} value={num(admins.length, locale)} />
        <Stat label={t.stats.clients} value={num(activeClients.length, locale)} hint={pendingClients ? fmt(t.stats.pendingClients, { n: pendingClients }) : undefined} />
        <Stat label={t.stats.balances} value={money(activeClients.reduce((s, c) => s + c.balance, 0), locale)} />
        <Stat label={t.stats.revenue} value={fcfa(revenue, locale)} hint={t.stats.revenueHint} />
        <Stat label={t.stats.transactions} value={num(txCountRes.count ?? 0, locale)} />
        <Stat label={t.stats.codes} value={num(codes.length, locale)} hint={fmt(t.stats.activeCodes, { n: activeCodes })} />
        <Stat label={t.stats.perAdmin} value={admins.length ? (clients.length / admins.length).toFixed(1) : "0"} hint={t.stats.average} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title={t.cards.flows} className="lg:col-span-2"><FlowBars data={dailyFlows(txs)} /></Card>
        <Card title={t.cards.breakdown}><Donut data={typeBreakdown(txs, dict.dash.txTypes)} /></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title={t.cards.revenueByAdmin}>
          <RankBars
            data={admins.map((a) => ({ name: a.full_name, value: paidBy(a.id) })).filter((x) => x.value > 0)}
            unit="FCFA"
            empty={t.cards.revenueByAdminEmpty}
          />
        </Card>
        <MarketPanel />
      </div>

      <Card title={fmt(t.cards.admins, { n: admins.length })}>
        {admins.length === 0 && <p className="py-4 text-center text-sm text-slate-400">{t.cards.noAdmins}</p>}
        <div className="space-y-3">
          {admins.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="font-semibold">{a.full_name}</p>
                <p className="text-xs text-slate-500">{a.email}</p>
              </div>
              <div className="flex gap-2 text-sm">
                <Badge tone="gray">{fmt(t.badges.clients, { n: clientCount(a.id) })}</Badge>
                <Badge tone="cyan">{fmt(t.badges.paid, { amount: fcfa(paidBy(a.id), locale) })}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t.cards.settings}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {settings.map((s) => (
            <SettingForm key={s.key} k={s.key} label={settingLabels[s.key] ?? s.key} value={s.value} />
          ))}
        </div>
      </Card>

      <Card title={t.cards.payments}>
        <Table head={t.paymentHead} empty={t.paymentsEmpty}>
          {payments.map((p) => (
            <tr key={p.id}>
              <Td className="whitespace-nowrap text-slate-500">{dateTime(p.created_at, locale)}</Td>
              <Td>{names[p.user_id] ?? dict.dash.names.unknown}</Td>
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

      <Card title={fmt(t.cards.clients, { n: clients.length })}>
        <Table head={t.clientHead} empty={t.clientsEmpty}>
          {clients.map((c) => (
            <tr key={c.id}>
              <Td>{c.full_name}</Td>
              <Td className="text-slate-500">{c.email}</Td>
              <Td>{c.created_by ? names[c.created_by] ?? dict.dash.names.unknown : dict.dash.names.platform}</Td>
              <Td className="font-mono">{money(c.balance, locale)}</Td>
              <Td><Badge tone={c.status === "active" ? "green" : "gray"}>{t.clientStatus[c.status]}</Badge></Td>
              <Td className="whitespace-nowrap text-slate-500">{dateTime(c.created_at, locale)}</Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title={t.cards.codes}>
        <Table head={t.codeHead} empty={t.codesEmpty}>
          {codes.map((c) => (
            <tr key={c.id}>
              <Td className="whitespace-nowrap text-slate-500">{dateTime(c.created_at, locale)}</Td>
              <Td>{names[c.admin_id] ?? dict.dash.names.unknown}</Td>
              <Td>{names[c.client_id] ?? dict.dash.names.unknown}</Td>
              <Td className="font-mono tracking-widest">{c.code}</Td>
              <Td>{c.amount ? money(c.amount, locale) : dict.dash.free}</Td>
              <Td className="whitespace-nowrap text-slate-500">{dateTime(c.expires_at, locale)}</Td>
              <Td>{statusBadge(codeStatus(c))}</Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title={t.cards.latest}>
        <TransactionsTable txs={txs} names={names} />
      </Card>
    </>
  );
}
