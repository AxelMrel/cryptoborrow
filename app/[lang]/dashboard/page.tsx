import { redirect } from "next/navigation";
import { HOME, getCurrentProfile } from "@/lib/dal";
import { withLocale } from "@/i18n/config";
import { getLocale } from "@/i18n/server";

// Redirection automatique selon le rôle.
export default async function DashboardIndex() {
  const [me, locale] = await Promise.all([getCurrentProfile(), getLocale()]);
  redirect(withLocale(locale, me ? HOME[me.role] : "/login"));
}
