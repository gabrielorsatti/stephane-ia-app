# Personal Gym Tracker

> Ton compagnon de sport complet : musculation, cardio, nutrition, coaching IA
> et réseau social fitness — le tout dans une seule app, sur mobile comme sur
> desktop.

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
allure cardio, macros sur 14 jours), un **calendrier** de tes séances et
**Stéphane**, ton **coach IA personnel** qui lit tes dernières performances
pour t'aider à ajuster tes charges, suggérer un programme ou débloquer un
plateau.

L'aspect **social** est au cœur de l'expérience : publie tes séances sur un
**flux d'activité type Strava**, envoie des **Kudos** (likes), commente les
performances de tes amis et suis tes **notifications** en temps réel. Chaque
utilisateur dispose d'un **profil avec photo** visible partout dans l'app.

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
des séances, poids de corps, logs nutrition, programmes, profils, amitiés,
notifications et interactions sociales. **Row Level Security** activé sur toutes
les tables (`auth.uid() = user_id`), ce qui garantit qu'un utilisateur ne peut
jamais lire ou modifier les données d'un autre, même en cas de requête directe.
Authentification Supabase Auth par e-mail / mot de passe. **Supabase Storage**
pour l'hébergement des photos de profil (bucket `avatars`).

**IA** : intégration d'un modèle **Llama 3.3 / Mistral Small 3.2** via l'API
OpenAI-compatible du Groupe GENES (ENSAE). Trois usages :
- `parseWorkoutWithAI` / `parseNutritionWithAI` — extraction structurée en
  JSON strict depuis du texte libre français.
- `CoachChat` (« Stéphane ») — assistant contextuel avec accès au résumé des
  séances, des records et des programmes ; peut proposer une mise à jour de
  charges appliquées en un clic.
- `generateSessionCommentary` — analyse automatique de chaque séance par
  Stéphane (~100 mots), affichée dans la PublishModal et l'historique.

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

### Entraînement

- **Saisie NLP** musculation (séries/reps/charges/lest) et cardio (distance,
  durée, allure calculée)
- **Fusion intelligente de séances** : fenêtre de 3 h — les exercices saisis
  successivement s'accumulent dans la même session
- **Dashboard** : volume total, volume 30j, poids de corps, calendrier, stats
  cardio
- **Historique** : édition en un clic (la séance est re-sérialisée en texte),
  déduplication automatique des exercices via `groupExercises`
- **Progression** : courbes par exercice (volume / intensité / record /
  distance / allure / durée selon type), records personnels avec overrides
  manuels
- **Programmes personnalisés** : CRUD avec objectifs et cues pédagogiques,
  sync Supabase

### Nutrition

- **Alimentation** : input libre analysé par IA, dashboard macros du jour,
  historique 14 jours (protéines + calories)

### Coach IA — Stéphane

- **Chat contextuel** avec accès à l'historique, aux records et aux programmes
- **Recommandations** de charges appliquées en un clic (diff cliquable)
- **Commentaire automatique** de chaque séance (~100 mots), visible dans
  l'historique et la PublishModal (masqué du flux social pour la vie privée)

### Social

- **Profils utilisateur** avec **photo de profil** (upload via Supabase
  Storage) et composant `UserBadge` réutilisable (avatar + pseudo) affiché
  partout dans l'app
- **Système d'amis** : recherche par pseudo, demandes envoyées/reçues,
  acceptation/refus
- **Profil ami** : stats publiques (séances, volume, top exercices, activité)
- **Publication de séances** : workflow « Terminer ma séance » avec choix
  **public / privé** et commentaire personnel
- **Flux d'activité** type Strava : séances publiées par tes amis et par toi
- **Kudos** (likes) et **commentaires** avec mise à jour optimiste
- **Notifications** : badge rouge sur l'onglet Social + liste dédiée avec
  « Tout marquer comme lu »

### Administration

- **Panneau admin** : liste des inscrits avec avatars, nombre d'amis, date
  d'inscription
- **Business Center FinOps** : suivi des tokens consommés par l'IA, coût par
  utilisateur, KPI globaux

### Général

- **Thèmes** : dark menthe / rose pastel clair, toggle instantané
- **Backup** : export / import JSON complet, auto-backup quotidien optionnel
- **Onboarding** : modal de bienvenue au premier lancement
- **Responsive** : bottom nav mobile (5 onglets avec badge notif), sidebar
  desktop

---

## Schéma de données

Tables Supabase (`db/`) :

| Table             | Clé                     | Contenu                                   |
| ----------------- | ----------------------- | ----------------------------------------- |
| `sessions`        | `id`                    | séances (exercices JSONB, coach_commentary, is_published, published_at) |
| `body_weights`    | `(user_id, date)`       | poids de corps journalier                 |
| `nutrition_logs`  | `id`                    | repas avec macros IA                      |
| `programs`        | `id`                    | programmes personnalisés                  |
| `profiles`        | `id` (= auth.users.id)  | pseudo, avatar_url, is_admin              |
| `friendships`     | `id`                    | sender_id, receiver_id, status (pending/accepted) |
| `likes`           | `(session_id, user_id)` | kudos sur les séances publiées            |
| `comments`        | `id`                    | commentaires sur les séances publiées     |
| `notifications`   | `id`                    | like/comment, actor_id, is_read           |
| `api_usage_logs`  | `id`                    | tokens in/out, coût estimé par requête IA |

Toutes les tables ont RLS activée. Migrations disponibles dans `db/`.

---

## Structure du code

```
src/
├── types/            # Session, FeedPost, FeedComment, Friendship, AppNotification…
├── lib/              # Domaine métier pur (TS testé)
│   ├── exercises.ts, parser.ts, scoring.ts, records.ts
│   ├── groupExercises.ts       # Déduplication exercices par nom
│   ├── sessionCommentary.ts    # Commentaire auto Stéphane
│   ├── recommendations.ts     # Recommandations de charges
│   ├── nutritionParser.ts     # IA → macros
│   ├── llm.ts                 # client chat/completions + tracking tokens
│   ├── storage.ts             # StorageAdapter + switch local/cloud
│   ├── supabase.ts            # Client Supabase singleton
│   └── adapters/supabaseAdapter.ts
├── hooks/            # useSessions, useFeed, useFriendships, useNotifications,
│                     # useProfile, usePrograms, useSocialInteractions…
├── components/       # UserBadge, FeedView, CommunityHub, NotificationList,
│                     # PublishModal, CoachChat, AdminPanel, ProgramEditor…
├── data/             # Seed + programmes par défaut
├── App.tsx
└── main.tsx
db/
├── schema.sql
├── migration-profiles-friendships.sql
├── migration-session-commentary.sql
├── migration-social-feed.sql
├── migration-likes-comments.sql
├── migration-notifications.sql
└── migration-api-usage-logs.sql
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

### Supabase Storage

Pour les photos de profil, créer un bucket **public** nommé `avatars` dans le
dashboard Supabase (Storage > New Bucket) avec une policy autorisant les uploads
authentifiés sur le path `{user_id}/*`.
