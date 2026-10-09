"use client";

import { useState } from "react";
import { CopyIcon, SendIcon } from "@/components/Icons";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

/** Code de retrait généré après paiement : grand format, copie et envoi WhatsApp. */
export default function CodeCard({ code, clientName, amount, expires }: { code: string; clientName: string; amount: string | null; expires: string }) {
  const { t: dict } = useI18n();
  const t = dict.billing.ret;
  const [copied, setCopied] = useState(false);
  const message = fmt(t.whatsappText, { code, date: expires });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand/5 p-6 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{t.code}</p>
      <p className="mt-2 break-all font-mono text-4xl font-bold tracking-[0.25em] text-brand sm:text-5xl">{code}</p>
      <p className="mt-3 text-sm text-slate-600">{fmt(t.codeFor, { name: clientName })}</p>
      <p className="text-sm text-slate-500">{amount ? fmt(t.codeAmount, { amount }) : t.codeAnyAmount}</p>
      <p className="text-xs text-slate-400">{fmt(t.codeExpires, { date: expires })}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={copy} className="btn btn-ghost"><CopyIcon className="h-4 w-4" />{copied ? t.copied : t.copy}</button>
        <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(message)}`}>
          <SendIcon className="h-4 w-4" />{t.whatsapp}
        </a>
      </div>
    </div>
  );
}
