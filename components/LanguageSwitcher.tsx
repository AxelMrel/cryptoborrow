"use client";

import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";

/** Bascule FR / EN en conservant la page courante, les paramètres et l'ancre. */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();

  const target = (l: Locale) => {
    const parts = pathname.split("/");
    parts[1] = l;
    return parts.join("/");
  };

  return (
    <div role="group" aria-label={t.site.language.label} className={`inline-flex rounded-full border border-slate-200 bg-white p-0.5 text-xs font-semibold ${className}`}>
      {locales.map((l) => (
        <a
          key={l}
          href={target(l)}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          onClick={(e) => {
            if (l === locale) return e.preventDefault();
            e.preventDefault();
            window.location.assign(target(l) + window.location.search + window.location.hash);
          }}
          className={`rounded-full px-2.5 py-1.5 transition ${l === locale ? "bg-brand text-white" : "text-slate-500 hover:text-brand"}`}
        >
          {t.site.language[l]}
        </a>
      ))}
    </div>
  );
}
