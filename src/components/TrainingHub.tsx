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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProgramTemplate } from "../data/programs";
import type {
  PersonalRecordOverride,
  Session,
} from "../types";
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
  const [publishSnapshot, setPublishSnapshot] = useState<{ id: string; session: Session; xpGained?: number; totalXpBefore?: number } | null>(null);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [prAlerts, setPrAlerts] = useState<PRAlert[]>([]);
  const [celebratedPRs, setCelebratedPRs] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);

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
      const created = s.createdAt ? new Date(s.createdAt).getTime() : parseInt(s.id, 10);
      return !isNaN(created) && now - created < MERGE_WINDOW_MS && !s.isPublished;
    });
  }, [sessions, publishSnapshot]);

  // Quick stats for hero card
  const heroStats = useMemo(() => {
    const last30 = sessions.filter((s) => {
      const d = new Date(s.date).getTime();
      return Date.now() - d < 30 * 24 * 3600 * 1000;
    });
    const volume30 = last30.reduce((acc, s) => acc + sessionVolume(s), 0);
    const summary = buildProgressionSummary(sessions, 12);
    return {
      sessions30: last30.length,
      volume30,
      trend: summary.volumeTrendPercent,
      topProg: summary.topProgressions[0],
    };
  }, [sessions]);

  function goTo(v: View) {
    setDirection("forward");
    setView(v);
  }

  function goBack() {
    setDirection("back");
    setView("main");
  }

  function openDrawer() {
    setDrawerOpen(true);
  }

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    if (!editingId) {
      setPrefillText("");
      setPrefillVersion((v) => v + 1);
    }
  }, [editingId]);

  // Close drawer on Escape key
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  function startEdit(session: Session) {
    setPrefillText(sessionToNlp(session));
    setPrefillVersion((v) => v + 1);
    setEditingId(session.id);
    setDrawerOpen(true);
    setDirection("back");
    setView("main");
  }

  function handleSave(session: Omit<Session, "id">) {
    if (editingId) {
      updateSession(editingId, session);
      setEditingId(null);
      setPrefillText("");
      setPrefillVersion((v) => v + 1);
      setDrawerOpen(false);
      void requestCommentary(editingId, { ...session, id: editingId });
    } else {
      const result = addSession(session);
      setDrawerOpen(false);
      setShowRestTimer(true);
      const prs = detectNewPRs(result.session, sessions, celebratedPRs);
      if (prs.length > 0) {
        setPrAlerts(prs);
        setCelebratedPRs(prev => {
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
    const historySummary = summary.totalSessions >= 3 ? summary.textSummary : undefined;
    const commentary = await generateSessionCommentary(session, programs, userId, historySummary);
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

  function handlePublish(userComment: string) {
    if (!publishSnapshot) return;
    updateSession(publishSnapshot.id, {
      isPublished: true,
      userComment: userComment || undefined,
      publishedAt: new Date().toISOString(),
    });
    setPublishSnapshot(null);
  }

  function handleKeepPrivate() {
    setPublishSnapshot(null);
  }

  function fillFromProgram(text: string) {
    setPrefillText(text);
    setPrefillVersion((v) => v + 1);
    setEditingId(null);
    setDrawerOpen(true);
    setDirection("back");
    setView("main");
  }

  const Wrap = direction === "forward" ? SlideIn : SlideBack;

  // ── Sub-views ──

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
        <div className="space-y-4">
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
    <Wrap id="training-main">
      <div className="space-y-4 pb-24">

        {/* ── Active session banner ── */}
        {activeSession && (
          <button
            onClick={finishSession}
            className="w-full flex items-center gap-3 rounded-2xl bg-gradient-to-r from-accent/15 via-accent/10 to-transparent border border-accent/25 px-4 py-3 text-left transition-all hover:border-accent/40 active:scale-[0.98]"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
              <Activity className="relative h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Séance en cours</div>
              <div className="text-xs text-text-muted truncate">
                {activeSession.exercices.length} exercice{activeSession.exercices.length !== 1 ? "s" : ""} · Appuie pour terminer
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-accent shrink-0" />
          </button>
        )}

        {/* ── Hero Progression Card ── */}
        <button
          onClick={() => goTo("progression")}
          className="w-full relative overflow-hidden rounded-3xl p-5 text-left transition-all duration-200 hover:shadow-xl hover:shadow-accent/8 active:scale-[0.97] group"
        >
          {/* Glass background */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/[0.08] via-lavender/[0.06] to-powder/[0.04] border border-accent/15 backdrop-blur-sm group-hover:border-accent/30 transition-colors" />

          {/* Decorative glow */}
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-lavender/8 blur-2xl" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="text-base font-bold">Progression</div>
                  <div className="text-xs text-text-muted">Courbes · Records · Coach</div>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-bg-card/60 border border-border/50 group-hover:bg-accent/10 group-hover:border-accent/30 transition-colors">
                <ChevronRight className="h-4 w-4 text-text-dim group-hover:text-accent transition-colors" />
              </div>
            </div>

            {/* Inline stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-bg-card/50 border border-border/40 px-3 py-2.5 text-center backdrop-blur-sm">
                <div className="text-lg font-bold">{heroStats.sessions30}</div>
                <div className="text-[10px] text-text-dim uppercase tracking-wider">séances/30j</div>
              </div>
              <div className="rounded-2xl bg-bg-card/50 border border-border/40 px-3 py-2.5 text-center backdrop-blur-sm">
                <div className="text-lg font-bold">{formatKg(heroStats.volume30)}</div>
                <div className="text-[10px] text-text-dim uppercase tracking-wider">volume/30j</div>
              </div>
              <div className="rounded-2xl bg-bg-card/50 border border-border/40 px-3 py-2.5 text-center backdrop-blur-sm">
                <div className={`text-lg font-bold ${heroStats.trend > 0 ? "text-green-500" : heroStats.trend < 0 ? "text-rose-400" : ""}`}>
                  {heroStats.trend > 0 ? "+" : ""}{heroStats.trend}%
                </div>
                <div className="text-[10px] text-text-dim uppercase tracking-wider">tendance</div>
              </div>
            </div>

            {/* Top progression teaser */}
            {heroStats.topProg && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-500/8 border border-green-500/15 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-green-500 shrink-0" />
                <span className="text-xs text-text-muted truncate">
                  <span className="font-medium text-text">{heroStats.topProg.nom}</span>
                  {" "}
                  {heroStats.topProg.oldMax}→{heroStats.topProg.newMax} kg
                  {" "}
                  <span className="font-semibold text-green-500">+{heroStats.topProg.deltaPercent}%</span>
                </span>
              </div>
            )}
          </div>
        </button>

        {/* ── Navigation grid ── */}
        <div className="grid grid-cols-3 gap-2.5">
          <NavCard
            icon={History}
            label="Historique"
            description="Séances passées"
            onClick={() => goTo("history")}
          />
          <NavCard
            icon={BookOpen}
            label="Programmes"
            description="Tes templates"
            onClick={() => goTo("programs")}
          />
          <NavCard
            icon={Dumbbell}
            label="Exercices"
            description="Catalogue"
            onClick={() => goTo("exercises")}
          />
        </div>
      </div>

      {/* ── FAB "Nouvelle séance" ── */}
      <button
        onClick={openDrawer}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2.5 rounded-full bg-accent pl-4 pr-5 py-3.5 text-white font-semibold shadow-xl shadow-accent/25 transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-accent/30 active:scale-95"
        aria-label="Nouvelle séance"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        <span className="text-sm">Nouvelle séance</span>
      </button>

      {/* ── Drawer / Bottom sheet ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
            onClick={closeDrawer}
          />

          {/* Sheet */}
          <div
            ref={drawerRef}
            className="relative mt-auto w-full max-h-[92vh] overflow-y-auto rounded-t-3xl bg-bg-card border-t border-border shadow-2xl"
            style={{ animation: "drawerSlideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            {/* Handle bar */}
            <div className="sticky top-0 z-10 flex justify-center pt-3 pb-1 bg-bg-card rounded-t-3xl">
              <div className="h-1 w-10 rounded-full bg-border-strong/60" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                <h2 className="text-base font-bold">
                  {editingId ? "Modifier la séance" : "Nouvelle séance"}
                </h2>
              </div>
              <button
                onClick={closeDrawer}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-bg-soft hover:bg-bg-elev transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4 text-text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-6">
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
                  closeDrawer();
                }}
              />
            </div>
          </div>
        </div>
      )}

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
        <LevelUpCelebration level={levelUpLevel} onDone={() => setLevelUpLevel(null)} />
      )}

      {prAlerts.length > 0 && (
        <PRCelebration alerts={prAlerts} onDone={() => setPrAlerts([])} />
      )}

      {showRestTimer && !publishSnapshot && (
        <RestTimer onClose={() => setShowRestTimer(false)} />
      )}
    </Wrap>
  );
}
