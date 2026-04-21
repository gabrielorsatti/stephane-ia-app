import { Target, Trophy } from "lucide-react";

interface Props {
  current: number;
  goal: number;
  onClick: () => void;
}

export function WeeklyProgressBar({ current, goal, onClick }: Props) {
  const percent = Math.min(100, Math.round((current / goal) * 100));
  const completed = current >= goal;

  return (
    <button
      onClick={onClick}
      className={[
        "card w-full text-left transition-all hover:border-accent/40 group",
        completed ? "border-accent/30 bg-accent/5" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {completed ? (
            <Trophy className="w-4 h-4 text-amber-400" />
          ) : (
            <Target className="w-4 h-4 text-accent" />
          )}
          <span className="text-sm font-semibold">
            {completed ? "Objectif atteint !" : "Objectif de la semaine"}
          </span>
        </div>
        <span className={[
          "text-xs font-bold tabular-nums",
          completed ? "text-amber-400" : "text-accent",
        ].join(" ")}>
          {current} / {goal} séance{goal > 1 ? "s" : ""}
        </span>
      </div>
      <div className="h-2.5 bg-bg-soft rounded-full overflow-hidden border border-border">
        <div
          className={[
            "h-full rounded-full transition-all duration-700",
            completed
              ? "bg-gradient-to-r from-amber-400 to-amber-300"
              : "bg-gradient-to-r from-accent to-accent-soft",
          ].join(" ")}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-xs text-text-dim mt-1 group-hover:text-text-muted transition-colors">
        {completed
          ? "Bravo ! Clique pour modifier ton objectif."
          : `Encore ${goal - current} séance${goal - current > 1 ? "s" : ""} avant dimanche. Clique pour modifier.`}
      </div>
    </button>
  );
}
