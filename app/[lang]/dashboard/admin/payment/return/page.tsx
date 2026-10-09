import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { settleFromFedaPay, type SettleResult } from "@/lib/payments";
import { Card } from "@/components/dashboard/ui";
import { withLocale } from "@/i18n/config";
import { fmt, num } from "@/i18n/format";
import { getDictionary, getLocale } from "@/i18n/server";

export const instant = false;

export async function generateMetadata() {
  return { title: (await getDictionary()).billing.ret.meta };
}

/**
 * Page où FedaPay renvoie l'admin après le paiement : /payment/return?id=<transaction>&status=<statut>.
 * Ces paramètres viennent du navigateur : ils ne servent QU'À identifier la transaction.
 * Le vrai statut est relu chez FedaPay avec la clé secrète avant de créditer quoi que ce soit.
 */
export default async function PaymentReturn({ searchParams }: PageProps<"/[lang]/dashboard/admin/payment/return">) {
  const [me, dict, locale, params] = await Promise.all([requireRole("admin"), getDictionary(), getLocale(), searchParams]);
  const t = dict.billing.ret;
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const result: SettleResult = await settleFromFedaPay(Number(rawId), me.id);

  const view = {
    approved: { tone: "ok", title: t.approved },
    pending: { tone: "wait", title: t.pending, text: t.pendingText },
    declined: { tone: "ko", title: t.declined, text: t.declinedText },
    canceled: { tone: "ko", title: t.canceled, text: t.canceledText },
    unknown: { tone: "ko", title: t.unknown, text: t.unknownText },
    error: { tone: "wait", title: t.error, text: t.errorText },
  }[result.state];
  const text = result.state === "approved"
    ? result.already ? t.approvedAlready : fmt(t.approvedText, { credits: num(result.credits, locale) })
    : (view as { text?: string }).text;
  const palette = { ok: "bg-emerald-50 text-up", wait: "bg-amber-50 text-amber-700", ko: "bg-rose-50 text-down" }[view.tone];
  const symbol = { ok: "✓", wait: "…", ko: "×" }[view.tone];
  const retry = result.state === "pending" || result.state === "error";

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <div className="text-center">
          <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold ${palette}`}>{symbol}</span>
          <h1 className="mt-5 text-2xl font-semibold">{view.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{text}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {retry && (
              <Link href={`${withLocale(locale, "/dashboard/admin/payment/return")}?id=${encodeURIComponent(String(rawId ?? ""))}`} className="btn btn-primary">
                {t.check}
              </Link>
            )}
            <Link href={withLocale(locale, "/dashboard/admin")} className={retry ? "btn btn-ghost" : "btn btn-primary"}>{t.back}</Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
