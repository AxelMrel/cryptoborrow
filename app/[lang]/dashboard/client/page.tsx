import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { balanceSeries, typeBreakdown } from "@/lib/stats";
import type { Transaction } from "@/lib/types";
import { Card, TransactionsTable } from "@/components/dashboard/ui";
import BalanceHero from "@/components/dashboard/BalanceHero";
import { WithdrawFlow } from "@/components/dashboard/client-forms";
import MarketPanel from "@/components/charts/MarketPanel";
import { LiveTicker } from "@/components/charts/LiveTicker";
import { Donut, TrendArea } from "@/components/charts/StatCharts";
import { getDictionary } from "@/i18n/server";
import { getYieldConfig } from "@/lib/fees";

// Pages authentifiées : le contenu dépend de la session, la navigation n'a pas besoin d'être "instantanée".
export const instant = false;

export async function generateMetadata() {
  return { title: (await getDictionary()).client.meta.wallet };
}

export default async function ClientDashboard() {
  const [me, dict, yieldCfg] = await Promise.all([requireRole("client"), getDictionary(), getYieldConfig()]);
  const nextYieldAt =
    me.balance > 0 && me.yield_at && yieldCfg.ratePercent > 0 && yieldCfg.periodMinutes > 0
      ? new Date(new Date(me.yield_at).getTime() + yieldCfg.periodMinutes * 60_000).toISOString()
      : null;
  const t = dict.client;
  const supabase = await createClient();
  // La RLS garantit que seules les transactions de ce client sont renvoyées.
  const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(50);
  const txs = (data ?? []) as Transaction[];

  return (
    <>
      <BalanceHero balance={me.balance} nextYieldAt={nextYieldAt} ratePercent={yieldCfg.ratePercent} />

      <div id="retrait" className="scroll-mt-24">
        <Card title={t.cards.withdrawal}><WithdrawFlow /></Card>
      </div>

      <div className="-mx-4 overflow-hidden border-y border-slate-200 bg-white"><LiveTicker /></div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title={t.cards.trend} className="lg:col-span-2">
          <TrendArea data={balanceSeries(txs, me.id, me.balance, dict.dash.charts.start)} empty={t.trendEmpty} />
        </Card>
        <Card title={t.cards.operations}><Donut data={typeBreakdown(txs, dict.dash.txTypes)} /></Card>
      </div>

      <MarketPanel />

      <Card title={t.cards.history}>
        <TransactionsTable txs={txs} names={{ [me.id]: me.full_name }} viewerId={me.id} />
      </Card>
    </>
  );
}
