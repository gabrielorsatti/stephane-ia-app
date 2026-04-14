import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

// Expose l'état d'authentification Supabase (ou null si non configuré).
// Retourne { ready, user, supabaseEnabled } + méthodes sign-in/sign-out.
export function useAuth() {
  const client = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!client); // si pas de client, on est prêt tout de suite

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    client.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user ?? null);
      setReady(true);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [client]);

  async function signInWithMagicLink(email: string): Promise<void> {
    if (!client) throw new Error("Supabase non configuré");
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async function signOut(): Promise<void> {
    if (!client) return;
    await client.auth.signOut();
  }

  return {
    ready,
    user,
    supabaseEnabled: !!client,
    signInWithMagicLink,
    signOut,
  };
}
