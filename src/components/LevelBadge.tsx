import { levelTitle } from "../lib/leveling";

interface Props {
  level: number;
  size?: "sm" | "md";
}

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-zinc-500/20 text-zinc-400",
  2: "bg-green-500/20 text-green-400",
  3: "bg-blue-500/20 text-blue-400",
  4: "bg-violet-500/20 text-violet-400",
  5: "bg-purple-500/20 text-purple-400",
  6: "bg-amber-500/20 text-amber-400",
  7: "bg-orange-500/20 text-orange-400",
  8: "bg-rose-500/20 text-rose-400",
  9: "bg-red-500/20 text-red-400",
  10: "bg-yellow-400/20 text-yellow-300",
};

export function LevelBadge({ level, size = "sm" }: Props) {
  const color = LEVEL_COLORS[level] ?? LEVEL_COLORS[1];
  const title = levelTitle(level);
  const textSize = "text-xs";
  const padding = size === "sm" ? "px-1 py-px" : "px-1.5 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-bold ${textSize} ${padding} ${color} shrink-0`}
      title={`Niv. ${level} — ${title}`}
    >
      Niv.{level}
    </span>
  );
}
