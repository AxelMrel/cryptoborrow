import { pair } from "./_pair";

export const adminLanding = pair(
  {
    meta: {
      title: "Espace admin | CoinPulse",
      description: "Créez vos clients, créditez leurs comptes, envoyez-leur leurs accès et générez leurs codes de retrait.",
    },
    pill: "Espace admin",
    heroTitle: "Développez votre activité, ",
    heroTitleHl: "client après client",
    heroText: "Vous créez les comptes de vos clients, vous leur envoyez leurs accès, vous créditez leurs soldes et vous générez leurs codes de retrait.",
    becomeAdmin: "Devenir admin",
    seePacks: "Voir les packs",
    alreadyAdmin: "Déjà admin ?",
    signInLink: "Connectez-vous",
    heroAlt: "Deux partenaires en discussion",
    sample: {
      title: "Message d'accès (exemple)",
      hello: "Bonjour Moussa, votre compte CoinPulse est prêt.",
      email: "E-mail : moussa@exemple.com",
      password: "Mot de passe : ••••••••",
      link: "Connexion : lien de la plateforme",
      whatsapp: "Envoyer par WhatsApp",
    },
    tools: {
      title: "Tout ce qu'il faut pour ",
      titleHl: "gérer vos clients",
      items: [
        { title: "Créez vos clients", text: "Ajoutez un client en quelques secondes, dans la limite du quota de votre pack." },
        { title: "Envoyez-leur leurs accès", text: "Après la création, copiez les coordonnées ou envoyez-les par WhatsApp ou e-mail en un clic." },
        { title: "Créditez leurs comptes", text: "Alimentez le solde de vos clients et gardez la trace de chaque opération." },
        { title: "Générez les codes de retrait", text: "Chaque code coûte des crédits. Il est à usage unique, lié à un client et limité dans le temps." },
        { title: "Pilotez avec des graphes", text: "Flux des 14 derniers jours, soldes par client, répartition des opérations." },
      ],
    },
    steps: {
      title: "Du pack à vos clients, ",
      titleHl: "en 4 étapes",
      items: [
        { title: "Choisissez un pack", text: "Vos crédits et votre quota de clients sont activés immédiatement." },
        { title: "Créez vos clients", text: "Vous saisissez leur nom, leur e-mail et un mot de passe." },
        { title: "Envoyez leurs coordonnées", text: "Un message prêt à l'emploi : un clic pour WhatsApp, e-mail ou copie." },
        { title: "Accompagnez-les", text: "Créditez leurs comptes et générez leurs codes de retrait quand ils en ont besoin." },
      ],
    },
    packs: {
      title: "Choisissez ",
      titleHl: "votre pack",
      subtitle: "Activation immédiate de vos crédits et de votre quota de clients.",
    },
    cta: {
      title: "Ouvrez votre espace admin",
      text: "Choisissez un pack, créez votre compte et accueillez vos premiers clients dans la foulée.",
      becomeAdmin: "Devenir admin",
      signIn: "Me connecter",
    },
  },
  {
    meta: {
      title: "Admin area | CoinPulse",
      description: "Create your clients, credit their accounts, send them their credentials and generate their withdrawal codes.",
    },
    pill: "Admin area",
    heroTitle: "Grow your business, ",
    heroTitleHl: "one client at a time",
    heroText: "You create your clients' accounts, send them their credentials, credit their balances and generate their withdrawal codes.",
    becomeAdmin: "Become an admin",
    seePacks: "See the plans",
    alreadyAdmin: "Already an admin?",
    signInLink: "Sign in",
    heroAlt: "Two partners talking",
    sample: {
      title: "Access message (example)",
      hello: "Hello Moussa, your CoinPulse account is ready.",
      email: "E-mail: moussa@example.com",
      password: "Password: ••••••••",
      link: "Sign in: platform link",
      whatsapp: "Send via WhatsApp",
    },
    tools: {
      title: "Everything you need to ",
      titleHl: "manage your clients",
      items: [
        { title: "Create your clients", text: "Add a client in seconds, within the quota of your plan." },
        { title: "Send them their credentials", text: "After creation, copy the details or send them by WhatsApp or e-mail in one click." },
        { title: "Credit their accounts", text: "Top up your clients' balances and keep a trace of every operation." },
        { title: "Generate withdrawal codes", text: "Each code costs credits. It can be used once, is tied to one client and expires after a while." },
        { title: "Steer with charts", text: "Flows over the last 14 days, balances per client, breakdown of operations." },
      ],
    },
    steps: {
      title: "From plan to clients, ",
      titleHl: "in 4 steps",
      items: [
        { title: "Choose a plan", text: "Your credits and client quota are activated immediately." },
        { title: "Create your clients", text: "You enter their name, e-mail and a password." },
        { title: "Send their credentials", text: "A ready-made message: one click for WhatsApp, e-mail or copy." },
        { title: "Support them", text: "Credit their accounts and generate their withdrawal codes when they need them." },
      ],
    },
    packs: {
      title: "Choose ",
      titleHl: "your plan",
      subtitle: "Your credits and client quota are activated immediately.",
    },
    cta: {
      title: "Open your admin account",
      text: "Choose a plan, create your account and welcome your first clients right away.",
      becomeAdmin: "Become an admin",
      signIn: "Sign in",
    },
  },
);
