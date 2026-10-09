import Image from "next/image";
import Link from "next/link";
import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";
import LiveBtcCard from "@/components/LiveBtcCard";
import { ChartIcon, IconBadge, KeyIcon, ShieldIcon, WalletIcon } from "@/components/Icons";
import { LiveTicker, MarketsGrid } from "@/components/charts/LiveTicker";
import { withLocale } from "@/i18n/config";
import { fmt, money } from "@/i18n/format";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata() {
  const t = (await getDictionary()).home.meta;
  return { title: t.title, description: t.description };
}

const FEATURE_ICONS = [<WalletIcon key="w" />, <ChartIcon key="c" />, <KeyIcon key="k" />, <ShieldIcon key="s" />];

export default async function Home() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.home;
  const login = withLocale(locale, "/login");

  return (
    <div id="top" className="overflow-x-clip">
      <SiteNav audience="client" />

      <header className="relative px-4 pb-20 pt-12 sm:pt-16">
        <div className="dots-bg pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative mx-auto grid max-w-[1160px] items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="animate-fade-up inline-block rounded-full bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand">
              {t.pill}
            </p>
            <h1 className="animate-fade-up mt-5 text-[34px] font-semibold leading-[1.3] tracking-tight [animation-delay:100ms] sm:text-[48px] sm:leading-[1.2]">
              {t.heroTitle}<span className="text-brand">{t.heroTitleHl}</span>
            </h1>
            <p className="animate-fade-up mt-5 max-w-lg text-lg leading-relaxed text-slate-500 [animation-delay:200ms]">
              {t.heroText}
            </p>
            <div className="animate-fade-up mt-8 flex flex-col gap-3 [animation-delay:300ms] sm:flex-row">
              <Link href={login} className="btn btn-primary !px-7 !py-3 text-base">{t.signIn}</Link>
              <a href="#acces" className="btn btn-ghost !px-7 !py-3 text-base">{t.howToAccess}</a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-brand/10" />
            <Image
              src="/images/woman-pagne.jpg" alt={t.heroAlt} width={560} height={640} priority
              className="relative h-[440px] w-full rounded-[2rem] object-cover object-top shadow-[0_24px_60px_rgba(18,22,58,0.18)] sm:h-[500px]"
            />
            <div className="animate-float absolute -left-3 top-10 sm:-left-8"><LiveBtcCard /></div>
            <div className="animate-float absolute -bottom-6 right-2 w-56 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_44px_rgba(18,22,58,0.14)] [animation-delay:-3s] sm:-right-6">
              <p className="text-xs text-slate-400">{t.balanceLabel}</p>
              <p className="mt-1 text-xl font-semibold">{money(2500, locale)}</p>
              <p className="mt-1 text-xs font-medium text-up">{fmt(t.todayGain, { amount: money(200, locale) })}</p>
            </div>
          </div>
        </div>
      </header>

      <LiveTicker />

      <section id="acces" className="scroll-mt-24 bg-sand/60 px-4 py-20">
        <div className="mx-auto grid max-w-[1160px] items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Image src="/images/woman-portrait.jpg" alt={t.access.alt} width={480} height={560} className="mx-auto h-[420px] w-full max-w-sm rounded-[2rem] object-cover shadow-[0_24px_60px_rgba(18,22,58,0.16)]" />
          <div>
            <h2 className="text-3xl font-semibold sm:text-4xl">{t.access.title}<span className="text-brand">{t.access.titleHl}</span></h2>
            <ol className="mt-8 space-y-6">
              {t.access.steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-white">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-600">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-sm text-slate-600">
              {t.access.already}{" "}
              <Link href={login} className="font-medium text-brand hover:underline">{t.access.signInHere}</Link>.
            </p>
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="mx-auto max-w-[1160px] scroll-mt-24 px-4 py-20">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">{t.features.title}<span className="text-brand">{t.features.titleHl}</span></h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.features.items.map((f, i) => (
            <div key={f.title} className="card p-6">
              <IconBadge>{FEATURE_ICONS[i]}</IconBadge>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="marches" className="scroll-mt-24 bg-surface px-4 py-20">
        <div className="mx-auto max-w-[1160px]">
          <h2 className="text-center text-3xl font-semibold sm:text-4xl">{t.markets.title}<span className="text-brand">{t.markets.titleHl}</span></h2>
          <p className="mx-auto mb-10 mt-3 max-w-xl text-center text-slate-500">{t.markets.subtitle}</p>
          <MarketsGrid />
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="relative mx-auto grid max-w-[1160px] items-center gap-8 overflow-hidden rounded-3xl bg-brand p-8 text-white shadow-[0_24px_60px_rgba(53,99,233,0.3)] sm:p-12 md:grid-cols-[1.4fr_1fr]">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10" />
          <div className="relative">
            <h2 className="text-3xl font-semibold">{t.cta.title}</h2>
            <p className="mt-3 max-w-md text-white/80">{t.cta.text}</p>
            <div className="mt-7"><Link href={login} className="btn bg-white !text-brand hover:bg-slate-100">{t.cta.button}</Link></div>
          </div>
          <Image src="/images/mobile-pay.jpg" alt="" width={420} height={280} className="relative hidden h-52 w-full rounded-2xl object-cover ring-4 ring-white/20 md:block" />
        </div>
      </section>

      <SiteFooter audience="client" />
    </div>
  );
}
