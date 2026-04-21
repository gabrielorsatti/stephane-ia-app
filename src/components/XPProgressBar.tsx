import { xpProgress, levelTitle } from "../lib/leveling";
import { LevelBadge } from "./LevelBadge";

interface Props {
  totalXp: number;
  compact?: boolean;
}

export function XPProgressBar({ totalXp, compact }: Props) {
  const { level, current, needed, percent } = xpProgress(totalXp);

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <LevelBadge level={level} size="sm" />
            <span className="text-text-dim">{levelTitle(level)}</span>
          </div>
          <span className="text-text-dim tabular-nums">{totalXp} XP</span>
        </div>
        <div className="h-1.5 bg-bg-soft rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LevelBadge level={level} size="md" />
          <span className="text-sm font-semibold">{levelTitle(level)}</span>
        </div>
        <span className="text-xs text-text-muted tabular-nums">{totalXp} XP total</span>
      </div>
      <div className="h-2.5 bg-bg-soft rounded-full overflow-hidden border border-border">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent-soft rounded-full transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-xs text-text-dim text-center tabular-nums">
        {current} / {needed} XP pour le niveau {level + 1}
      </div>
    </div>
  );
}
