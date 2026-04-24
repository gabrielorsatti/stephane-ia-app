import { useCallback, useEffect, useRef, useState } from "react";

const LS_KEY = "stephane-live-session";

export interface LiveSessionState {
  sessionId: string;
  startedAt: string; // ISO
}

function load(): LiveSessionState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.sessionId && parsed?.startedAt) return parsed as LiveSessionState;
  } catch { /* corrupted */ }
  return null;
}

function save(state: LiveSessionState | null) {
  if (state) localStorage.setItem(LS_KEY, JSON.stringify(state));
  else localStorage.removeItem(LS_KEY);
}

export function useLiveSession() {
  const [state, setState] = useState<LiveSessionState | null>(load);

  const start = useCallback((sessionId: string, startedAt: string) => {
    const next: LiveSessionState = { sessionId, startedAt };
    save(next);
    setState(next);
  }, []);

  const stop = useCallback(() => {
    save(null);
    setState(null);
  }, []);

  return { liveSession: state, startLiveSession: start, stopLiveSession: stop };
}

export function useElapsedTimer(startedAt: string | null) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!startedAt) { setElapsed(0); return; }
    const origin = new Date(startedAt).getTime();
    function tick() {
      setElapsed(Math.floor((Date.now() - origin) / 1000));
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [startedAt]);

  return elapsed;
}

export function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
