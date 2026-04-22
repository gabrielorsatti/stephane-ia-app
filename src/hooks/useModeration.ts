import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

export function useModeration(userId: string | undefined) {
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    const client = getSupabase();
    if (!client) return;
    let cancelled = false;
    void client
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", userId)
      .then(({ data }) => {
        if (!cancelled && data) {
          setBlockedIds(new Set(data.map((r) => r.blocked_id)));
        }
      });
    return () => { cancelled = true; };
  }, [userId]);

  const reportContent = useCallback(
    async (contentId: string, contentType: "session" | "comment", reason: string): Promise<boolean> => {
      const client = getSupabase();
      if (!client || !userId) return false;
      const { error } = await client.from("reports").insert({
        reporter_id: userId,
        reported_content_id: contentId,
        content_type: contentType,
        reason,
      });
      if (error) {
        console.warn("[report]", error.message);
        return false;
      }
      return true;
    },
    [userId],
  );

  const blockUser = useCallback(
    async (blockedId: string): Promise<boolean> => {
      const client = getSupabase();
      if (!client || !userId || userId === blockedId) return false;
      const { error } = await client.from("blocks").insert({
        blocker_id: userId,
        blocked_id: blockedId,
      });
      if (error) {
        console.warn("[block]", error.message);
        return false;
      }
      setBlockedIds((prev) => new Set(prev).add(blockedId));
      return true;
    },
    [userId],
  );

  const unblockUser = useCallback(
    async (blockedId: string): Promise<boolean> => {
      const client = getSupabase();
      if (!client || !userId) return false;
      const { error } = await client
        .from("blocks")
        .delete()
        .match({ blocker_id: userId, blocked_id: blockedId });
      if (error) {
        console.warn("[unblock]", error.message);
        return false;
      }
      setBlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(blockedId);
        return next;
      });
      return true;
    },
    [userId],
  );

  return { blockedIds, reportContent, blockUser, unblockUser };
}
