import Image from "next/image";
import Link from "next/link";
import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";
import PricingCards from "@/components/PricingCards";
import { ChartIcon, CoinsIcon, IconBadge, KeyIcon, SendIcon, UsersIcon } from "@/components/Icons";

export const metadata = {
  title: "Espace admin | CoinPulse",
  description: "Créez vos clients, créditez leurs comptes, envoyez-leur leurs accès et générez leurs codes de retrait.",
};

const TOOLS = [
  { icon: <UsersIcon />, title: "Créez vos clients", text: "Ajoutez un client en quelques secondes, dans la limite du quota de votre pack." },
  { icon: <SendIcon />, title: "Envoyez-leur leurs accès", text: "Après la création, copiez les coordonnées ou envoyez-les par WhatsApp ou e-mail en un clic." },
  { icon: <CoinsIcon />, title: "Créditez leurs comptes", text: "Alimentez le solde de vos clients et gardez la trace de chaque opération." },
  { icon: <KeyIcon />, title: "Générez les codes de retrait", text: "Chaque code coûte des crédits. Il est à usage unique, lié à un client et limité dans le temps." },
  { icon: <ChartIcon />, title: "Pilotez avec des graphes", text: "Flux des 14 derniers jours, soldes par client, répartition des opérations." },
];

const STEPS = [
  { n: "1", title: "Choisissez un pack", text: "Vos crédits et votre quota de clients sont activés immédiatement." },
  { n: "2", title: "Créez vos clients", text: "Vous saisissez leur nom, leur e-mail et un mot de passe." },
  { n: "3", title: "Envoyez leurs coordonnées", text: "Un message prêt à l'emploi : un clic pour WhatsApp, e-mail ou copie." },
  { n: "4", title: "Accompagnez-les", text: "Créditez leurs comptes et générez leurs codes de retrait quand ils en ont besoin." },
];

export default function AdminLanding() {
  return (
    <div className="overflow-x-clip">
      <SiteNav audience="admin" />

      <header className="relative px-4 pb-20 pt-12 sm:pt-16">
        <div className="dots-bg pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative mx-auto grid max-w-[1160px] items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="animate-fade-up inline-block rounded-full bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand">
              Espace admin
            </p>
            <h1 className="animate-fade-up mt-5 text-[34px] font-semibold leading-[1.3] tracking-tight [animation-delay:100ms] sm:text-[48px] sm:leading-[1.2]">
              Développez votre activité, <span className="text-brand">client après client</span>
            </h1>
            <p className="animate-fade-up mt-5 max-w-lg text-lg leading-relaxed text-slate-500 [animation-delay:200ms]">
              Vous créez les comptes de vos clients, vous leur envoyez leurs accès, vous créditez leurs soldes et vous générez leurs codes de retrait.
            </p>
            <div className="animate-fade-up mt-8 flex flex-col gap-3 [animation-delay:300ms] sm:flex-row">
              <Link href="/signup" className="btn btn-primary !px-7 !py-3 text-base">Devenir admin</Link>
              <a href="#tarifs" className="btn btn-ghost !px-7 !py-3 text-base">Voir les packs</a>
            </div>
            <p className="animate-fade-up mt-6 text-sm text-slate-500 [animation-delay:400ms]">
              Déjà admin ? <Link href="/login" className="font-medium text-brand hover:underline">Connectez-vous</Link>.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-brand/10" />
            <Image
              src="/images/partners.jpg" alt="Deux partenaires en discussion" width={640} height={520} priority
              className="relative h-[420px] w-full rounded-[2rem] object-cover shadow-[0_24px_60px_rgba(18,22,58,0.18)] sm:h-[480px]"
            />
            <div className="animate-float absolute -bottom-8 -left-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_44px_rgba(18,22,58,0.14)] sm:-left-8">
              <p className="text-xs font-semibold text-brand">Message d&apos;accès (exemple)</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Bonjour Moussa, votre compte CoinPulse est prêt.<br />
                E-mail : moussa@exemple.com<br />
                Mot de passe : ••••••••<br />
                Connexion : lien de la plateforme
              </p>
              <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-up">Envoyer par WhatsApp</span>
            </div>
          </div>
        </div>
      </header>

      <section id="outils" className="scroll-mt-24 bg-surface px-4 py-20">
        <div className="mx-auto max-w-[1160px]">
          <h2 className="text-center text-3xl font-semibold sm:text-4xl">Tout ce qu&apos;il faut pour <span className="text-brand">gérer vos clients</span></h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t) => (
              <div key={t.title} className="card p-6">
                <IconBadge>{t.icon}</IconBadge>
                <h3 className="mt-4 font-semibold">{t.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="etapes" className="mx-auto max-w-[1160px] scroll-mt-24 px-4 py-20">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">Du pack à vos clients, <span className="text-brand">en 4 étapes</span></h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_36px_rgba(18,22,58,0.06)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-semibold text-white">{s.n}</span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="tarifs" className="scroll-mt-24 bg-surface px-4 py-20">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">Choisissez <span className="text-brand">votre pack</span></h2>
        <p className="mx-auto mb-14 mt-3 max-w-xl text-center text-slate-500">
          Activation immédiate. Aucun montant n&apos;est réellement débité.
        </p>
        <PricingCards />
      </section>

      <section className="px-4 py-20">
        <div className="relative mx-auto grid max-w-[1160px] items-center gap-8 overflow-hidden rounded-3xl bg-brand p-8 text-white shadow-[0_24px_60px_rgba(53,99,233,0.3)] sm:p-12 md:grid-cols-[1.4fr_1fr]">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10" />
          <div className="relative">
            <h2 className="text-3xl font-semibold">Ouvrez votre espace admin</h2>
            <p className="mt-3 max-w-md text-white/80">Choisissez un pack, créez votre compte et accueillez vos premiers clients dans la foulée.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="btn bg-white !text-brand hover:bg-slate-100">Devenir admin</Link>
              <Link href="/login" className="btn border border-white/50 text-white hover:bg-white/10">Me connecter</Link>
            </div>
          </div>
          <Image src="/images/man-smile.jpg" alt="" width={420} height={280} className="relative hidden h-52 w-full rounded-2xl object-cover object-top ring-4 ring-white/20 md:block" />
        </div>
      </section>

      <SiteFooter audience="admin" />
    </div>
  );
}
