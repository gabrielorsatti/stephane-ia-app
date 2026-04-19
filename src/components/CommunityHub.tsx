import { Bell, Rss, Shield, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useFeed } from "../hooks/useFeed";
import { useNotifications } from "../hooks/useNotifications";
import { useSocialInteractions } from "../hooks/useSocialInteractions";
import type { Friendship, Profile } from "../types";
import { AdminPanel } from "./AdminPanel";
import { FeedView } from "./FeedView";
import { HubHeader } from "./HubHeader";
import { NavCard } from "./NavCard";
import { NotificationList } from "./NotificationList";
import { SocialView } from "./SocialView";
import { SlideBack, SlideIn } from "./Transition";

type View = "main" | "friends" | "admin" | "notifications";

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
}: Props) {
  const [view, setView] = useState<View>("main");
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const friendIds = useMemo(
    () => accepted.map((f) => (f.senderId === userId ? f.receiverId : f.senderId)),
    [accepted, userId],
  );
  const { posts, loading: feedLoading } = useFeed(userId, friendIds);
  const { toggleLike, addComment } = useSocialInteractions(userId);
  const { notifications, unreadCount, markAllRead } = useNotifications(userId);

  function goTo(v: View) {
    setDirection("forward");
    setView(v);
  }

  function goBack() {
    setDirection("back");
    setView("main");
  }

  const Wrap = direction === "forward" ? SlideIn : SlideBack;

  if (view === "notifications") {
    return (
      <Wrap id="community-notifications">
        <HubHeader title="Retour au flux" onBack={goBack} />
        <NotificationList
          notifications={notifications}
          onMarkAllRead={() => void markAllRead()}
        />
      </Wrap>
    );
  }

  if (view === "friends") {
    return (
      <Wrap id="community-friends">
        <HubHeader title="Retour au flux" onBack={goBack} />
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
      </Wrap>
    );
  }

  if (view === "admin" && isAdmin) {
    return (
      <Wrap id="community-admin">
        <HubHeader title="Retour au flux" onBack={goBack} />
        <AdminPanel />
      </Wrap>
    );
  }

  return (
    <Wrap id="community-main">
      <div className="space-y-4">
        {/* Profile card with friend count */}
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-lg">
              {profile.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">@{profile.username}</div>
              <div className="text-xs text-text-muted">
                {accepted.length} ami{accepted.length !== 1 ? "s" : ""}
                {pendingReceived.length > 0 && (
                  <span className="text-amber-400 ml-1.5">
                    · {pendingReceived.length} demande{pendingReceived.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar: Feed / Friends / Admin */}
        <div className="flex gap-2">
          <NavCard
            icon={Users}
            label={`Amis (${accepted.length})`}
            description="Gérer tes amis et demandes"
            onClick={() => goTo("friends")}
          />
          <div className="relative">
            <NavCard
              icon={Bell}
              label="Notifications"
              description="Réactions à tes séances"
              onClick={() => goTo("notifications")}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          {isAdmin && (
            <NavCard
              icon={Shield}
              label="Administration"
              description="Gestion des utilisateurs"
              onClick={() => goTo("admin")}
            />
          )}
        </div>

        {/* Feed */}
        <div className="flex items-center gap-2 mb-1">
          <Rss className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Flux d'activité</h3>
        </div>
        <FeedView
          posts={posts}
          loading={feedLoading}
          onToggleLike={toggleLike}
          onAddComment={addComment}
        />
      </div>
    </Wrap>
  );
}
