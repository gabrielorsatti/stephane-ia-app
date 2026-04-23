import { Bot, Sparkles, TrendingUp, X } from "lucide-react";
import { useState } from "react";

const FLAG = "stephane-ia:onboarded:v2";

// Modal de bienvenue affichée au premier lancement. Stocke un flag
// LocalStorage (bump v2 pour réinitialiser l'état existant). Fermeture via
// la croix ou le bouton "C'est parti !".
export function Onboarding() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(FLAG));

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(FLAG, "1");
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      onClick={dismiss}
    >
      <div
        className="bg-bg-card border border-border rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Bienvenue 👋</h3>
          </div>
          <button
            className="btn-ghost !p-1.5"
            onClick={dismiss}
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-sm">
          <p className="text-text-muted">
            Trois choses à savoir pour commencer :
          </p>

          <Step
            icon={<Sparkles className="w-4 h-4" />}
            title="Saisie en langage naturel"
          >
            Tape tes séances ligne par ligne. Exemples :
            <ul className="font-mono text-xs text-text-muted bg-bg-soft border border-border rounded-lg p-2 mt-2 space-y-0.5">
              <li>3x12 Développé couché à 80kg</li>
              <li>4x8 Tractions +20kg</li>
              <li>Course 5km en 25min</li>
            </ul>
          </Step>

          <Step
            icon={<TrendingUp className="w-4 h-4" />}
            title="Progression"
          >
            L'onglet <strong>Progression</strong> affiche tes graphes par
            exercice (volume, intensité, records) ou en cardio (distance,
            allure, durée).
          </Step>

          <Step icon={<Bot className="w-4 h-4" />} title="Stéphane">
            Onglet <strong>Coach</strong> : Stéphane analyse tes performances,
            suggère des charges et peut même générer un programme sur mesure.
          </Step>
        </div>

        <div className="p-4 border-t border-border">
          <button className="btn-primary w-full" onClick={dismiss}>
            C'est parti !
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-text">{title}</div>
        <div className="text-xs text-text-muted mt-1">{children}</div>
      </div>
    </div>
  );
}
