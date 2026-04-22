import { User, AlertCircle } from "lucide-react";
import { useState } from "react";

interface Props {
  onSubmit: (username: string) => Promise<void>;
}

export function ProfileSetup({ onSubmit }: Props) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 3) {
      setError("3 caractères minimum");
      return;
    }
    if (!/^[a-z0-9_.-]+$/.test(trimmed)) {
      setError("Lettres, chiffres, _ . - uniquement");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-bg-card border border-border rounded-xl w-full max-w-sm p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Choisis ton pseudo</h2>
            <p className="text-xs text-text-muted">
              Visible par les autres membres.
            </p>
          </div>
        </div>
        <input
          type="text"
          className="input w-full"
          placeholder="ex: stephane_01"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={30}
          autoFocus
        />
        <label className="flex items-start gap-2 text-xs text-text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="accent-accent mt-0.5"
          />
          <span>
            J'accepte que mes données de santé (entraînement, nutrition, poids)
            soient traitées pour le coaching IA personnalisé.{" "}
            <span className="text-text-dim">Voir Politique de confidentialité.</span>
          </span>
        </label>
        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={saving || !username.trim() || !consent}
        >
          {saving ? "Enregistrement…" : "Valider"}
        </button>
      </form>
    </div>
  );
}
