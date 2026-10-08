# CryptoBO — Simulateur d'échange / portefeuille crypto (FCFA)

> **Projet pédagogique : tout est simulé.** Aucun vrai paiement, aucun vrai retrait.

Stack : **Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase (Auth + PostgreSQL + RLS)**, déployé sur **Vercel**.
Aucune API séparée : toute la logique serveur est dans des **Server Actions** et des **fonctions SQL (RPC)**.

---

## 1. Démarrage local

```bash
npm install
cp .env.example .env.local        # puis renseigner les 3 clés Supabase
```

1. Créer un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor** → coller et exécuter [`supabase/schema.sql`](supabase/schema.sql) (tables, RLS, fonctions RPC, tarifs).
3. Renseigner `.env.local` (Project Settings → API) ; définir aussi `SEED_SUPER_ADMIN_*`.
4. Créer le super admin de départ : `npm run seed:super-admin`
5. `npm run dev` → <http://localhost:3000> → *Connexion*.

Parcours de démonstration : un futur admin choisit un pack sur la landing (`/signup`, paiement simulé) et reçoit ses crédits + son quota automatiquement → l'admin crée un client et le crédite → le client fait un dépôt → l'admin génère un code (5 000 crédits) → le client retire avec ce code.

## 2. Architecture

```
proxy.ts                     Protège /dashboard/* et /login (Next 16 : "middleware" = "proxy")
app/
  page.tsx                   Landing CLIENT (accueil) : aucun lien vers l'espace admin
  admin/page.tsx             Landing ADMIN, adresse communiquée aux admins (outils, packs, inscription)
  signup/page.tsx            Inscription d'un admin par achat (simulé) d'un pack
  login/page.tsx             Connexion email + mot de passe
  dashboard/
    layout.tsx               En-tête + <Suspense> (Cache Components)
    page.tsx                 Redirection selon le rôle
    client/ admin/ super-admin/page.tsx
lib/
  supabase/server.ts         Client lié à la session (clé anon, soumis à la RLS)
  supabase/admin.ts          Client service_role  — `server-only`
  dal.ts                     Data Access Layer : getCurrentProfile / requireRole / HOME
  rpc.ts                     callRpc (appel des fonctions SQL), guard(role), messages d'erreur
  actions/                   Server Actions : auth, client, admin, super-admin
  market.ts                  Hooks cours (Binance WS) et taux (Frankfurter)
components/
  charts/                    Lightweight Charts (bougies crypto, courbe devises), ticker
  dashboard/                 Formulaires (useActionState), tableaux, cartes
supabase/schema.sql          Schéma complet + RLS + RPC
scripts/seed-super-admin.mjs Création du super admin
```

### Flux d'une opération (exemple : génération d'un code de retrait)

```
Navigateur ──form──▶ Server Action generateWithdrawalCode
                       1. guard("admin")        rôle vérifié côté serveur (session Supabase)
                       2. validation des entrées (uuid, montant)
                       3. code aléatoire crypto (node:crypto randomInt, 8 car.)
                       4. rpc_generate_withdrawal_code  (clé service_role)
                              └─ SQL atomique : verrou admin FOR UPDATE, client ∈ ses clients ?,
                                 crédits ≥ frais (table settings) ?, débit, transaction admin_fee, insert code
```

## 3. Sécurité (points à défendre à l'oral)

