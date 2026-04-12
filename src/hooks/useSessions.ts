import { useCallback, useEffect, useState } from "react";
import { localStorageAdapter, makeId } from "../lib/storage";
import type { Session } from "../types";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    localStorageAdapter.getSessions().then((s) => {
      setSessions(sortByDateDesc(s));
      setReady(true);
    });
  }, []);

  const persist = useCallback((next: Session[]) => {
    const sorted = sortByDateDesc(next);
    setSessions(sorted);
    void localStorageAdapter.saveSessions(sorted);
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
