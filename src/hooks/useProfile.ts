import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import type { Profile } from "../types";

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      const client = getSupabase();
      if (!client) {
        setLoading(false);
        return;
      }
      const { data, error } = await client
        .from("profiles")
        .select("id, username, avatar_url, is_admin, created_at")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn("[useProfile] load failed", error);
        setLoading(false);
        return;
      }
      if (data) {
        setProfile({
          id: data.id,
          username: data.username,
          avatarUrl: data.avatar_url ?? undefined,
          isAdmin: data.is_admin,
          createdAt: data.created_at,
        });
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
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

  const needsSetup =
    !loading && profile !== null && profile.username.startsWith("user_");

  return { profile, loading, needsSetup, updateUsername, updateAvatar };
}
