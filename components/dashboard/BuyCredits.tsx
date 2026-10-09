import { PLANS } from "@/lib/plans";
import { eurToXof } from "@/lib/fedapay";
import { startCheckout } from "@/lib/actions/billing";
import { fmt, money, num } from "@/i18n/format";
import { getDictionary, getLocale } from "@/i18n/server";
import { ActionForm, SubmitButton } from "./forms";

/** Achat de crédits : un bouton par pack, qui envoie l'admin payer chez FedaPay. */
export default async function BuyCredits() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.billing;
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">{t.buySubtitle}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <ActionForm
            key={p.id}
            action={startCheckout}
            className={`flex flex-col rounded-2xl border p-5 ${p.highlight ? "border-brand bg-brand/5" : "border-slate-200 bg-white"}`}
          >
            <input type="hidden" name="plan_id" value={p.id} />
            <p className="font-semibold">{p.name}</p>
            <p className="mt-1 text-3xl font-bold">{money(p.price, locale)}</p>
            <p className="mt-2 text-sm text-slate-600">{fmt(t.pack, { credits: num(p.credits, locale), clients: num(p.max_clients, locale) })}</p>
            <p className="mb-4 mt-1 flex-1 text-xs text-slate-400">{fmt(t.xofNote, { xof: num(eurToXof(p.price), locale) })}</p>
            <SubmitButton className="btn btn-primary w-full">{t.pay}</SubmitButton>
          </ActionForm>
        ))}
      </div>
    </div>
  );
}
