import { Settings } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ADMIN_UID } from "./components/AdminPanel";
import { AuthGate } from "./components/AuthGate";
import { BodyWeightChart } from "./components/BodyWeightChart";
import { FadeIn } from "./components/Transition";
import { CalendarView } from "./components/CalendarView";
import { CardioStatsCard } from "./components/CardioStatsCard";
import { CategoryChart } from "./components/CategoryChart";
import { CoachChat } from "./components/CoachChat";
import { CommunityHub } from "./components/CommunityHub";
import { CrowdCheckPrompt } from "./components/CrowdCheckPrompt";
import type { Hub } from "./components/hubTypes";
import { Logo } from "./components/Logo";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { NutritionHub } from "./components/NutritionHub";
import { OccupancyChart } from "./components/OccupancyChart";
import { Onboarding } from "./components/Onboarding";
import { ProfileSetup } from "./components/ProfileSetup";
import { SettingsHub } from "./components/SettingsHub";
import { Sidebar } from "./components/Sidebar";
import { StatsCards } from "./components/StatsCards";
import { TrainingHub } from "./components/TrainingHub";
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

  const { profile, needsSetup, ensureProfile, updateUsername } =
    useProfile(auth.user?.id);
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

  const [hub, setHub] = useState<Hub>("home");
  const prevHubRef = useRef<Hub>("home");
  const [crowdCheckPending, setCrowdCheckPending] = useState(false);

  const navigate = useCallback(
    (next: Hub) => {
      if (next !== "settings") prevHubRef.current = next;
      setHub(next);
    },
    [],
  );

  function goBackFromSettings() {
    setHub(prevHubRef.current);
  }

  function handleAddSession(session: Omit<import("./types").Session, "id">) {
    addSession(session);
    if (favoriteId) {
      setCrowdCheckPending(true);
    }
  }

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

          <button
            onClick={() => navigate("settings")}
            className={[
              "md:hidden w-11 h-11 flex items-center justify-center rounded-xl transition-colors active:scale-95 shrink-0",
              hub === "settings"
                ? "bg-accent/15 text-accent"
                : "text-text-muted hover:text-text hover:bg-bg-elev",
            ].join(" ")}
            aria-label="Réglages"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex">
        <Sidebar active={hub} onChange={navigate} />

        <main className="flex-1 max-w-5xl mx-auto px-4 py-6 space-y-6 min-w-0">
          <Onboarding />

          {hub === "home" && (
            <FadeIn id="home">
              {crowdCheckPending && favoriteGym && (
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
              <StatsCards sessions={sessions} bodyWeight={latest?.poids} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                <VolumeChart sessions={sessions} />
                <CategoryChart sessions={sessions} />
                <CardioStatsCard sessions={sessions} />
                <BodyWeightChart entries={entries} onAdd={addEntry} />
                <CalendarView sessions={sessions} />
                <OccupancyChart />
              </div>
            </FadeIn>
          )}

          {hub === "training" && (
            <FadeIn id="training">
              <TrainingHub
                sessions={sessions}
                addSession={handleAddSession}
                updateSession={updateSession}
                removeSession={removeSession}
                overrides={overrides}
                upsertOverride={upsertOverride}
                removeOverride={removeOverride}
              />
            </FadeIn>
          )}

          {hub === "nutrition" && (
            <FadeIn id="nutrition">
              <NutritionHub
                bodyWeightEntries={entries}
                onAddBodyWeight={addEntry}
              />
            </FadeIn>
          )}

          {hub === "coach" && (
            <FadeIn id="coach">
              <CoachChat
                sessions={sessions}
                bodyWeights={entries}
                overrides={overrides}
                programs={programs}
                onApplyPrograms={replaceAllPrograms}
              />
            </FadeIn>
          )}

          {hub === "community" && auth.user && profile && (
            <FadeIn id="community">
              <CommunityHub
                userId={auth.user.id}
                profile={profile}
                isAdmin={isAdmin}
                accepted={accepted}
                pendingReceived={pendingReceived}
                pendingSent={pendingSent}
                onSearch={searchUser}
                onSendRequest={sendRequest}
                onAccept={accept}
                onReject={reject}
                onRemove={removeFriend}
              />
            </FadeIn>
          )}

          {hub === "settings" && (
            <FadeIn id="settings">
              <SettingsHub
                profile={profile}
                theme={theme}
                onToggleTheme={toggleTheme}
                onUpdateUsername={updateUsername}
                onSignOut={
                  auth.supabaseEnabled && auth.user
                    ? () => void auth.signOut()
                    : undefined
                }
                sessions={sessions}
                bodyWeights={entries}
                onImport={(s, b) => {
                  replaceSessions(s);
                  replaceBodyWeights(b);
                }}
                onBack={goBackFromSettings}
              />
            </FadeIn>
          )}
        </main>
      </div>

      <MobileBottomNav active={hub} onChange={navigate} />

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
