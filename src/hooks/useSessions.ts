import { useCallback, useEffect, useRef, useState } from "react";
import { maybeAutoBackup } from "../lib/backup";
import { getAdapter, makeId } from "../lib/storage";
import { showError } from "../components/ErrorToast";
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
  const ref = useRef(sessions);

  useEffect(() => {
    let cancelled = false;
    function load() {
      setReady(false);
      getAdapter()
        .getSessions()
        .then((s) => {
          if (cancelled) return;
          const sorted = sortByDateDesc(s);
          ref.current = sorted;
          setSessions(sorted);
          setReady(true);
        })
        .catch((err) => {
          if (!cancelled) {
            console.warn("[useSessions] load failed", err);
            showError("Impossible de charger les séances. Vérifie ta connexion.");
            setReady(true);
          }
        });
    }
    load();
    window.addEventListener("stephane-ia:storage-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("stephane-ia:storage-changed", load);
    };
  }, []);

  const persist = useCallback((next: Session[]) => {
    const sorted = sortByDateDesc(next);
    ref.current = sorted;
    setSessions(sorted);
    const adapter = getAdapter();
    void adapter.saveSessions(sorted).catch((err) => {
      console.warn("[useSessions] save failed", err);
      showError("Sauvegarde échouée. Tes données seront resynchronisées.");
    });
    void adapter.getBodyWeights().then((bw) => maybeAutoBackup(sorted, bw)).catch(() => {});
  }, []);

  const addSession = useCallback(
    (session: Omit<Session, "id">): { id: string; merged: boolean; session: Session } => {
      const current = ref.current;
      const now = Date.now();
      const candidate = current.find(
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
        persist(current.map((s) => (s.id === candidate.id ? merged : s)));
        return { id: candidate.id, merged: true, session: merged };
      }

      const id = makeId();
      const created: Session = { ...session, id, createdAt: new Date().toISOString() };
      persist([...current, created]);
      return { id, merged: false, session: created };
    },
    [persist],
  );

  const updateSession = useCallback(
    (id: string, patch: Partial<Session>) => {
      persist(
        ref.current.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
    },
    [persist],
  );

  const removeSession = useCallback(
    (id: string) => {
      persist(ref.current.filter((s) => s.id !== id));
    },
    [persist],
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
