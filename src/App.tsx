import { LogOut, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminPanel, ADMIN_UID } from "./components/AdminPanel";
import { AuthGate } from "./components/AuthGate";
import { BackupControls } from "./components/BackupControls";
import { BodyWeightChart } from "./components/BodyWeightChart";
import { CalendarView } from "./components/CalendarView";
import { CardioStatsCard } from "./components/CardioStatsCard";
import { CategoryChart } from "./components/CategoryChart";
import { CoachChat } from "./components/CoachChat";
import { CrowdCheckPrompt } from "./components/CrowdCheckPrompt";
import { ExerciseCatalog } from "./components/ExerciseCatalog";
import { HistoryView } from "./components/HistoryView";
import { Logo } from "./components/Logo";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { Onboarding } from "./components/Onboarding";
import { PersonalRecords } from "./components/PersonalRecords";
import { ProfileSetup } from "./components/ProfileSetup";
import { ProgramView } from "./components/ProgramView";
import { NutritionView } from "./components/NutritionView";
import { OccupancyChart } from "./components/OccupancyChart";
import { ProgressionChart } from "./components/ProgressionChart";
import { SessionInput } from "./components/SessionInput";
import { SocialView } from "./components/SocialView";
import { StatsCards } from "./components/StatsCards";
import { UpdateToast } from "./components/UpdateToast";
import { VolumeChart } from "./components/VolumeChart";
import { useAuth } from "./hooks/useAuth";
import { useBodyWeight } from "./hooks/useBodyWeight";
import { useFriendships } from "./hooks/useFriendships";
import { useGyms } from "./hooks/useGyms";
import { useOccupancyFeedback } from "./hooks/useOccupancyFeedback";
import { useProfile } from "./hooks/useProfile";
import { usePrograms } from "./hooks/usePrograms";
import { useTheme } from "./hooks/useTheme";
import { useRecordOverrides } from "./hooks/useRecordOverrides";
import { useSessions } from "./hooks/useSessions";
import { migrateOwnerDataIfNeeded } from "./lib/ownerMigration";
import { setCloudMode } from "./lib/storage";
import { getSupabase } from "./lib/supabase";
import { sessionToNlp } from "./lib/toNlp";
import type { Session } from "./types";

type Tab =
  | "dashboard"
  | "historique"
  | "progression"
  | "alimentation"
  | "programme"
  | "exercices"
  | "coach"
  | "social"
  | "admin";

export default function App() {
  return (
    <AuthGate>
      <AppInner />
    </AuthGate>
  );
}

