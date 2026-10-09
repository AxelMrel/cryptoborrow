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

// Pages authentifiées : le contenu dépend de la session, la navigation n'a pas besoin d'être "instantanée".
export const instant = false;

export const metadata = { title: "Mon portefeuille | CoinPulse" };

export default async function ClientDashboard() {
  const me = await requireRole("client");
  const supabase = await createClient();
  // La RLS garantit que seules les transactions de ce client sont renvoyées.
  const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(50);
  const txs = (data ?? []) as Transaction[];

  return (
    <>
      <BalanceHero name={me.full_name} balance={me.balance} />

      <div id="retrait" className="scroll-mt-24">
        <Card title="Retrait"><WithdrawFlow /></Card>
      </div>

      <div className="-mx-4 overflow-hidden border-y border-slate-200 bg-white"><LiveTicker /></div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Évolution de mon solde" className="lg:col-span-2">
          <TrendArea data={balanceSeries(txs, me.id, me.balance)} empty="La courbe de votre solde apparaîtra dès votre premier crédit." />
        </Card>
        <Card title="Mes opérations"><Donut data={typeBreakdown(txs)} /></Card>
      </div>

      <MarketPanel />

      <Card title="Historique des transactions">
        <TransactionsTable txs={txs} names={{ [me.id]: me.full_name }} viewerId={me.id} />
      </Card>
    </>
  );
}
