# Personal Gym Tracker

WebApp moderne, rapide et épurée pour suivre mes séances de musculation
et ma progression. Dark mode par défaut, saisie en langage naturel,
statistiques et graphiques intégrés.

## Stack

- **Vite + React 18 + TypeScript** (strict)
- **Tailwind CSS 3** pour un design dark épuré
- **Recharts** pour les graphiques
- **Lucide-react** pour les icônes
- **date-fns** pour la gestion des dates
- **Vitest** pour les tests unitaires
- **LocalStorage** pour la persistance (architecture prête pour une
  migration vers SQLite/PostgreSQL)

## Démarrage rapide

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # lance les tests unitaires
npm run build     # build de production
npm run typecheck # vérifie les types TS
```

## Fonctionnalités

### Saisie en langage naturel (NLP)

Tape ce que tu veux, le parser reconnaît les formes les plus courantes :

```
3 séries de 12 rep de DC à 80kg
4x10 squat 100kg
développé couché 3x12 @ 80
curl 3*10 à 12,5
SDT 5x5 120kg puis tractions 3x10
```

Le catalogue couvre ~25 mouvements avec alias (DC, SDT, OHP, dips, etc.) —
voir `src/lib/exercises.ts` pour l'enrichir.

### Dashboard

- 4 KPI : volume total, volume 30 jours, poids de corps, score moyen
- Courbe d'évolution du volume dans le temps
- Barres du volume par catégorie (Poussée, Tirage, Jambes, Épaules, Bras...)
- Courbe du poids de corps avec ajout rapide
- Calendrier mensuel avec pastilles sur les jours d'entraînement

### Historique

Liste des séances classées par date, avec détail des exercices, volume
et score.

### Progression

Courbe par mouvement : charge maximale soulevée + 1RM estimé (Epley) au
fil du temps.

### Backup

Export et import JSON versionné pour sauvegarder ses données ou les
migrer vers une autre installation.

## Structure du code

```
src/
├── types/        # Schémas TS (Session, ExerciseEntry, SetEntry, ...)
├── lib/          # Domaine métier, pur TS, testé
│   ├── exercises.ts   # Catalogue + aliases
│   ├── parser.ts      # NLP
│   ├── scoring.ts     # Volume, 1RM (Epley), score
│   ├── storage.ts     # StorageAdapter, aujourd'hui LocalStorage
│   └── backup.ts      # Export / import JSON
├── hooks/        # useSessions, useBodyWeight
├── components/   # Dashboard, charts, historique, progression, input NLP
├── App.tsx
└── main.tsx
```

## Schéma d'une séance

```ts
{
  id: string,
  date: "2026-04-12",
  exercices: [
    {
      nom: "Développé couché",
      categorie: "Poussée",
      sets: [{ reps: 12, poids: 80 }, ...]
    }
  ],
  notes?: string,
  bodyWeight?: number
}
```

## Migration vers une base distante

Le fichier `src/lib/storage.ts` expose une interface `StorageAdapter`.
Pour passer à SQLite/PostgreSQL, il suffit d'implémenter cette même
interface côté API et de remplacer `localStorageAdapter` par la nouvelle
implémentation — aucun autre code ne change.
