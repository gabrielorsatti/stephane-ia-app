import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import type { PublicStats, Session } from "../types";

// Calcule les stats publiques d'un utilisateur (SANS poids de corps).
// Si targetId = uid courant, lit via adapter normal ; sinon via Supabase
// (la RLS "friend read" sur sessions autorise la lecture).
export function usePublicStats(targetId: string | undefined) {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) {
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

      // Profil (pour memberSince).
      const { data: profile } = await client
        .from("profiles")
        .select("created_at")
        .eq("id", targetId)
        .maybeSingle();

      // Sessions de l'utilisateur cible (RLS filtrera).
      const { data: sessions, error } = await client
        .from("sessions")
        .select("id, date, exercices")
        .eq("user_id", targetId);
      if (error) {
        console.warn("[usePublicStats]", error);
        setLoading(false);
        return;
      }
      if (cancelled) return;

      const rows = (sessions ?? []) as Array<{
        id: string;
        date: string;
        exercices: Session["exercices"];
      }>;

      const totalSessions = rows.length;

      let totalVolume = 0;
      const exerciseCount: Record<string, number> = {};
      for (const row of rows) {
        for (const ex of row.exercices) {
          exerciseCount[ex.nom] = (exerciseCount[ex.nom] ?? 0) + 1;
          for (const s of ex.sets) {
            totalVolume += s.reps * s.poids;
          }
        }
      }

      const topExercises = Object.entries(exerciseCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([nom, count]) => ({ nom, count }));

      setStats({
        totalSessions,
        totalVolume: Math.round(totalVolume),
        topExercises,
        memberSince: profile?.created_at ?? new Date().toISOString(),
      });
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  return { stats, loading };
}
