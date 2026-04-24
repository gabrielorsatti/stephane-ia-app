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

const LEVEL_COLORS: Record<IntensityLevel, { fill: string; stroke: string; glow: string }> = {
  0: { fill: "#2d4a35", stroke: "#3d6048", glow: "none" },
  1: { fill: "#8b6e1e", stroke: "#b8922a", glow: "0 0 4px rgba(185,146,42,0.4)" },
  2: { fill: "#a83828", stroke: "#cc4433", glow: "0 0 6px rgba(200,60,40,0.5)" },
  3: { fill: "#d42020", stroke: "#ff3030", glow: "0 0 10px rgba(255,48,48,0.7)" },
};

const LEVEL_LABEL: Record<IntensityLevel, string> = {
  0: "Repos",
  1: "Sollicité",
  2: "Travaillé",
  3: "Intense",
};

type Z = { id: MuscleGroup; d: string };

// ── FRONT VIEW ──
// Anatomically shaped paths in a 100×140 viewBox.

const F: Z[] = [
  // Chest — pectoralis major, fan-shaped
  { id: "chest", d: "M36,39 C38,36 44,35 50,37 L50,48 C46,50 40,50 37,47 C35,45 35,42 36,39Z" },
  { id: "chest", d: "M64,39 C62,36 56,35 50,37 L50,48 C54,50 60,50 63,47 C65,45 65,42 64,39Z" },
  // Anterior deltoid
  { id: "shoulders", d: "M29,34 C27,31 25,34 25,39 C25,43 28,44 31,43 L36,39 C34,37 32,35 29,34Z" },
  { id: "shoulders", d: "M71,34 C73,31 75,34 75,39 C75,43 72,44 69,43 L64,39 C66,37 68,35 71,34Z" },
  // Biceps brachii — two-headed bulge
  { id: "biceps", d: "M24,44 C23,47 22,52 22,57 C22,60 24,62 27,62 C29,61 30,58 30,54 C30,50 29,46 28,44Z" },
  { id: "biceps", d: "M76,44 C77,47 78,52 78,57 C78,60 76,62 73,62 C71,61 70,58 70,54 C70,50 71,46 72,44Z" },
  // Forearms — brachioradialis taper
  { id: "forearms", d: "M23,62 C22,66 21,71 20,76 C20,78 22,78 24,77 C26,74 26,68 27,62Z" },
  { id: "forearms", d: "M77,62 C78,66 79,71 80,76 C80,78 78,78 76,77 C74,74 74,68 73,62Z" },
  // Rectus abdominis — segmented 6 blocks
  { id: "core", d: "M44,49 L50,48 L50,55 L44,55Z" },
  { id: "core", d: "M50,48 L56,49 L56,55 L50,55Z" },
  { id: "core", d: "M44,55 L56,55 L56,62 L44,62Z" },
  { id: "core", d: "M44,62 L56,62 L56,69 L43,69Z" },
  { id: "core", d: "M56,62 L56,69 L57,69Z" },
  // Quadriceps — vastus lateralis + rectus femoris + vastus medialis
  { id: "quads", d: "M38,75 C40,73 43,74 45,76 C47,82 48,90 48,98 C48,102 46,104 42,104 C39,103 37,98 37,92 C36,86 37,80 38,75Z" },
  { id: "quads", d: "M62,75 C60,73 57,74 55,76 C53,82 52,90 52,98 C52,102 54,104 58,104 C61,103 63,98 63,92 C64,86 63,80 62,75Z" },
  // Tibialis anterior + gastrocnemius (front view)
  { id: "calves", d: "M38,108 C39,106 41,107 42,110 C43,116 42,123 41,128 C40,131 38,130 37,127 C36,122 36,114 38,108Z" },
  { id: "calves", d: "M62,108 C61,106 59,107 58,110 C57,116 58,123 59,128 C60,131 62,130 63,127 C64,122 64,114 62,108Z" },
];

// ── BACK VIEW ──
const B: Z[] = [
  // Trapezius — diamond-shaped upper
  { id: "upperBack", d: "M38,34 C42,31 48,30 50,31 L50,40 C46,42 42,41 39,39 C37,38 37,36 38,34Z" },
  { id: "upperBack", d: "M62,34 C58,31 52,30 50,31 L50,40 C54,42 58,41 61,39 C63,38 63,36 62,34Z" },
  // Latissimus dorsi — wide V-taper
  { id: "lats", d: "M33,42 C36,40 39,42 41,46 C42,52 42,58 41,62 C39,65 35,63 33,59 C31,54 31,48 33,42Z" },
  { id: "lats", d: "M67,42 C64,40 61,42 59,46 C58,52 58,58 59,62 C61,65 65,63 67,59 C69,54 69,48 67,42Z" },
  // Erector spinae — lower back columns
  { id: "lowerBack", d: "M43,60 C46,58 50,57 50,57 L50,72 C47,74 44,73 43,71 C42,68 42,63 43,60Z" },
  { id: "lowerBack", d: "M57,60 C54,58 50,57 50,57 L50,72 C53,74 56,73 57,71 C58,68 58,63 57,60Z" },
  // Triceps — horseshoe shape
  { id: "triceps", d: "M24,44 C23,47 22,52 22,57 C22,60 24,62 27,62 C29,61 30,58 30,54 C30,50 29,46 28,44Z" },
  { id: "triceps", d: "M76,44 C77,47 78,52 78,57 C78,60 76,62 73,62 C71,61 70,58 70,54 C70,50 71,46 72,44Z" },
  // Gluteus maximus — rounded mass
  { id: "glutes", d: "M40,73 C44,71 48,70 50,70 C52,70 56,71 60,73 C63,77 62,83 58,86 C54,88 50,89 50,89 C50,89 46,88 42,86 C38,83 37,77 40,73Z" },
  // Hamstrings — biceps femoris + semitendinosus
  { id: "hamstrings", d: "M39,88 C41,86 44,88 46,90 C48,96 48,102 47,108 C45,110 42,109 40,106 C38,100 37,94 39,88Z" },
  { id: "hamstrings", d: "M61,88 C59,86 56,88 54,90 C52,96 52,102 53,108 C55,110 58,109 60,106 C62,100 63,94 61,88Z" },
  // Calves — gastrocnemius diamond
  { id: "calves", d: "M38,112 C40,109 42,110 43,114 C44,120 43,126 41,131 C40,133 38,132 37,129 C36,124 36,118 38,112Z" },
  { id: "calves", d: "M62,112 C60,109 58,110 57,114 C56,120 57,126 59,131 C60,133 62,132 63,129 C64,124 64,118 62,112Z" },
];

