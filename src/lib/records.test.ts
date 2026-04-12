import { describe, expect, it } from "vitest";
import { computeRecords } from "./records";
import type { Session } from "../types";

const sessions: Session[] = [
  {
    id: "a",
    date: "2026-01-10",
    exercices: [
      {
        nom: "Développé couché",
        categorie: "Poussée",
        sets: [
          { reps: 10, poids: 80 },
          { reps: 8, poids: 85 },
        ],
      },
    ],
  },
  {
    id: "b",
    date: "2026-02-01",
    exercices: [
      {
        nom: "Développé couché",
        categorie: "Poussée",
        sets: [{ reps: 5, poids: 95 }],
      },
      {
        nom: "Squat",
        categorie: "Jambes",
        sets: [{ reps: 5, poids: 120 }],
      },
    ],
  },
];

describe("computeRecords", () => {
  it("retourne un record par exercice", () => {
    const recs = computeRecords(sessions);
    expect(recs).toHaveLength(2);
  });

  it("trace la charge max et sa date", () => {
    const recs = computeRecords(sessions);
    const bench = recs.find((r) => r.nom === "Développé couché")!;
    expect(bench.maxPoids).toBe(95);
    expect(bench.maxPoidsReps).toBe(5);
    expect(bench.maxPoidsDate).toBe("2026-02-01");
    expect(bench.totalSessions).toBe(2);
  });

  it("trie par meilleur 1RM décroissant", () => {
    const recs = computeRecords(sessions);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].best1RM).toBeGreaterThanOrEqual(recs[i].best1RM);
    }
  });

  it("retourne un tableau vide sans séance", () => {
    expect(computeRecords([])).toEqual([]);
  });

  it("applique un override manuel sur un exercice existant", () => {
    const recs = computeRecords(sessions, [
      { nom: "Développé couché", maxPoids: 120, maxPoidsReps: 1 },
    ]);
    const bench = recs.find((r) => r.nom === "Développé couché")!;
    expect(bench.maxPoids).toBe(120);
    expect(bench.maxPoidsReps).toBe(1);
    expect(bench.manualOverride).toBe(true);
    // Les champs non surchargés restent les valeurs calculées.
    expect(bench.totalSessions).toBe(2);
  });

  it("crée un PR depuis un override pour un exercice jamais fait", () => {
    const recs = computeRecords(sessions, [
      {
        nom: "Clean & Jerk",
        categorie: "Autre",
        maxPoids: 80,
        maxPoidsReps: 1,
        maxPoidsDate: "2026-03-20",
      },
    ]);
    const c = recs.find((r) => r.nom === "Clean & Jerk")!;
    expect(c.maxPoids).toBe(80);
    expect(c.totalSessions).toBe(0);
  });
});
