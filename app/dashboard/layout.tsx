import { Suspense } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { LogoutIcon } from "@/components/Icons";
import ClientMenu from "@/components/dashboard/ClientMenu";
import { getCurrentProfile } from "@/lib/dal";
import { signOut } from "@/lib/actions/auth";

const ROLE_LABEL = { super_admin: "Super admin", admin: "Admin", client: "Client" } as const;

async function UserBar() {
  const me = await getCurrentProfile();
  if (!me) return null;
  const initials = me.full_name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {me.role === "client" ? (
        <ClientMenu initials={initials} name={me.full_name} email={me.email} />
      ) : (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">{initials}</span>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold leading-tight">{me.full_name}</p>
            <p className="text-xs text-slate-500">{ROLE_LABEL[me.role]}</p>
          </div>
        </div>
      )}
      <form action={signOut}>
        <button
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-down focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <LogoutIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl border border-slate-200/60 bg-white px-4 shadow-[0_10px_36px_rgba(18,22,58,0.08)] sm:px-5">
          <Link href="/dashboard" aria-label="Tableau de bord"><Logo className="h-12" /></Link>
          <Suspense fallback={<div className="h-10 w-28 animate-pulse rounded-full bg-slate-100" />}>
            <UserBar />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <Suspense fallback={<div className="card h-64 animate-pulse" />}>{children}</Suspense>
      </main>
    </div>
  );
}
