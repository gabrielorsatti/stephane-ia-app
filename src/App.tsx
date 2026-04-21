import { Rss, Settings } from "lucide-react";
import { levelFromXp } from "./lib/leveling";
import { LevelBadge } from "./components/LevelBadge";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_UID } from "./components/AdminPanel";
import { AuthGate } from "./components/AuthGate";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineBadge } from "./components/OfflineBadge";
import { BodyWeightChart } from "./components/BodyWeightChart";
import { FadeIn } from "./components/Transition";
import { CalendarView } from "./components/CalendarView";
import { FeedView } from "./components/FeedView";
import { CrowdCheckPrompt } from "./components/CrowdCheckPrompt";
import type { Hub } from "./components/hubTypes";
import { InstallPrompt } from "./components/InstallPrompt";
import { Logo } from "./components/Logo";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { OccupancyChart } from "./components/OccupancyChart";
import { Onboarding } from "./components/Onboarding";
import { ProfileSetup } from "./components/ProfileSetup";
import { SettingsHub } from "./components/SettingsHub";
import { Sidebar } from "./components/Sidebar";
import { SkeletonCard } from "./components/Skeleton";
import { LoadingScreen } from "./components/LoadingScreen";
import { UpdateToast } from "./components/UpdateToast";
import { ErrorToast } from "./components/ErrorToast";
import { UserProfileView } from "./components/UserProfileView";
import { VolumeChart } from "./components/VolumeChart";
import { GoalSettingModal } from "./components/GoalSettingModal";
import { StreakBadge } from "./components/StreakBadge";
import { WeeklyChallengeCard } from "./components/WeeklyChallengeCard";
import { WeeklyProgressBar } from "./components/WeeklyProgressBar";
import { computeStreaks } from "./lib/streaks";
import { generateWeeklyChallenge } from "./lib/weeklyChallenge";
import { sessionsThisWeek } from "./lib/weeklyGoal";

const TrainingHub = lazy(() => import("./components/TrainingHub").then(m => ({ default: m.TrainingHub })));
const NutritionHub = lazy(() => import("./components/NutritionHub").then(m => ({ default: m.NutritionHub })));
const CoachChat = lazy(() => import("./components/CoachChat").then(m => ({ default: m.CoachChat })));
const CommunityHub = lazy(() => import("./components/CommunityHub").then(m => ({ default: m.CommunityHub })));
import { useAuth } from "./hooks/useAuth";
import { useBodyWeight } from "./hooks/useBodyWeight";
import { useFeed } from "./hooks/useFeed";
import { useFriendships } from "./hooks/useFriendships";
import { useNotifications } from "./hooks/useNotifications";
import { useSocialInteractions } from "./hooks/useSocialInteractions";
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
    <ErrorBoundary>
      <AuthGate>
        <AppInner />
      </AuthGate>
    </ErrorBoundary>
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

  const { profile, loading: profileLoading, loadError: profileError, needsSetup, ensureProfile, updateUsername, updateAvatar, updateBio, addXp, updateWeeklyGoal } =
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

  const { unreadCount: notifCount } = useNotifications(auth.user?.id);

  const homeFriendIds = useMemo(
    () => accepted.map((f) => (f.senderId === auth.user?.id ? f.receiverId : f.senderId)),
    [accepted, auth.user?.id],
  );
  const { posts: homePosts, loading: homeFeedLoading } = useFeed(auth.user?.id, homeFriendIds);
  const { toggleLike: homeToggleLike, addComment: homeAddComment } = useSocialInteractions(auth.user?.id);

  const isAdmin =
    auth.user?.id === ADMIN_UID || (profile?.isAdmin ?? false);

  const [hub, setHub] = useState<Hub>("home");
  const prevHubRef = useRef<Hub>("home");
  const [crowdCheckPending, setCrowdCheckPending] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const weeklyCount = useMemo(() => sessionsThisWeek(sessions), [sessions]);
  const streak = useMemo(() => computeStreaks(sessions), [sessions]);
  const challenge = useMemo(() => generateWeeklyChallenge(sessions), [sessions]);
  const needsGoalSetup = !profileLoading && profile != null && profile.weeklyGoal == null;

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
    const result = addSession(session);
    if (favoriteId) {
      setCrowdCheckPending(true);
    }
    return result;
  }

  if (auth.supabaseEnabled && (!auth.ready || (auth.user && profileLoading))) {
    return <LoadingScreen />;
  }

  if (auth.supabaseEnabled && auth.user && profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-sm text-center space-y-3">
          <p className="text-sm text-text-muted">
            Impossible de charger le profil. Vérifie ta connexion ou réessaie.
          </p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
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
              <div className="font-semibold truncate">Gym Track</div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                {profile ? (
                  <>
                    <span className="truncate">@{profile.username}</span>
                    <LevelBadge level={levelFromXp(profile.totalXp)} size="sm" />
                    <StreakBadge streak={streak} />
                  </>
                ) : (
                  <span className="truncate">Suis ta progression sans friction.</span>
                )}
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
        <Sidebar active={hub} onChange={navigate} notifCount={notifCount} />

        <main className="flex-1 max-w-5xl mx-auto px-4 py-6 space-y-6 min-w-0">
          <Onboarding />

          {hub === "home" && !viewingProfileId && (
            <FadeIn id="home">
              {profile?.weeklyGoal != null && (
                <WeeklyProgressBar
                  current={weeklyCount}
                  goal={profile.weeklyGoal}
                  onClick={() => setShowGoalModal(true)}
                />
              )}

              <WeeklyChallengeCard challenge={challenge} />

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

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Rss className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold">Flux d'activité</h3>
                </div>
                <FeedView
                  posts={homePosts}
                  loading={homeFeedLoading}
                  onToggleLike={homeToggleLike}
                  onAddComment={homeAddComment}
                  onViewProfile={setViewingProfileId}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                <OccupancyChart />
                <CalendarView sessions={sessions} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <VolumeChart sessions={sessions} compact />
                <BodyWeightChart entries={entries} onAdd={addEntry} compact />
              </div>
            </FadeIn>
          )}

          {hub === "home" && viewingProfileId && (
            <FadeIn id="profile-view">
              <UserProfileView
                userId={viewingProfileId}
                onBack={() => setViewingProfileId(null)}
              />
            </FadeIn>
          )}

          <Suspense fallback={<SkeletonCard />}>
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
                  programs={programs}
                  userId={auth.user?.id}
                  bodyWeight={latest?.poids}
                  totalXp={profile?.totalXp}
                  onAddXp={addXp}
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
                  userId={auth.user?.id}
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
          </Suspense>

          {hub === "settings" && (
            <FadeIn id="settings">
              <SettingsHub
                profile={profile}
                theme={theme}
                onToggleTheme={toggleTheme}
                onUpdateUsername={updateUsername}
                onUpdateAvatar={updateAvatar}
                onUpdateBio={updateBio}
                userId={auth.user?.id}
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

      <MobileBottomNav active={hub} onChange={navigate} notifCount={notifCount} />

      <OfflineBadge />
      <UpdateToast />
      <InstallPrompt />
      <ErrorToast />

      {(showGoalModal || needsGoalSetup) && (
        <GoalSettingModal
          currentGoal={profile?.weeklyGoal ?? undefined}
          onSave={updateWeeklyGoal}
          onClose={() => setShowGoalModal(false)}
        />
      )}

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
