# Setup Supabase (multi-utilisateurs)

Tant que les variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` ne sont pas renseignées, l'app reste en mode **LocalStorage mono-utilisateur** (comportement existant, tes données restent intactes).

## 1. Créer le projet

1. Va sur <https://supabase.com/dashboard> → **New project**.
2. Récupère dans **Project Settings → API** :
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`

## 2. Créer les tables + RLS

Ouvre **SQL Editor**, colle le contenu de [`schema.sql`](./schema.sql), clique **Run**. Idempotent : tu peux le relancer.

## 3. Activer l'auth Magic Link

**Authentication → Providers → Email** → assure-toi que *Enable Email provider* est coché (coché par défaut). Le Magic Link marche out-of-the-box.

Dans **Authentication → URL Configuration**, ajoute ton URL d'app (localhost pour dev, l'URL GitHub Pages pour prod) dans *Redirect URLs*.

## 4. Configurer l'app

Dans `.env` :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Redémarre `npm run dev`. Un écran de connexion apparaît. Saisis ton email, clique sur le lien reçu → tu arrives connecté.

## 5. Importer tes données LocalStorage existantes

À la première connexion, l'écran propose un bouton **« Importer mes données locales vers mon compte »**. Il lit ton LocalStorage actuel et le pousse vers Supabase. Il ne touche pas au LocalStorage après coup (double sécurité).

## 6. Déploiement GitHub Actions

Ajoute les 2 secrets `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans Settings → Secrets → Actions, et injecte-les dans le step `npm run build` (voir `DEPLOY_SECRET.md`).
