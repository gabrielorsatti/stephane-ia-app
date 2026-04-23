import { Check, KeyRound, Loader2, LogIn, Mail, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Logo } from "./Logo";
import { SplashScreen } from "./SplashScreen";

interface Props {
  children: React.ReactNode;
}

export function AuthGate({ children }: Props) {
  const auth = useAuth();

  if (!auth.supabaseEnabled) return <>{children}</>;

  if (!auth.ready) return <SplashScreen />;

  if (auth.user && auth.isPasswordRecovery) {
    return (
      <ResetPasswordCard onReset={auth.updatePassword} />
    );
  }

  if (auth.user) return <>{children}</>;

  return (
    <SignInCard
      onSignIn={auth.signInWithPassword}
      onSignUp={auth.signUpWithPassword}
      onForgot={auth.resetPasswordForEmail}
    />
  );
}

type Mode = "signin" | "signup" | "forgot";

function SignInCard({
  onSignIn,
  onSignUp,
  onForgot,
}: {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onForgot: (email: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "forgot") {
        await onForgot(email.trim());
        setForgotSent(true);
      } else if (mode === "signin") {
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

  if (mode === "forgot") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 1rem)",
          paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
        }}
      >
        <div className="card w-full max-w-md space-y-5 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-accent">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Mot de passe oublié</h1>
              <p className="text-xs text-text-muted">
                Un lien de réinitialisation sera envoyé par email.
              </p>
            </div>
          </div>

          {forgotSent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center">
                <Mail className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium">Email envoyé !</p>
                <p className="text-xs text-text-muted mt-1">
                  Vérifie ta boîte de réception (et les spams).<br />
                  Clique sur le lien pour choisir un nouveau mot de passe.
                </p>
              </div>
              <button
                className="btn-ghost text-xs mt-2"
                onClick={() => {
                  setMode("signin");
                  setForgotSent(false);
                  setError(null);
                }}
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
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
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={busy || !email.trim()}
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Envoyer le lien
              </button>
              {error && (
                <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <button
                type="button"
                className="w-full text-xs text-text-dim hover:text-text-muted transition-colors pt-1"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
              >
                Retour à la connexion
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 1rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
      }}
    >
      <div className="card w-full max-w-md space-y-5 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-accent">
            <Logo size={24} />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Stephane IA</h1>
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
            onClick={() => { setMode("signin"); setError(null); }}
          />
          <ModeTab
            label="Inscription"
            active={mode === "signup"}
            onClick={() => { setMode("signup"); setError(null); }}
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

          {mode === "signin" && (
            <button
              type="button"
              className="text-xs text-text-dim hover:text-accent-soft transition-colors"
              onClick={() => {
                setMode("forgot");
                setError(null);
              }}
            >
              Mot de passe oublié ?
            </button>
          )}

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

        <p className="text-xs text-text-dim border-t border-border pt-3">
          Tes séances sont stockées dans ton compte Supabase — isolation RLS
          stricte, aucun autre utilisateur ne peut les voir.
        </p>
      </div>
    </div>
  );
}

function ResetPasswordCard({
  onReset,
}: {
  onReset: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onReset(password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card w-full max-w-md animate-fadeIn">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center">
              <Check className="w-6 h-6 text-accent" />
            </div>
            <p className="text-sm font-medium">Mot de passe mis à jour !</p>
            <p className="text-xs text-text-muted">
              Redirection vers le Dashboard…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 1rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
      }}
    >
      <div className="card w-full max-w-md space-y-5 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-accent">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Nouveau mot de passe</h1>
            <p className="text-xs text-text-muted">
              Choisis un mot de passe sécurisé.
            </p>
          </div>
        </div>

        <form onSubmit={handle} className="space-y-3">
          <label className="block text-xs text-text-muted">
            Nouveau mot de passe
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              autoFocus
              className="input mt-1"
              placeholder="6 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="block text-xs text-text-muted">
            Confirmer
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="input mt-1"
              placeholder="Répète le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy || password.length < 6 || !confirm}
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Mettre à jour
          </button>
          {error && (
            <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </form>
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
