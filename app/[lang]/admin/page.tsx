import Image from "next/image";
import Link from "next/link";
import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";
import PricingCards from "@/components/PricingCards";
import { ChartIcon, CoinsIcon, IconBadge, KeyIcon, SendIcon, UsersIcon } from "@/components/Icons";
import { withLocale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";

export async function generateMetadata() {
  const t = (await getDictionary()).adminLanding.meta;
  return { title: t.title, description: t.description };
}

const TOOL_ICONS = [<UsersIcon key="u" />, <SendIcon key="s" />, <CoinsIcon key="c" />, <KeyIcon key="k" />, <ChartIcon key="g" />];

export default async function AdminLanding() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.adminLanding;
  const signup = withLocale(locale, "/signup");
  const login = withLocale(locale, "/login");

  return (
    <div id="top" className="overflow-x-clip">
      <SiteNav audience="admin" />

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
              <Link href={signup} className="btn btn-primary !px-7 !py-3 text-base">{t.becomeAdmin}</Link>
              <a href="#tarifs" className="btn btn-ghost !px-7 !py-3 text-base">{t.seePacks}</a>
            </div>
            <p className="animate-fade-up mt-6 text-sm text-slate-500 [animation-delay:400ms]">
              {t.alreadyAdmin} <Link href={login} className="font-medium text-brand hover:underline">{t.signInLink}</Link>.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-brand/10" />
            <Image
              src="/images/partners.jpg" alt={t.heroAlt} width={640} height={520} priority
              className="relative h-[420px] w-full rounded-[2rem] object-cover shadow-[0_24px_60px_rgba(18,22,58,0.18)] sm:h-[480px]"
            />
            <div className="animate-float absolute -bottom-8 -left-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_44px_rgba(18,22,58,0.14)] sm:-left-8">
              <p className="text-xs font-semibold text-brand">{t.sample.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {t.sample.hello}<br />
                {t.sample.email}<br />
                {t.sample.password}<br />
                {t.sample.link}
              </p>
              <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-up">{t.sample.whatsapp}</span>
            </div>
          </div>
        </div>
      </header>

      <section id="outils" className="scroll-mt-24 bg-surface px-4 py-20">
        <div className="mx-auto max-w-[1160px]">
          <h2 className="text-center text-3xl font-semibold sm:text-4xl">{t.tools.title}<span className="text-brand">{t.tools.titleHl}</span></h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.tools.items.map((item, i) => (
              <div key={item.title} className="card p-6">
                <IconBadge>{TOOL_ICONS[i]}</IconBadge>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="etapes" className="mx-auto max-w-[1160px] scroll-mt-24 px-4 py-20">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">{t.steps.title}<span className="text-brand">{t.steps.titleHl}</span></h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {t.steps.items.map((s, i) => (
            <div key={s.title} className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_36px_rgba(18,22,58,0.06)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-semibold text-white">{i + 1}</span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="tarifs" className="scroll-mt-24 bg-surface px-4 py-20">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">{t.packs.title}<span className="text-brand">{t.packs.titleHl}</span></h2>
        <p className="mx-auto mb-14 mt-3 max-w-xl text-center text-slate-500">{t.packs.subtitle}</p>
        <PricingCards />
      </section>

      <section className="px-4 py-20">
        <div className="relative mx-auto grid max-w-[1160px] items-center gap-8 overflow-hidden rounded-3xl bg-brand p-8 text-white shadow-[0_24px_60px_rgba(53,99,233,0.3)] sm:p-12 md:grid-cols-[1.4fr_1fr]">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10" />
          <div className="relative">
            <h2 className="text-3xl font-semibold">{t.cta.title}</h2>
            <p className="mt-3 max-w-md text-white/80">{t.cta.text}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={signup} className="btn bg-white !text-brand hover:bg-slate-100">{t.cta.becomeAdmin}</Link>
              <Link href={login} className="btn border border-white/50 text-white hover:bg-white/10">{t.cta.signIn}</Link>
            </div>
          </div>
          <Image src="/images/man-smile.jpg" alt="" width={420} height={280} className="relative hidden h-52 w-full rounded-2xl object-cover object-top ring-4 ring-white/20 md:block" />
        </div>
      </section>

      <SiteFooter audience="admin" />
    </div>
  );
}
