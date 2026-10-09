import { SCENES, type SceneName } from "@/components/illustrations/Scenes";
import type { ReactNode } from "react";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";

/** Bandeau d'accueil humain en haut des dashboards admin et super admin. */
export default async function Welcome({ name, subtitle, scene = "wallet", children }: {
  name: string;
  subtitle: string;
  scene?: SceneName;
  children?: ReactNode;
}) {
  const t = (await getDictionary()).dash.welcome;
  const Scene = SCENES[scene];
  const first = name.split(/\s+/)[0];
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand text-white shadow-[0_20px_50px_rgba(53,99,233,0.25)]">
      <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute bottom-[-5rem] left-1/3 h-56 w-56 rounded-full bg-white/5" />
      <div className="relative grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm font-medium text-white/70">{t.hello}</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{fmt(t.back, { name: first })}</h1>
          <p className="mt-2 max-w-lg text-sm text-white/80">{subtitle}</p>
          {children && <div className="mt-5">{children}</div>}
        </div>
        <Scene tone="dark" className="hidden h-36 w-52 md:block" />
      </div>
    </section>
  );
}
