import { Minus, Pause, Play, Plus, RotateCcw, Timer, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const PRESETS = [60, 90, 120] as const;
const ADJUST_STEP = 15;
const LS_KEY = "gym-track:rest-timer-pref";

function loadPreferred(): number {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v ? parseInt(v, 10) || 90 : 90;
  } catch {
    return 90;
  }
}

function savePreferred(s: number) {
  try {
    localStorage.setItem(LS_KEY, String(s));
  } catch { /* noop */ }
}

interface Props {
  onClose: () => void;
}

export function RestTimer({ onClose }: Props) {
  const [duration, setDuration] = useState(loadPreferred);
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const vibrate = useCallback(() => {
    try {
      navigator.vibrate?.([200, 100, 200, 100, 200]);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (!running || finished) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setFinished(true);
          setRunning(false);
          vibrate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, finished, vibrate]);

  function selectPreset(s: number) {
    savePreferred(s);
    setDuration(s);
    setRemaining(s);
    setRunning(true);
    setFinished(false);
  }

  function adjust(delta: number) {
    const next = Math.max(ADJUST_STEP, remaining + delta);
    setRemaining(next);
    setDuration((d) => Math.max(ADJUST_STEP, d + delta));
    if (finished) {
      setFinished(false);
      setRunning(true);
    }
  }

  function reset() {
    setRemaining(duration);
    setRunning(true);
    setFinished(false);
  }

  function togglePause() {
    if (finished) {
      reset();
    } else {
      setRunning((r) => !r);
    }
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = duration > 0 ? ((duration - remaining) / duration) * 100 : 100;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-sm">
      <div
        className={[
          "bg-bg-card/95 backdrop-blur-lg border rounded-2xl shadow-lg px-4 py-3 space-y-3 transition-colors",
          finished ? "border-accent shadow-accent/20" : "border-border",
        ].join(" ")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold">Repos</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-bg-elev text-text-muted transition-colors"
            aria-label="Fermer le minuteur"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-1.5 bg-bg-soft rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-soft rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => adjust(-ADJUST_STEP)}
            className="w-9 h-9 rounded-xl bg-bg-soft border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-accent/40 transition-colors active:scale-95"
            aria-label={`Moins ${ADJUST_STEP} secondes`}
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div
              className={[
                "text-3xl font-bold tabular-nums tracking-tight transition-colors",
                finished ? "text-accent animate-pulse" : "text-text",
              ].join(" ")}
            >
              {mins}:{secs.toString().padStart(2, "0")}
            </div>
            {finished && (
              <div className="text-xs font-semibold text-accent mt-0.5">
                C'est reparti !
              </div>
            )}
          </div>

          <button
            onClick={() => adjust(ADJUST_STEP)}
            className="w-9 h-9 rounded-xl bg-bg-soft border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-accent/40 transition-colors active:scale-95"
            aria-label={`Plus ${ADJUST_STEP} secondes`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-1">
            {PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => selectPreset(s)}
                className={[
                  "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors active:scale-95",
                  duration === s && !finished
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "bg-bg-soft border border-border text-text-muted hover:text-text hover:border-accent/40",
                ].join(" ")}
              >
                {s}s
              </button>
            ))}
          </div>

          <button
            onClick={togglePause}
            className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shadow-md shadow-accent/20 transition-transform active:scale-95"
            aria-label={running ? "Pause" : "Reprendre"}
          >
            {running ? <Pause className="w-4 h-4" /> : finished ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={reset}
            className="w-9 h-9 rounded-xl bg-bg-soft border border-border flex items-center justify-center text-text-muted hover:text-text transition-colors active:scale-95"
            aria-label="Recommencer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
