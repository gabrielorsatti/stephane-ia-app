import { DEFAULT_PROGRAMS, type ProgramTemplate } from "../data/programs";

const KEY = "stephane-ia:programs:v1";

// Retourne les programmes actuels (sync, lit le LocalStorage). Initialise
// avec les valeurs par défaut au premier accès.
export function getProgramsSync(): ProgramTemplate[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ProgramTemplate[];
    }
  } catch {
    /* ignore JSON / storage errors et bascule sur le défaut */
  }
  // Premier accès : seed silencieux.
  try {
    localStorage.setItem(KEY, JSON.stringify(DEFAULT_PROGRAMS));
  } catch {
    /* storage indisponible : on retournera les défauts en mémoire */
  }
  return DEFAULT_PROGRAMS;
}

export function savePrograms(programs: ProgramTemplate[]): void {
  localStorage.setItem(KEY, JSON.stringify(programs));
}

export function resetProgramsToDefaults(): void {
  savePrograms(DEFAULT_PROGRAMS);
}
