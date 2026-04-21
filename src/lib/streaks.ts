import type { Session } from "../types";

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return localDateStr(d);
}

function addWeeks(monday: string, n: number): string {
  const d = new Date(monday + "T12:00:00");
  d.setDate(d.getDate() + n * 7);
  return localDateStr(d);
}

export interface StreakInfo {
  current: number;
  best: number;
}

export function computeStreaks(sessions: Session[]): StreakInfo {
  if (sessions.length === 0) return { current: 0, best: 0 };

  const activeWeeks = new Set<string>();
  for (const s of sessions) {
    const d = new Date(s.date + "T12:00:00");
    activeWeeks.add(mondayOf(d));
  }

  const sorted = Array.from(activeWeeks).sort();
  if (sorted.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let streak = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (addWeeks(sorted[i - 1], 1) === sorted[i]) {
      streak++;
      if (streak > best) best = streak;
    } else {
      streak = 1;
    }
  }

  const thisMonday = mondayOf(new Date());
  const lastMonday = addWeeks(thisMonday, -1);
  const lastActive = sorted[sorted.length - 1];
  const current =
    lastActive === thisMonday || lastActive === lastMonday ? streak : 0;

  return { current, best };
}
