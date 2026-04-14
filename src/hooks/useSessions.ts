import { useCallback, useEffect, useState } from "react";
import { maybeAutoBackup } from "../lib/backup";
import { getAdapter, makeId } from "../lib/storage";
import type { Session } from "../types";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function load() {
      setReady(false);
      getAdapter()
        .getSessions()
        .then((s) => {
          if (cancelled) return;
          setSessions(sortByDateDesc(s));
          setReady(true);
        })
        .catch(() => {
          if (!cancelled) setReady(true);
        });
    }
    load();
    window.addEventListener("gym-tracker:storage-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("gym-tracker:storage-changed", load);
    };
  }, []);

  const persist = useCallback((next: Session[]) => {
    const sorted = sortByDateDesc(next);
    setSessions(sorted);
    const adapter = getAdapter();
    void adapter.saveSessions(sorted);
    // Miroir défensif + auto-backup quotidien si activé.
    void adapter.getBodyWeights().then((bw) => maybeAutoBackup(sorted, bw));
  }, []);

  const addSession = useCallback(
    (session: Omit<Session, "id">) => {
      persist([...sessions, { ...session, id: makeId() }]);
    },
    [persist, sessions],
  );

  const updateSession = useCallback(
    (id: string, patch: Partial<Session>) => {
      persist(
        sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
    },
    [persist, sessions],
  );

  const removeSession = useCallback(
    (id: string) => {
      persist(sessions.filter((s) => s.id !== id));
    },
    [persist, sessions],
  );

  const replaceAll = useCallback(
    (next: Session[]) => persist(next),
    [persist],
  );

  return {
    sessions,
    ready,
    addSession,
    updateSession,
    removeSession,
    replaceAll,
  };
}

function sortByDateDesc(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1));
}
