import type { Session } from "../types";

function mondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function sessionsThisWeek(sessions: Session[]): number {
  const monday = mondayOfWeek(new Date());
  return sessions.filter((s) => s.date >= monday).length;
}