// Silhouette — shared outline for both views.
const OUTLINE =
  "M50,10 C55,10 57,14 58,18 C59,22 58,27 56,30 C54,33 50,34 50,34 C50,34 46,33 44,30 C42,27 41,22 42,18 C43,14 45,10 50,10Z " +
  "M29,34 C34,30 42,28 50,28 C58,28 66,30 71,34 C75,32 77,36 78,42 C79,50 78,58 77,62 C79,68 80,76 80,80 L76,80 C75,74 74,66 73,62 " +
  "C71,58 69,44 66,40 C62,36 56,34 50,34 C44,34 38,36 34,40 C31,44 29,58 27,62 C26,66 25,74 24,80 L20,80 C20,76 21,68 23,62 C22,58 21,50 22,42 C23,36 25,32 29,34Z " +
  "M43,72 C40,75 38,80 37,88 C36,96 37,104 38,108 C36,112 36,120 37,128 C38,132 40,134 42,133 C43,131 43,124 43,116 " +
  "C44,110 46,100 48,92 C49,88 50,86 50,86 C50,86 51,88 52,92 C54,100 56,110 57,116 C57,124 57,131 58,133 C60,134 62,132 63,128 C64,120 64,112 62,108 C63,104 64,96 63,88 C62,80 60,75 57,72Z";

function BodyView({
  zones,
  scores,
  maxScore,
}: {
  zones: Z[];
  scores: Record<MuscleGroup, number>;
  maxScore: number;
}) {
  return (
    <svg viewBox="16 6 68 132" className="w-[120px] sm:w-[150px] h-auto select-none">
      <defs>
        <radialGradient id="bodyGlow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity="0.05" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="muscleGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="16" y="6" width="68" height="132" fill="url(#bodyGlow)" rx="4" />

      {/* Body outline */}
      <path
        d={OUTLINE}
        fill="none"
        stroke="rgb(var(--c-border))"
        strokeWidth="0.5"
        opacity="0.35"
      />

      {/* Muscle zones */}
      {zones.map((zone, i) => {
        const ratio = maxScore > 0 ? scores[zone.id] / maxScore : 0;
        const level = intensityLevel(ratio);
        const c = LEVEL_COLORS[level];
        return (
          <path
            key={`${zone.id}-${i}`}
            d={zone.d}
            fill={c.fill}
            stroke={c.stroke}
            strokeWidth={level >= 2 ? "0.6" : "0.35"}
            opacity={level === 0 ? 0.45 : 0.9}
            filter={level >= 3 ? "url(#muscleGlow)" : undefined}
            style={{ transition: "all 0.6s ease" }}
          >
            <title>{MUSCLE_LABELS[zone.id]} — {LEVEL_LABEL[level]}</title>
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
      .map((m) => ({
        id: m,
        score: scores[m],
        level: intensityLevel(maxScore > 0 ? scores[m] / maxScore : 0),
      }))
      .filter((m) => m.level > 0)
      .sort((a, b) => b.score - a.score);
  }, [scores, maxScore]);

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold">Carte musculaire</div>
            <div className="text-[11px] text-text-dim">7 derniers jours</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {([0, 1, 2, 3] as IntensityLevel[]).map((lvl) => (
            <span key={lvl} className="flex items-center gap-1 text-[10px] text-text-dim">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{
                  background: LEVEL_COLORS[lvl].fill,
                  border: `1px solid ${LEVEL_COLORS[lvl].stroke}`,
                }}
              />
              {LEVEL_LABEL[lvl]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 px-3 py-3 bg-[rgb(var(--c-bg))]/60">
        <div className="text-center">
          <BodyView zones={F} scores={scores} maxScore={maxScore} />
          <div className="text-[10px] text-text-dim mt-1 font-medium tracking-wide">FACE</div>
        </div>
        <div className="text-center">
          <BodyView zones={B} scores={scores} maxScore={maxScore} />
          <div className="text-[10px] text-text-dim mt-1 font-medium tracking-wide">DOS</div>
        </div>
      </div>

      {ranked.length > 0 && (
        <div className="px-4 py-3 border-t border-border/40">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {ranked.slice(0, 8).map(({ id, level }) => {
              const c = LEVEL_COLORS[level];
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    border: `1px solid ${c.stroke}`,
                    color: c.stroke,
                    background: c.fill + "30",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: c.stroke, boxShadow: c.glow }}
                  />
                  {MUSCLE_LABELS[id]}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
