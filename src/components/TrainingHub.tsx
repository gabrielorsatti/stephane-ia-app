import {
  BookOpen,
  CheckCircle2,
  Dumbbell,
  History,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ProgramTemplate } from "../data/programs";
import type {
  PersonalRecordOverride,
  Session,
} from "../types";
import { sessionScore } from "../lib/scoring";
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

  function goTo(v: View) {
    setDirection("forward");
    setView(v);
  }

  function goBack() {
    setDirection("back");
    setView("main");
  }

  function startEdit(session: Session) {
    setPrefillText(sessionToNlp(session));
    setPrefillVersion((v) => v + 1);
    setEditingId(session.id);
    setDirection("back");
    setView("main");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSave(session: Omit<Session, "id">) {
    if (editingId) {
      updateSession(editingId, session);
      setEditingId(null);
      setPrefillText("");
      setPrefillVersion((v) => v + 1);
      void requestCommentary(editingId, { ...session, id: editingId });
    } else {
      const result = addSession(session);
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
    setDirection("back");
    setView("main");
  }

  const Wrap = direction === "forward" ? SlideIn : SlideBack;

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

  return (
    <Wrap id="training-main">
      <div className="space-y-4">
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
          }}
        />

        {activeSession && (
          <button
            className="w-full btn-primary !py-3 text-base font-semibold"
            onClick={finishSession}
          >
            <CheckCircle2 className="w-5 h-5" /> Terminer ma séance
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <NavCard
            icon={TrendingUp}
            label="Progression"
            description="Courbes et records personnels"
            onClick={() => goTo("progression")}
          />
        </div>
      </div>

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
