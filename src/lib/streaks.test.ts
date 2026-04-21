import { describe, expect, it } from "vitest";
import { computeStreaks } from "./streaks";
import type { Session } from "../types";

function makeSession(date: string): Session {
  return { id: date, date, exercices: [{ nom: "Bench", categorie: "Poussée", sets: [{ reps: 10, poids: 60 }] }] };
}

function mondayOf(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  return r;
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

describe("computeStreaks", () => {
  it("returns 0 for empty sessions", () => {
    expect(computeStreaks([])).toEqual({ current: 0, best: 0 });
  });

  it("returns streak of 1 for single week", () => {
    const monday = mondayOf(new Date());
    const result = computeStreaks([makeSession(fmt(monday))]);
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });

  it("counts consecutive weeks", () => {
    const now = new Date();
    const mon = mondayOf(now);
    const sessions = [0, 1, 2].map((w) => {
      const d = new Date(mon);
      d.setDate(d.getDate() - w * 7);
      return makeSession(fmt(d));
    });
    const result = computeStreaks(sessions);
    expect(result.current).toBe(3);
    expect(result.best).toBe(3);
  });

  it("breaks streak on gap", () => {
    const now = new Date();
    const mon = mondayOf(now);
    const d1 = new Date(mon);
    const d2 = new Date(mon);
    d2.setDate(d2.getDate() - 21);
    const result = computeStreaks([makeSession(fmt(d1)), makeSession(fmt(d2))]);
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });
});
