import { useCallback, useEffect, useState } from "react";
import type { ProgramTemplate } from "../data/programs";
import {
  getProgramsSync,
  resetProgramsToDefaults,
  savePrograms,
} from "../lib/programsStore";

// Hook React qui expose les programmes éditables et leur persistance.
export function usePrograms() {
  const [programs, setPrograms] = useState<ProgramTemplate[]>(() =>
    getProgramsSync(),
  );

  useEffect(() => {
    setPrograms(getProgramsSync());
  }, []);

  const persist = useCallback((next: ProgramTemplate[]) => {
    setPrograms(next);
    savePrograms(next);
  }, []);

  const replaceAll = useCallback(
    (next: ProgramTemplate[]) => persist(next),
    [persist],
  );

  const upsertProgram = useCallback(
    (p: ProgramTemplate) => {
      const next = programs.some((x) => x.id === p.id)
        ? programs.map((x) => (x.id === p.id ? p : x))
        : [...programs, p];
      persist(next);
    },
    [programs, persist],
  );

  const reset = useCallback(() => {
    resetProgramsToDefaults();
    setPrograms(getProgramsSync());
  }, []);

  return { programs, replaceAll, upsertProgram, reset };
}
