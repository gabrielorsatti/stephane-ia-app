import { useMemo } from "react";
import type { Session } from "../types";
import {
  ALL_MUSCLES,
  computeMuscleHeat,
  intensityLevel,
  MUSCLE_LABELS,
  type IntensityLevel,
  type MuscleGroup,
} from "../lib/muscleMapping";

interface Props {
  sessions: Session[];
}

const LEVEL_COLORS: Record<IntensityLevel, string> = {
  0: "#2a3a2e",
  1: "#8a7a20",
  2: "#b84030",
  3: "#e02020",
};

const LEVEL_GLOW: Record<IntensityLevel, string> = {
  0: "none",
  1: "drop-shadow(0 0 3px rgba(180,160,30,0.3))",
  2: "drop-shadow(0 0 5px rgba(200,60,40,0.4))",
  3: "drop-shadow(0 0 8px rgba(240,40,40,0.6))",
};

const LEVEL_LABEL: Record<IntensityLevel, string> = {
  0: "Repos",
  1: "Sollicité",
  2: "Travaillé",
  3: "Intense",
};

type Zone = { id: MuscleGroup; d: string };

const FRONT: Zone[] = [
  // Chest
  { id: "chest", d: "M37,40 Q42,37 50,38 L50,50 Q44,52 38,50 Q35,46 37,40Z" },
  { id: "chest", d: "M63,40 Q58,37 50,38 L50,50 Q56,52 62,50 Q65,46 63,40Z" },
  // Shoulders
  { id: "shoulders", d: "M30,35 Q28,31 26,36 Q25,42 29,43 L34,41 Q36,38 37,40 Q35,36 30,35Z" },
  { id: "shoulders", d: "M70,35 Q72,31 74,36 Q75,42 71,43 L66,41 Q64,38 63,40 Q65,36 70,35Z" },
  // Biceps
  { id: "biceps", d: "M25,44 L29,43 L30,56 Q30,60 28,62 L24,62 Q22,58 23,50Z" },
  { id: "biceps", d: "M75,44 L71,43 L70,56 Q70,60 72,62 L76,62 Q78,58 77,50Z" },
  // Forearms
  { id: "forearms", d: "M24,62 L28,62 Q28,70 26,76 L22,78 Q20,74 21,68Z" },
  { id: "forearms", d: "M76,62 L72,62 Q72,70 74,76 L78,78 Q80,74 79,68Z" },
  // Core — 3 tiers for visual richness
  { id: "core", d: "M42,50 L58,50 L58,58 L42,58Z" },
  { id: "core", d: "M42,58 L58,58 L58,66 L42,66Z" },
  { id: "core", d: "M42,66 L58,66 L57,74 L43,74Z" },
  // Quads
  { id: "quads", d: "M40,76 Q42,74 45,76 Q47,84 48,94 L48,102 Q44,104 40,100 Q37,92 38,84Z" },
  { id: "quads", d: "M60,76 Q58,74 55,76 Q53,84 52,94 L52,102 Q56,104 60,100 Q63,92 62,84Z" },
  // Calves
  { id: "calves", d: "M38,108 Q40,106 42,108 Q43,116 42,124 Q40,130 38,128 Q36,120 37,112Z" },
  { id: "calves", d: "M62,108 Q60,106 58,108 Q57,116 58,124 Q60,130 62,128 Q64,120 63,112Z" },
];

const BACK: Zone[] = [
  // Upper back / Traps
  { id: "upperBack", d: "M38,36 Q44,33 50,34 L50,42 Q44,44 40,42 Q37,40 38,36Z" },
  { id: "upperBack", d: "M62,36 Q56,33 50,34 L50,42 Q56,44 60,42 Q63,40 62,36Z" },
  // Lats
  { id: "lats", d: "M34,42 Q38,42 40,46 L40,60 Q38,64 34,62 Q32,54 33,46Z" },
  { id: "lats", d: "M66,42 Q62,42 60,46 L60,60 Q62,64 66,62 Q68,54 67,46Z" },
  // Lower back
  { id: "lowerBack", d: "M42,60 Q50,58 58,60 L58,72 Q50,74 42,72Z" },
  // Triceps
  { id: "triceps", d: "M25,44 L29,43 L30,56 Q30,60 28,62 L24,62 Q22,58 23,50Z" },
  { id: "triceps", d: "M75,44 L71,43 L70,56 Q70,60 72,62 L76,62 Q78,58 77,50Z" },
  // Glutes
  { id: "glutes", d: "M40,72 Q50,70 60,72 Q63,80 58,86 Q50,88 42,86 Q37,80 40,72Z" },
  // Hamstrings
  { id: "hamstrings", d: "M40,88 Q42,86 45,88 Q47,96 48,106 L44,108 Q40,104 38,96Z" },
  { id: "hamstrings", d: "M60,88 Q58,86 55,88 Q53,96 52,106 L56,108 Q60,104 62,96Z" },
  // Calves (back)
  { id: "calves", d: "M38,110 Q40,108 43,110 Q44,118 43,126 Q40,132 38,130 Q36,122 37,114Z" },
  { id: "calves", d: "M62,110 Q60,108 57,110 Q56,118 57,126 Q60,132 62,130 Q64,122 63,114Z" },
];

