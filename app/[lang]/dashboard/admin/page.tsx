import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { codeStatus, dateTime, fmt, money, num } from "@/i18n/format";
import { getDictionary, getLocale } from "@/i18n/server";
import type { Payment, Profile, Transaction, WithdrawalCode } from "@/lib/types";
import { PLANS } from "@/lib/plans";
import BuyCredits from "@/components/dashboard/BuyCredits";
import { Badge, Card, Stat, Table, Td, TransactionsTable } from "@/components/dashboard/ui";
import { ClientActions, CreateClientForm } from "@/components/dashboard/admin-forms";
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
  const [me, dict, locale] = await Promise.all([requireRole("admin"), getDictionary(), getLocale()]);
  const t = dict.admin;
  const supabase = await createClient();

  // Toutes ces lectures passent par la RLS : l'admin ne reçoit que SES clients et leurs données.
  const [clientsRes, txRes, codesRes, feeRes, payRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "client").order("created_at", { ascending: false }),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("withdrawal_codes").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("settings").select("value").eq("key", "withdrawal_code_fee").single(),
    supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(20),
  ]);
  const payments = payRes.error ? null : ((payRes.data ?? []) as Payment[]); // null : migration 003 pas encore exécutée
  const clients = (clientsRes.data ?? []) as Profile[];
  const txs = (txRes.data ?? []) as Transaction[];
  const codes = (codesRes.data ?? []) as WithdrawalCode[];
  const fee = Number(feeRes.data?.value ?? 5000);

  const names: Record<string, string> = { [me.id]: me.full_name };
  clients.forEach((c) => (names[c.id] = c.full_name));

  // Pas de crédits => pas d'espace de travail.
  if (me.credits <= 0) {
    return (
      <Card>
        <h1 className="text-2xl font-bold text-brand">{t.locked.title}</h1>
        <p className="mt-3 text-slate-700">{t.locked.text}</p>
        <p className="mt-2 text-sm font-medium text-brand">{dict.billing.lockedHint}</p>
        <div className="mt-6"><BuyCredits /></div>
      </Card>
    );
  }

  const quotaFull = clients.length >= me.max_clients;
  const activeCodes = codes.filter((c) => codeStatus(c) === "active").length;

  return (
    <>
      <Welcome name={me.full_name} photo="/images/partners.jpg" subtitle={t.welcome} />
      <div className="-mx-4 overflow-hidden border-y border-slate-200 bg-white"><LiveTicker /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label={t.stats.credits} value={fmt(t.stats.creditsValue, { n: num(me.credits, locale) })} hint={fmt(t.stats.codeCost, { fee: num(fee, locale) })} />
        <Stat label={t.stats.quota} value={`${clients.length} / ${me.max_clients}`} hint={quotaFull ? t.stats.quotaFull : fmt(t.stats.placesLeft, { n: me.max_clients - clients.length })} />
        <Stat label={t.stats.codes} value={codes.length} hint={fmt(t.stats.activeCodes, { n: activeCodes })} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title={t.cards.flows} className="lg:col-span-2"><FlowBars data={dailyFlows(txs)} /></Card>
        <Card title={t.cards.breakdown}><Donut data={typeBreakdown(txs, dict.dash.txTypes)} /></Card>
      </div>

      <Card title={t.cards.balances}>
        <RankBars data={clients.map((c) => ({ name: c.full_name, value: c.balance }))} empty={t.cards.balancesEmpty} />
      </Card>

      <Card title={dict.billing.buyTitle}><BuyCredits /></Card>

      <Card title={t.cards.create}>
        {quotaFull ? <p className="text-sm text-amber-800">{t.cards.quotaFullText}</p> : <CreateClientForm />}
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
                <p className="font-mono text-lg text-brand">{money(c.balance, locale)}</p>
              </div>
              <ClientActions clientId={c.id} fee={fee} />
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

      {payments && (
        <Card title={dict.billing.history.title}>
          <Table head={dict.billing.history.head} empty={dict.billing.history.empty}>
            {payments.map((p) => (
              <tr key={p.id}>
                <Td className="whitespace-nowrap text-slate-500">{dateTime(p.created_at, locale)}</Td>
                <Td>{PLANS.find((x) => x.id === p.plan_id)?.name ?? p.plan_id}</Td>
                <Td className="whitespace-nowrap">{money(p.amount_eur, locale)}</Td>
                <Td><Badge tone={p.status === "approved" ? "green" : p.status === "pending" ? "gray" : "red"}>{dict.billing.history.status[p.status]}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <Card title={t.cards.transactions}>
        <TransactionsTable txs={txs} names={names} />
      </Card>
    </>
  );
}
