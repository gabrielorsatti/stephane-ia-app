import type { SupabaseClient, User } from "@supabase/supabase-js";
import { SEED_BODY_WEIGHTS, SEED_SESSIONS } from "../data/seed";
import { supabaseAdapter } from "./adapters/supabaseAdapter";

// Email du compte "maître" qui possède les données historiques.
const OWNER_EMAIL = "gabriel.orsatti@gmail.com";

// Clé de flag par user_id — une fois la migration faite, on ne la rejoue pas.
function flagKey(userId: string): string {
  return `stephane-ia:owner-seeded:${userId}`;
}

// Injecte les données historiques dans le compte Supabase SI et seulement SI :
//   1. L'utilisateur connecté est l'email propriétaire
//   2. Le flag LocalStorage de ce user_id n'est pas posé
//   3. Le compte ne contient pas déjà de séances (double sécurité)
// Retourne true si une migration a eu lieu.
export async function migrateOwnerDataIfNeeded(
  client: SupabaseClient,
  user: User,
): Promise<boolean> {
  if (user.email?.toLowerCase() !== OWNER_EMAIL) return false;
  if (localStorage.getItem(flagKey(user.id))) return false;

  const adapter = supabaseAdapter(client);
  const existing = await adapter.getSessions();
  if (existing.length > 0) {
    // Le compte a déjà des données : on pose le flag pour ne jamais rejouer.
    localStorage.setItem(flagKey(user.id), "1");
    return false;
  }

  await adapter.saveSessions(SEED_SESSIONS);
  await adapter.saveBodyWeights(SEED_BODY_WEIGHTS);
  localStorage.setItem(flagKey(user.id), "1");
  return true;
}
