export const MAX_LEVEL = 10;

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * (level - 1) * 100;
}

export function levelFromXp(totalXp: number): number {
  const raw = Math.floor(Math.sqrt(totalXp / 100)) + 1;
  return Math.min(raw, MAX_LEVEL);
}

export function xpProgress(totalXp: number): { level: number; current: number; needed: number; percent: number } {
  const level = levelFromXp(totalXp);
  if (level >= MAX_LEVEL) {
    return { level, current: totalXp, needed: totalXp, percent: 100 };
  }
  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  const current = totalXp - floor;
  const needed = ceiling - floor;
  const percent = Math.min(100, Math.round((current / needed) * 100));
  return { level, current, needed, percent };
}

const LEVEL_TITLES: Record<number, string> = {
  1: "Débutant",
  2: "Régulier",
  3: "Sportif",
  4: "Athlète",
  5: "Confirmé",
  6: "Expert",
  7: "Élite",
  8: "Champion",
  9: "Légende",
  10: "Titan",
};

export function levelTitle(level: number): string {
  return LEVEL_TITLES[level] ?? "Débutant";
}
