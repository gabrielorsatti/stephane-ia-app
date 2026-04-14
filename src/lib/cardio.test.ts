import { describe, expect, it } from "vitest";
import {
  aggregateCardio,
  computePace,
  formatPace,
  parsePace,
} from "./cardio";
import type { Session } from "../types";

describe("computePace", () => {
  it("calcule l'allure min/km depuis distance + durée", () => {
    expect(computePace({ distance: 5, duree: 25 })).toBe(5);
    expect(computePace({ distance: 10, duree: 45 })).toBe(4.5);
  });
  it("retourne null si données insuffisantes", () => {
    expect(computePace({ distance: 0, duree: 25 })).toBeNull();
    expect(computePace({ distance: 5 })).toBeNull();
    expect(computePace({})).toBeNull();
  });
});

describe("formatPace / parsePace", () => {
  it("formate 5:30 min/km", () => {
    expect(formatPace(5.5)).toBe("5:30");
  });
  it("parse '3:00'", () => {
    expect(parsePace("3:00")).toBe(3);
  });
  it("parse '4:30'", () => {
    expect(parsePace("4:30")).toBe(4.5);
  });
});

describe("aggregateCardio", () => {
  it("somme distance/durée/dénivelé", () => {
    const sessions: Session[] = [
      {
        id: "1",
        date: "2026-04-10",
        exercices: [
          {
            nom: "Course",
            categorie: "Cardio",
            sets: [],
            cardio: { distance: 5, duree: 25, denivele: 50 },
          },
        ],
      },
      {
        id: "2",
        date: "2026-04-12",
        exercices: [
          {
            nom: "Vélo",
            categorie: "Cardio",
            sets: [],
            cardio: { distance: 20, duree: 60 },
          },
        ],
      },
    ];
    const agg = aggregateCardio(sessions);
    expect(agg.totalDistance).toBe(25);
    expect(agg.totalDuration).toBe(85);
    expect(agg.totalDenivele).toBe(50);
    expect(agg.entryCount).toBe(2);
  });
});
