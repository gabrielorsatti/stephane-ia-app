import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, MessageCircle, Zap } from "lucide-react";
import type { AppNotification } from "../types";
import { EmptyState } from "./EmptyState";

interface Props {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

export function NotificationList({ notifications, onMarkAllRead }: Props) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Aucune notification"
        description="Tu recevras des notifications quand tes amis réagiront à tes séances."
      />
    );
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Notifications</h3>
        </div>
        {hasUnread && (
          <button
            className="text-xs text-accent hover:text-accent-soft"
            onClick={onMarkAllRead}
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={[
              "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors",
              n.isRead ? "bg-bg-soft/50" : "bg-accent-muted/20 border border-accent-muted/40",
            ].join(" ")}
          >
            <div className="mt-0.5 shrink-0">
              {n.type === "like" ? (
                <Zap className="w-4 h-4 text-amber-400" />
              ) : (
                <MessageCircle className="w-4 h-4 text-accent" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text">
                <span className="font-semibold">@{n.actorUsername}</span>{" "}
                {n.type === "like"
                  ? "a aimé ta séance"
                  : "a commenté ta séance"}
              </p>
              <p className="text-[11px] text-text-dim mt-0.5">
                {formatDistanceToNow(parseISO(n.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            </div>
            {!n.isRead && (
              <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
