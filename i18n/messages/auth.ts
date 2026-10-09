import { pair } from "./_pair";

export const auth = pair(
  {
    login: {
      meta: "Connexion | CoinPulse",
      title: "Bon retour parmi nous",
      subtitle: "Connectez-vous avec l'e-mail et le mot de passe que votre admin vous a envoyés.",
      quote: "Suivez vos marchés et gérez votre portefeuille, simplement.",
      email: "Email",
      emailPlaceholder: "vous@exemple.com",
      password: "Mot de passe",
      submit: "Se connecter",
    },
    signup: {
      meta: "Devenir admin | CoinPulse",
      title: "Ouvrez votre espace admin",
      subtitle: "L'inscription est gratuite. Vous ne payez que lorsque vous créez un client ou générez un code de retrait.",
      quote: "Accompagnez vos clients et développez votre activité.",
      haveAccount: "Déjà un compte ?",
      signIn: "Se connecter",
      fullName: "Nom complet",
      email: "Email",
      password: "Mot de passe (8 caractères minimum)",
      create: "Créer mon compte gratuit",
    },
    home: "Accueil",
  },
  {
    login: {
      meta: "Sign in | CoinPulse",
      title: "Welcome back",
      subtitle: "Sign in with the e-mail and password your admin sent you.",
      quote: "Follow your markets and manage your wallet, simply.",
      email: "E-mail",
      emailPlaceholder: "you@example.com",
      password: "Password",
      submit: "Sign in",
    },
    signup: {
      meta: "Become an admin | CoinPulse",
      title: "Open your admin account",
      subtitle: "Sign-up is free. You only pay when you create a client or generate a withdrawal code.",
      quote: "Support your clients and grow your business.",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
      fullName: "Full name",
      email: "E-mail",
      password: "Password (8 characters minimum)",
      create: "Create my free account",
    },
    home: "Home",
  },
);
