import { useCallback, useEffect, useState } from "react";
import { maybeAutoBackup } from "../lib/backup";
import { getAdapter, makeId } from "../lib/storage";
import type { Session } from "../types";

const MERGE_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours

function getSessionCreatedAt(s: Session): number {
  if (s.createdAt) return new Date(s.createdAt).getTime();
  const ts = parseInt(s.id, 10);
  return isNaN(ts) ? 0 : ts;
}

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
    void adapter.getBodyWeights().then((bw) => maybeAutoBackup(sorted, bw));
  }, []);

  const addSession = useCallback(
    (session: Omit<Session, "id">): { id: string; merged: boolean } => {
      const now = Date.now();
      const candidate = sessions.find(
        (s) =>
          s.date === session.date &&
          now - getSessionCreatedAt(s) < MERGE_WINDOW_MS,
      );

      if (candidate) {
        const merged: Session = {
          ...candidate,
          exercices: [...candidate.exercices, ...session.exercices],
          notes: [candidate.notes, session.notes].filter(Boolean).join(" · ") || undefined,
          bodyWeight: session.bodyWeight ?? candidate.bodyWeight,
          coachCommentary: undefined,
        };
        persist(sessions.map((s) => (s.id === candidate.id ? merged : s)));
        return { id: candidate.id, merged: true };
      }

      const id = makeId();
      const now_iso = new Date().toISOString();
      persist([...sessions, { ...session, id, createdAt: now_iso }]);
      return { id, merged: false };
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
