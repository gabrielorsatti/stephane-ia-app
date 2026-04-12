import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lit la configuration Supabase depuis les variables Vite (préfixe VITE_).
// Retourne `null` si aucune clé n'est fournie → l'app reste en mode
// LocalStorage 100% offline.
export function makeSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// Client partagé, créé une seule fois.
let cached: SupabaseClient | null | undefined;
export function getSupabase(): SupabaseClient | null {
  if (cached === undefined) cached = makeSupabaseClient();
  return cached;
}
