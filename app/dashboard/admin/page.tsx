import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { codeStatus, dateTime, fcfa } from "@/lib/format";
import type { Profile, Transaction, WithdrawalCode } from "@/lib/types";
import { Badge, Card, Stat, Table, Td, TransactionsTable } from "@/components/dashboard/ui";
import { ClientActions, CreateClientForm } from "@/components/dashboard/admin-forms";
import Welcome from "@/components/dashboard/Welcome";
import { LiveTicker } from "@/components/charts/LiveTicker";
import { Donut, FlowBars, RankBars } from "@/components/charts/StatCharts";
import { dailyFlows, typeBreakdown } from "@/lib/stats";

// Pages authentifiées : le contenu dépend de la session, la navigation n'a pas besoin d'être "instantanée".
export const instant = false;

export const metadata = { title: "Espace admin | CoinPulse" };

export default async function AdminDashboard() {
  const me = await requireRole("admin");
  const supabase = await createClient();

  // Toutes ces lectures passent par la RLS : l'admin ne reçoit que SES clients et leurs données.
  const [clientsRes, txRes, codesRes, feeRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "client").order("created_at", { ascending: false }),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("withdrawal_codes").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("settings").select("value").eq("key", "withdrawal_code_fee").single(),
  ]);
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
        <h1 className="text-2xl font-bold text-brand">Espace verrouillé</h1>
        <p className="mt-3 text-slate-700">
          Votre solde de crédits est de 0 FCFA. Contactez le super admin pour obtenir des crédits et débloquer votre espace.
        </p>
      </Card>
    );
  }

  const quotaFull = clients.length >= me.max_clients;

  return (
    <>
      <Welcome name={me.full_name} photo="/images/partners.jpg" subtitle="Gérez vos clients, créditez leurs comptes et générez leurs codes de retrait." />
      <div className="-mx-4 overflow-hidden border-y border-slate-200 bg-white"><LiveTicker /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Crédits" value={fcfa(me.credits)} hint={`Un code de retrait coûte ${fcfa(fee)}`} />
        <Stat label="Clients / quota" value={`${clients.length} / ${me.max_clients}`} hint={quotaFull ? "Quota atteint" : "Places restantes : " + (me.max_clients - clients.length)} />
        <Stat label="Codes générés" value={codes.length} hint={`${codes.filter((c) => codeStatus(c) === "active").length} actif(s)`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Flux de mes clients (14 jours)" className="lg:col-span-2"><FlowBars data={dailyFlows(txs)} /></Card>
        <Card title="Répartition des opérations"><Donut data={typeBreakdown(txs)} /></Card>
      </div>

      <Card title="Soldes de mes clients">
        <RankBars data={clients.map((c) => ({ name: c.full_name, value: c.balance }))} empty="Créez votre premier client pour voir ses soldes." />
      </Card>

      <Card title="Créer un client">
        {quotaFull ? (
          <p className="text-sm text-amber-800">Quota atteint : demandez au super admin d&apos;augmenter votre limite.</p>
        ) : (
          <CreateClientForm />
        )}
      </Card>

      <Card title={`Mes clients (${clients.length})`}>
        {clients.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Aucun client pour le moment.</p>}
        <div className="space-y-4">
          {clients.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{c.full_name}</p>
                  <p className="text-xs text-slate-500">{c.email}</p>
                </div>
                <p className="font-mono text-lg text-brand">{fcfa(c.balance)}</p>
              </div>
              <ClientActions clientId={c.id} fee={fee} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Codes de retrait générés">
        <Table head={["Créé le", "Client", "Code", "Montant", "Expire", "Statut"]} empty="Aucun code généré.">
          {codes.map((c) => {
            const st = codeStatus(c);
            return (
              <tr key={c.id}>
                <Td className="whitespace-nowrap text-slate-500">{dateTime(c.created_at)}</Td>
                <Td>{names[c.client_id] ?? "Inconnu"}</Td>
                <Td className="font-mono tracking-widest">{c.code}</Td>
                <Td>{c.amount ? fcfa(c.amount) : "Libre"}</Td>
                <Td className="whitespace-nowrap text-slate-500">{dateTime(c.expires_at)}</Td>
                <Td><Badge tone={st === "active" ? "cyan" : st === "used" ? "green" : "gray"}>{st === "active" ? "Actif" : st === "used" ? "Utilisé" : "Expiré"}</Badge></Td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Card title="Transactions (mes clients et mes crédits)">
        <TransactionsTable txs={txs} names={names} />
      </Card>
    </>
  );
}
