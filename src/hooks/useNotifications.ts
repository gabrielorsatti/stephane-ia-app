import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import type { AppNotification } from "../types";

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    const client = getSupabase();
    if (!client || !userId) return;

    const { data } = await client
      .from("notifications")
      .select("id, user_id, actor_id, type, session_id, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data) return;

    const actorIds = [...new Set(data.map((n) => n.actor_id))];
    const profileMap = new Map<string, string>();

    if (actorIds.length > 0) {
      const { data: profiles } = await client
        .from("profiles")
        .select("id, username")
        .in("id", actorIds);
      for (const p of profiles ?? []) profileMap.set(p.id, p.username);
    }

    const mapped: AppNotification[] = data.map((n) => ({
      id: n.id,
      userId: n.user_id,
      actorId: n.actor_id,
      actorUsername: profileMap.get(n.actor_id) ?? "?",
      type: n.type as AppNotification["type"],
      sessionId: n.session_id,
      isRead: n.is_read,
      createdAt: n.created_at,
    }));

    setNotifications(mapped);
    setUnreadCount(mapped.filter((n) => !n.isRead).length);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const markAllRead = useCallback(async () => {
    const client = getSupabase();
    if (!client || !userId) return;

    await client
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, markAllRead, refresh: load };
}
