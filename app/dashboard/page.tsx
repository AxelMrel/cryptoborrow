import { redirect } from "next/navigation";
import { HOME, getCurrentProfile } from "@/lib/dal";

// Redirection automatique selon le rôle.
export default async function DashboardIndex() {
  const me = await getCurrentProfile();
  redirect(me ? HOME[me.role] : "/login");
}
