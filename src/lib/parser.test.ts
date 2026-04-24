import { describe, expect, it } from "vitest";
import { parseInput, parseSegment } from "./parser";

describe("parseSegment", () => {
  it("parse la forme canonique française", () => {
    const ex = parseSegment("3 séries de 12 rep de DC à 80kg");
    expect(ex).not.toBeNull();
    expect(ex!.nom).toBe("Développé couché");
    expect(ex!.categorie).toBe("Poussée");
    expect(ex!.sets).toHaveLength(3);
    expect(ex!.sets[0]).toEqual({ reps: 12, poids: 80 });
  });

  it("parse la forme NxM compacte", () => {
    const ex = parseSegment("4x10 squat 100kg");
    expect(ex!.nom).toBe("Squat");
    expect(ex!.sets).toHaveLength(4);
    expect(ex!.sets[0]).toEqual({ reps: 10, poids: 100 });
  });

  it("parse le nom d'exercice en premier avec @", () => {
    const ex = parseSegment("développé couché 3x12 @ 80");
    expect(ex!.nom).toBe("Développé couché");
    expect(ex!.sets[0]).toEqual({ reps: 12, poids: 80 });
  });

  it("parse avec astérisque et virgule décimale", () => {
    const ex = parseSegment("curl 3*10 à 12,5");
    expect(ex!.nom).toBe("Curl haltères");
    expect(ex!.sets[0]).toEqual({ reps: 10, poids: 12.5 });
  });

  it("parse SDT en tirage", () => {
    const ex = parseSegment("SDT 5x5 120kg");
    expect(ex!.nom).toBe("Soulevé de terre");
    expect(ex!.categorie).toBe("Tirage");
    expect(ex!.sets).toHaveLength(5);
    expect(ex!.sets[0].poids).toBe(120);
  });

  it("retourne null si aucun exercice reconnu", () => {
    expect(parseSegment("3x10 bidule 50kg")).toBeNull();
  });

  it("retourne null si pas de sets/reps", () => {
    expect(parseSegment("DC 80kg")).toBeNull();
  });

  // ── Formats flexibles ──
  it("parse '10 reps x 3 @ 80' (reps d'abord)", () => {
    const ex = parseSegment("DC 10 reps x 3 @ 80");
    expect(ex).not.toBeNull();
    expect(ex!.nom).toBe("Développé couché");
    expect(ex!.sets).toHaveLength(3);
    expect(ex!.sets[0]).toEqual({ reps: 10, poids: 80 });
  });

  it("parse '80kg 3 sets de 10' (poids en premier)", () => {
    const ex = parseSegment("squat 80kg 3 sets de 10");
    expect(ex).not.toBeNull();
    expect(ex!.nom).toBe("Squat");
    expect(ex!.sets).toHaveLength(3);
    expect(ex!.sets[0]).toEqual({ reps: 10, poids: 80 });
  });

  it("parse '3 sets 10 reps 80kg' (composants séparés)", () => {
    const ex = parseSegment("DC 3 sets 10 reps 80kg");
    expect(ex).not.toBeNull();
    expect(ex!.nom).toBe("Développé couché");
    expect(ex!.sets).toHaveLength(3);
    expect(ex!.sets[0]).toEqual({ reps: 10, poids: 80 });
  });

  it("parse '10 reps 3 series' (reps puis series)", () => {
    const ex = parseSegment("tractions 10 reps 3 series");
    expect(ex).not.toBeNull();
    expect(ex!.nom).toBe("Tractions");
    expect(ex!.sets).toHaveLength(3);
    expect(ex!.sets[0]).toEqual({ reps: 10, poids: 0 });
  });

  it("parse '5 reps DC 80kg' (reps seules → 1 set)", () => {
    const ex = parseSegment("5 reps DC 80kg");
    expect(ex).not.toBeNull();
    expect(ex!.nom).toBe("Développé couché");
    expect(ex!.sets).toHaveLength(1);
    expect(ex!.sets[0]).toEqual({ reps: 5, poids: 80 });
  });

  it("gère le poids du corps (pas de kg mentionné)", () => {
    const ex = parseSegment("tractions 3x10");
    expect(ex!.nom).toBe("Tractions");
    expect(ex!.sets[0].poids).toBe(0);
  });

  it("privilégie l'alias le plus long", () => {
    // "curl marteau" doit être préféré à "curl" seul.
    const ex = parseSegment("curl marteau 3x10 à 15");
    expect(ex!.nom).toBe("Curl marteau");
  });

  it("reconnaît les nouveaux mouvements du programme", () => {
    const cases: Array<[string, string]> = [
      ["DC haltères 3x10 à 32kg", "Développé couché haltères"],
      ["DI machine 3x12 à 80kg", "Développé incliné machine"],
      ["pec fly 3x12 à 25kg", "Pec deck"],
      ["dips lestés 3x8 à 20kg", "Dips lestés"],
      ["dips machine 3x12 à 100kg", "Dips machine"],
      ["tractions pronation 3x10", "Tractions"],
      ["rowing unilatéral 3x12 à 45kg", "Rowing haltère"],
      ["curl incliné 3x10 à 12kg", "Curl incliné"],
      ["french press 3x10 à 10kg", "French press"],
      ["élévations poulie 3x12 à 5kg", "Élévations latérales poulie"],
    ];
    for (const [input, expected] of cases) {
      const ex = parseSegment(input);
      expect(ex, input).not.toBeNull();
      expect(ex!.nom, input).toBe(expected);
    }
  });
});

