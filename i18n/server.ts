import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { LANG_COOKIE, defaultLocale, hasLocale, type Locale } from "./config";
import { dictionaries } from "./dict";

/** Langue de la route courante (Server Components, layouts, pages). Ne fonctionne pas dans les Server Actions. */
export async function getLocale(): Promise<Locale> {
  const l = await lang();
  if (!hasLocale(l)) notFound();
  return l;
}

export async function getDictionary() {
  return dictionaries[await getLocale()];
}

/**
 * Langue pour les Server Actions : `next/root-params` n'y est pas disponible, on lit donc le cookie
 * posé par le proxy à chaque visite d'une page localisée.
 */
export async function getActionLocale(): Promise<Locale> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  return hasLocale(c) ? c : defaultLocale;
}

export async function getActionDictionary() {
  return dictionaries[await getActionLocale()];
}

/** Tout ce dont une Server Action a besoin : langue, dictionnaire, messages d'actions et d'erreurs. */
export async function getActionContext() {
  const locale = await getActionLocale();
  const dict = dictionaries[locale];
  return { locale, dict, m: dict.errors.actions, e: dict.errors };
}
