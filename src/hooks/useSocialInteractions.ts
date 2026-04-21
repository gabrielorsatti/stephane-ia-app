import { useCallback } from "react";
import { getSupabase } from "../lib/supabase";
import { showError } from "../components/ErrorToast";

export function useSocialInteractions(userId: string | undefined) {
  const toggleLike = useCallback(
    async (sessionId: string, liked: boolean): Promise<boolean> => {
      const client = getSupabase();
      if (!client || !userId) return false;

      try {
        if (liked) {
          const { error } = await client.from("likes").delete().match({ session_id: sessionId, user_id: userId });
          if (error) throw error;
        } else {
          const { error } = await client.from("likes").insert({ session_id: sessionId, user_id: userId });
          if (error) throw error;
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
        return true;
      } catch (err) {
        console.warn("[toggleLike] failed", err);
        showError("Impossible d'enregistrer le kudo. Vérifie ta connexion.");
        return false;
      }
    },
    [userId],
  );

  const addComment = useCallback(
    async (sessionId: string, content: string): Promise<boolean> => {
      const client = getSupabase();
      if (!client || !userId || !content.trim()) return false;

      try {
        const { error } = await client.from("comments").insert({
          session_id: sessionId,
          user_id: userId,
          content: content.trim(),
        });
        if (error) throw error;
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
        return true;
      } catch (err) {
        console.warn("[addComment] failed", err);
        showError("Impossible d'envoyer le commentaire. Vérifie ta connexion.");
        return false;
      }
    },
    [userId],
  );

  return { toggleLike, addComment };
}
