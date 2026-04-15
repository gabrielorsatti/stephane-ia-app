import { useCallback, useEffect, useState } from "react";
import { getAdapter, makeId } from "../lib/storage";
import type { OccupancyFeedback, OccupancyLevel } from "../types";

export function useOccupancyFeedback() {
  const [feedback, setFeedback] = useState<OccupancyFeedback[]>([]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getAdapter()
        .getOccupancyFeedback()
        .then((f) => {
          if (!cancelled) setFeedback(f);
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

  const persist = useCallback((next: OccupancyFeedback[]) => {
    setFeedback(next);
    void getAdapter().saveOccupancyFeedback(next);
  }, []);

  const addFeedback = useCallback(
    (input: {
      gymId: string;
      hour: number;
      dayOfWeek: number;
      level: OccupancyLevel;
    }) => {
      const entry: OccupancyFeedback = {
        id: makeId(),
        gymId: input.gymId,
        hour: input.hour,
        dayOfWeek: input.dayOfWeek,
        level: input.level,
        createdAt: new Date().toISOString(),
      };
      persist([...feedback, entry]);
      return entry;
    },
    [feedback, persist],
  );

  const removeFeedback = useCallback(
    (id: string) => persist(feedback.filter((f) => f.id !== id)),
    [feedback, persist],
  );

  const forGym = useCallback(
    (gymId: string) => feedback.filter((f) => f.gymId === gymId),
    [feedback],
  );

  return { feedback, addFeedback, removeFeedback, forGym };
}
