import {
  Sparkles,
  Calendar,
  Trash2,
  Plus,
  X,
  Save,
  Bot,
  Loader2,
  AlertTriangle,
  Pencil,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseInput } from "../lib/parser";
import { aiParseSession, isAIParserAvailable } from "../lib/aiParser";
import { compareWithLast, type ExerciseDelta } from "../lib/exerciseComparison";
import type { ExerciseEntry, Session, SetEntry } from "../types";

interface Props {
  mode?: "edit" | "append";
  onSave: (session: Omit<Session, "id">) => void;
  onAppend?: (exercices: ExerciseEntry[]) => void;
  prefillText?: string;
  prefillVersion?: number;
  editing?: {
    date: string;
    notes?: string;
    bodyWeight?: number;
  };
  onCancelEdit?: () => void;
  sessions?: Session[];
  excludeSessionId?: string;
}

type ParseMode = "idle" | "loading" | "done" | "error";

export function SessionInput({
  mode = "edit",
  onSave,
  onAppend,
  prefillText,
  prefillVersion,
  editing,
  onCancelEdit,
  sessions,
  excludeSessionId,
}: Props) {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );

  const [exercices, setExercices] = useState<ExerciseEntry[]>([]);
  const [unrecognized, setUnrecognized] = useState<string[]>([]);
  const [parseMode, setParseMode] = useState<ParseMode>("idle");
  const [parseError, setParseError] = useState<string>("");
  const [usedAI, setUsedAI] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const regexResult = useMemo(() => parseInput(text), [text]);

  useEffect(() => {
    if (prefillText !== undefined) {
      setText(prefillText);
      setExercices([]);
      setUnrecognized([]);
      setParseMode("idle");
    }
  }, [prefillText, prefillVersion]);

  useEffect(() => {
    if (editing) {
      setDate(editing.date);
      setNotes(editing.notes ?? "");
      setBodyWeight(editing.bodyWeight ? String(editing.bodyWeight) : "");
    }
  }, [editing]);

  async function handleAIParse() {
    if (!text.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setParseMode("loading");
    setParseError("");
    setUsedAI(true);
    try {
      const result = await aiParseSession(text.trim(), ctrl.signal);
      if (ctrl.signal.aborted) return;
      setExercices(result.exercices);
      setUnrecognized([]);
      setParseMode("done");
    } catch (err) {
      if (ctrl.signal.aborted) return;
      console.error("[AI Parse]", err);
      setParseError(
        err instanceof Error ? err.message : "Erreur inconnue",
      );
      setExercices(regexResult.exercices);
      setUnrecognized(regexResult.unrecognized);
      setParseMode("error");
    }
  }

  function handleRegexParse() {
    setExercices(regexResult.exercices);
    setUnrecognized(regexResult.unrecognized);
    setParseMode("done");
    setUsedAI(false);
  }

  const displayExercices = parseMode === "done" || parseMode === "error"
    ? exercices
    : regexResult.exercices;
  const displayUnrecognized = parseMode === "done" || parseMode === "error"
    ? unrecognized
    : regexResult.unrecognized;

  const canSave = displayExercices.length > 0 && parseMode !== "loading";

  function handleSave() {
    if (!canSave) return;
    if (mode === "append" && onAppend) {
      onAppend(displayExercices);
    } else {
      onSave({
        date,
        exercices: displayExercices,
        notes: notes.trim() || undefined,
        bodyWeight: bodyWeight ? parseFloat(bodyWeight) : undefined,
      });
    }
    setText("");
    setNotes("");
    setBodyWeight("");
    setExercices([]);
    setUnrecognized([]);
    setParseMode("idle");
    setUsedAI(false);
  }

  function handleClear() {
    abortRef.current?.abort();
    setText("");
    setNotes("");
    setBodyWeight("");
    setExercices([]);
    setUnrecognized([]);
    setParseMode("idle");
    setUsedAI(false);
  }

  function removeExercise(idx: number) {
    setExercices((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateExercise(idx: number, updated: ExerciseEntry) {
    setExercices((prev) => prev.map((e, i) => (i === idx ? updated : e)));
  }

  const aiAvailable = isAIParserAvailable();
  const isAppend = mode === "append";

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">
            {editing ? "Modifier la séance" : isAppend ? "Ajouter des exercices" : "Nouvelle séance"}
          </h2>
        </div>
        {editing && onCancelEdit && (
          <button className="btn-ghost !py-1.5" onClick={onCancelEdit}>
            <X className="w-4 h-4" /> Annuler
          </button>
        )}
      </div>

      {/* Date / weight / notes — only in edit mode */}
      {!isAppend && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex items-center gap-2 col-span-1">
            <Calendar className="w-4 h-4 text-text-muted" />
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <input
            className="input md:col-span-1"
            placeholder="Poids de corps (kg)"
            inputMode="decimal"
            value={bodyWeight}
            onChange={(e) => setBodyWeight(e.target.value)}
          />
          <input
            className="input md:col-span-1"
            placeholder="Notes (optionnel)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      <textarea
        className="input min-h-[110px] font-mono text-sm"
        placeholder={`Décris ta séance librement. Ex:\nDéveloppé couché 4x10 à 80kg\n3 séries de squat pyramidal 100/110/120 pour 8 reps\nTractions 5x8 poids de corps\nCourse 5km en 25min`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (parseMode === "done" || parseMode === "error") {
            setParseMode("idle");
            setExercices([]);
            setUnrecognized([]);
          }
        }}
      />

      <div className="flex flex-wrap gap-2">
        {aiAvailable && (
          <button
            className="btn-primary text-sm"
            onClick={handleAIParse}
            disabled={!text.trim() || parseMode === "loading"}
          >
            {parseMode === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyse en
                cours…
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" /> Analyser avec l'IA
              </>
            )}
          </button>
        )}
        <button
          className="btn-ghost text-sm"
          onClick={handleRegexParse}
          disabled={!text.trim() || parseMode === "loading"}
        >
          {aiAvailable ? "Analyse rapide (hors-ligne)" : "Analyser"}
        </button>
      </div>

      {parseMode === "error" && (
        <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">
              L'IA n'a pas pu analyser la séance — fallback regex appliqué.
            </div>
            <div className="text-text-dim mt-0.5">{parseError}</div>
          </div>
        </div>
      )}

      {parseMode === "loading" && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 bg-bg-soft border border-border rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {parseMode !== "loading" && (
        <ExerciceList
          exercices={displayExercices}
          unrecognized={displayUnrecognized}
          confirmed={parseMode === "done" || parseMode === "error"}
          usedAI={usedAI}
          onRemove={removeExercise}
          onUpdate={updateExercise}
          sessions={sessions}
          excludeSessionId={excludeSessionId}
        />
      )}

      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={handleClear}>
          <Trash2 className="w-4 h-4" /> Effacer
        </button>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={!canSave}
        >
          {editing ? (
            <>
              <Save className="w-4 h-4" /> Mettre à jour
            </>
          ) : isAppend ? (
            <>
              <Plus className="w-4 h-4" /> Ajouter
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Enregistrer
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ExerciceList({
  exercices,
  unrecognized,
  confirmed,
  usedAI,
  onRemove,
  onUpdate,
  sessions,
  excludeSessionId,
}: {
  exercices: ExerciseEntry[];
  unrecognized: string[];
  confirmed: boolean;
  usedAI: boolean;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, updated: ExerciseEntry) => void;
  sessions?: Session[];
  excludeSessionId?: string;
}) {
  const sortedSessions = useMemo(() => {
    if (!sessions?.length) return [];
    return sessions
      .filter((s) => s.id !== excludeSessionId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, excludeSessionId]);

  const deltas = useMemo(() => {
    if (!sortedSessions.length) return new Map<number, ExerciseDelta | null>();
    const map = new Map<number, ExerciseDelta | null>();
    for (let i = 0; i < exercices.length; i++) {
      map.set(i, compareWithLast(exercices[i], sortedSessions));
    }
    return map;
  }, [exercices, sortedSessions]);

  if (!exercices.length && !unrecognized.length) {
    return (
      <p className="text-xs text-text-dim">
        L'aperçu des exercices reconnus apparaîtra ici.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {confirmed && usedAI && exercices.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-accent">
          <Bot className="w-3.5 h-3.5" />
          <span>
            {exercices.length} exercice{exercices.length > 1 ? "s" : ""}{" "}
            reconnu{exercices.length > 1 ? "s" : ""} par l'IA — vérifie
            avant d'enregistrer.
          </span>
        </div>
      )}
      {exercices.map((ex, i) => (
        <ExerciseRow
          key={i}
          exercise={ex}
          confirmed={confirmed}
          delta={deltas.get(i) ?? null}
          onRemove={() => onRemove(i)}
          onUpdate={(updated) => onUpdate(i, updated)}
        />
      ))}
      {unrecognized.map((seg, i) => (
        <div
          key={`u-${i}`}
          className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2"
        >
          Non reconnu : « {seg} »
        </div>
      ))}
    </div>
  );
}

function ExerciseRow({
  exercise,
  confirmed,
  delta,
  onRemove,
  onUpdate,
}: {
  exercise: ExerciseEntry;
  confirmed: boolean;
  delta: ExerciseDelta | null;
  onRemove: () => void;
  onUpdate: (updated: ExerciseEntry) => void;
}) {
  const [editing, setEditing] = useState(false);

  const setsLabel = exercise.sets.length > 0
    ? formatSets(exercise.sets)
    : exercise.cardio
      ? formatCardio(exercise.cardio)
      : "—";

  if (editing) {
    return (
      <InlineEditor
        exercise={exercise}
        onSave={(updated) => {
          onUpdate(updated);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="bg-bg-soft border border-border rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
          <span className="font-medium">{exercise.nom}</span>
          <span className="chip bg-accent-muted/40 text-accent-soft">
            {exercise.categorie}
          </span>
          <span className="text-text-muted">{setsLabel}</span>
        </div>
        {confirmed && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              className="text-text-dim hover:text-text p-1"
              onClick={() => setEditing(true)}
              title="Modifier"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              className="text-text-dim hover:text-rose-400 p-1"
              onClick={onRemove}
              title="Retirer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      {delta && <DeltaBadge delta={delta} />}
    </div>
  );
}

function InlineEditor({
  exercise,
  onSave,
  onCancel,
}: {
  exercise: ExerciseEntry;
  onSave: (updated: ExerciseEntry) => void;
  onCancel: () => void;
}) {
  const [nom, setNom] = useState(exercise.nom);
  const [sets, setSets] = useState(
    exercise.sets.map((s) => ({ reps: String(s.reps), poids: String(s.poids) })),
  );

  function addSet() {
    const last = sets[sets.length - 1];
    setSets([...sets, { reps: last?.reps ?? "10", poids: last?.poids ?? "0" }]);
  }

  function removeSet(idx: number) {
    setSets(sets.filter((_, i) => i !== idx));
  }

  function updateSet(idx: number, field: "reps" | "poids", val: string) {
    setSets(sets.map((s, i) => (i === idx ? { ...s, [field]: val } : s)));
  }

  function handleSave() {
    onSave({
      ...exercise,
      nom: nom.trim() || exercise.nom,
      sets: sets.map((s) => ({
        reps: parseInt(s.reps, 10) || 0,
        poids: parseFloat(s.poids) || 0,
      })),
    });
  }

  return (
    <div className="bg-bg-soft border border-accent/40 rounded-lg px-3 py-2 space-y-2">
      <input
        type="text"
        className="input text-sm w-full"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Nom de l'exercice"
      />
      <div className="space-y-1">
        {sets.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-text-dim w-6">#{i + 1}</span>
            <input
              type="number"
              className="input text-xs w-16 text-center"
              value={s.reps}
              onChange={(e) => updateSet(i, "reps", e.target.value)}
              placeholder="reps"
            />
            <span className="text-text-dim text-xs">×</span>
            <input
              type="number"
              className="input text-xs w-20 text-center"
              value={s.poids}
              onChange={(e) => updateSet(i, "poids", e.target.value)}
              placeholder="kg"
            />
            <span className="text-text-dim text-xs">kg</span>
            {sets.length > 1 && (
              <button
                className="text-text-dim hover:text-rose-400 p-0.5"
                onClick={() => removeSet(i)}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-ghost text-xs" onClick={addSet}>
          <Plus className="w-3 h-3" /> Série
        </button>
        <div className="flex-1" />
        <button className="btn-ghost text-xs" onClick={onCancel}>
          Annuler
        </button>
        <button className="btn-primary text-xs" onClick={handleSave}>
          OK
        </button>
      </div>
    </div>
  );
}

function formatSets(sets: SetEntry[]): string {
  if (sets.length === 0) return "—";
  const allSame =
    sets.every((s) => s.reps === sets[0].reps && s.poids === sets[0].poids);
  if (allSame) {
    const s = sets[0];
    return `${sets.length} × ${s.reps} reps${s.poids > 0 ? ` @ ${s.poids} kg` : " (PDC)"}`;
  }
  return sets
    .map(
      (s) => `${s.reps}r${s.poids > 0 ? `@${s.poids}` : ""}`,
    )
    .join(" / ");
}

function formatCardio(
  cardio: NonNullable<ExerciseEntry["cardio"]>,
): string {
  const parts: string[] = [];
  if (cardio.distance) parts.push(`${cardio.distance} km`);
  if (cardio.duree) parts.push(`${cardio.duree} min`);
  if (cardio.denivele) parts.push(`+${cardio.denivele} m`);
  return parts.join(" · ") || "—";
}

function DeltaBadge({ delta }: { delta: ExerciseDelta }) {
  const isUp = delta.volumePct > 1;
  const isDown = delta.volumePct < -1;
  const color = isUp
    ? "text-emerald-400"
    : isDown
      ? "text-rose-400"
      : "text-text-dim";
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  const volLabel = delta.hasWeight ? "vol" : "reps";
  const volSign = delta.volumePct > 0 ? "+" : "";
  const parts: string[] = [`${volSign}${delta.volumePct.toFixed(0)}% ${volLabel}`];
  if (delta.hasWeight && delta.maxWeightDiff !== 0) {
    parts.push(
      `${delta.maxWeightDiff > 0 ? "+" : ""}${delta.maxWeightDiff}kg`,
    );
  }
  if (delta.repsDiff !== 0 && delta.hasWeight) {
    parts.push(
      `${delta.repsDiff > 0 ? "+" : ""}${delta.repsDiff} reps`,
    );
  }

  const daysAgo = Math.round(
    (Date.now() - new Date(delta.lastDate).getTime()) / 86400000,
  );
  const ago =
    daysAgo <= 0
      ? "auj."
      : daysAgo === 1
        ? "hier"
        : daysAgo < 7
          ? `il y a ${daysAgo}j`
          : daysAgo < 30
            ? `il y a ${Math.round(daysAgo / 7)} sem`
            : `il y a ${Math.round(daysAgo / 30)} mois`;

  return (
    <div className={`flex items-center gap-1.5 mt-1 text-[10px] leading-tight ${color}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span className="font-semibold">{parts.join(" · ")}</span>
      <span className="text-text-dim">vs {ago}</span>
    </div>
  );
}
