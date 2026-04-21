import { Flame } from "lucide-react";
import type { StreakInfo } from "../lib/streaks";

interface Props {
  streak: StreakInfo;
}

export function StreakBadge({ streak }: Props) {
  if (streak.current === 0) return null;

  const hot = streak.current >= 4;

  return (
    <div
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        hot
          ? "bg-orange-500/15 text-orange-400"
          : "bg-amber-500/15 text-amber-500",
      ].join(" ")}
      title={`Record : ${streak.best} semaines`}
    >
      <Flame className={`w-3.5 h-3.5 ${hot ? "animate-pulse" : ""}`} />
      {streak.current} sem.
    </div>
  );
}
