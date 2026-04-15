# Personal Gym Tracker

> Ton compagnon de sport complet : musculation, cardio, nutrition et coaching —
> le tout dans une seule app, sur mobile comme sur desktop.

Application développée par **Gabriel Orsatti**.

---

## Pour qui ?

Personal Gym Tracker est un compagnon de sport complet pensé pour les gens qui
s'entraînent sérieusement mais qui n'ont pas envie de se battre avec une app.
Tu décris ta séance en français (« 4x10 squat 100kg, puis tractions 3x8 +10 »)
et l'**IA intégrée** la convertit en séries structurées — plus besoin de taper
case par case. Même chose côté **alimentation** : tu écris « 150g de poulet,
riz, brocolis » et l'IA estime calories et macros automatiquement.

Côté suivi, tu retrouves tes **graphiques de progression** (volume, records,
allure cardio, macros sur 14 jours), un **calendrier** de tes séances et un
**Coach IA** qui lit tes dernières performances pour t'aider à ajuster tes
charges, suggérer un programme ou débloquer un plateau.

L'app est **gratuite, sans publicité**, et tes données sont **chiffrées et
synchronisées via Supabase** — accessibles depuis n'importe quel appareil,
installables comme une application native (PWA) sur iPhone et Android, et
protégées par une authentification sécurisée par e-mail.

---

## Stack technique

**Front** : React 18 + TypeScript strict, bundler Vite 6, UI Tailwind CSS 3
(système de thèmes via CSS variables — dark et rose pastel). Graphiques
Recharts qui adaptent automatiquement leurs couleurs au thème actif. Icônes
lucide-react.

**Backend-as-a-Service** : **Supabase** (PostgreSQL managé) pour la persistance
des séances, poids de corps, logs nutrition et programmes. **Row Level Security**
activé sur toutes les tables (`auth.uid() = user_id`), ce qui garantit qu'un
utilisateur ne peut jamais lire ou modifier les données d'un autre, même en
cas de requête directe. Authentification Supabase Auth par e-mail / mot de
passe.

**IA** : intégration d'un modèle **Llama 3.3 / Mistral Small 3.2** via l'API
OpenAI-compatible du Groupe GENES (ENSAE). Deux usages :
- `parseWorkoutWithAI` / `parseNutritionWithAI` — extraction structurée en
  JSON strict depuis du texte libre français.
- `CoachChat` — assistant contextuel avec accès au résumé des séances, des
  records et des programmes ; peut proposer une mise à jour de charges via un
  bloc JSON interprété par l'app.

**PWA** : `vite-plugin-pwa` avec service worker Workbox et registerType
`prompt` — l'utilisateur est notifié par un toast à chaque nouvelle version
plutôt que d'avoir un rechargement silencieux. Installable à l'écran d'accueil
sur iOS et Android, fonctionne offline pour la consultation.

**Déploiement** : GitHub Actions → GitHub Pages. Le push sur `main` déclenche
build + tests + publication automatique.

**Architecture de stockage** : interface `StorageAdapter` commune à un
`localStorageAdapter` (mode déconnecté) et un `supabaseAdapter` (mode cloud).
Le switch est transparent pour les hooks et composants.

---

## Démarrage rapide

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitaires (Vitest)
npm run typecheck  # vérification des types
npm run build      # build de production
```

Variables d'environnement (optionnelles en dev — `.env.local`) :

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_LLM_API_KEY=...
VITE_LLM_BASE_URL=https://llm.lab.groupe-genes.fr/openai
VITE_LLM_MODEL=mistralai/Mistral-Small-3.2-24B-Instruct-2506
```

Sans ces clés l'app démarre en mode LocalStorage + parser regex, ce qui suffit
à explorer l'interface.

---

## Fonctionnalités

- **Saisie NLP** musculation (séries/reps/charges/lest) et cardio (distance,
  durée, allure calculée)
- **Alimentation** : input libre analysé par IA, dashboard macros du jour,
  historique 14 jours (protéines + calories)
- **Dashboard** : volume total, volume 30j, poids de corps, calendrier, stats
  cardio
- **Historique** : édition en un clic (la séance est re-sérialisée en texte)
- **Progression** : courbes par exercice (volume / intensité / record /
  distance / allure / durée selon type), records personnels avec overrides
  manuels
- **Programmes personnalisés** : CRUD avec objectifs et cues pédagogiques,
  sync Supabase
- **Coach IA** : chat contextuel avec suggestions, peut proposer des mises à
  jour de charges appliquées en un clic
- **Thèmes** : dark menthe / rose pastel clair, toggle instantané
- **Backup** : export / import JSON complet

---

## Schéma de données

Tables Supabase (`db/schema.sql`) :

| Table             | Clé                     | Contenu                                   |
| ----------------- | ----------------------- | ----------------------------------------- |
| `sessions`        | `id`                    | séances (exercices en JSONB)              |
| `body_weights`    | `(user_id, date)`       | poids de corps journalier                 |
| `nutrition_logs`  | `id`                    | repas avec macros IA                      |
| `programs`        | `id`                    | programmes personnalisés                  |

Toutes les tables ont RLS activée avec les 4 policies (select / insert /
update / delete) sur `auth.uid() = user_id`.

---

## Structure du code

```
src/
├── types/            # Session, ExerciseEntry, NutritionLog, PersonalRecordOverride…
├── lib/              # Domaine métier pur (TS testé)
│   ├── exercises.ts, parser.ts, scoring.ts, records.ts
│   ├── nutritionParser.ts  # IA → macros
│   ├── llm.ts              # client chat/completions
│   ├── storage.ts          # StorageAdapter + switch local/cloud
│   └── adapters/supabaseAdapter.ts
├── hooks/            # useSessions, useBodyWeight, useNutritionLogs, useTheme, useChartColors…
├── components/       # Dashboard, charts, CoachChat, NutritionView, ProgramEditor…
├── data/             # Seed + programmes par défaut
├── App.tsx
└── main.tsx
db/
└── schema.sql        # Tables + RLS à exécuter dans Supabase
```

---

## Tests

```bash
npm test
```

Les suites couvrent le parser NLP, le scoring, l'agrégation des records et
les overrides manuels.

---

## Déploiement

Push sur `main` → `.github/workflows/deploy.yml` → install + typecheck +
tests + build + publish sur GitHub Pages.

Les secrets Supabase et LLM sont injectés via les GitHub Actions Secrets. En
leur absence, le site reste fonctionnel en mode LocalStorage + fallback
regex.
