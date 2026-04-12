# Activer la synchronisation cloud (Supabase)

Par défaut l'app stocke tout dans le LocalStorage du navigateur : chaque
appareil a ses propres données. Pour synchroniser téléphone ↔ PC en temps
réel, branche Supabase (100% gratuit pour un usage perso).

## 1. Créer le projet Supabase (3 min)

1. Va sur https://supabase.com, crée un compte, puis **New project**.
2. Choisis un nom (ex: `gym-tracker`), un mot de passe DB fort, la région
   la plus proche. Le plan **Free** suffit largement (500 MB, pause après
   7 jours sans accès — il se relance tout seul au clic suivant).
3. Attends ~1 min que le projet soit provisionné.

## 2. Créer les tables

1. Dans le dashboard → **SQL Editor** → **New query**.
2. Colle le contenu de `db/schema.sql` depuis ce repo.
3. Clique **Run**. Deux tables créées : `sessions` et `body_weights`, avec
   Row Level Security activée (chaque utilisateur ne voit que ses propres
   données).

## 3. Activer l'authentification

L'auth est nécessaire pour que la RLS sache qui tu es. Option la plus
simple : **magic link par email**.

1. Dashboard → **Authentication** → **Providers** → **Email**.
2. Laisse activé "Enable email signup" et "Enable magic link".
3. Rien d'autre à configurer.

## 4. Récupérer les clés

1. Dashboard → **Project Settings** → **API**.
2. Copie **Project URL** et **anon public key**.
3. À la racine du repo, copie `.env.example` en `.env.local` :
   ```bash
   cp .env.example .env.local
   ```
4. Remplis les deux variables dans `.env.local`.

## 5. Utilisation

- `npm run dev` → connexion locale, données synchronisées dans Supabase.
- Sur le site déployé (GitHub Pages), les clés sont exposées dans le
  bundle JavaScript, mais la RLS empêche quiconque d'accéder à tes
  données sans le lien magic envoyé sur ton email.

## Comment ça marche techniquement

- `src/lib/supabase.ts` : crée le client Supabase si les variables
  d'environnement sont présentes, sinon renvoie `null`.
- `src/lib/adapters/supabaseAdapter.ts` : implémente l'interface
  `StorageAdapter` en lisant/écrivant dans Postgres via PostgREST.
- Le reste du code ne change pas — c'est l'intérêt d'avoir défini
  `StorageAdapter` dès le départ.
