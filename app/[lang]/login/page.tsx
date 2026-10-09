import AuthShell from "@/components/AuthShell";
import LoginForm from "@/components/LoginForm";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getDictionary()).auth.login.meta };
}

export default async function LoginPage() {
  const t = (await getDictionary()).auth.login;
  return (
    <AuthShell title={t.title} subtitle={t.subtitle} scene="market" quote={t.quote}>
      <LoginForm />
    </AuthShell>
  );
}
