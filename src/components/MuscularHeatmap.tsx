import { useMemo } from "react";
import type { Session } from "../types";
import {
  computeMuscleHeat,
  MUSCLE_LABELS,
  type MuscleGroup,
} from "../lib/muscleMapping";

interface Props {
  sessions: Session[];
}

function heatColor(ratio: number): string {
  if (ratio < 0.05) return "rgb(var(--c-bg-elev))";
  const r = Math.round(60 + 195 * ratio);
  const g = Math.round(180 - 130 * ratio);
  const b = Math.round(120 - 80 * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

type MuscleZone = {
  id: MuscleGroup;
  d: string;
};

const FRONT_ZONES: MuscleZone[] = [
  // Chest
  { id: "chest", d: "M36,38 Q50,34 50,42 Q50,50 42,50 Q34,48 36,38 Z" },
  { id: "chest", d: "M64,38 Q50,34 50,42 Q50,50 58,50 Q66,48 64,38 Z" },
  // Shoulders
  { id: "shoulders", d: "M30,34 Q26,30 24,36 Q24,42 30,42 Q34,40 36,38 Q34,34 30,34 Z" },
  { id: "shoulders", d: "M70,34 Q74,30 76,36 Q76,42 70,42 Q66,40 64,38 Q66,34 70,34 Z" },
  // Biceps
  { id: "biceps", d: "M24,42 Q22,48 22,56 Q22,60 26,60 Q30,58 30,42 Z" },
  { id: "biceps", d: "M76,42 Q78,48 78,56 Q78,60 74,60 Q70,58 70,42 Z" },
  // Forearms
  { id: "forearms", d: "M22,60 Q20,68 18,76 Q20,78 24,76 Q26,68 26,60 Z" },
  { id: "forearms", d: "M78,60 Q80,68 82,76 Q80,78 76,76 Q74,68 74,60 Z" },
  // Core
  { id: "core", d: "M42,50 Q50,48 58,50 L58,72 Q50,74 42,72 Z" },
  // Quads
  { id: "quads", d: "M38,72 Q42,72 44,76 Q46,88 44,100 Q40,100 36,88 Q34,80 38,72 Z" },
  { id: "quads", d: "M62,72 Q58,72 56,76 Q54,88 56,100 Q60,100 64,88 Q66,80 62,72 Z" },
  // Calves
  { id: "calves", d: "M36,104 Q38,110 40,118 Q40,126 38,130 Q34,128 34,118 Q34,110 36,104 Z" },
  { id: "calves", d: "M64,104 Q62,110 60,118 Q60,126 62,130 Q66,128 66,118 Q66,110 64,104 Z" },
];

const BACK_ZONES: MuscleZone[] = [
  // Upper back / Traps
  { id: "upperBack", d: "M36,34 Q50,30 64,34 Q60,38 50,40 Q40,38 36,34 Z" },
  // Lats
  { id: "lats", d: "M34,42 Q38,40 42,46 L42,60 Q38,64 34,60 Q32,52 34,42 Z" },
  { id: "lats", d: "M66,42 Q62,40 58,46 L58,60 Q62,64 66,60 Q68,52 66,42 Z" },
  // Lower back
  { id: "lowerBack", d: "M42,60 Q50,58 58,60 L58,72 Q50,74 42,72 Z" },
  // Triceps
  { id: "triceps", d: "M24,42 Q22,48 22,56 Q22,60 26,60 Q30,58 30,42 Z" },
  { id: "triceps", d: "M76,42 Q78,48 78,56 Q78,60 74,60 Q70,58 70,42 Z" },
  // Glutes
  { id: "glutes", d: "M38,72 Q50,70 62,72 Q64,80 58,84 Q50,86 42,84 Q36,80 38,72 Z" },
  // Hamstrings
  { id: "hamstrings", d: "M38,84 Q42,86 44,90 Q46,98 44,106 Q40,108 36,98 Q34,90 38,84 Z" },
  { id: "hamstrings", d: "M62,84 Q58,86 56,90 Q54,98 56,106 Q60,108 64,98 Q66,90 62,84 Z" },
  // Calves (back)
  { id: "calves", d: "M36,108 Q38,114 40,122 Q40,130 38,134 Q34,132 34,122 Q34,114 36,108 Z" },
  { id: "calves", d: "M64,108 Q62,114 60,122 Q60,130 62,134 Q66,132 66,122 Q66,114 64,108 Z" },
];

function BodySilhouette({ className }: { className?: string }) {
  return (
    <path
      className={className}
      d="M50,8 Q56,8 58,14 Q60,20 58,26 Q56,30 50,30 Q44,30 42,26 Q40,20 42,14 Q44,8 50,8 Z
         M30,34 Q36,30 50,28 Q64,30 70,34 Q76,30 78,38 Q80,50 78,60 Q80,68 82,78 L76,78 Q74,68 74,60 Q70,58 66,60 Q68,52 66,42 Q62,38 50,36 Q38,38 34,42 Q32,52 34,60 Q30,58 26,60 Q26,68 24,78 L18,78 Q20,68 22,60 Q20,50 22,38 Q24,30 30,34 Z
         M42,72 Q38,72 36,80 Q34,90 36,100 Q34,104 34,118 Q34,130 38,134 Q42,132 42,126 Q44,118 44,108 Q46,100 48,90 Q50,86 52,90 Q54,100 56,108 Q56,118 58,126 Q58,132 62,134 Q66,130 66,118 Q66,104 64,100 Q66,90 64,80 Q62,72 58,72 Z"
      fill="none"
      stroke="rgb(var(--c-border-strong))"
      strokeWidth="0.8"
      opacity="0.5"
    />
  );
}

function MuscleZones({
  zones,
  scores,
  maxScore,
}: {
  zones: MuscleZone[];
  scores: Record<MuscleGroup, number>;
  maxScore: number;
}) {
  return (
    <>
      {zones.map((zone, i) => {
        const ratio = maxScore > 0 ? scores[zone.id] / maxScore : 0;
        return (
          <path
            key={`${zone.id}-${i}`}
            d={zone.d}
            fill={heatColor(ratio)}
            stroke="rgb(var(--c-border))"
            strokeWidth="0.3"
            opacity="0.85"
          >
            <title>{MUSCLE_LABELS[zone.id]}</title>
          </path>
        );
      })}
    </>
  );
}

export function MuscularHeatmap({ sessions }: Props) {
  const { scores, maxScore } = useMemo(
    () => computeMuscleHeat(sessions, 7),
    [sessions],
  );

  const active = Object.entries(scores)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="card !p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Carte musculaire</div>
          <div className="text-xs text-text-dim">7 derniers jours</div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-text-dim">
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: heatColor(0) }}
            />
            Repos
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: heatColor(0.5) }}
            />
            Modéré
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: heatColor(1) }}
            />
            Intense
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {/* Front view */}
        <div className="text-center">
          <svg viewBox="14 4 72 134" className="w-28 sm:w-36 h-auto">
            <BodySilhouette />
            <MuscleZones zones={FRONT_ZONES} scores={scores} maxScore={maxScore} />
          </svg>
          <div className="text-[10px] text-text-dim mt-1">Face</div>
        </div>
        {/* Back view */}
        <div className="text-center">
          <svg viewBox="14 4 72 134" className="w-28 sm:w-36 h-auto">
            <BodySilhouette />
            <MuscleZones zones={BACK_ZONES} scores={scores} maxScore={maxScore} />
          </svg>
          <div className="text-[10px] text-text-dim mt-1">Dos</div>
        </div>
      </div>

      {/* Legend — top worked muscles */}
      {active.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {active.slice(0, 6).map(([key, val]) => (
            <span
              key={key}
              className="chip text-xs border"
              style={{
                background: heatColor(val / maxScore) + "22",
                borderColor: heatColor(val / maxScore),
                color: heatColor(val / maxScore),
              }}
            >
              {MUSCLE_LABELS[key as MuscleGroup]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
