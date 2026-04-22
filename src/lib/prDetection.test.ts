import { describe, expect, it } from "vitest";
import { detectNewPRs } from "./prDetection";
import type { Session } from "../types";

function makeSession(id: string, date: string, exercices: Session["exercices"]): Session {
  return { id, date, exercices };
}

describe("detectNewPRs", () => {
  const history: Session[] = [
    makeSession("1", "2026-01-01", [
      { nom: "Bench Press", categorie: "Poussée", sets: [{ reps: 10, poids: 80 }] },
      { nom: "Squat", categorie: "Jambes", sets: [{ reps: 8, poids: 100 }] },
    ]),
    makeSession("2", "2026-01-08", [
      { nom: "Bench Press", categorie: "Poussée", sets: [{ reps: 8, poids: 85 }] },
    ]),
  ];

  it("detects a new weight PR", () => {
    const newSession = makeSession("3", "2026-01-15", [
      { nom: "Bench Press", categorie: "Poussée", sets: [{ reps: 10, poids: 90 }] },
    ]);
    const alerts = detectNewPRs(newSession, history);
    expect(alerts.length).toBe(1);
    expect(alerts[0].exerciseName).toBe("Bench Press");
    expect(alerts[0].type).toBe("maxPoids");
    expect(alerts[0].newValue).toBe(90);
  });

  it("returns empty for no PR", () => {
    const newSession = makeSession("3", "2026-01-15", [
      { nom: "Bench Press", categorie: "Poussée", sets: [{ reps: 10, poids: 80 }] },
    ]);
    expect(detectNewPRs(newSession, history)).toEqual([]);
  });

  it("ignores exercises not in history", () => {
    const newSession = makeSession("3", "2026-01-15", [
      { nom: "Curl biceps", categorie: "Bras", sets: [{ reps: 12, poids: 20 }] },
    ]);
    expect(detectNewPRs(newSession, history)).toEqual([]);
  });

  it("detects PR on 1RM improvement without weight PR", () => {
    const newSession = makeSession("3", "2026-01-15", [
      { nom: "Squat", categorie: "Jambes", sets: [{ reps: 5, poids: 100 }, { reps: 3, poids: 115 }] },
    ]);
    const alerts = detectNewPRs(newSession, history);
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe("maxPoids");
  });

  it("skips already celebrated PRs", () => {
    const newSession = makeSession("3", "2026-01-15", [
      { nom: "Bench Press", categorie: "Poussée", sets: [{ reps: 10, poids: 90 }] },
    ]);
    const celebrated = new Set(["Bench Press:maxPoids"]);
    const alerts = detectNewPRs(newSession, history, celebrated);
    expect(alerts).toEqual([]);
  });

  it("detects cardio duration PR", () => {
    const cardioHistory: Session[] = [
      makeSession("1", "2026-01-01", [
        { nom: "Course", categorie: "Cardio", sets: [], durationMinutes: 30 },
      ]),
    ];
    const newSession = makeSession("2", "2026-01-08", [
      { nom: "Course", categorie: "Cardio", sets: [], durationMinutes: 45 },
    ]);
    const alerts = detectNewPRs(newSession, cardioHistory);
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe("maxDuration");
    expect(alerts[0].oldValue).toBe(30);
    expect(alerts[0].newValue).toBe(45);
  });
});
