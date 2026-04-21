import { Brain, Globe, Lock, Zap } from "lucide-react";
import { useState } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import type { Session } from "../types";
import { groupExercises } from "../lib/groupExercises";
import { sessionVolume, sessionDurationScore } from "../lib/scoring";
import { xpProgress, levelFromXp } from "../lib/leveling";
import { LevelBadge } from "./LevelBadge";

interface Props {
  session: Session;
  xpGained?: number;
  totalXpBefore?: number;
  onPublish: (userComment: string) => void;
  onKeepPrivate: () => void;
  onClose: () => void;
}

export function PublishModal({ session, xpGained, totalXpBefore, onPublish, onKeepPrivate, onClose }: Props) {
  const [comment, setComment] = useState("");
  const trapRef = useFocusTrap<HTMLDivElement>();
  const vol = Math.round(sessionVolume(session));
  const durScore = Math.round(sessionDurationScore(session));

  const categories = [...new Set(session.exercices.map((e) => e.categorie))];
  const title = categories.length > 0
    ? `Séance ${categories.join(" / ")}`
    : "Séance terminée";

  const showXp = xpGained != null && xpGained > 0 && totalXpBefore != null;
  const oldProgress = showXp ? xpProgress(totalXpBefore) : null;
  const newProgress = showXp ? xpProgress(totalXpBefore + xpGained) : null;
  const leveledUp = showXp && levelFromXp(totalXpBefore + xpGained) > levelFromXp(totalXpBefore);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={trapRef} className="bg-bg-card border border-border rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-fadeIn">
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {session.exercices.length} exercices
              {vol > 0 ? ` · ${vol} kg de volume` : ""}
              {durScore > 0 && vol === 0 ? ` · ${Math.round(session.exercices.reduce((s, e) => s + (e.durationMinutes ?? 0), 0))} min` : ""}
            </p>
          </div>

          {showXp && oldProgress && newProgress && (
            <div className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <span className="text-sm font-bold text-accent">+{xpGained} XP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <LevelBadge level={newProgress.level} size="md" />
                  {leveledUp && (
                    <span className="text-xs font-bold text-amber-400 animate-pulse">LEVEL UP !</span>
                  )}
                </div>
              </div>
              <div className="h-2.5 bg-bg-soft rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-gradient-to-r from-accent to-accent-soft rounded-full animate-xpFill"
                  style={{
                    "--xp-from": `${oldProgress.percent}%`,
                    "--xp-to": `${newProgress.percent}%`,
                  } as React.CSSProperties}
                />
              </div>
              <div className="text-xs text-text-dim text-center tabular-nums">
                {newProgress.current} / {newProgress.needed} XP
              </div>
            </div>
          )}

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {groupExercises(session.exercices).map((ex, i) => (
              <div
                key={i}
                className="bg-bg-soft border border-border rounded-lg px-3 py-1.5 text-sm"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium truncate">{ex.nom}</span>
                  <span className="chip bg-accent-muted/40 text-accent-soft text-xs shrink-0">
                    {ex.categorie}
                  </span>
                </div>
                <div className="text-xs text-text-muted">
                  {ex.durationMinutes
                    ? `${ex.durationMinutes} min${ex.intensity ? ` · ${ex.intensity}` : ""}`
                    : ex.sets.map((s) => `${s.reps}×${s.poids || "PDC"}`).join(" · ")}
                </div>
              </div>
            ))}
          </div>

          {session.coachCommentary && (
            <div className="bg-accent-muted/20 border border-accent-muted rounded-xl px-3 py-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-accent-soft text-xs font-semibold uppercase tracking-wide">
                <Brain className="w-3.5 h-3.5" />
                L'avis de Stéphane
              </div>
              <p className="text-xs text-text-dim mb-1">Votre coach personnel propulsé par l'IA</p>
              <p className="text-xs text-text-muted italic leading-relaxed">
                {session.coachCommentary}
              </p>
            </div>
          )}

          <div>
            <textarea
              className="input min-h-[70px] text-sm"
              placeholder="Ajouter un commentaire personnel... (optionnel)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
            {comment.length > 0 && (
              <div className="text-xs text-text-dim text-right mt-0.5">
                {comment.length}/500
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              className="btn-ghost flex-1 text-sm"
              onClick={onKeepPrivate}
            >
              <Lock className="w-4 h-4" /> Garder privé
            </button>
            <button
              className="btn-primary flex-1 text-sm"
              onClick={() => onPublish(comment.trim())}
            >
              <Globe className="w-4 h-4" /> Publier sur le flux
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
