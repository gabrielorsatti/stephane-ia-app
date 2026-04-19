import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import type { ExerciseEntry, FeedPost, Session } from "../types";

export function useFeed(userId: string | undefined, friendIds: string[]) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const client = getSupabase();
    if (!client || !userId || friendIds.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await client
      .from("sessions")
      .select("id, user_id, date, exercices, notes, body_weight, created_at, coach_commentary, is_published, user_comment, published_at")
      .eq("is_published", true)
      .in("user_id", friendIds)
      .order("published_at", { ascending: false })
      .limit(30);

    if (error) {
      console.warn("[useFeed]", error.message);
      setLoading(false);
      return;
    }

    const authorIds = [...new Set((data ?? []).map((r) => r.user_id))];
    let profileMap = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: profiles } = await client
        .from("profiles")
        .select("id, username")
        .in("id", authorIds);
      for (const p of profiles ?? []) profileMap.set(p.id, p.username);
    }

    const feed: FeedPost[] = (data ?? []).map((row) => ({
      session: {
        id: row.id,
        date: row.date,
        exercices: row.exercices as ExerciseEntry[],
        notes: row.notes ?? undefined,
        bodyWeight: row.body_weight ?? undefined,
        createdAt: row.created_at ?? undefined,
        coachCommentary: row.coach_commentary ?? undefined,
        isPublished: true,
        userComment: row.user_comment ?? undefined,
        publishedAt: row.published_at ?? undefined,
      } satisfies Session,
      authorId: row.user_id,
      authorUsername: profileMap.get(row.user_id) ?? "?",
    }));

    setPosts(feed);
    setLoading(false);
  }, [userId, friendIds.join(",")]);

  useEffect(() => {
    void load();
  }, [load]);

  return { posts, loading, refresh: load };
}
