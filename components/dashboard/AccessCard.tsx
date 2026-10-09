"use client";

import { useState, useSyncExternalStore } from "react";
import { CopyIcon, SendIcon } from "@/components/Icons";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import type { Credentials } from "@/lib/types";

type Props = { name: string; email: string; link: string; password?: string; onHide?: () => void };

/**
 * Lien d'accès à envoyer au client + message prêt à l'emploi (copie, WhatsApp, e-mail).
 * Le mot de passe n'y figure que s'il est encore disponible (navigateur de l'admin juste après le paiement).
 */
export function AccessCard({ name, email, link, password, onHide }: Props) {
  const { t: dict } = useI18n();
  const t = dict.admin.credentials;
  const a = dict.admin.access;
  const [copied, setCopied] = useState<"link" | "message" | null>(null);
  const first = name.split(/\s+/)[0];
  const message = password
    ? fmt(t.message, { first, email, password, link })
    : fmt(t.messageNoPassword, { first, email, link });

  const copy = async (what: "link" | "message") => {
    try {
      await navigator.clipboard.writeText(what === "link" ? link : message);
      setCopied(what);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      /* presse-papiers indisponible : le texte reste sélectionnable */
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">{a.linkTitle}</p>
        <p className="mt-0.5 text-xs text-slate-500">{a.linkHelp}</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label={a.linkTitle} className="input font-mono text-xs" />
          <button type="button" onClick={() => copy("link")} className="btn btn-primary whitespace-nowrap">
            <CopyIcon className="h-4 w-4" />{copied === "link" ? a.linkCopied : a.copyLink}
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold">{a.messageTitle}</p>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{message}</pre>
        {!password && <p className="mt-2 text-xs text-slate-400">{a.note}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => copy("message")} className="btn btn-ghost">
            <CopyIcon className="h-4 w-4" />{copied === "message" ? t.copied : t.copy}
          </button>
          <a className="btn btn-ghost" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(message)}`}>
            <SendIcon className="h-4 w-4" />{t.whatsapp}
          </a>
          <a className="btn btn-ghost" href={`mailto:${email}?subject=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(message)}`}>
            <SendIcon className="h-4 w-4" />{t.email}
          </a>
        </div>
        {password && onHide && <button type="button" onClick={onHide} className="mt-3 text-xs text-slate-400 underline">{a.hidePassword}</button>}
      </div>
    </div>
  );
}

const noopSubscribe = () => () => {};

/** Récapitulatif juste après le paiement : reprend le mot de passe gardé par le navigateur de l'admin, s'il existe. */
export function StoredAccess({ clientId, name, email, link }: { clientId: string; name: string; email: string; link: string }) {
  const key = `cp-credentials:${clientId}`;
  const raw = useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const [hidden, setHidden] = useState(false);
  let password: string | undefined;
  try {
    password = raw && !hidden ? (JSON.parse(raw) as Credentials).password : undefined;
  } catch {
    password = undefined;
  }
  return (
    <AccessCard
      name={name}
      email={email}
      link={link}
      password={password}
      onHide={() => {
        try { sessionStorage.removeItem(key); } catch { /* sans effet */ }
        setHidden(true);
      }}
    />
  );
}
