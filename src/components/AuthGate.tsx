import { Loader2, LogIn, Mail, UploadCloud } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Logo } from "./Logo";

interface Props {
  children: React.ReactNode;
}

// Garde l'app derrière l'authentification Supabase si elle est configurée.
// Si Supabase n'est pas configuré, laisse passer (mode solo LocalStorage).
export function AuthGate({ children }: Props) {
  const { ready, user, supabaseEnabled, signInWithMagicLink } = useAuth();

  if (!supabaseEnabled) return <>{children}</>;
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (user) return <>{children}</>;

  return <SignInCard onSubmit={signInWithMagicLink} />;
}

function SignInCard({
  onSubmit,
}: {
  onSubmit: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onSubmit(email.trim());
      setSent(true);
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
              Choisis ton profil ou connecte-toi
            </p>
          </div>
        </div>

        {sent ? (
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2 text-accent-soft">
              <Mail className="w-4 h-4" /> Lien envoyé
            </div>
            <p className="text-text-muted text-xs">
              Ouvre l'email que tu viens de recevoir à{" "}
              <span className="font-mono text-text">{email}</span> et clique
              sur le lien magique — tu seras redirigé ici connecté.
            </p>
            <button
              className="btn-ghost text-xs"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Utiliser un autre email
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
                <LogIn className="w-4 h-4" />
              )}
              Recevoir le lien magique
            </button>
            {error && (
              <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </form>
        )}

        <div className="text-[11px] text-text-dim border-t border-border pt-3">
          <p className="flex items-start gap-2">
            <UploadCloud className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Tes séances sont stockées dans ton compte (isolation Supabase
            RLS : aucun autre utilisateur ne peut les voir).
          </p>
        </div>
      </div>
    </div>
  );
}