describe("parseSegment cardio", () => {
  it("parse 'Course 5km en 25min'", () => {
    const ex = parseSegment("Course 5km en 25min");
    expect(ex).not.toBeNull();
    expect(ex!.categorie).toBe("Cardio");
    expect(ex!.cardio?.distance).toBe(5);
    expect(ex!.cardio?.duree).toBe(25);
  });

  it("parse 'Vélo 20km allure 3:00'", () => {
    const ex = parseSegment("Vélo 20km allure 3:00");
    expect(ex).not.toBeNull();
    expect(ex!.categorie).toBe("Cardio");
    expect(ex!.cardio?.distance).toBe(20);
    // allure 3:00 sur 20km → 60 min
    expect(ex!.cardio?.duree).toBe(60);
  });

  it("parse dénivelé '+100m'", () => {
    const ex = parseSegment("Course 10km 45min +100m");
    expect(ex!.cardio?.denivele).toBe(100);
  });

  it("parse durée en heures '1h30'", () => {
    const ex = parseSegment("Vélo 40km 1h30");
    expect(ex!.cardio?.duree).toBe(90);
  });
});

describe("parseInput", () => {
  it("parse plusieurs lignes", () => {
    const res = parseInput(
      "3x12 DC à 80kg\n4x10 squat 100kg\ncurl 3x12 à 15",
    );
    expect(res.exercices).toHaveLength(3);
    expect(res.unrecognized).toHaveLength(0);
  });

  it("sépare sur 'puis'", () => {
    const res = parseInput("3x12 DC à 80kg puis 5x5 SDT 120kg");
    expect(res.exercices).toHaveLength(2);
    expect(res.exercices[0].nom).toBe("Développé couché");
    expect(res.exercices[1].nom).toBe("Soulevé de terre");
  });

  it("remonte les segments non reconnus", () => {
    const res = parseInput("3x10 bidule 50kg\n4x8 squat 100kg");
    expect(res.exercices).toHaveLength(1);
    expect(res.unrecognized).toHaveLength(1);
  });

  it("ignore les lignes vides", () => {
    const res = parseInput("\n\n3x12 DC à 80kg\n\n");
    expect(res.exercices).toHaveLength(1);
    expect(res.unrecognized).toHaveLength(0);
  });
});
