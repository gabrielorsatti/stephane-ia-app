import { Bot, Target } from "lucide-react";
import type { WeeklyChallenge } from "../lib/weeklyChallenge";

interface Props {
  challenge: WeeklyChallenge;
}

export function WeeklyChallengeCard({ challenge }: Props) {
  const pct = Math.min(100, challenge.target > 0 ? (challenge.current / challenge.target) * 100 : 0);
  const done = challenge.current >= challenge.target;

  return (
    <div
      className={[
        "card !p-4 space-y-3 transition-colors",
        done ? "border-green-500/40 bg-green-500/5" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center">
          <Target className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{challenge.title}</div>
          <div className="flex items-center gap-1 text-xs text-text-dim">
            <Bot className="w-3 h-3" />
            Défi de Stéphane
          </div>
        </div>
        {done && (
          <span className="text-xs font-bold text-green-500 shrink-0">
            Complété !
          </span>
        )}
      </div>

      <p className="text-xs text-text-muted">{challenge.description}</p>

      <div className="space-y-1.5">
        <div className="h-2 bg-bg-soft rounded-full overflow-hidden border border-border">
          <div
            className={[
              "h-full rounded-full transition-all duration-500",
              done
                ? "bg-green-500"
                : "bg-gradient-to-r from-accent to-accent-soft",
            ].join(" ")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-text-dim">
          <span>
            {challenge.current} / {challenge.target} {challenge.unit}
          </span>
          <span>{Math.round(pct)}%</span>
        </div>
      </div>
    </div>
  );
}
