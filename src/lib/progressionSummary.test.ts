import { describe, expect, it } from "vitest";
import { buildProgressionSummary } from "./progressionSummary";
import type { Session } from "../types";

function makeSession(date: string, exercices: Session["exercices"]): Session {
  return { id: date, date, exercices };
}

function makeExo(nom: string, categorie: string, sets: Array<{ reps: number; poids: number }>) {
  return { nom, categorie: categorie as Session["exercices"][0]["categorie"], sets };
}

describe("buildProgressionSummary", () => {
  const today = new Date().toISOString().slice(0, 10);
  const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const sixWeeksAgo = new Date(Date.now() - 42 * 86400000).toISOString().slice(0, 10);

  const sessions: Session[] = [
    makeSession(sixWeeksAgo, [
      makeExo("Développé couché", "Poussée", [{ reps: 10, poids: 60 }, { reps: 10, poids: 60 }]),
      makeExo("Squat", "Jambes", [{ reps: 8, poids: 80 }]),
    ]),
    makeSession(twoWeeksAgo, [
      makeExo("Développé couché", "Poussée", [{ reps: 10, poids: 70 }, { reps: 10, poids: 70 }]),
    ]),
    makeSession(oneWeekAgo, [
      makeExo("Squat", "Jambes", [{ reps: 8, poids: 100 }]),
    ]),
    makeSession(today, [
      makeExo("Développé couché", "Poussée", [{ reps: 10, poids: 75 }, { reps: 10, poids: 75 }]),
      makeExo("Squat", "Jambes", [{ reps: 8, poids: 110 }]),
    ]),
  ];

  it("returns correct session count", () => {
    const result = buildProgressionSummary(sessions, 12);
    expect(result.totalSessions).toBe(4);
  });

  it("calculates avg sessions per week", () => {
    const result = buildProgressionSummary(sessions, 12);
    expect(result.avgSessionsPerWeek).toBeGreaterThan(0);
  });

  it("identifies top progressions", () => {
    const result = buildProgressionSummary(sessions, 12);
    expect(result.topProgressions.length).toBeGreaterThan(0);
    expect(result.topProgressions[0].deltaPercent).toBeGreaterThan(0);
  });

  it("builds a non-empty text summary", () => {
    const result = buildProgressionSummary(sessions, 12);
    expect(result.textSummary.length).toBeGreaterThan(50);
    expect(result.textSummary).toContain("séances");
  });

  it("handles empty sessions gracefully", () => {
    const result = buildProgressionSummary([], 12);
    expect(result.totalSessions).toBe(0);
    expect(result.topProgressions).toEqual([]);
    expect(result.textSummary).toContain("0 séances");
  });

  it("includes category frequencies", () => {
    const result = buildProgressionSummary(sessions, 12);
    expect(result.categoryFrequencies.length).toBeGreaterThan(0);
    const poussee = result.categoryFrequencies.find(c => c.categorie === "Poussée");
    expect(poussee).toBeDefined();
    expect(poussee!.totalSessions).toBeGreaterThan(0);
  });

  it("filters sessions outside the time window", () => {
    const oldSession = makeSession("2020-01-01", [
      makeExo("Bench", "Poussée", [{ reps: 10, poids: 50 }]),
    ]);
    const result = buildProgressionSummary([...sessions, oldSession], 12);
    expect(result.totalSessions).toBe(4);
  });
});