function AppInner() {
  const auth = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const cloud = auth.supabaseEnabled && !!auth.user;
    setCloudMode(cloud);
    if (cloud && auth.user) {
      const client = getSupabase();
      if (client) {
        void migrateOwnerDataIfNeeded(client, auth.user).then((migrated) => {
          if (migrated) {
            window.dispatchEvent(
              new CustomEvent("gym-tracker:storage-changed"),
            );
          }
        });
      }
    }
  }, [auth.supabaseEnabled, auth.user]);

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
  const { programs, replaceAll: replaceAllPrograms } = usePrograms();
  const { favorite: favoriteGym, favoriteId } = useGyms();
  const { addFeedback } = useOccupancyFeedback();

  // Profil et social.
  const { profile, needsSetup, ensureProfile } = useProfile(auth.user?.id);
  const {
    accepted,
    pendingReceived,
    pendingSent,
    sendRequest,
    accept,
    reject,
    remove: removeFriend,
    searchUser,
  } = useFriendships(auth.user?.id);

  const isAdmin =
    auth.user?.id === ADMIN_UID || (profile?.isAdmin ?? false);

  const [tab, setTab] = useState<Tab>("dashboard");
  const [prefillText, setPrefillText] = useState<string | undefined>();
  const [prefillVersion, setPrefillVersion] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [crowdCheckPending, setCrowdCheckPending] = useState(false);

  const TABS: Tab[] = [
    "dashboard",
    "historique",
    "progression",
    "alimentation",
    "programme",
    "exercices",
    "coach",
    "social",
    ...(isAdmin ? ["admin" as const] : []),
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
      if (favoriteId) {
        setCrowdCheckPending(true);
      }
    }
  }

  const editingSession = editingId
    ? sessions.find((s) => s.id === editingId)
    : undefined;

  // Gate : forcer le choix du pseudo avant toute interaction.
  if (auth.supabaseEnabled && auth.user && needsSetup) {
    return (
      <ProfileSetup
        onSubmit={async (username) => {
          await ensureProfile(username);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header
        className="border-b border-border bg-bg-soft/60 backdrop-blur sticky top-0 z-20"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-accent shrink-0">
              <Logo size={22} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">Personal Gym Tracker</div>
              <div className="text-xs text-text-muted truncate">
                {profile
                  ? `@${profile.username}`
                  : "Suis ta progression sans friction."}
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
            <button
              className="btn-ghost !px-2 !py-2"
              onClick={toggleTheme}
              title={
                theme === "dark"
                  ? "Passer au thème rose pastel"
                  : "Passer au thème sombre"
              }
              aria-label="Changer de thème"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            {auth.supabaseEnabled && auth.user && (
              <button
                className="btn-ghost !px-2 !py-2"
                onClick={() => void auth.signOut()}
                title={`Déconnexion (${auth.user.email ?? "compte"})`}
                aria-label="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Onboarding />

        {tab === "dashboard" && (
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
        )}

        {tab === "dashboard" && crowdCheckPending && favoriteGym && (
          <CrowdCheckPrompt
            gym={favoriteGym}
            onSubmit={(level) => {
              const now = new Date();
              addFeedback({
                gymId: favoriteGym.id,
                hour: now.getHours(),
                dayOfWeek: now.getDay(),
                level,
              });
              setCrowdCheckPending(false);
            }}
            onDismiss={() => setCrowdCheckPending(false)}
          />
        )}

        {tab === "dashboard" && (
          <>
            <StatsCards sessions={sessions} bodyWeight={latest?.poids} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <VolumeChart sessions={sessions} />
              <CategoryChart sessions={sessions} />
              <CardioStatsCard sessions={sessions} />
              <BodyWeightChart entries={entries} onAdd={addEntry} />
              <CalendarView sessions={sessions} />
              <OccupancyChart />
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
            <ProgressionChart sessions={sessions} overrides={overrides} />
            <PersonalRecords
              sessions={sessions}
              overrides={overrides}
              onUpsertOverride={upsertOverride}
              onRemoveOverride={removeOverride}
            />
          </div>
        )}

        {tab === "alimentation" && <NutritionView />}

        {tab === "programme" && <ProgramView onFillInput={fillFromProgram} />}

        {tab === "exercices" && <ExerciseCatalog />}

        {tab === "coach" && (
          <CoachChat
            sessions={sessions}
            bodyWeights={entries}
            overrides={overrides}
            programs={programs}
            onApplyPrograms={replaceAllPrograms}
          />
        )}

        {tab === "social" && auth.user && profile && (
          <SocialView
            userId={auth.user.id}
            profile={profile}
            accepted={accepted}
            pendingReceived={pendingReceived}
            pendingSent={pendingSent}
            onSearch={searchUser}
            onSendRequest={sendRequest}
            onAccept={accept}
            onReject={reject}
            onRemove={removeFriend}
          />
        )}

        {tab === "admin" && isAdmin && <AdminPanel />}
      </main>

      <MobileBottomNav
        active={tab}
        onChange={(t) => setTab(t as Tab)}
        isAdmin={isAdmin}
      />

      <UpdateToast />

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-xs text-text-dim space-y-1">
        <div>
          Application développée par{" "}
          <span className="font-semibold text-text-muted">Gabriel Orsatti</span>
        </div>
        <div>
          Données synchronisées en temps réel via Supabase (PostgreSQL).
          Architecture Cloud sécurisée et chiffrée.
        </div>
      </footer>
    </div>
  );
}
