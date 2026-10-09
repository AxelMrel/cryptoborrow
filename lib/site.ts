import "server-only";
import { headers } from "next/headers";
import { withLocale, type Locale } from "@/i18n/config";

/** URL publique du site. NEXT_PUBLIC_SITE_URL est prioritaire : on évite de se fier à l'en-tête Host. */
export async function siteOrigin() {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fixed) return fixed;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Lien de connexion à envoyer à un client : page de connexion avec son e-mail déjà rempli. */
export async function clientAccessLink(locale: Locale, email: string) {
  return `${await siteOrigin()}${withLocale(locale, "/login")}?email=${encodeURIComponent(email)}`;
}