| Risque | Parade |
|---|---|
| Lire les données d'un autre | **RLS sur les 4 tables** : super admin = tout ; admin = soi + `created_by = auth.uid()` ; client = soi. Les lectures des dashboards passent par la RLS. |
| Modifier un solde depuis le navigateur | **Aucune policy d'écriture** et `REVOKE` des droits d'écriture : tout changement passe par les fonctions `rpc_*`, exécutables **uniquement par `service_role`**. |
| Fuite de la clé service_role | Jamais préfixée `NEXT_PUBLIC_`, lue seulement dans `lib/supabase/admin.ts` (`import "server-only"` → le build échoue si un composant client l'importe). |
| Contournement par l'UI | Chaque Server Action revérifie le rôle (`guard`) ; les RPC revérifient aussi le rôle en SQL (défense en profondeur) ; le proxy n'est qu'un contrôle optimiste. |
| Double clic / requêtes concurrentes | Boutons désactivés (`useFormStatus`) **et** verrous `SELECT … FOR UPDATE` dans les RPC ; `CHECK (balance >= 0)` empêche tout solde négatif. |
| Code de retrait volé / rejoué | Aléatoire cryptographique, lié à **un client**, **usage unique**, **expiration** (réglable), validé et consommé **dans la même transaction SQL** que le débit. Le client **n'a pas le droit de lire** la table des codes (sinon il se servirait seul). |
| Dépassement de quota | `rpc_create_client` verrouille la ligne de l'admin puis compte les clients : pas de course entre deux créations simultanées. Si la RPC échoue, l'utilisateur Auth créé est supprimé. |
| Création de comptes | Pas d'inscription publique de clients ; l'inscription admin passe par un pack et une Server Action. `auth.admin.createUser` appelé côté serveur uniquement. |

## 4. Règles métier (choix de conception à connaître)

- **Les admins s'inscrivent eux-mêmes** depuis les cartes de pricing de la landing : choix d'un pack → compte créé, crédits et quota attribués, connexion automatique. Les packs sont définis dans `lib/plans.ts`. Le **super admin ne crée plus d'admins** ; il ajuste crédits/quotas, tarifs et supervise. Le paiement est simulé : n'importe qui peut donc s'offrir des crédits (acceptable pour un simulateur ; un vrai produit brancherait un PSP et ajouterait un anti-abus).
- **L'admin crée ses clients et leur transmet leurs accès** : après création, il obtient un message prêt à envoyer (e-mail, mot de passe, lien de connexion) avec les boutons Copier, WhatsApp et E-mail. Le mot de passe n'est affiché qu'une fois. Aucun e-mail n'est envoyé automatiquement par le serveur (pas de fournisseur d'envoi configuré).
- **Admin sans crédits (`credits = 0`) → espace verrouillé** (il ne peut ni créer de client, ni créditer, ni générer de code).
- **Créditer un client ne consomme pas les crédits de l'admin** ; seuls les **codes de retrait** coûtent des crédits (5 000 par défaut, modifiable par le super admin dans `settings`). Le sujet ne précisait pas ce point — c'est un paramétrage simple à changer dans `rpc_admin_credit_client`.
- Un code peut avoir un **montant optionnel** : s'il est défini, le retrait doit être exactement de ce montant.
- Solde insuffisant au retrait ⇒ refus **sans consommer** le code.
- Le quota ne peut pas être fixé en dessous du nombre de clients déjà créés.

## 5. Données de marché temps réel

| Donnée | Source | Appel |
|---|---|---|
| Cryptos (ticker + bougies 1 min) | **WebSocket public Binance** (`stream.binance.com`) + REST `klines` | Direct depuis le navigateur, sans clé |
| Devises | **Frankfurter** (taux BCE) | Direct depuis le navigateur, rafraîchi toutes les 5 min |
| FCFA | Parité fixe **1 EUR = 655,957 XOF** | Le XOF n'est pas publié par la BCE ; on le déduit de la parité officielle |

Aucune API personnalisée n'a été créée. Les taux BCE sont **quotidiens** (pas de tick à la seconde) ; seules les cryptos sont réellement « live ».
Si Binance est bloqué sur votre réseau (certains pays/entreprises), les graphes crypto affichent un message d'erreur.

## 6. Déploiement sur Vercel

1. Pousser le dépôt sur GitHub.
2. [vercel.com/new](https://vercel.com/new) → importer le dépôt (framework Next.js détecté).
3. **Settings → Environment Variables** (Production **et** Preview) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ← secret, sans `NEXT_PUBLIC_`
4. Déployer. Le super admin se crée une fois depuis votre poste (`npm run seed:super-admin` avec `.env.local` pointant sur le même projet Supabase) — les variables `SEED_*` ne sont **pas** nécessaires sur Vercel.
5. Supabase → *Authentication → URL Configuration* : ajouter l'URL Vercel dans *Site URL* (non indispensable ici car pas d'e-mail de confirmation, mais propre).

## 7. Tarifs modifiables (table `settings`)

| Clé | Défaut | Rôle |
|---|---|---|
| `withdrawal_code_fee` | 5000 | Crédits débités à l'admin par code |
| `withdrawal_code_ttl_minutes` | 60 | Durée de validité d'un code |
| `max_operation_amount` | 10 000 000 | Garde-fou par opération |

Modifiables depuis le dashboard super admin.

## 8. Limites connues (honnêteté pour la soutenance)

- Pas de limitation du nombre de tentatives de code (un code de 8 caractères parmi 32 ⁸ ≈ 10¹² reste hors de portée d'une devinette, mais un vrai produit ajouterait un rate limit).
- Les mots de passe initiaux sont choisis par le créateur du compte ; pas de flux « mot de passe oublié ».
- Les listes sont limitées (50 à 200 lignes) sans pagination.
