import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BackupControls } from "./components/BackupControls";
import { BodyWeightChart } from "./components/BodyWeightChart";
import { CalendarView } from "./components/CalendarView";
import { CategoryChart } from "./components/CategoryChart";
import { ExerciseCatalog } from "./components/ExerciseCatalog";
import { HistoryView } from "./components/HistoryView";
import { Logo } from "./components/Logo";
import { PersonalRecords } from "./components/PersonalRecords";
import { ProgramView } from "./components/ProgramView";
import { ProgressionChart } from "./components/ProgressionChart";
import { SessionInput } from "./components/SessionInput";
import { StatsCards } from "./components/StatsCards";
import { VolumeChart } from "./components/VolumeChart";
import { useBodyWeight } from "./hooks/useBodyWeight";
import { useRecordOverrides } from "./hooks/useRecordOverrides";
import { useSessions } from "./hooks/useSessions";
import { sessionToNlp } from "./lib/toNlp";
import type { Session } from "./types";

type Tab =
  | "dashboard"
  | "historique"
  | "progression"
  | "programme"
  | "exercices";

export default function App() {
  const {
    sessions,
    addSession,
    updateSession,
    removeSession,
    replaceAll: replaceSessions,
  } = useSessions();
  const { entries, addEntry, latest, replaceAll: replaceBodyWeights } =
    useBodyWeight();
  const {
    overrides,
    upsert: upsertOverride,
    remove: removeOverride,
  } = useRecordOverrides();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [prefillText, setPrefillText] = useState<string | undefined>();
  const [prefillVersion, setPrefillVersion] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Referme le menu mobile à chaque changement d'onglet.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [tab]);

  const TABS: Tab[] = [
    "dashboard",
    "historique",
    "progression",
    "programme",
    "exercices",
  ];

  function fillFromProgram(text: string) {
    setPrefillText(text);
    setPrefillVersion((v) => v + 1);
    setEditingId(null);
    setTab("dashboard");
  }

  function startEdit(session: Session) {
    setPrefillText(sessionToNlp(session));
    setPrefillVersion((v) => v + 1);
    setEditingId(session.id);
    setTab("dashboard");
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

  const editingSession = editingId
    ? sessions.find((s) => s.id === editingId)
    : undefined;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-bg-soft/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-accent shrink-0">
              <Logo size={22} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">Personal Gym Tracker</div>
              <div className="text-xs text-text-muted truncate">
                Suis ta progression sans friction.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BackupControls
              sessions={sessions}
              bodyWeights={entries}
              onImport={(s, b) => {
                replaceSessions(s);
                replaceBodyWeights(b);
              }}
            />
            {/* Navigation desktop : visible à partir de md */}
            <nav className="hidden md:flex gap-1 bg-bg-card border border-border rounded-lg p-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={[
                    "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors",
                    tab === t
                      ? "bg-accent text-bg"
                      : "text-text-muted hover:text-text",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </nav>
            {/* Bouton hamburger : visible en dessous de md */}
            <button
              className="md:hidden btn-ghost !px-2 !py-2"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

      </header>

      {/* Panneau mobile : bottom sheet, ancré en bas pour rester accessible au pouce */}
      {mobileNavOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg-card rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-border-strong" />
            </div>
            <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={[
                    "w-full text-left px-4 py-3 rounded-lg text-sm font-medium capitalize transition-colors",
                    tab === t
                      ? "bg-accent text-bg"
                      : "bg-bg-soft text-text-muted hover:text-text border border-border",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>
          </nav>
        </>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
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

        {tab === "dashboard" && (
          <>
            <StatsCards sessions={sessions} bodyWeight={latest?.poids} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <VolumeChart sessions={sessions} />
              <CategoryChart sessions={sessions} />
              <BodyWeightChart entries={entries} onAdd={addEntry} />
              <CalendarView sessions={sessions} />
            </div>
          </>
        )}

        {tab === "historique" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <HistoryView
                sessions={sessions}
                onRemove={removeSession}
                onEdit={startEdit}
              />
            </div>
            <div>
              <CalendarView sessions={sessions} />
            </div>
          </div>
        )}

        {tab === "progression" && (
          <div className="space-y-4">
            <ProgressionChart sessions={sessions} />
            <PersonalRecords
              sessions={sessions}
              overrides={overrides}
              onUpsertOverride={upsertOverride}
              onRemoveOverride={removeOverride}
            />
          </div>
        )}

        {tab === "programme" && <ProgramView onFillInput={fillFromProgram} />}

        {tab === "exercices" && <ExerciseCatalog />}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-xs text-text-dim space-y-1">
        <div>
          Application développée par{" "}
          <span className="font-semibold text-text-muted">Gabriel Orsatti</span>
        </div>
        <div>
          Données stockées localement (LocalStorage) · Prêt pour une migration
          SQLite/PostgreSQL
        </div>
      </footer>
    </div>
  );
}
