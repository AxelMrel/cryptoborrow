import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { codeStatus, dateTime, money, num } from "@/lib/format";
import type { Profile, Transaction, WithdrawalCode } from "@/lib/types";
import { Badge, Card, Stat, Table, Td, TransactionsTable } from "@/components/dashboard/ui";
import { AdminActions, SettingForm } from "@/components/dashboard/super-admin-forms";
import Welcome from "@/components/dashboard/Welcome";
import MarketPanel from "@/components/charts/MarketPanel";
import { LiveTicker } from "@/components/charts/LiveTicker";
import { Donut, FlowBars, RankBars } from "@/components/charts/StatCharts";
import { dailyFlows, typeBreakdown } from "@/lib/stats";

// Pages authentifiées : le contenu dépend de la session, la navigation n'a pas besoin d'être "instantanée".
export const instant = false;

export const metadata = { title: "Super admin | CoinPulse" };

export default async function SuperAdminDashboard() {
  const me = await requireRole("super_admin");
  const supabase = await createClient();

  // Le super admin voit tout grâce à la policy RLS is_super_admin().
  const [profilesRes, txRes, txCountRes, feesRes, codesRes, settingsRes] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("transactions").select("*", { count: "exact", head: true }),
    supabase.from("transactions").select("amount").eq("type", "admin_fee"),
    supabase.from("withdrawal_codes").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("settings").select("*").order("key"),
  ]);
  const profiles = (profilesRes.data ?? []) as Profile[];
  const admins = profiles.filter((p) => p.role === "admin");
  const clients = profiles.filter((p) => p.role === "client");
  const txs = (txRes.data ?? []) as Transaction[];
  const codes = (codesRes.data ?? []) as WithdrawalCode[];
  const settings = (settingsRes.data ?? []) as { key: string; value: string }[];
  const feesCollected = (feesRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

  const names: Record<string, string> = {};
  profiles.forEach((p) => (names[p.id] = p.full_name));
  const clientCount = (adminId: string) => clients.filter((c) => c.created_by === adminId).length;

  const SETTING_LABELS: Record<string, string> = {
    withdrawal_code_fee: "Frais par code de retrait (crédits)",
    withdrawal_code_ttl_minutes: "Validité d'un code (minutes)",
    max_operation_amount: "Montant max par opération (€)",
  };

  return (
    <>
      <Welcome name={me.full_name} photo="/images/man-smile.jpg" subtitle="Vue d'ensemble de la plateforme : admins, clients, crédits, codes et transactions." />
      <div className="-mx-4 overflow-hidden border-y border-slate-200 bg-white"><LiveTicker /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Admins" value={num(admins.length)} />
        <Stat label="Clients" value={num(clients.length)} />
        <Stat label="Soldes clients" value={money(clients.reduce((s, c) => s + c.balance, 0))} />
        <Stat label="Crédits admins" value={`${num(admins.reduce((s, a) => s + a.credits, 0))} crédits`} />
        <Stat label="Frais encaissés" value={`${num(feesCollected)} crédits`} hint="Codes de retrait" />
        <Stat label="Transactions" value={num(txCountRes.count ?? 0)} />
        <Stat label="Codes générés" value={num(codes.length)} hint={`${codes.filter((c) => codeStatus(c) === "active").length} actif(s)`} />
        <Stat label="Clients / admin" value={admins.length ? (clients.length / admins.length).toFixed(1) : "0"} hint="Moyenne" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Flux des clients (14 jours)" className="lg:col-span-2"><FlowBars data={dailyFlows(txs)} /></Card>
        <Card title="Répartition des transactions"><Donut data={typeBreakdown(txs)} /></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Crédits par admin">
          <RankBars data={admins.map((a) => ({ name: a.full_name, value: a.credits }))} empty="Aucun admin inscrit pour le moment." />
        </Card>
        <MarketPanel />
      </div>

      <Card title={`Admins (${admins.length})`}>
        {admins.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Aucun admin pour le moment : ils s&apos;inscrivent depuis la landing page.</p>}
        <div className="space-y-4">
          {admins.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{a.full_name}</p>
                  <p className="text-xs text-slate-500">{a.email}</p>
                </div>
                <div className="flex gap-2 text-sm">
                  <Badge tone={a.credits > 0 ? "cyan" : "red"}>{num(a.credits)} crédits</Badge>
                  <Badge tone="gray">{clientCount(a.id)} / {a.max_clients} clients</Badge>
                </div>
              </div>
              <AdminActions adminId={a.id} maxClients={a.max_clients} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Tarifs et paramètres">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {settings.map((s) => (
            <SettingForm key={s.key} k={s.key} label={SETTING_LABELS[s.key] ?? s.key} value={s.value} />
          ))}
        </div>
      </Card>

      <Card title={`Clients (${clients.length})`}>
        <Table head={["Client", "Email", "Admin", "Solde", "Créé le"]} empty="Aucun client.">
          {clients.map((c) => (
            <tr key={c.id}>
              <Td>{c.full_name}</Td>
              <Td className="text-slate-500">{c.email}</Td>
              <Td>{c.created_by ? names[c.created_by] ?? "Inconnu" : "Plateforme"}</Td>
              <Td className="font-mono">{money(c.balance)}</Td>
              <Td className="whitespace-nowrap text-slate-500">{dateTime(c.created_at)}</Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Codes de retrait">
        <Table head={["Créé le", "Admin", "Client", "Code", "Montant", "Expire", "Statut"]} empty="Aucun code.">
          {codes.map((c) => {
            const st = codeStatus(c);
            return (
              <tr key={c.id}>
                <Td className="whitespace-nowrap text-slate-500">{dateTime(c.created_at)}</Td>
                <Td>{names[c.admin_id] ?? "Inconnu"}</Td>
                <Td>{names[c.client_id] ?? "Inconnu"}</Td>
                <Td className="font-mono tracking-widest">{c.code}</Td>
                <Td>{c.amount ? money(c.amount) : "Libre"}</Td>
                <Td className="whitespace-nowrap text-slate-500">{dateTime(c.expires_at)}</Td>
                <Td><Badge tone={st === "active" ? "cyan" : st === "used" ? "green" : "gray"}>{st === "active" ? "Actif" : st === "used" ? "Utilisé" : "Expiré"}</Badge></Td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Card title="Dernières transactions">
        <TransactionsTable txs={txs} names={names} />
      </Card>
    </>
  );
}
