import { Dumbbell } from "lucide-react";
import { useState } from "react";
import { BackupControls } from "./components/BackupControls";
import { BodyWeightChart } from "./components/BodyWeightChart";
import { CalendarView } from "./components/CalendarView";
import { CategoryChart } from "./components/CategoryChart";
import { ProgressionChart } from "./components/ProgressionChart";
import { SessionInput } from "./components/SessionInput";
import { SessionList } from "./components/SessionList";
import { StatsCards } from "./components/StatsCards";
import { VolumeChart } from "./components/VolumeChart";
import { useBodyWeight } from "./hooks/useBodyWeight";
import { useSessions } from "./hooks/useSessions";

type Tab = "dashboard" | "historique" | "progression";

export default function App() {
  const { sessions, addSession, removeSession, replaceAll: replaceSessions } =
    useSessions();
  const { entries, addEntry, latest, replaceAll: replaceBodyWeights } =
    useBodyWeight();
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-bg-soft/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-black">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Personal Gym Tracker</div>
              <div className="text-xs text-text-muted">
                Suis ta progression sans friction.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BackupControls
              sessions={sessions}
              bodyWeights={entries}
              onImport={(s, b) => {
                replaceSessions(s);
                replaceBodyWeights(b);
              }}
            />
            <nav className="flex gap-1 bg-bg-card border border-border rounded-lg p-1">
            {(["dashboard", "historique", "progression"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors",
                  tab === t
                    ? "bg-accent text-black"
                    : "text-text-muted hover:text-text",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <SessionInput onSave={addSession} />

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
              <SessionList sessions={sessions} onRemove={removeSession} />
            </div>
            <div>
              <CalendarView sessions={sessions} />
            </div>
          </div>
        )}

        {tab === "progression" && (
          <div className="space-y-4">
            <ProgressionChart sessions={sessions} />
            <CategoryChart sessions={sessions} />
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-xs text-text-dim">
        Données stockées localement (LocalStorage) · Prêt pour une migration
        SQLite/PostgreSQL
      </footer>
    </div>
  );
}
