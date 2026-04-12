# Personal Gym Tracker

> WebApp personnelle pour suivre mes séances de musculation, ma progression
> et mes records — sans friction, sur desktop comme sur mobile.

Application développée par **Gabriel Orsatti**.

- Saisie en **langage naturel** (« 4x10 squat 100kg »)
- Dashboard, historique, progression, programme
- **Records personnels** éditables manuellement
- **PWA installable** sur téléphone (offline)
- **Dark mode** par défaut, design épuré
- Données stockées **localement** (LocalStorage), prêt pour une migration
  vers Supabase / Postgres

---

## Démarrage rapide

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitaires (Vitest)
npm run typecheck  # vérification des types
npm run build      # build de production
```

Aucune configuration n'est requise : l'application démarre avec un jeu
de données de démo (seed) qui peut être effacé à tout moment via le
bouton de réinitialisation dans les backups.

---

## Stack technique

| Domaine       | Choix                                           |
| ------------- | ----------------------------------------------- |
| Build         | Vite 6                                          |
| UI            | React 18 + TypeScript strict                    |
| Style         | Tailwind CSS 3 (thème dark custom)              |
| Graphiques    | Recharts                                        |
| Icônes        | Lucide-react                                    |
| Dates         | date-fns (locale `fr`)                          |
| Tests         | Vitest                                          |
| PWA           | vite-plugin-pwa (Workbox, offline, manifest)    |
| Persistence   | LocalStorage (interface `StorageAdapter`)       |
| Sync (option) | Supabase (scaffold prêt, non câblé par défaut)  |
| Déploiement   | GitHub Pages via GitHub Actions                 |

---

## Fonctionnalités

### Saisie en langage naturel

Le parseur reconnaît les formes françaises les plus courantes — séries,
reps, charges, virgule décimale, mots-clés de liaison :

```
3 séries de 12 rep de DC à 80kg
4x10 squat 100kg
développé couché 3x12 @ 80
curl 3*10 à 12,5
SDT 5x5 120kg puis tractions 3x10
```

Le catalogue (`src/lib/exercises.ts`) couvre ~25 mouvements avec alias
(DC, SDT, OHP, dips, élévations latérales, etc.).

### Dashboard

- 4 KPI : volume total, volume 30 jours, poids de corps, score moyen
- Volume dans le temps (courbe)
- Volume par catégorie : Poussée, Tirage, Jambes, Épaules, Bras…
- Poids de corps avec ajout rapide
- Calendrier mensuel avec pastilles sur les jours d'entraînement

### Historique

Liste chronologique des séances, édition en un clic (le texte brut est
reconstruit et renvoyé dans le champ de saisie), suppression.

### Progression

- Courbe par mouvement : charge max et **1RM estimé (Epley)** au fil du temps
- **Records personnels** : charge max, 1RM, date, nombre de séances
  - Édition manuelle (bouton crayon) pour corriger une valeur ou ajouter
    un contexte (`notes`)
  - Ajout d'un PR **sans séance associée** (utile pour les vieux records
    ou des mouvements jamais saisis)
  - Les PR manuels sont étiquetés « manuel » et fusionnent avec les
    valeurs calculées (les champs non renseignés restent calculés)

### Programme

Mes routines PUSH / PULL / MIXTE avec objectifs et coaching cues. Un
clic pré-remplit le champ de saisie du dashboard.

### Backup

Export / import JSON versionné (séances + poids de corps) pour
sauvegarder ou migrer les données.

---

## Installation sur mobile (PWA)

1. Ouvre le site dans Chrome (Android) ou Safari (iOS).
2. Menu → « Ajouter à l'écran d'accueil ».
3. L'app fonctionne ensuite offline et s'ouvre comme une appli native.

---

## Déploiement

Push sur `main` déclenche le workflow `.github/workflows/deploy.yml` :

1. Install + typecheck + tests + build
2. Upload artefact `dist/`
3. Deploy sur GitHub Pages (environnement `github-pages`)

Le `base` Vite est automatiquement ajusté quand `GITHUB_ACTIONS=true`
(voir `vite.config.ts`).

---

## Structure du code

```
src/
├── types/            # Session, ExerciseEntry, SetEntry, PersonalRecordOverride…
├── lib/              # Domaine métier (pur TS, testé)
│   ├── exercises.ts      # Catalogue + alias
│   ├── parser.ts         # NLP
│   ├── scoring.ts        # Volume, 1RM (Epley), score
│   ├── records.ts        # Agrégation PR + overrides manuels
│   ├── storage.ts        # StorageAdapter (LocalStorage aujourd'hui)
│   ├── seeding.ts        # Seed initial au premier lancement
│   ├── backup.ts         # Export/import JSON
│   ├── toNlp.ts          # Re-sérialise une séance en texte éditable
│   └── adapters/         # Adapters interchangeables (Supabase en option)
├── hooks/            # useSessions, useBodyWeight, useRecordOverrides
├── components/       # Dashboard, charts, historique, progression, input NLP, éditeur PR…
├── data/             # Seed + programmes
├── App.tsx
└── main.tsx
```

---

## Schéma d'une séance

```ts
{
  id: string,
  date: "2026-04-12",
  exercices: [
    {
      nom: "Développé couché",
      categorie: "Poussée",
      sets: [{ reps: 12, poids: 80 }]
    }
  ],
  notes?: string,
  bodyWeight?: number
}
```

---

## Migration vers une base distante

`src/lib/storage.ts` expose une interface `StorageAdapter`. Un adapter
Supabase (`src/lib/adapters/supabaseAdapter.ts`) est déjà scaffoldé,
avec le schéma SQL dans `db/schema.sql` (RLS par `user_id`).

Pour activer Supabase :

1. Crée un projet Supabase, applique `db/schema.sql`.
2. Renseigne `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (en local
   via `.env.local`, en production via les secrets GitHub).
3. Remplace l'adapter utilisé dans `storage.ts`.

Aucun autre code n'a besoin de changer : les hooks et composants sont
agnostiques du backend.

---

## Tests

27 tests unitaires couvrent le parser, le scoring, l'agrégation des
records et les overrides manuels.

```bash
npm test
```
