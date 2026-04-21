import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import type { Profile } from "../types";

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(!!userId);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      setLoadError(false);
      return;
    }
    setLoading(true);
    setLoadError(false);
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled && loading) {
        console.warn("[useProfile] timeout — forcing loaded");
        setLoading(false);
      }
    }, 5000);

    async function load() {
      const client = getSupabase();
      if (!client) {
        setLoading(false);
        return;
      }

      // Try full query first; fall back to base columns if new columns don't exist yet
      let data: Record<string, unknown> | null = null;
      const { data: full, error: fullErr } = await client
        .from("profiles")
        .select("id, username, avatar_url, bio, total_xp, is_admin, created_at")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (fullErr) {
        // Column might not exist — retry without new columns
        const { data: basic, error: basicErr } = await client
          .from("profiles")
          .select("id, username, avatar_url, is_admin, created_at")
          .eq("id", userId)
          .maybeSingle();

        if (cancelled) return;

        if (basicErr) {
          console.warn("[useProfile] load failed", basicErr);
          setLoadError(true);
          setLoading(false);
          return;
        }
        data = basic as Record<string, unknown> | null;
      } else {
        data = full as Record<string, unknown> | null;
      }

      if (data) {
        setProfile({
          id: data.id as string,
          username: data.username as string,
          avatarUrl: (data.avatar_url as string) ?? undefined,
          bio: (data.bio as string) ?? undefined,
          totalXp: (data.total_xp as number) ?? 0,
          isAdmin: data.is_admin as boolean,
          createdAt: data.created_at as string,
        });
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [userId]);

  const updateUsername = useCallback(
    async (username: string) => {
      if (!userId) return;
      const client = getSupabase();
      if (!client) return;
      const trimmed = username.trim().toLowerCase();
      if (!trimmed) throw new Error("Le pseudo ne peut pas être vide");
      const { error } = await client
        .from("profiles")
        .update({ username: trimmed })
        .eq("id", userId);
      if (error) {
        if (error.code === "23505") {
          throw new Error("Ce pseudo est déjà pris");
        }
        throw error;
      }
      setProfile((p) => (p ? { ...p, username: trimmed } : p));
    },
    [userId],
  );

  const updateAvatar = useCallback(
    async (url: string) => {
      if (!userId) return;
      const client = getSupabase();
      if (!client) return;
      const { error } = await client
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", userId);
      if (error) throw error;
      setProfile((p) => (p ? { ...p, avatarUrl: url } : p));
    },
    [userId],
  );

  const updateBio = useCallback(
    async (bio: string) => {
      if (!userId) return;
      const client = getSupabase();
      if (!client) return;
      const { error } = await client
        .from("profiles")
        .update({ bio })
        .eq("id", userId);
      if (error) throw error;
      setProfile((p) => (p ? { ...p, bio: bio || undefined } : p));
    },
    [userId],
  );

  const addXp = useCallback(
    async (xp: number): Promise<{ oldXp: number; newXp: number }> => {
      const oldXp = profile?.totalXp ?? 0;
      const newXp = oldXp + xp;
      if (!userId) return { oldXp, newXp };
      const client = getSupabase();
      if (!client) return { oldXp, newXp };
      const { error } = await client
        .from("profiles")
        .update({ total_xp: newXp })
        .eq("id", userId);
      if (error) throw error;
      setProfile((p) => (p ? { ...p, totalXp: newXp } : p));
      return { oldXp, newXp };
    },
    [userId, profile?.totalXp],
  );

  // Only trigger setup when we successfully loaded and found no profile or a placeholder username.
  // Never trigger setup if the load errored (could be a transient/schema issue).
  const needsSetup =
    !loading &&
    !loadError &&
    (profile === null || profile.username.startsWith("user_"));

  const ensureProfile = useCallback(
    async (username: string) => {
      if (!userId) return;
      const client = getSupabase();
      if (!client) return;
      const trimmed = username.trim().toLowerCase();
      if (!trimmed) throw new Error("Le pseudo ne peut pas être vide");
      if (profile === null) {
        // Use upsert to handle both "row missing" and "row exists but wasn't loaded" cases
        const { error } = await client.from("profiles").upsert(
          { id: userId, username: trimmed },
          { onConflict: "id" },
        );
        if (error) {
          if (error.code === "23505")
            throw new Error("Ce pseudo est déjà pris");
          if (error.code === "42P01")
            throw new Error(
              "Table profiles introuvable. Exécute le script SQL dans Supabase (voir db/migration-profiles-friendships.sql).",
            );
          throw error;
        }
        setProfile({
          id: userId,
          username: trimmed,
          totalXp: 0,
          isAdmin: false,
          createdAt: new Date().toISOString(),
        });
      } else {
        await updateUsername(trimmed);
      }
    },
    [userId, profile, updateUsername],
  );

  return { profile, loading, loadError, needsSetup, updateUsername, updateAvatar, updateBio, addXp, ensureProfile };
}
