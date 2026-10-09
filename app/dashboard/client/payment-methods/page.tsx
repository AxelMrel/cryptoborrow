import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/lib/types";
import { Card } from "@/components/dashboard/ui";
import PageHeader from "@/components/dashboard/PageHeader";
import { AddPaymentMethodForm, PaymentMethodItem } from "@/components/dashboard/payment-forms";

export const instant = false;
export const metadata = { title: "Moyens de paiement | CoinPulse" };

export default async function PaymentMethodsPage() {
  const me = await requireRole("client");
  const supabase = await createClient();
  // La RLS ne renvoie que les moyens de paiement du client connecté.
  const { data, error } = await supabase
    .from("payment_methods").select("*").eq("user_id", me.id)
    .order("is_default", { ascending: false }).order("created_at", { ascending: false });
  const methods = (data ?? []) as PaymentMethod[];

  return (
    <>
      <PageHeader title="Moyens de paiement" subtitle="Enregistrez la carte ou le compte bancaire que vous utilisez, pour les retrouver facilement." />

      {error ? (
        <Card>
          <p className="font-semibold">Fonctionnalité en cours d&apos;activation</p>
          <p className="mt-1 text-sm text-slate-500">
            La base de données doit encore recevoir la migration <code className="rounded bg-slate-100 px-1.5 py-0.5">supabase/002_profile_payment.sql</code>.
          </p>
        </Card>
      ) : (
        <>
          <Card title={`Mes moyens de paiement (${methods.length}/5)`}>
            {methods.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Aucun moyen de paiement enregistré pour le moment.</p>
            ) : (
              <ul className="space-y-3">{methods.map((m) => <PaymentMethodItem key={m.id} method={m} />)}</ul>
            )}
          </Card>
          {methods.length < 5 && (
            <Card title="Ajouter un moyen de paiement"><AddPaymentMethodForm /></Card>
          )}
        </>
      )}
    </>
  );
}
