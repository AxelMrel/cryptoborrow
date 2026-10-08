import AuthShell from "@/components/AuthShell";
import { ActionForm, SubmitButton } from "@/components/dashboard/forms";
import { signIn } from "@/lib/actions/auth";

export const metadata = { title: "Connexion | CryptoBO" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Bon retour parmi nous"
      subtitle="Connectez-vous avec l'e-mail et le mot de passe que votre admin vous a envoyés."
      photo="/images/woman-portrait.jpg"
      quote="Suivez vos marchés et gérez votre portefeuille, simplement."
    >
      <ActionForm action={signIn} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="vous@exemple.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Mot de passe</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
        </div>
        <SubmitButton className="btn btn-primary w-full !py-3">Se connecter</SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
