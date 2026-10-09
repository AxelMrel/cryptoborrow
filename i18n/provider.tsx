"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./config";
import type { Dict } from "./dict";

const Ctx = createContext<{ locale: Locale; t: Dict } | null>(null);

/** Donne la langue et le dictionnaire aux composants clients. */
export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: ReactNode }) {
  return <Ctx value={{ locale, t: dict }}>{children}</Ctx>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n doit être utilisé sous <I18nProvider>");
  return v;
}
