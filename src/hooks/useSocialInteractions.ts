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
        const { data: session } = await client
          .from("sessions")
          .select("user_id")
          .eq("id", sessionId)
          .single();
        if (session && session.user_id !== userId) {
          await client.from("notifications").insert({
            user_id: session.user_id,
            actor_id: userId,
            type: "like",
            session_id: sessionId,
          });
        }
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
      const { data: session } = await client
        .from("sessions")
        .select("user_id")
        .eq("id", sessionId)
        .single();
      if (session && session.user_id !== userId) {
        await client.from("notifications").insert({
          user_id: session.user_id,
          actor_id: userId,
          type: "comment",
          session_id: sessionId,
        });
      }
    },
    [userId],
  );

  return { toggleLike, addComment };
}
