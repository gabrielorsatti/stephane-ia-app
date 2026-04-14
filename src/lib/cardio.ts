import type { CardioData, ExerciseEntry, Session } from "../types";

// Calcule l'allure en minutes par km. Retourne null si données insuffisantes.
export function computePace(data: CardioData): number | null {
  if (!data.distance || !data.duree || data.distance <= 0) return null;
  return data.duree / data.distance;
}

// Formate une allure (min/km) en "m:ss" pour l'affichage.
export function formatPace(minPerKm: number | null): string {
  if (minPerKm == null || !isFinite(minPerKm)) return "—";
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Parse une allure saisie sous forme "m:ss" ou "m.ss" en minutes décimales.
export function parsePace(raw: string): number | null {
  const m = raw.match(/(\d+)[:.](\d{1,2})/);
  if (!m) {
    const n = parseFloat(raw.replace(",", "."));
    return isFinite(n) ? n : null;
  }
  const mins = parseInt(m[1], 10);
  const secs = parseInt(m[2], 10);
  if (secs >= 60) return null;
  return mins + secs / 60;
}

// Retourne uniquement les entrées cardio d'une séance.
export function cardioEntries(session: Session): ExerciseEntry[] {
  return session.exercices.filter((ex) => ex.cardio);
}

// Agrège distance totale et durée totale sur une liste de séances.
export function aggregateCardio(sessions: Session[]): {
  totalDistance: number;
  totalDuration: number;
  totalDenivele: number;
  entryCount: number;
} {
  let totalDistance = 0;
  let totalDuration = 0;
  let totalDenivele = 0;
  let entryCount = 0;
  for (const s of sessions) {
    for (const ex of s.exercices) {
      if (!ex.cardio) continue;
      entryCount += 1;
      if (ex.cardio.distance) totalDistance += ex.cardio.distance;
      if (ex.cardio.duree) totalDuration += ex.cardio.duree;
      if (ex.cardio.denivele) totalDenivele += ex.cardio.denivele;
    }
  }
  return { totalDistance, totalDuration, totalDenivele, entryCount };
}
