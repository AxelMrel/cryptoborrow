import { requireRole } from "@/lib/dal";
import { dateTime } from "@/lib/format";
import { Card } from "@/components/dashboard/ui";
import PageHeader from "@/components/dashboard/PageHeader";
import { PasswordForm, ProfileForm } from "@/components/dashboard/profile-forms";

export const instant = false;
export const metadata = { title: "Mon profil | CoinPulse" };

export default async function ProfilePage() {
  const me = await requireRole("client");
  return (
    <>
      <PageHeader title="Mon profil" subtitle="Vos informations personnelles et la sécurité de votre compte." />
      <Card title="Informations personnelles">
        <ProfileForm fullName={me.full_name} phone={me.phone ?? ""} email={me.email} />
        <p className="mt-4 text-xs text-slate-400">Compte créé le {dateTime(me.created_at)}</p>
      </Card>
      <Card title="Mot de passe">
        <PasswordForm />
      </Card>
    </>
  );
}
