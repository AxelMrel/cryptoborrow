export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";
export const LANG_COOKIE = "lang";

export const hasLocale = (l: string | undefined | null): l is Locale => !!l && (locales as readonly string[]).includes(l);

/** Locale Intl utilisée pour les nombres, devises et dates. */
export const intlLocale = (l: Locale) => (l === "fr" ? "fr-FR" : "en-GB");

/** Préfixe un chemin avec la langue : withLocale("en", "/login") -> "/en/login". */
export const withLocale = (l: Locale, path: string) => `/${l}${path === "/" ? "" : path}`;
