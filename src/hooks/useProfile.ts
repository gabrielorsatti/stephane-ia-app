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

  // Deux cas déclenchent le setup :
  // 1. Le profil n'existe pas du tout (row absente — utilisateur pré-trigger)
  // 2. Le pseudo est toujours le placeholder "user_XXXXX"
  const needsSetup =
    !loading &&
    (profile === null || profile.username.startsWith("user_"));

  // Si le profil n'existe pas, on doit d'abord le créer côté client avant
  // de pouvoir le mettre à jour. createIfMissing gère ce cas edge.
  const ensureProfile = useCallback(
    async (username: string) => {
      if (!userId) return;
      const client = getSupabase();
      if (!client) return;
      const trimmed = username.trim().toLowerCase();
      if (!trimmed) throw new Error("Le pseudo ne peut pas être vide");
      if (profile === null) {
        // Profil absent — insert (la policy owner insert l'autorise).
        const { error } = await client.from("profiles").insert({
          id: userId,
          username: trimmed,
        });
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
          isAdmin: false,
          createdAt: new Date().toISOString(),
        });
      } else {
        await updateUsername(trimmed);
      }
    },
    [userId, profile, updateUsername],
  );

  return { profile, loading, needsSetup, updateUsername, updateAvatar, ensureProfile };
}
