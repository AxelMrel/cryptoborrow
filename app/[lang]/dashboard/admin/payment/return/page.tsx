import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { settleFromFedaPay, type SettleResult } from "@/lib/payments";
import { Card } from "@/components/dashboard/ui";
import CodeCard from "@/components/dashboard/CodeCard";
import { StoredCredentials } from "@/components/dashboard/admin-forms";
import { withLocale } from "@/i18n/config";
import { dateTime, fmt, money } from "@/i18n/format";
import { getDictionary, getLocale } from "@/i18n/server";

export const instant = false;

export async function generateMetadata() {
  return { title: (await getDictionary()).billing.ret.meta };
}

/**
 * Page où FedaPay renvoie l'admin après le paiement : /payment/return?id=<transaction>&status=<statut>.
 * Ces paramètres viennent du navigateur : ils ne servent QU'À identifier la transaction.
 * Le vrai statut est relu chez FedaPay avec la clé secrète avant de créer le client ou le code.
 */
export default async function PaymentReturn({ searchParams }: PageProps<"/[lang]/dashboard/admin/payment/return">) {
  const [me, dict, locale, params] = await Promise.all([requireRole("admin"), getDictionary(), getLocale(), searchParams]);
  const t = dict.billing.ret;
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const result: SettleResult = await settleFromFedaPay(Number(rawId), me.id);

  // Lectures protégées par la RLS : l'admin ne peut lire que ses propres clients et codes.
  const supabase = await createClient();
  let clientName = "";
  let clientEmail = "";
  let code: { code: string; amount: number | null; expires_at: string } | null = null;
  if (result.state === "approved") {
    if (result.targetClientId) {
      const { data } = await supabase.from("profiles").select("full_name,email").eq("id", result.targetClientId).maybeSingle();
      clientName = data?.full_name ?? "";
      clientEmail = data?.email ?? "";
    }
    if (result.kind === "withdrawal_code") {
      const { data } = await supabase.from("withdrawal_codes").select("code,amount,expires_at").eq("payment_id", result.paymentId).maybeSingle();
      code = data ?? null;
    }
  }

  const tone = result.state === "approved" ? "ok" : result.state === "pending" || result.state === "error" ? "wait" : "ko";
  const palette = { ok: "bg-emerald-50 text-up", wait: "bg-amber-50 text-amber-700", ko: "bg-rose-50 text-down" }[tone];
  const symbol = { ok: "✓", wait: "…", ko: "×" }[tone];
  const retry = result.state === "pending" || result.state === "error";

  let title = "";
  let text = "";
  if (result.state === "approved") {
    if (result.kind === "withdrawal_code") {
      title = t.codeApproved;
      text = fmt(t.codeApprovedText, { name: clientName });
    } else {
      title = t.clientApproved;
      text = result.already ? t.clientAlready : fmt(t.clientApprovedText, { name: clientName });
    }
  } else {
    const table = {
      pending: [t.pending, t.pendingText],
      declined: [t.declined, t.declinedText],
      canceled: [t.canceled, t.canceledText],
      unknown: [t.unknown, t.unknownText],
      error: [t.error, t.errorText],
    } as const;
    [title, text] = table[result.state];
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <div className="text-center">
          <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold ${palette}`}>{symbol}</span>
          <h1 className="mt-5 text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{text}</p>
        </div>

        {result.state === "approved" && result.kind === "withdrawal_code" && code && (
          <div className="mt-6">
            <CodeCard
              code={code.code}
              clientName={clientName}
              amount={code.amount ? money(code.amount, locale) : null}
              expires={dateTime(code.expires_at, locale)}
            />
          </div>
        )}
        {result.state === "approved" && result.kind === "client_creation" && result.targetClientId && !result.already && (
          <div className="mt-6"><StoredCredentials clientId={result.targetClientId} /></div>
        )}
        {result.state === "approved" && result.kind === "client_creation" && clientEmail && result.already && (
          <p className="mt-4 text-center text-xs text-slate-400">{clientEmail}</p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {retry && (
            <Link href={`${withLocale(locale, "/dashboard/admin/payment/return")}?id=${encodeURIComponent(String(rawId ?? ""))}`} className="btn btn-primary">
              {t.check}
            </Link>
          )}
          <Link href={withLocale(locale, "/dashboard/admin")} className={retry ? "btn btn-ghost" : "btn btn-primary"}>{t.back}</Link>
        </div>
      </Card>
    </div>
  );
}
