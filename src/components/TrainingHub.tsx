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
  const [prefillText, setPrefillText] = useState<string | undefined>();
  const [prefillVersion, setPrefillVersion] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingSession = editingId
    ? sessions.find((s) => s.id === editingId)
    : undefined;

  function startEdit(session: Session) {
    setPrefillText(sessionToNlp(session));
    setPrefillVersion((v) => v + 1);
    setEditingId(session.id);
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
    setView("main");
  }

  if (view === "history") {
    return (
      <>
        <HubHeader title="Retour à Training" onBack={() => setView("main")} />
        <HistoryView
          sessions={sessions}
          onRemove={removeSession}
          onEdit={startEdit}
        />
      </>
    );
  }

  if (view === "exercises") {
    return (
      <>
        <HubHeader title="Retour à Training" onBack={() => setView("main")} />
        <ExerciseCatalog />
      </>
    );
  }

  if (view === "programs") {
    return (
      <>
        <HubHeader title="Retour à Training" onBack={() => setView("main")} />
        <ProgramView onFillInput={fillFromProgram} />
      </>
    );
  }

  if (view === "progression") {
    return (
      <>
        <HubHeader title="Retour à Training" onBack={() => setView("main")} />
        <div className="space-y-4">
          <ProgressionChart sessions={sessions} overrides={overrides} />
          <PersonalRecords
            sessions={sessions}
            overrides={overrides}
            onUpsertOverride={upsertOverride}
            onRemoveOverride={removeOverride}
          />
        </div>
      </>
    );
  }

  return (
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
          onClick={() => setView("history")}
        />
        <NavCard
          icon={BookOpen}
          label="Programmes"
          description="Tes templates de séances"
          onClick={() => setView("programs")}
        />
        <NavCard
          icon={Dumbbell}
          label="Exercices"
          description="Catalogue complet"
          onClick={() => setView("exercises")}
        />
        <NavCard
          icon={TrendingUp}
          label="Progression"
          description="Courbes et records personnels"
          onClick={() => setView("progression")}
        />
      </div>
    </div>
  );
}
