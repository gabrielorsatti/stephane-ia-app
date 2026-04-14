import { Sparkles, X } from "lucide-react";
import { useState } from "react";

const FLAG = "gym-tracker:onboarded:v1";

interface Props {
  onDismiss?: () => void;
}

// Petit guide affiché 1 fois pour expliquer la saisie NLP.
// Se cache automatiquement après dismiss (flag LocalStorage).
export function Onboarding({ onDismiss }: Props) {
  const [visible, setVisible] = useState(() => !localStorage.getItem(FLAG));

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(FLAG, "1");
    setVisible(false);
    onDismiss?.();
  }

  return (
    <div className="card bg-accent-muted/20 border-accent-muted/50 relative">
      <button
        className="absolute top-2 right-2 btn-ghost !p-1.5"
        onClick={dismiss}
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-sm">Bienvenue 👋</h3>
      </div>
      <p className="text-xs text-text-muted mb-3">
        Saisis tes séances en langage naturel, une ligne par exercice :
      </p>
      <ul className="text-xs space-y-1 font-mono bg-bg-soft border border-border rounded-lg p-3">
        <li>3x12 Développé couché à 80kg</li>
        <li>4x10 Squat 100kg</li>
        <li>Course 5km en 25min</li>
        <li>Vélo 20km allure 3:00</li>
      </ul>
      <p className="text-xs text-text-dim mt-3">
        Clique sur l'onglet <strong>Coach</strong> pour analyser tes progrès
        avec l'IA, et <strong>Programme</strong> pour suivre un split
        prédéfini.
      </p>
      <button className="btn-primary mt-3 text-xs" onClick={dismiss}>
        C'est parti
      </button>
    </div>
  );
}
