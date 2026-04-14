import { Loader2, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Logo } from "./Logo";

interface Props {
  children: React.ReactNode;
}

// Garde l'app derrière l'authentification Supabase si elle est configurée.
// Si Supabase n'est pas configuré, laisse passer (mode solo LocalStorage).
export function AuthGate({ children }: Props) {
  const { ready, user, supabaseEnabled, signInWithPassword, signUpWithPassword } =
    useAuth();

  if (!supabaseEnabled) return <>{children}</>;
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (user) return <>{children}</>;

  return (
    <SignInCard
      onSignIn={signInWithPassword}
      onSignUp={signUpWithPassword}
    />
  );
}

type Mode = "signin" | "signup";

function SignInCard({
  onSignIn,
  onSignUp,
}: {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await onSignIn(email.trim(), password);
      } else {
        await onSignUp(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 1rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
      }}
    >
      <div className="card w-full max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-accent">
            <Logo size={24} />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Personal Gym Tracker</h1>
            <p className="text-xs text-text-muted">
              {mode === "signin"
                ? "Connecte-toi à ton compte"
                : "Crée ton profil"}
            </p>
          </div>
        </div>

        <div className="flex gap-1 bg-bg-soft border border-border rounded-lg p-1">
          <ModeTab
            label="Connexion"
            active={mode === "signin"}
            onClick={() => setMode("signin")}
          />
          <ModeTab
            label="Inscription"
            active={mode === "signup"}
            onClick={() => setMode("signup")}
          />
        </div>

        <form onSubmit={handle} className="space-y-3">
          <label className="block text-xs text-text-muted">
            Email
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              className="input mt-1"
              placeholder="toi@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-xs text-text-muted">
            Mot de passe
            <input
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              className="input mt-1"
              placeholder="6 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy || !email.trim() || password.length < 6}
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "signin" ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {mode === "signin" ? "Se connecter" : "Créer le compte"}
          </button>
          {error && (
            <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </form>

        <p className="text-[11px] text-text-dim border-t border-border pt-3">
          Tes séances sont stockées dans ton compte Supabase — isolation RLS
          stricte, aucun autre utilisateur ne peut les voir.
        </p>
      </div>
    </div>
  );
}

function ModeTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
        active
          ? "bg-accent text-bg"
          : "text-text-muted hover:text-text",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
