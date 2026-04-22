import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

const REASONS = [
  "Contenu offensant ou inapproprié",
  "Spam ou publicité",
  "Harcèlement",
  "Données fausses / triche",
  "Autre",
];

interface Props {
  contentId: string;
  contentType: "session" | "comment";
  onSubmit: (contentId: string, contentType: "session" | "comment", reason: string) => Promise<boolean>;
  onClose: () => void;
}

export function ReportModal({ contentId, contentType, onSubmit, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!reason || sending) return;
    setSending(true);
    const ok = await onSubmit(contentId, contentType, reason);
    if (ok) setDone(true);
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold">Signaler</h3>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <p className="text-sm text-text-muted">Merci pour ton signalement. Notre équipe examinera ce contenu.</p>
        ) : (
          <>
            <p className="text-xs text-text-muted">
              Pourquoi signales-tu ce {contentType === "session" ? "post" : "commentaire"} ?
            </p>
            <div className="space-y-1.5">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-accent"
                  />
                  {r}
                </label>
              ))}
            </div>
            <button
              className="btn-primary w-full"
              onClick={() => void handleSubmit()}
              disabled={!reason || sending}
            >
              {sending ? "Envoi…" : "Envoyer le signalement"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
