import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import type { ExerciseEntry, FeedComment, FeedPost, Session } from "../types";

export function useFeed(userId: string | undefined, friendIds: string[]) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const client = getSupabase();
    if (!client || !userId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const allAuthors = [...new Set([userId, ...friendIds])];
    const { data, error } = await client
      .from("sessions")
      .select("id, user_id, date, exercices, notes, body_weight, created_at, is_published, user_comment, published_at")
      .eq("is_published", true)
      .in("user_id", allAuthors)
      .order("published_at", { ascending: false })
      .limit(30);

    if (error) {
      console.warn("[useFeed]", error.message);
      setLoading(false);
      return;
    }

    const rows = data ?? [];
    const sessionIds = rows.map((r) => r.id);
    const authorIds = [...new Set(rows.map((r) => r.user_id))];

    const [profilesRes, likesRes, myLikesRes, commentsRes] = await Promise.all([
      authorIds.length > 0
        ? client.from("profiles").select("id, username, avatar_url").in("id", authorIds)
        : { data: [] },
      sessionIds.length > 0
        ? client.from("likes").select("session_id").in("session_id", sessionIds)
        : { data: [] },
      sessionIds.length > 0
        ? client.from("likes").select("session_id").in("session_id", sessionIds).eq("user_id", userId)
        : { data: [] },
      sessionIds.length > 0
        ? client.from("comments").select("id, session_id, user_id, content, created_at").in("session_id", sessionIds).order("created_at", { ascending: true })
        : { data: [] },
    ]);

    const profileMap = new Map<string, { username: string; avatarUrl?: string }>();
    for (const p of profilesRes.data ?? []) profileMap.set(p.id, { username: p.username, avatarUrl: p.avatar_url ?? undefined });

    const likeCounts = new Map<string, number>();
    for (const l of likesRes.data ?? []) {
      likeCounts.set(l.session_id, (likeCounts.get(l.session_id) ?? 0) + 1);
    }

    const myLikes = new Set<string>();
    for (const l of myLikesRes.data ?? []) myLikes.add(l.session_id);

    const commentsBySession = new Map<string, FeedComment[]>();
    for (const c of commentsRes.data ?? []) {
      const list = commentsBySession.get(c.session_id) ?? [];
      list.push({
        id: c.id,
        userId: c.user_id,
        username: profileMap.get(c.user_id)?.username ?? "?",
        avatarUrl: profileMap.get(c.user_id)?.avatarUrl,
        content: c.content,
        createdAt: c.created_at,
      });
      commentsBySession.set(c.session_id, list);
    }

    // Resolve comment author usernames not already in profileMap
    const commentAuthorIds = [...new Set((commentsRes.data ?? []).map((c) => c.user_id))].filter((id) => !profileMap.has(id));
    if (commentAuthorIds.length > 0) {
      const { data: extra } = await client.from("profiles").select("id, username, avatar_url").in("id", commentAuthorIds);
      for (const p of extra ?? []) {
        profileMap.set(p.id, { username: p.username, avatarUrl: p.avatar_url ?? undefined });
        for (const list of commentsBySession.values()) {
          for (const c of list) {
            if (c.userId === p.id) c.username = p.username;
          }
        }
      }
    }

    const feed: FeedPost[] = rows.map((row) => ({
      session: {
        id: row.id,
        date: row.date,
        exercices: row.exercices as ExerciseEntry[],
        notes: row.notes ?? undefined,
        bodyWeight: row.body_weight ?? undefined,
        createdAt: row.created_at ?? undefined,
        isPublished: true,
        userComment: row.user_comment ?? undefined,
        publishedAt: row.published_at ?? undefined,
      } satisfies Session,
      authorId: row.user_id,
      authorUsername: profileMap.get(row.user_id)?.username ?? "?",
      authorAvatarUrl: profileMap.get(row.user_id)?.avatarUrl,
      likeCount: likeCounts.get(row.id) ?? 0,
      likedByMe: myLikes.has(row.id),
      comments: commentsBySession.get(row.id) ?? [],
    }));

    setPosts(feed);
    setLoading(false);
  }, [userId, friendIds.join(",")]);

  useEffect(() => {
    void load();
  }, [load]);

  return { posts, loading, refresh: load };
}
