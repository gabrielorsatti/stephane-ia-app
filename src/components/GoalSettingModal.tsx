import { Target } from "lucide-react";
import { useState } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";

interface Props {
  currentGoal?: number;
  onSave: (goal: number) => Promise<void>;
  onClose: () => void;
}

export function GoalSettingModal({ currentGoal, onSave, onClose }: Props) {
  const [goal, setGoal] = useState(currentGoal ?? 3);
  const [saving, setSaving] = useState(false);
  const trapRef = useFocusTrap<HTMLDivElement>();

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(goal);
      onClose();
    } catch {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && currentGoal != null) onClose(); }}
    >
      <div ref={trapRef} className="bg-bg-card border border-border rounded-2xl w-full max-w-sm animate-fadeIn">
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Objectif hebdomadaire</h2>
              <p className="text-xs text-text-muted">
                Combien de séances par semaine ?
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                onClick={() => setGoal(n)}
                className={[
                  "w-10 h-10 rounded-full font-bold text-sm transition-all",
                  n === goal
                    ? "bg-accent text-white scale-110 shadow-lg shadow-accent/30"
                    : "bg-bg-soft border border-border text-text-muted hover:border-accent hover:text-accent",
                ].join(" ")}
              >
                {n}
              </button>
            ))}
          </div>

          <p className="text-xs text-text-dim text-center">
            {goal === 1 && "Une séance par semaine, c'est déjà super !"}
            {goal === 2 && "Deux séances, un bon rythme pour débuter."}
            {goal === 3 && "Trois séances, l'équilibre parfait."}
            {goal === 4 && "Quatre séances, tu es régulier !"}
            {goal === 5 && "Cinq séances, une vraie discipline."}
            {goal === 6 && "Six séances, attention à la récupération !"}
            {goal === 7 && "Tous les jours, mode beast activé !"}
          </p>

          <button
            className="btn-primary w-full"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? "Enregistrement…" : currentGoal != null ? "Modifier" : "Valider mon objectif"}
          </button>
        </div>
      </div>
    </div>
  );
}