const SILHOUETTE_FRONT =
  "M50,10 Q55,10 57,15 Q59,22 57,28 Q55,32 50,32 Q45,32 43,28 Q41,22 43,15 Q45,10 50,10Z " +
  "M30,35 Q38,30 50,30 Q62,30 70,35 Q76,32 77,42 Q78,52 77,62 Q79,70 80,80 L76,80 Q74,70 72,62 " +
  "L66,42 Q62,38 50,36 Q38,38 34,42 L28,62 Q26,70 24,80 L20,80 Q21,70 23,62 Q22,52 23,42 Q24,32 30,35Z " +
  "M43,74 Q40,76 38,84 Q36,94 38,104 Q36,108 36,120 Q36,130 40,134 L44,132 Q44,126 44,116 " +
  "Q44,108 46,98 Q48,90 50,86 Q52,90 54,98 Q56,108 56,116 Q56,126 56,132 L60,134 " +
  "Q64,130 64,120 Q64,108 62,104 Q64,94 62,84 Q60,76 57,74Z";

const SILHOUETTE_BACK = SILHOUETTE_FRONT;

function BodyView({
  zones,
  silhouette,
  scores,
  maxScore,
}: {
  zones: Zone[];
  silhouette: string;
  scores: Record<MuscleGroup, number>;
  maxScore: number;
}) {
  return (
    <svg viewBox="16 6 68 132" className="w-32 sm:w-40 h-auto select-none">
      <defs>
        <radialGradient id="bg-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect x="16" y="6" width="68" height="132" fill="url(#bg-glow)" rx="4" />
      <path
        d={silhouette}
        fill="none"
        stroke="rgb(var(--c-border))"
        strokeWidth="0.6"
        opacity="0.4"
      />
      {zones.map((zone, i) => {
        const ratio = maxScore > 0 ? scores[zone.id] / maxScore : 0;
        const level = intensityLevel(ratio);
        return (
          <path
            key={`${zone.id}-${i}`}
            d={zone.d}
            fill={LEVEL_COLORS[level]}
            stroke={level > 0 ? LEVEL_COLORS[level] : "rgb(var(--c-border))"}
            strokeWidth={level > 0 ? "0.5" : "0.3"}
            opacity={level === 0 ? 0.5 : 0.85}
            style={{ filter: LEVEL_GLOW[level], transition: "all 0.5s ease" }}
          >
            <title>
              {MUSCLE_LABELS[zone.id]} — {LEVEL_LABEL[level]}
            </title>
          </path>
        );
      })}
    </svg>
  );
}

export function MuscularHeatmap({ sessions }: Props) {
  const { scores, maxScore } = useMemo(
    () => computeMuscleHeat(sessions, 7),
    [sessions],
  );

  const ranked = useMemo(() => {
    return ALL_MUSCLES
      .map((m) => ({ id: m, score: scores[m], level: intensityLevel(maxScore > 0 ? scores[m] / maxScore : 0) }))
      .filter((m) => m.level > 0)
      .sort((a, b) => b.score - a.score);
  }, [scores, maxScore]);

  return (
    <div className="card !p-0 overflow-hidden">
      {/* Dark header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold">Carte musculaire</div>
            <div className="text-[11px] text-text-dim">Activité des 7 derniers jours</div>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2.5 mt-2.5">
          {([0, 1, 2, 3] as IntensityLevel[]).map((lvl) => (
            <span key={lvl} className="flex items-center gap-1 text-[10px] text-text-dim">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm border border-border/30"
                style={{ background: LEVEL_COLORS[lvl] }}
              />
              {LEVEL_LABEL[lvl]}
            </span>
          ))}
        </div>
      </div>

      {/* Body views */}
      <div className="flex justify-center gap-1 px-2 py-2 bg-bg-soft/50">
        <div className="text-center">
          <BodyView
            zones={FRONT}
            silhouette={SILHOUETTE_FRONT}
            scores={scores}
            maxScore={maxScore}
          />
          <div className="text-[10px] text-text-dim mt-0.5 font-medium">Face</div>
        </div>
        <div className="text-center">
          <BodyView
            zones={BACK}
            silhouette={SILHOUETTE_BACK}
            scores={scores}
            maxScore={maxScore}
          />
          <div className="text-[10px] text-text-dim mt-0.5 font-medium">Dos</div>
        </div>
      </div>

      {/* Active muscle chips */}
      {ranked.length > 0 && (
        <div className="px-4 py-3 border-t border-border/50">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {ranked.slice(0, 8).map(({ id, level }) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border"
                style={{
                  borderColor: LEVEL_COLORS[level],
                  color: LEVEL_COLORS[level],
                  background: LEVEL_COLORS[level] + "18",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: LEVEL_COLORS[level] }}
                />
                {MUSCLE_LABELS[id]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
