import { useCallback } from "react";
import { getSupabase } from "../lib/supabase";

export function useSocialInteractions(userId: string | undefined) {
  const toggleLike = useCallback(
    async (sessionId: string, liked: boolean) => {
      const client = getSupabase();
      if (!client || !userId) return;

      if (liked) {
        await client.from("likes").delete().match({ session_id: sessionId, user_id: userId });
      } else {
        await client.from("likes").insert({ session_id: sessionId, user_id: userId });
      }
    },
    [userId],
  );

  const addComment = useCallback(
    async (sessionId: string, content: string) => {
      const client = getSupabase();
      if (!client || !userId || !content.trim()) return;

      await client.from("comments").insert({
        session_id: sessionId,
        user_id: userId,
        content: content.trim(),
      });
    },
    [userId],
  );

  return { toggleLike, addComment };
}
