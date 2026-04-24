import {
  Activity,
  BookOpen,
  ChevronRight,
  Dumbbell,
  History,
  Plus,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProgramTemplate } from "../data/programs";
import type { PersonalRecordOverride, Session } from "../types";
import { sessionScore, sessionVolume } from "../lib/scoring";
import { levelFromXp } from "../lib/leveling";
import { LevelUpCelebration } from "./LevelUpCelebration";
import { CardioStatsCard } from "./CardioStatsCard";
import { CategoryChart } from "./CategoryChart";
import { OccupancyChart } from "./OccupancyChart";
import { StatsCards } from "./StatsCards";
import { generateSessionCommentary } from "../lib/sessionCommentary";
import { buildProgressionSummary } from "../lib/progressionSummary";
import { detectNewPRs, type PRAlert } from "../lib/prDetection";
import { sessionToNlp } from "../lib/toNlp";
import { CoachBilan } from "./CoachBilan";
import { PRCelebration } from "./PRCelebration";
import { ExerciseCatalog } from "./ExerciseCatalog";
import { HistoryView } from "./HistoryView";
import { HubHeader } from "./HubHeader";
import { NavCard } from "./NavCard";
import { PersonalRecords } from "./PersonalRecords";
import { ProgressionChart } from "./ProgressionChart";
import { ProgramView } from "./ProgramView";
import { PublishModal } from "./PublishModal";
import { RestTimer } from "./RestTimer";
import { SessionInput } from "./SessionInput";
import { SlideBack, SlideIn } from "./Transition";

type View = "main" | "history" | "exercises" | "programs" | "progression";

interface Props {
  sessions: Session[];
  addSession: (s: Omit<Session, "id">) => { id: string; merged: boolean; session: Session };
  updateSession: (id: string, patch: Partial<Session>) => void;
  removeSession: (id: string) => void;
  overrides: PersonalRecordOverride[];
  upsertOverride: (o: PersonalRecordOverride) => void;
  removeOverride: (exercise: string) => void;
  programs: ProgramTemplate[];
  userId?: string;
  bodyWeight?: number;
  totalXp?: number;
  onAddXp?: (xp: number) => Promise<{ oldXp: number; newXp: number }>;
}

