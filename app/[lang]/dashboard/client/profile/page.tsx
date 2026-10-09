import { requireRole } from "@/lib/dal";
import { dateTime, fmt } from "@/i18n/format";
import { getDictionary, getLocale } from "@/i18n/server";
import { Card } from "@/components/dashboard/ui";
import PageHeader from "@/components/dashboard/PageHeader";
import { PasswordForm, ProfileForm } from "@/components/dashboard/profile-forms";

export const instant = false;

export async function generateMetadata() {
  return { title: (await getDictionary()).client.meta.profile };
}

export default async function ProfilePage() {
  const [me, dict, locale] = await Promise.all([requireRole("client"), getDictionary(), getLocale()]);
  const t = dict.client.profile;
  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <Card title={t.personal}>
        <ProfileForm fullName={me.full_name} phone={me.phone ?? ""} email={me.email} />
        <p className="mt-4 text-xs text-slate-400">{fmt(t.createdOn, { date: dateTime(me.created_at, locale) })}</p>
      </Card>
      <Card title={t.password}>
        <PasswordForm />
      </Card>
    </>
  );
}
