import { useCallback, useEffect, useState } from "react";
import { getAdapter } from "../lib/storage";
import type { PersonalRecordOverride } from "../types";

// Overrides manuels des records personnels. Persistés via le StorageAdapter
// actif (LocalStorage en solo, Supabase en mode connecté — RLS par user_id).
export function useRecordOverrides() {
  const [overrides, setOverrides] = useState<PersonalRecordOverride[]>([]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getAdapter()
        .getRecordOverrides()
        .then((o) => {
          if (!cancelled) setOverrides(o);
        })
        .catch(() => {});
    }
    load();
    window.addEventListener("stephane-ia:storage-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("stephane-ia:storage-changed", load);
    };
  }, []);

  const persist = useCallback((next: PersonalRecordOverride[]) => {
    setOverrides(next);
    void getAdapter().saveRecordOverrides(next);
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
