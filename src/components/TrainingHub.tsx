import {
  BookOpen,
  Dumbbell,
  History,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import type {
  PersonalRecordOverride,
  Session,
} from "../types";
import { sessionToNlp } from "../lib/toNlp";
import { ExerciseCatalog } from "./ExerciseCatalog";
import { HistoryView } from "./HistoryView";
import { HubHeader } from "./HubHeader";
import { NavCard } from "./NavCard";
import { PersonalRecords } from "./PersonalRecords";
import { ProgressionChart } from "./ProgressionChart";
import { ProgramView } from "./ProgramView";
import { SessionInput } from "./SessionInput";
import { SlideBack, SlideIn } from "./Transition";

type View = "main" | "history" | "exercises" | "programs" | "progression";

interface Props {
  sessions: Session[];
  addSession: (s: Omit<Session, "id">) => void;
  updateSession: (id: string, s: Omit<Session, "id">) => void;
  removeSession: (id: string) => void;
  overrides: PersonalRecordOverride[];
  upsertOverride: (o: PersonalRecordOverride) => void;
  removeOverride: (exercise: string) => void;
}

export function TrainingHub({
  sessions,
  addSession,
  updateSession,
  removeSession,
  overrides,
  upsertOverride,
  removeOverride,
}: Props) {
  const [view, setView] = useState<View>("main");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [prefillText, setPrefillText] = useState<string | undefined>();
  const [prefillVersion, setPrefillVersion] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingSession = editingId
    ? sessions.find((s) => s.id === editingId)
    : undefined;

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
    } else {
      addSession(session);
    }
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
          <ProgressionChart sessions={sessions} overrides={overrides} />
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
    </Wrap>
  );
}
