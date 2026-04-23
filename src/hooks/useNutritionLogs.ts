import { useCallback, useEffect, useState } from "react";
import { getAdapter, makeId } from "../lib/storage";
import type { NutritionLog } from "../types";

function sortByCreated(list: NutritionLog[]): NutritionLog[] {
  return [...list].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

// CRUD nutrition logs. Pattern identique à useBodyWeight : adaptateur
// LocalStorage ↔ Supabase transparent, refresh sur event storage-changed.
export function useNutritionLogs() {
  const [logs, setLogs] = useState<NutritionLog[]>([]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getAdapter()
        .getNutritionLogs()
        .then((l) => {
          if (!cancelled) setLogs(sortByCreated(l));
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

  const persist = useCallback((next: NutritionLog[]) => {
    const sorted = sortByCreated(next);
    setLogs(sorted);
    void getAdapter().saveNutritionLogs(sorted);
  }, []);

  const addLog = useCallback(
    (entry: Omit<NutritionLog, "id" | "createdAt">) => {
      const log: NutritionLog = {
        ...entry,
        id: makeId(),
        createdAt: new Date().toISOString(),
      };
      persist([...logs, log]);
    },
    [persist, logs],
  );

  const removeLog = useCallback(
    (id: string) => persist(logs.filter((l) => l.id !== id)),
    [persist, logs],
  );

  const replaceAll = useCallback(
    (next: NutritionLog[]) => persist(next),
    [persist],
  );

  return { logs, addLog, removeLog, replaceAll };
}
