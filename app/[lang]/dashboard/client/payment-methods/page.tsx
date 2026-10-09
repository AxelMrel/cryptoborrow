import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import type { PaymentMethod } from "@/lib/types";
import { Card } from "@/components/dashboard/ui";
import PageHeader from "@/components/dashboard/PageHeader";
import { AddPaymentMethodForm, PaymentMethodItem } from "@/components/dashboard/payment-forms";

export const instant = false;

export async function generateMetadata() {
  return { title: (await getDictionary()).client.meta.payments };
}

export default async function PaymentMethodsPage() {
  const [me, dict] = await Promise.all([requireRole("client"), getDictionary()]);
  const t = dict.client.payments;
  const supabase = await createClient();
  // La RLS ne renvoie que les moyens de paiement du client connecté.
  const { data, error } = await supabase
    .from("payment_methods").select("*").eq("user_id", me.id)
    .order("is_default", { ascending: false }).order("created_at", { ascending: false });
  const methods = (data ?? []) as PaymentMethod[];

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {error ? (
        <Card>
          <p className="font-semibold">{t.activationTitle}</p>
          <p className="mt-1 text-sm text-slate-500">
            {t.activationText} <code className="rounded bg-slate-100 px-1.5 py-0.5">supabase/002_profile_payment.sql</code>.
          </p>
        </Card>
      ) : (
        <>
          <Card title={fmt(t.mine, { n: methods.length })}>
            {methods.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">{t.none}</p>
            ) : (
              <ul className="space-y-3">{methods.map((m) => <PaymentMethodItem key={m.id} method={m} />)}</ul>
            )}
          </Card>
          {methods.length < 5 && (
            <Card title={t.add}><AddPaymentMethodForm /></Card>
          )}
        </>
      )}
    </>
  );
}
