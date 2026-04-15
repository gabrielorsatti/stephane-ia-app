import { X } from "lucide-react";
import type { Gym, OccupancyLevel } from "../types";

interface Props {
  gym: Gym;
  onSubmit: (level: OccupancyLevel) => void;
  onDismiss: () => void;
}

const OPTIONS: Array<{ key: OccupancyLevel; label: string; emoji: string }> = [
  { key: "vide", label: "Vide", emoji: "🟢" },
  { key: "moyen", label: "Moyen", emoji: "🟡" },
  { key: "bonde", label: "Bondé", emoji: "🔴" },
];

// Micro-feedback post-séance : 3 boutons, 1 seconde à cocher. Alimente le
// modèle prédictif pour affiner l'estimation d'affluence propre à la salle.
export function CrowdCheckPrompt({ gym, onSubmit, onDismiss }: Props) {
  return (
    <div className="card border-accent/50 bg-accent-muted/10 relative z-10 animate-in fade-in">
      <button
        onClick={onDismiss}
        aria-label="Ignorer"
        className="absolute top-2 right-2 text-text-dim hover:text-text"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="text-sm font-semibold mb-1">
        Comment était l'affluence ?
      </div>
      <div className="text-xs text-text-muted mb-3">
        {gym.name} — ton retour améliore la prédiction pour cette salle.
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => onSubmit(o.key)}
            className="flex flex-col items-center gap-1 py-2 px-2 bg-bg-soft border border-border rounded-lg hover:border-accent transition-colors"
          >
            <span className="text-lg">{o.emoji}</span>
            <span className="text-xs font-medium">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
