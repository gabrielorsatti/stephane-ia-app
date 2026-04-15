import type { SupabaseClient } from "@supabase/supabase-js";
import type { StorageAdapter } from "../storage";
import type {
  BodyWeightEntry,
  Category,
  NutritionLog,
  PersonalRecordOverride,
  Session,
} from "../../types";

// Adapter Supabase : respecte l'interface StorageAdapter.
// Exige que l'utilisateur soit authentifié (auth.uid() non null) car la
// RLS filtre sur user_id. En l'absence de session, lève une erreur claire.
export function supabaseAdapter(client: SupabaseClient): StorageAdapter {
  async function userId(): Promise<string> {
    const { data } = await client.auth.getUser();
    if (!data.user) throw new Error("Utilisateur Supabase non authentifié");
    return data.user.id;
  }

  return {
    async getSessions() {
      const uid = await userId();
      const { data, error } = await client
        .from("sessions")
        .select("id, date, exercices, notes, body_weight")
        .eq("user_id", uid)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(
        (row): Session => ({
          id: row.id,
          date: row.date,
          exercices: row.exercices,
          notes: row.notes ?? undefined,
          bodyWeight: row.body_weight ?? undefined,
        }),
      );
    },

    async saveSessions(sessions) {
      const uid = await userId();
      // Upsert par id. On supprime d'abord celles qui ne sont plus là.
      const { data: current, error: e1 } = await client
        .from("sessions")
        .select("id")
        .eq("user_id", uid);
      if (e1) throw e1;
      const keepIds = new Set(sessions.map((s) => s.id));
      const toDelete = (current ?? [])
        .map((r: { id: string }) => r.id)
        .filter((id) => !keepIds.has(id));
      if (toDelete.length > 0) {
        const { error } = await client
          .from("sessions")
          .delete()
          .in("id", toDelete);
        if (error) throw error;
      }
      if (sessions.length > 0) {
        const rows = sessions.map((s) => ({
          id: s.id,
          user_id: uid,
          date: s.date,
          exercices: s.exercices,
          notes: s.notes ?? null,
          body_weight: s.bodyWeight ?? null,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client
          .from("sessions")
          .upsert(rows, { onConflict: "id" });
        if (error) throw error;
      }
    },

    async getBodyWeights() {
      const uid = await userId();
      const { data, error } = await client
        .from("body_weights")
        .select("date, poids")
        .eq("user_id", uid)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BodyWeightEntry[];
    },

    async saveBodyWeights(entries) {
      const uid = await userId();
      // Stratégie simple : on écrase tout.
      const { error: eDel } = await client
        .from("body_weights")
        .delete()
        .eq("user_id", uid);
      if (eDel) throw eDel;
      if (entries.length > 0) {
        const rows = entries.map((e) => ({
          user_id: uid,
          date: e.date,
          poids: e.poids,
        }));
        const { error } = await client.from("body_weights").insert(rows);
        if (error) throw error;
      }
    },

    async getNutritionLogs() {
      const uid = await userId();
      const { data, error } = await client
        .from("nutrition_logs")
        .select("id, date, food_text, calories, protein, carbs, fat, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(
        (row): NutritionLog => ({
          id: row.id,
          date: row.date,
          foodText: row.food_text,
          calories: Number(row.calories ?? 0),
          protein: Number(row.protein ?? 0),
          carbs: Number(row.carbs ?? 0),
          fat: Number(row.fat ?? 0),
          createdAt: row.created_at,
        }),
      );
    },

    async saveNutritionLogs(logs) {
      const uid = await userId();
      // Même stratégie que sessions : delete-before-save sur les id absents,
      // puis upsert. Ça nous permet de gérer delete + edit + insert en un appel.
      const { data: current, error: e1 } = await client
        .from("nutrition_logs")
        .select("id")
        .eq("user_id", uid);
      if (e1) throw e1;
      const keep = new Set(logs.map((l) => l.id));
      const toDelete = (current ?? [])
        .map((r: { id: string }) => r.id)
        .filter((id) => !keep.has(id));
      if (toDelete.length > 0) {
        const { error } = await client
          .from("nutrition_logs")
          .delete()
          .in("id", toDelete);
        if (error) throw error;
      }
      if (logs.length > 0) {
        const rows = logs.map((l) => ({
          id: l.id,
          user_id: uid,
          date: l.date,
          food_text: l.foodText,
          calories: Math.round(l.calories),
          protein: l.protein,
          carbs: l.carbs,
          fat: l.fat,
          created_at: l.createdAt,
        }));
        const { error } = await client
          .from("nutrition_logs")
          .upsert(rows, { onConflict: "id" });
        if (error) throw error;
      }
    },

    async getRecordOverrides() {
      const uid = await userId();
      const { data, error } = await client
        .from("record_overrides")
        .select(
          "nom, categorie, max_poids, max_poids_reps, max_poids_date, best_1rm, best_1rm_date, max_reps_bodyweight, max_reps_bodyweight_date, notes",
        )
        .eq("user_id", uid);
      if (error) throw error;
      return (data ?? []).map(
        (row): PersonalRecordOverride => ({
          nom: row.nom,
          categorie: (row.categorie ?? undefined) as Category | undefined,
          maxPoids: row.max_poids ?? undefined,
          maxPoidsReps: row.max_poids_reps ?? undefined,
          maxPoidsDate: row.max_poids_date ?? undefined,
          best1RM: row.best_1rm ?? undefined,
          best1RMDate: row.best_1rm_date ?? undefined,
          maxRepsBodyweight: row.max_reps_bodyweight ?? undefined,
          maxRepsBodyweightDate: row.max_reps_bodyweight_date ?? undefined,
          notes: row.notes ?? undefined,
        }),
      );
    },

    async saveRecordOverrides(overrides) {
      const uid = await userId();
      // Reset complet : delete-all puis insert. La table est petite (un row
      // par exercice max) donc la simplicité l'emporte sur l'optimisation.
      const { error: eDel } = await client
        .from("record_overrides")
        .delete()
        .eq("user_id", uid);
      if (eDel) throw eDel;
      if (overrides.length > 0) {
        const rows = overrides.map((o) => ({
          user_id: uid,
          nom: o.nom,
          categorie: o.categorie ?? null,
          max_poids: o.maxPoids ?? null,
          max_poids_reps: o.maxPoidsReps ?? null,
          max_poids_date: o.maxPoidsDate ?? null,
          best_1rm: o.best1RM ?? null,
          best_1rm_date: o.best1RMDate ?? null,
          max_reps_bodyweight: o.maxRepsBodyweight ?? null,
          max_reps_bodyweight_date: o.maxRepsBodyweightDate ?? null,
          notes: o.notes ?? null,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await client.from("record_overrides").insert(rows);
        if (error) throw error;
      }
    },
  };
}
