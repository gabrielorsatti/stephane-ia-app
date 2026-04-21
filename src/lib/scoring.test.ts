import { describe, expect, it } from "vitest";
import {
  bestEstimated1RM,
  durationScore,
  estimate1RM,
  exerciseVolume,
  sessionScore,
  sessionVolume,
  volumeByCategory,
} from "./scoring";
import type { Session } from "../types";

const session: Session = {
  id: "s1",
  date: "2026-01-15",
  exercices: [
    {
      nom: "Développé couché",
      categorie: "Poussée",
      sets: [
        { reps: 10, poids: 80 },
        { reps: 8, poids: 85 },
      ],
    },
    {
      nom: "Squat",
      categorie: "Jambes",
      sets: [{ reps: 5, poids: 120 }],
    },
  ],
};

describe("scoring", () => {
  it("calcule le volume d'un exercice", () => {
    expect(exerciseVolume(session.exercices[0])).toBe(10 * 80 + 8 * 85);
  });

  it("calcule le volume total d'une séance", () => {
    expect(sessionVolume(session)).toBe(800 + 680 + 600);
  });

  it("estime le 1RM via Epley", () => {
    expect(estimate1RM({ reps: 10, poids: 80 })).toBeCloseTo(106.67, 1);
  });

  it("retourne 0 pour un set sans poids", () => {
    expect(estimate1RM({ reps: 10, poids: 0 })).toBe(0);
  });

  it("prend la meilleure estimation 1RM d'un exercice", () => {
    const best = bestEstimated1RM(session.exercices[0]);
    expect(best).toBeCloseTo(85 * (1 + 8 / 30), 2);
  });

  it("produit un score entier positif", () => {
    expect(sessionScore(session)).toBeGreaterThan(0);
    expect(Number.isInteger(sessionScore(session))).toBe(true);
  });

  it("agrège le volume par catégorie", () => {
    const map = volumeByCategory([session]);
    expect(map["Poussée"]).toBe(1480);
    expect(map["Jambes"]).toBe(600);
  });

  it("calcule un score > 0 pour les exercices bodyweight sans lest", () => {
    const bwSession: Session = {
      id: "s2",
      date: "2026-01-16",
      exercices: [
        {
          nom: "Pompes",
          categorie: "Poussée",
          sets: [{ reps: 20, poids: 0 }],
        },
      ],
    };
    expect(sessionScore(bwSession)).toBeGreaterThan(0);
  });

  it("calcule un durationScore pour les exercices bien-être", () => {
    expect(durationScore({ nom: "Yoga", categorie: "Mobilité", sets: [], durationMinutes: 60, intensity: "modéré" })).toBe(180);
    expect(durationScore({ nom: "HIIT", categorie: "Cours Collectif", sets: [], durationMinutes: 30, intensity: "intense" })).toBe(135);
    expect(durationScore({ nom: "Marche", categorie: "Cardio", sets: [], durationMinutes: 45, intensity: "léger" })).toBe(90);
  });

  it("inclut le durationScore dans le sessionScore", () => {
    const wellnessSession: Session = {
      id: "s3",
      date: "2026-01-17",
      exercices: [
        { nom: "Yoga Hatha", categorie: "Mobilité", sets: [], durationMinutes: 60, intensity: "modéré" },
      ],
    };
    expect(sessionScore(wellnessSession)).toBeGreaterThan(0);
  });
});