function formatKg(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}t`;
  return `${Math.round(v)} kg`;
}

export function TrainingHub({
  sessions,
  addSession,
  updateSession,
  removeSession,
  overrides,
  upsertOverride,
  removeOverride,
  programs,
  userId,
  bodyWeight,
  totalXp,
  onAddXp,
}: Props) {
  const [view, setView] = useState<View>("main");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [prefillText, setPrefillText] = useState<string | undefined>();
  const [prefillVersion, setPrefillVersion] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publishSnapshot, setPublishSnapshot] = useState<{
    id: string;
    session: Session;
    xpGained?: number;
    totalXpBefore?: number;
  } | null>(null);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [prAlerts, setPrAlerts] = useState<PRAlert[]>([]);
  const [celebratedPRs, setCelebratedPRs] = useState<Set<string>>(new Set());
  const [isInputOpen, setIsInputOpen] = useState(false);

  const editingSession = editingId
    ? sessions.find((s) => s.id === editingId)
    : undefined;

  const MERGE_WINDOW_MS = 3 * 60 * 60 * 1000;
  const activeSession = useMemo(() => {
    if (publishSnapshot) return undefined;
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);
    return sessions.find((s) => {
      if (s.date !== today) return false;
      const created = s.createdAt
        ? new Date(s.createdAt).getTime()
        : parseInt(s.id, 10);
      return !isNaN(created) && now - created < MERGE_WINDOW_MS && !s.isPublished;
    });
  }, [sessions, publishSnapshot]);

  const heroStats = useMemo(() => {
    const last30 = sessions.filter(
      (s) => Date.now() - new Date(s.date).getTime() < 30 * 24 * 3600 * 1000,
    );
    const volume30 = last30.reduce((acc, s) => acc + sessionVolume(s), 0);
    const summary = buildProgressionSummary(sessions, 12);
    return {
      sessions30: last30.length,
      volume30,
      trend: summary.volumeTrendPercent,
      topProg: summary.topProgressions[0],
    };
  }, [sessions]);

  // ── Navigation ──

  function goTo(v: View) {
    setDirection("forward");
    setView(v);
  }

  function goBack() {
    setDirection("back");
    setView("main");
  }

  // ── Input modal ──

  function openInput() {
    setIsInputOpen(true);
  }

  const closeInput = useCallback(() => {
    setIsInputOpen(false);
    if (!editingId) {
      setPrefillText("");
      setPrefillVersion((v) => v + 1);
    }
  }, [editingId]);

  // Scroll lock & Escape key
  useEffect(() => {
    if (!isInputOpen) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeInput();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isInputOpen, closeInput]);

  // ── Session actions ──

  function startEdit(session: Session) {
    setPrefillText(sessionToNlp(session));
    setPrefillVersion((v) => v + 1);
    setEditingId(session.id);
    setIsInputOpen(true);
    setDirection("back");
    setView("main");
  }

  function handleSave(session: Omit<Session, "id">) {
    if (editingId) {
      updateSession(editingId, session);
      setEditingId(null);
      setPrefillText("");
      setPrefillVersion((v) => v + 1);
      setIsInputOpen(false);
      void requestCommentary(editingId, { ...session, id: editingId });
    } else {
      const result = addSession(session);
      setIsInputOpen(false);
      setShowRestTimer(true);
      const prs = detectNewPRs(result.session, sessions, celebratedPRs);
      if (prs.length > 0) {
        setPrAlerts(prs);
        setCelebratedPRs((prev) => {
          const next = new Set(prev);
          for (const pr of prs) next.add(`${pr.exerciseName}:${pr.type}`);
          return next;
        });
      }
      void requestCommentary(result.id, result.session);
      const xp = sessionScore(result.session);
      if (xp > 0 && onAddXp) {
        void onAddXp(xp).then(({ oldXp, newXp }) => {
          const oldLevel = levelFromXp(oldXp);
          const newLevel = levelFromXp(newXp);
          if (newLevel > oldLevel) setLevelUpLevel(newLevel);
        });
      }
    }
  }

  async function requestCommentary(sessionId: string, session: Session) {
    const summary = buildProgressionSummary(sessions, 12);
    const historySummary =
      summary.totalSessions >= 3 ? summary.textSummary : undefined;
    const commentary = await generateSessionCommentary(
      session,
      programs,
      userId,
      historySummary,
    );
    if (commentary) updateSession(sessionId, { coachCommentary: commentary });
  }

  function finishSession() {
    if (!activeSession) return;
    const xpGained = sessionScore(activeSession);
    setPublishSnapshot({
      id: activeSession.id,
      session: { ...activeSession },
      xpGained,
      totalXpBefore: totalXp ?? 0,
    });
  }

  function handlePublish(userComment: string, exerciseComments?: Record<string, string>) {
    if (!publishSnapshot) return;
    const patch: Partial<Session> = {
      isPublished: true,
      userComment: userComment || undefined,
      publishedAt: new Date().toISOString(),
    };
    if (exerciseComments) {
      patch.exercices = publishSnapshot.exercices.map((ex) =>
        exerciseComments[ex.nom] ? { ...ex, comment: exerciseComments[ex.nom] } : ex,
      );
    }
    updateSession(publishSnapshot.id, patch);
    setPublishSnapshot(null);
  }

  function handleKeepPrivate() {
    setPublishSnapshot(null);
  }

  function fillFromProgram(text: string) {
    setPrefillText(text);
    setPrefillVersion((v) => v + 1);
    setEditingId(null);
    setIsInputOpen(true);
    setDirection("back");
    setView("main");
  }

  // ── Render ──

  const Wrap = direction === "forward" ? SlideIn : SlideBack;

  // Sub-views
  if (view === "history") {
    return (
      <Wrap id="training-history">
        <HubHeader title="Retour à Training" onBack={goBack} />
        <HistoryView
          sessions={sessions}
          onRemove={removeSession}
          onEdit={startEdit}
        />
      </Wrap>
    );
  }

  if (view === "exercises") {
    return (
      <Wrap id="training-exercises">
        <HubHeader title="Retour à Training" onBack={goBack} />
        <ExerciseCatalog />
      </Wrap>
    );
  }

  if (view === "programs") {
    return (
      <Wrap id="training-programs">
        <HubHeader title="Retour à Training" onBack={goBack} />
        <ProgramView onFillInput={fillFromProgram} />
      </Wrap>
    );
  }

  if (view === "progression") {
    return (
      <Wrap id="training-progression">
        <HubHeader title="Retour à Training" onBack={goBack} />
        <div className="space-y-4 px-4">
          <CoachBilan sessions={sessions} userId={userId} />
          <StatsCards sessions={sessions} bodyWeight={bodyWeight} />
          <ProgressionChart sessions={sessions} overrides={overrides} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CategoryChart sessions={sessions} />
            <CardioStatsCard sessions={sessions} />
            <OccupancyChart />
          </div>
          <PersonalRecords
            sessions={sessions}
            overrides={overrides}
            onUpsertOverride={upsertOverride}
            onRemoveOverride={removeOverride}
          />
        </div>
      </Wrap>
    );
  }

  // ── Main dashboard ──

  return (
    <>
      <Wrap id="training-main">
        <div className="flex flex-col gap-4 px-4 pb-6">

          {/* ── Active session banner ── */}
          {activeSession && (
            <button
              onClick={finishSession}
              className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-accent/15 via-accent/10 to-transparent border border-accent/25 px-4 py-3.5 text-left transition-all active:scale-[0.98]"
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
                <Activity className="relative h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">Séance en cours</div>
                <div className="text-xs text-text-muted truncate">
                  {activeSession.exercices.length} exercice
                  {activeSession.exercices.length !== 1 ? "s" : ""} · Appuie
                  pour terminer
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-accent shrink-0" />
            </button>
          )}

          {/* ── Hero Progression Card ── */}
          <button
            onClick={() => goTo("progression")}
            className="relative w-full overflow-hidden rounded-2xl p-5 text-left transition-all duration-200 active:scale-[0.97] group"
          >
            {/* Glass layer */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/[0.08] via-lavender/[0.06] to-powder/[0.04] border border-accent/15 group-hover:border-accent/30 transition-colors" />

            {/* Glow accents */}
            <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-lavender/[0.08] blur-2xl pointer-events-none" />

            <div className="relative">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-base font-bold leading-tight">
                      Progression
                    </div>
                    <div className="text-xs text-text-muted">
                      Courbes · Records · Coach
                    </div>
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-bg-card/60 border border-border/50 group-hover:bg-accent/10 group-hover:border-accent/30 transition-colors">
                  <ChevronRight className="h-4 w-4 text-text-dim group-hover:text-accent transition-colors" />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-bg-card/60 border border-border/30 px-2 py-2 text-center">
                  <div className="text-lg font-bold leading-tight">
                    {heroStats.sessions30}
                  </div>
                  <div className="text-[10px] text-text-dim uppercase tracking-wider mt-0.5">
                    séances/30j
                  </div>
                </div>
                <div className="rounded-xl bg-bg-card/60 border border-border/30 px-2 py-2 text-center">
                  <div className="text-lg font-bold leading-tight">
                    {formatKg(heroStats.volume30)}
                  </div>
                  <div className="text-[10px] text-text-dim uppercase tracking-wider mt-0.5">
                    volume/30j
                  </div>
                </div>
                <div className="rounded-xl bg-bg-card/60 border border-border/30 px-2 py-2 text-center">
                  <div
                    className={`text-lg font-bold leading-tight ${
                      heroStats.trend > 0
                        ? "text-green-500"
                        : heroStats.trend < 0
                          ? "text-rose-400"
                          : ""
                    }`}
                  >
                    {heroStats.trend > 0 ? "+" : ""}
                    {heroStats.trend}%
                  </div>
                  <div className="text-[10px] text-text-dim uppercase tracking-wider mt-0.5">
                    tendance
                  </div>
                </div>
              </div>

              {/* Top progression chip */}
              {heroStats.topProg && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-500/[0.08] border border-green-500/15 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span className="text-xs text-text-muted truncate">
                    <span className="font-medium text-text">
                      {heroStats.topProg.nom}
                    </span>{" "}
                    {heroStats.topProg.oldMax}&rarr;{heroStats.topProg.newMax} kg{" "}
                    <span className="font-semibold text-green-500">
                      +{heroStats.topProg.deltaPercent}%
                    </span>
                  </span>
                </div>
              )}
            </div>
          </button>

          {/* ── Navigation cards — 1 col mobile, 3 cols desktop ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NavCard
              icon={History}
              label="Historique"
              description="Toutes tes séances passées"
              onClick={() => goTo("history")}
            />
            <NavCard
              icon={BookOpen}
              label="Programmes"
              description="Tes templates de séances"
              onClick={() => goTo("programs")}
            />
            <NavCard
              icon={Dumbbell}
              label="Exercices"
              description="Catalogue complet"
              onClick={() => goTo("exercises")}
            />
          </div>

          {/* ── CTA Nouvelle séance — in-flow, never overlaps ── */}
          <div className="pt-4 pb-2">
            <button
              onClick={openInput}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-accent py-5 text-white font-bold text-lg shadow-lg shadow-accent/20 transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-accent/30 active:scale-[0.97]"
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
              Nouvelle séance
            </button>
          </div>
        </div>
      </Wrap>

      {/* ══════ Full-screen input overlay ══════ */}
      {isInputOpen && (
        <div
          className="fixed inset-0 z-[110] flex flex-col bg-bg"
          role="dialog"
          aria-modal="true"
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-card">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              <h2 className="text-base font-bold">
                {editingId ? "Modifier la séance" : "Nouvelle séance"}
              </h2>
            </div>
            <button
              onClick={closeInput}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-soft hover:bg-bg-elev transition-colors active:scale-95"
              aria-label="Fermer"
            >
              <X className="h-5 w-5 text-text-muted" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <SessionInput
              onSave={handleSave}
              prefillText={prefillText}
              prefillVersion={prefillVersion}
              editing={
                editingSession
                  ? {
                      date: editingSession.date,
                      notes: editingSession.notes,
                      bodyWeight: editingSession.bodyWeight,
                    }
                  : undefined
              }
              onCancelEdit={() => {
                setEditingId(null);
                setPrefillText("");
                setPrefillVersion((v) => v + 1);
                closeInput();
              }}
            />
          </div>
        </div>
      )}

      {/* ══════ Modals & Overlays ══════ */}
      {publishSnapshot && (
        <PublishModal
          session={publishSnapshot.session}
          xpGained={publishSnapshot.xpGained}
          totalXpBefore={publishSnapshot.totalXpBefore}
          onPublish={handlePublish}
          onKeepPrivate={handleKeepPrivate}
          onClose={() => setPublishSnapshot(null)}
        />
      )}

      {levelUpLevel != null && (
        <LevelUpCelebration
          level={levelUpLevel}
          onDone={() => setLevelUpLevel(null)}
        />
      )}

      {prAlerts.length > 0 && (
        <PRCelebration alerts={prAlerts} onDone={() => setPrAlerts([])} />
      )}

      {showRestTimer && !publishSnapshot && (
        <RestTimer onClose={() => setShowRestTimer(false)} />
      )}
    </>
  );
}
