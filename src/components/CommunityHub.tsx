import { Settings, Shield } from "lucide-react";
import { useState } from "react";
import type { Theme } from "../hooks/useTheme";
import type { BodyWeightEntry, Friendship, Profile, Session } from "../types";
import { AdminPanel } from "./AdminPanel";
import { HubHeader } from "./HubHeader";
import { NavCard } from "./NavCard";
import { SettingsHub } from "./SettingsHub";
import { SocialView } from "./SocialView";

type View = "main" | "admin" | "settings";

interface Props {
  userId: string;
  profile: Profile;
  isAdmin: boolean;
  accepted: Friendship[];
  pendingReceived: Friendship[];
  pendingSent: Friendship[];
  onSearch: (query: string) => Promise<Profile[]>;
  onSendRequest: (receiverId: string) => Promise<void>;
  onAccept: (friendshipId: string) => Promise<void>;
  onReject: (friendshipId: string) => Promise<void>;
  onRemove: (friendshipId: string) => Promise<void>;
  theme: Theme;
  onToggleTheme: () => void;
  onUpdateUsername: (username: string) => Promise<void>;
  onSignOut?: () => void;
  sessions: Session[];
  bodyWeights: BodyWeightEntry[];
  onImport: (sessions: Session[], bodyWeights: BodyWeightEntry[]) => void;
}

export function CommunityHub({
  userId,
  profile,
  isAdmin,
  accepted,
  pendingReceived,
  pendingSent,
  onSearch,
  onSendRequest,
  onAccept,
  onReject,
  onRemove,
  theme,
  onToggleTheme,
  onUpdateUsername,
  onSignOut,
  sessions,
  bodyWeights,
  onImport,
}: Props) {
  const [view, setView] = useState<View>("main");

  if (view === "admin" && isAdmin) {
    return (
      <>
        <HubHeader title="Retour à Communauté" onBack={() => setView("main")} />
        <AdminPanel />
      </>
    );
  }

  if (view === "settings") {
    return (
      <>
        <HubHeader title="Retour à Communauté" onBack={() => setView("main")} />
        <SettingsHub
          profile={profile}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onUpdateUsername={onUpdateUsername}
          onSignOut={onSignOut}
          sessions={sessions}
          bodyWeights={bodyWeights}
          onImport={onImport}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <SocialView
        userId={userId}
        profile={profile}
        accepted={accepted}
        pendingReceived={pendingReceived}
        pendingSent={pendingSent}
        onSearch={onSearch}
        onSendRequest={onSendRequest}
        onAccept={onAccept}
        onReject={onReject}
        onRemove={onRemove}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NavCard
          icon={Settings}
          label="Réglages"
          description="Thème, profil, données, à propos"
          onClick={() => setView("settings")}
        />
        {isAdmin && (
          <NavCard
            icon={Shield}
            label="Administration"
            description="Gestion des utilisateurs"
            onClick={() => setView("admin")}
          />
        )}
      </div>
    </div>
  );
}
