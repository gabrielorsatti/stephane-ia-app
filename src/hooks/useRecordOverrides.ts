import { useCallback, useEffect, useState } from "react";
import { recordOverridesStore } from "../lib/storage";
import type { PersonalRecordOverride } from "../types";

export function useRecordOverrides() {
  const [overrides, setOverrides] = useState<PersonalRecordOverride[]>([]);

  useEffect(() => {
    recordOverridesStore.get().then(setOverrides);
  }, []);

  const persist = useCallback((next: PersonalRecordOverride[]) => {
    setOverrides(next);
    void recordOverridesStore.save(next);
  }, []);

  const upsert = useCallback(
    (override: PersonalRecordOverride) => {
      persist([
        ...overrides.filter((o) => o.nom !== override.nom),
        override,
      ]);
    },
    [overrides, persist],
  );

  const remove = useCallback(
    (nom: string) => persist(overrides.filter((o) => o.nom !== nom)),
    [overrides, persist],
  );

  return { overrides, upsert, remove };
}
