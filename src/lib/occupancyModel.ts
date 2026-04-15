// Modèle d'affluence contextuel. La courbe de base capture le rythme urbain
// classique (pics matin/midi/soir) ; elle est ensuite pondérée par le type
// de quartier (business district = creux le WE, city_center = soir blindé),
// le jour de la semaine, et les retours "Crowd Check" de l'utilisateur pour
// la salle concernée. Ce n'est pas du temps réel — c'est un prior bayésien
// léger, que les feedbacks viennent corriger localement au fil de l'eau.

import type { LocationType, OccupancyFeedback, OccupancyLevel } from "../types";

// Vibe globale saisie manuellement (fallback quand il n'y a ni feedback ni
// location_type). Renommé depuis "OccupancyLevel" pour lever l'ambiguïté
// avec le level per-heure des feedbacks.
export type CrowdVibe = "calme" | "normal" | "bonde";

const BASE_CURVE: number[] = [
  0, 0, 0, 0, 0, 0, // 0-5h
  10, 45, 75, 70, 45, 35, // 6-11h
  65, 75, 50, 35, 45, 70, // 12-17h
  85, 80, 65, 45, 25, 10, // 18-23h
];

const VIBE_FACTOR: Record<CrowdVibe, number> = {
  calme: 0.65,
  normal: 1,
  bonde: 1.25,
};

// Valeur cible (0-100) associée à un feedback ponctuel. Ces ancres servent
// à "tirer" la courbe vers le ressenti observé (moyenne pondérée).
const FEEDBACK_TARGET: Record<OccupancyLevel, number> = {
  vide: 20,
  moyen: 55,
  bonde: 90,
};

export interface OccupancyPoint {
  hour: number;
  label: string;
  value: number;
  isCurrent: boolean;
  // true si la valeur a été ajustée par au moins un feedback utilisateur.
  hasFeedback: boolean;
}

export interface OccupancyModelInput {
  currentHour?: number;
  dayOfWeek?: number; // 0=dim, 6=sam
  locationType?: LocationType;
  feedbacks?: OccupancyFeedback[];
  // Fallback manuel si pas de location_type ni feedbacks.
  vibe?: CrowdVibe;
}

export function buildOccupancyCurve(
  input: OccupancyModelInput = {},
): OccupancyPoint[] {
  const currentHour = input.currentHour ?? new Date().getHours();
  const dayOfWeek = input.dayOfWeek ?? new Date().getDay();
  const feedbacks = input.feedbacks ?? [];
  const vibe = input.vibe ?? "normal";

  // 1. Courbe de base modulée par la vibe (si pas de contexte).
  const base = BASE_CURVE.map((v) => v * VIBE_FACTOR[vibe]);

  // 2. Ajustement par type de quartier et jour.
  const contextual = base.map((v, h) =>
    applyContext(v, h, dayOfWeek, input.locationType),
  );

  // 3. Fusion avec les feedbacks : moyenne pondérée par heure.
  const byHour = groupFeedbackByHour(feedbacks, dayOfWeek);

  return contextual.map((v, h) => {
    const hourFeedbacks = byHour.get(h) ?? [];
    let value = v;
    if (hourFeedbacks.length > 0) {
      const avgTarget =
        hourFeedbacks.reduce((s, f) => s + FEEDBACK_TARGET[f.level], 0) /
        hourFeedbacks.length;
      // Plus il y a de feedbacks, plus on fait confiance au signal observé.
      // Avec 1 feedback : poids 0.4 ; avec 5+ : poids ~0.8.
      const weight = Math.min(0.8, 0.4 + 0.1 * (hourFeedbacks.length - 1));
      value = v * (1 - weight) + avgTarget * weight;
    }
    return {
      hour: h,
      label: `${h}h`,
      value: Math.max(0, Math.min(100, Math.round(value))),
      isCurrent: h === currentHour,
      hasFeedback: hourFeedbacks.length > 0,
    };
  });
}

function applyContext(
  value: number,
  hour: number,
  dayOfWeek: number,
  location?: LocationType,
): number {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isSaturday = dayOfWeek === 6;

  if (location === "business_district") {
    // Quartier de bureaux : pic midi renforcé, soir allégé, WE quasi-désert.
    if (isWeekend) return value * 0.35;
    if (hour >= 12 && hour <= 14) return value * 1.2;
    if (hour >= 18 && hour <= 20) return value * 0.85;
  } else if (location === "city_center") {
    // Centre-ville : soir très chargé, midi correct, WE équilibré.
    if (hour >= 18 && hour <= 21) return value * 1.15;
    if (isWeekend && hour >= 10 && hour <= 13) return value * 1.1;
  } else if (location === "suburban") {
    // Périurbain : creux en journée, samedi matin très chargé.
    if (isSaturday && hour >= 9 && hour <= 12) return value * 1.25;
    if (!isWeekend && hour >= 10 && hour <= 16) return value * 0.85;
  }
  return value;
}

function groupFeedbackByHour(
  feedbacks: OccupancyFeedback[],
  dayOfWeek: number,
): Map<number, OccupancyFeedback[]> {
  const map = new Map<number, OccupancyFeedback[]>();
  for (const f of feedbacks) {
    // On considère les feedbacks du même jour de la semaine (±1 jour pour
    // les jours adjacents, pondération simple : on garde exact pour l'instant).
    if (f.dayOfWeek !== dayOfWeek) continue;
    const list = map.get(f.hour) ?? [];
    list.push(f);
    map.set(f.hour, list);
  }
  return map;
}
