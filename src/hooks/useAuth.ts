import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

export function useAuth() {
  const client = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!client);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    client.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user ?? null);
      setReady(true);
    });
    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [client]);

  async function signInWithPassword(
    email: string,
    password: string,
  ): Promise<void> {
    if (!client) throw new Error("Supabase non configuré");
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signUpWithPassword(
    email: string,
    password: string,
  ): Promise<void> {
    if (!client) throw new Error("Supabase non configuré");
    const { error } = await client.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function resetPasswordForEmail(email: string): Promise<void> {
    if (!client) throw new Error("Supabase non configuré");
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword: string): Promise<void> {
    if (!client) throw new Error("Supabase non configuré");
    const { error } = await client.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    setIsPasswordRecovery(false);
  }

  async function signOut(): Promise<void> {
    if (!client) return;
    await client.auth.signOut();
  }

  return {
    ready,
    user,
    supabaseEnabled: !!client,
    isPasswordRecovery,
    signInWithPassword,
    signUpWithPassword,
    resetPasswordForEmail,
    updatePassword,
    signOut,
  };
}
