import { useCallback, useEffect, useState } from "react";
import { getAdapter } from "../lib/storage";
import type { BodyWeightEntry } from "../types";

export function useBodyWeight() {
  const [entries, setEntries] = useState<BodyWeightEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getAdapter()
        .getBodyWeights()
        .then((e) => {
          if (!cancelled) setEntries(sortAsc(e));
        })
        .catch(() => {});
    }
    load();
    window.addEventListener("gym-tracker:storage-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("gym-tracker:storage-changed", load);
    };
  }, []);

  const persist = useCallback((next: BodyWeightEntry[]) => {
    const sorted = sortAsc(next);
    setEntries(sorted);
    void getAdapter().saveBodyWeights(sorted);
  }, []);

  const addEntry = useCallback(
    (entry: BodyWeightEntry) => {
      // Remplace l'entrée si la date existe déjà.
      const filtered = entries.filter((e) => e.date !== entry.date);
      persist([...filtered, entry]);
    },
    [persist, entries],
  );

  const removeEntry = useCallback(
    (date: string) => persist(entries.filter((e) => e.date !== date)),
    [persist, entries],
  );

  const replaceAll = useCallback(
    (next: BodyWeightEntry[]) => persist(next),
    [persist],
  );

  const latest = entries[entries.length - 1];

  return { entries, addEntry, removeEntry, latest, replaceAll };
}

function sortAsc(list: BodyWeightEntry[]): BodyWeightEntry[] {
  return [...list].sort((a, b) => (a.date < b.date ? -1 : 1));
}
