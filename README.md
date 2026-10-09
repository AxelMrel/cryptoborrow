# CoinPulse : plateforme d'échange / portefeuille crypto (euros)

> **Projet pédagogique.** Aucun vrai paiement, aucun vrai retrait.

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
   puis [`supabase/002_profile_payment.sql`](supabase/002_profile_payment.sql) (téléphone du profil et moyens de paiement du client)
   puis [`supabase/003_payments.sql`](supabase/003_payments.sql) (table `payments`, étape intermédiaire)
   puis [`supabase/004_pay_per_use.sql`](supabase/004_pay_per_use.sql) (tarification à l'usage : clients en attente, paiements par opération, code généré en base).
3. Renseigner `.env.local` (Project Settings → API) ; définir aussi `SEED_SUPER_ADMIN_*`.
4. Créer le super admin de départ : `npm run seed:super-admin`
5. `npm run dev` → <http://localhost:3000> → *Connexion*.

Parcours de démonstration : un admin s'inscrit gratuitement (`/admin` puis `/signup`) → il crée un client et paie 5 000 FCFA via FedaPay (le client est activé à la confirmation) → il le crédite (gratuit) → il paie 1 000 FCFA pour générer un code de retrait → le client retire avec ce code. Le client qui veut déposer est invité, par une fenêtre modale, à contacter son admin.

## 2. Architecture

```
proxy.ts                     Langue (redirige / vers /fr ou /en) + protection de /dashboard/* (Next 16 : "middleware" = "proxy")
i18n/                        Internationalisation FR / EN : config, formatage (euros, dates), dictionnaires par thème (messages/)
app/[lang]/                  Toutes les routes sont préfixées par la langue : /fr/... et /en/...
  page.tsx                   Landing CLIENT (accueil) : aucun lien vers l'espace admin
  admin/page.tsx             Landing ADMIN, adresse communiquée aux admins (outils, tarifs, inscription gratuite)
  dashboard/client/profile/          Profil du client (nom, téléphone, mot de passe)
  dashboard/client/payment-methods/  Moyens de paiement du client (4 derniers chiffres uniquement)
  signup/page.tsx            Inscription gratuite d'un admin
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

### Flux d'une opération (exemple : un admin crédite un client)

```
Navigateur ──form──▶ Server Action creditClient
                       1. guard("admin")        rôle vérifié côté serveur (session Supabase)
                       2. validation des entrées (uuid, montant)
                       3. rpc_admin_credit_client  (clé service_role)
                              └─ SQL atomique : le client appartient-il à cet admin ET est-il actif ?
                                 crédit du solde + ligne dans transactions, dans la même transaction SQL
```

### Paiements à l'usage avec FedaPay (sandbox)

Il n'y a **ni pack, ni abonnement, ni crédits** : l'inscription d'un admin est **gratuite**, puis il paie via **FedaPay** (agrégateur : mobile money et cartes en Afrique de l'Ouest) :

| Opération | Tarif (modifiable par le super admin) | Effet après paiement confirmé |
|---|---|---|
| Créer un client | 5 000 FCFA | le client passe de `pending` à `active` et peut se connecter |
| Générer un code de retrait | 1 000 FCFA | la base génère le code (aléatoire, usage unique, expirant) |

```
Admin ─ remplit le formulaire ─▶ Server Action
          1. crée le client en statut "pending" (ou ouvre l'achat d'un code)
          2. rpc_create_fee_payment : la BASE fixe le montant (table settings)
          3. POST /v1/transactions + /token (FedaPay, clé secrète, XOF)
          4. redirect ─▶ page de paiement hébergée par FedaPay
FedaPay ─ callback_url?id=..&status=.. ─▶ /dashboard/admin/payment/return
          5. relit GET /v1/transactions/{id} chez FedaPay  (on ignore ?status=)
          6. rpc_settle_payment : active le client / génère le code, UNE seule fois
FedaPay ─ webhook signé ─▶ /api/webhooks/fedapay   (même règlement, en tâche de fond)
```

**Points de sécurité à défendre**
- Rien n'est créé à cause d'une redirection : un client reste `pending` (connexion refusée, ni crédit ni retrait possible) et un code n'existe pas tant que **la transaction n'a pas été relue chez FedaPay** avec la clé secrète.
- **Le montant est décidé par la base**, pas par le navigateur ni par le serveur web. Le règlement compare le montant déclaré par FedaPay à celui demandé (`AMOUNT_MISMATCH` sinon).
- Règlement **atomique et idempotent** (`SELECT … FOR UPDATE`) : retour navigateur et webhook peuvent arriver ensemble ou être rejoués sans effet double (un seul code, un seul passage à `active`).
- Le mot de passe d'un client n'est **jamais stocké en clair** : il n'existe que dans le navigateur de l'admin (sessionStorage) le temps du paiement, puis haché par Supabase Auth.
- Webhook : signature `X-FEDAPAY-SIGNATURE` (HMAC-SHA256 de `horodatage.corps`, tolérance 5 min, comparaison à temps constant).
- `FEDAPAY_SECRET_KEY` et `FEDAPAY_WEBHOOK_SECRET` ne sont lues que côté serveur.

**Devise** : FedaPay ne facture qu'en francs CFA (XOF). Les frais sont donc affichés et facturés en FCFA ; les soldes des clients restent en euros.

**Configuration (sandbox)**
1. Compte sur [sandbox.fedapay.com](https://sandbox.fedapay.com), clé secrète (Paramètres, Clés API).
2. Dans `.env` : `FEDAPAY_ENV=sandbox`, `FEDAPAY_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.
3. Webhook (utile une fois déployé) : endpoint `https://<votre-domaine>/api/webhooks/fedapay` (événements `transaction.*`), puis son secret dans `FEDAPAY_WEBHOOK_SECRET`. En local, la page de retour règle le paiement elle-même.
4. Production : `FEDAPAY_ENV=live` avec la clé secrète live.

### Langues (français et anglais)

- Chaque URL commence par la langue (`/fr/login`, `/en/login`). Une visite sans préfixe est redirigée selon la langue du navigateur (français par défaut), puis la langue choisie est mémorisée dans un cookie.
- Le sélecteur **FR / EN** est dans la navigation et dans l'en-tête des dashboards ; il conserve la page, les paramètres et l'ancre.
- Les textes vivent dans `i18n/messages/*.ts` : chaque fichier contient le français et l'anglais côte à côte, et TypeScript refuse un build où une clé manque dans une langue. Les messages des Server Actions (erreurs, confirmations) sont traduits dans la langue de la page via le cookie.
- Montants, dates et nombres suivent la langue (`10 000 €` en français, `€10,000` en anglais).
- Pour ajouter une langue : ajouter son code dans `i18n/config.ts` puis ses textes dans chaque fichier de `i18n/messages/`.

## 3. Sécurité (points à défendre à l'oral)

| Risque | Parade |
|---|---|
| Lire les données d'un autre | **RLS sur les 4 tables** : super admin = tout ; admin = soi + `created_by = auth.uid()` ; client = soi. Les lectures des dashboards passent par la RLS. |
| Modifier un solde depuis le navigateur | **Aucune policy d'écriture** et `REVOKE` des droits d'écriture : tout changement passe par les fonctions `rpc_*`, exécutables **uniquement par `service_role`**. |
| Fuite de la clé service_role | Jamais préfixée `NEXT_PUBLIC_`, lue seulement dans `lib/supabase/admin.ts` (`import "server-only"` → le build échoue si un composant client l'importe). |
| Contournement par l'UI | Chaque Server Action revérifie le rôle (`guard`) ; les RPC revérifient aussi le rôle en SQL (défense en profondeur) ; le proxy n'est qu'un contrôle optimiste. |
| Double clic / requêtes concurrentes | Boutons désactivés (`useFormStatus`) **et** verrous `SELECT … FOR UPDATE` dans les RPC ; `CHECK (balance >= 0)` empêche tout solde négatif. |
| Code de retrait volé / rejoué | Aléatoire cryptographique, lié à **un client**, **usage unique**, **expiration** (réglable), validé et consommé **dans la même transaction SQL** que le débit. Le client **n'a pas le droit de lire** la table des codes (sinon il se servirait seul). |
| Création de comptes | Pas d'inscription publique de clients ; l'inscription admin (gratuite) passe par une Server Action. `auth.admin.createUser` appelé côté serveur uniquement. |

## 4. Règles métier (choix de conception à connaître)

- **L'inscription d'un admin est gratuite et immédiate.** Il ne paie que pour **créer un client** (5 000 FCFA) et **générer un code de retrait** (1 000 FCFA). Créditer un client est gratuit.
- **L'admin crée ses clients et leur transmet leurs accès** : après le paiement, il obtient un message prêt à envoyer (e-mail, mot de passe, lien) avec Copier, WhatsApp et E-mail. Le mot de passe n'est affiché qu'une fois.
- Un code peut avoir un **montant optionnel** : s'il est défini, le retrait doit être exactement de ce montant.
- Solde insuffisant au retrait ⇒ refus **sans consommer** le code.

## 5. Données de marché temps réel

| Donnée | Source | Appel |
|---|---|---|
| Cryptos (ticker + bougies 1 min) | **WebSocket public Binance** (`stream.binance.com`) + REST `klines` | Direct depuis le navigateur, sans clé |
| Devises | **Frankfurter** (taux BCE) | Direct depuis le navigateur, rafraîchi toutes les 5 min |
| Euros | Taux Frankfurter (BCE) | Équivalent en euros des cryptos cotées en dollars |

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
| `client_creation_fee_xof` | 5000 | Frais (FCFA) payés par l'admin pour créer un client |
| `withdrawal_code_fee_xof` | 1000 | Frais (FCFA) payés par l'admin pour générer un code |
| `withdrawal_code_ttl_minutes` | 60 | Durée de validité d'un code |
| `max_operation_amount` | 10 000 000 | Garde-fou par opération |

Modifiables depuis le dashboard super admin.

## 8. Limites connues (honnêteté pour la soutenance)

- Pas de limitation du nombre de tentatives de code (un code de 8 caractères parmi 32 ⁸ ≈ 10¹² reste hors de portée d'une devinette, mais un vrai produit ajouterait un rate limit).
- Les mots de passe initiaux sont choisis par le créateur du compte ; pas de flux « mot de passe oublié ».
- Les listes sont limitées (50 à 200 lignes) sans pagination.
