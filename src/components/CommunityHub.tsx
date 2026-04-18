import { Shield } from "lucide-react";
import { useState } from "react";
import type { Friendship, Profile } from "../types";
import { AdminPanel } from "./AdminPanel";
import { HubHeader } from "./HubHeader";
import { NavCard } from "./NavCard";
import { SocialView } from "./SocialView";
import { SlideBack, SlideIn } from "./Transition";

type View = "main" | "admin";

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

  function goTo(v: View) {
    setDirection("forward");
    setView(v);
  }

  function goBack() {
    setDirection("back");
    setView("main");
  }

  const Wrap = direction === "forward" ? SlideIn : SlideBack;

  if (view === "admin" && isAdmin) {
    return (
      <Wrap id="community-admin">
        <HubHeader title="Retour à Communauté" onBack={goBack} />
        <AdminPanel />
      </Wrap>
    );
  }

  return (
    <Wrap id="community-main">
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
        {isAdmin && (
          <NavCard
            icon={Shield}
            label="Administration"
            description="Gestion des utilisateurs"
            onClick={() => goTo("admin")}
          />
        )}
      </div>
    </Wrap>
  );
}
