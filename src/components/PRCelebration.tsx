import { Trophy } from "lucide-react";
import { useEffect } from "react";
import type { PRAlert } from "../lib/prDetection";

interface Props {
  alerts: PRAlert[];
  onDone: () => void;
}

export function PRCelebration({ alerts, onDone }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, 5000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div
        className="bg-bg-card/95 backdrop-blur-lg border border-amber-400/40 rounded-2xl shadow-lg shadow-amber-400/10 px-6 py-5 max-w-sm w-full pointer-events-auto animate-fadeIn space-y-3"
        onClick={onDone}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-400/15 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-amber-400">
              Nouveau Record !
            </div>
            <div className="text-xs text-text-muted">
              {alerts.length === 1
                ? "Tu as battu un PR aujourd'hui"
                : `${alerts.length} records battus aujourd'hui`}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {alerts.map((pr, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-bg-soft border border-border rounded-lg px-3 py-2"
            >
              <span className="text-sm font-medium truncate">
                {pr.exerciseName}
              </span>
              <div className="flex items-center gap-1.5 shrink-0 text-xs">
                <span className="text-text-dim font-mono line-through">
                  {pr.oldValue} {pr.type === "maxPoids" ? "kg" : "1RM"}
                </span>
                <span className="font-bold text-amber-400">
                  {pr.newValue} {pr.type === "maxPoids" ? "kg" : "1RM"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
