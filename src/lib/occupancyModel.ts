// Modèle d'affluence théorique pour une salle de sport urbaine. Les valeurs
// sont des estimations (0-100) basées sur les horaires typiques : creux la
// nuit, pics matin (7-9h), midi (12-13h) et soir (17-20h). Ce n'est PAS de
// la donnée en temps réel — c'est une heuristique pour aider l'utilisateur
// à planifier ses créneaux.

export type OccupancyLevel = "calme" | "normal" | "bonde";

// Courbe de base : occupation moyenne par heure (0h → 23h) pour une salle
// "normale" ouverte 6h-23h. Les heures fermées sont à 0.
const BASE_CURVE: number[] = [
  0, 0, 0, 0, 0, 0, // 0-5h
  10, 45, 75, 70, 45, 35, // 6-11h
  65, 75, 50, 35, 45, 70, // 12-17h
  85, 80, 65, 45, 25, 10, // 18-23h
];

const LEVEL_FACTOR: Record<OccupancyLevel, number> = {
  calme: 0.65,
  normal: 1,
  bonde: 1.25,
};

export interface OccupancyPoint {
  hour: number;
  label: string;
  value: number;
  isCurrent: boolean;
}

export function buildOccupancyCurve(
  level: OccupancyLevel = "normal",
  currentHour: number = new Date().getHours(),
): OccupancyPoint[] {
  const factor = LEVEL_FACTOR[level];
  return BASE_CURVE.map((v, h) => ({
    hour: h,
    label: `${h}h`,
    value: Math.min(100, Math.round(v * factor)),
    isCurrent: h === currentHour,
  }));
}
