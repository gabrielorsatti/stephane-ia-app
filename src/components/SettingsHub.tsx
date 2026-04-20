import {
  Camera,
  Check,
  Download,
  ExternalLink,
  FileText,
  Info,
  Lock,
  LogOut,
  Moon,
  Pencil,
  ShieldCheck,
  Sun,
  Upload,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { GreenImpact } from "./GreenImpact";
import { HubHeader } from "./HubHeader";
import {
  buildBackup,
  downloadBackup,
  isAutoBackupEnabled,
  parseBackup,
  setAutoBackupEnabled,
} from "../lib/backup";
import type { Theme } from "../hooks/useTheme";
import { getSupabase } from "../lib/supabase";
import type { BodyWeightEntry, Profile, Session } from "../types";

interface Props {
  profile: Profile | null;
  theme: Theme;
  onToggleTheme: () => void;
  onUpdateUsername: (username: string) => Promise<void>;
  onUpdateAvatar?: (url: string) => Promise<void>;
  userId?: string;
  onSignOut?: () => void;
  sessions: Session[];
  bodyWeights: BodyWeightEntry[];
  onImport: (sessions: Session[], bodyWeights: BodyWeightEntry[]) => void;
  onBack?: () => void;
}

export function SettingsHub({
  profile,
  theme,
  onToggleTheme,
  onUpdateUsername,
  onUpdateAvatar,
  userId,
  onSignOut,
  sessions,
  bodyWeights,
  onImport,
  onBack,
}: Props) {
  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [auto, setAuto] = useState(isAutoBackupEnabled());
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  async function saveUsername() {
    if (!username.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onUpdateUsername(username.trim());
      setEditingUsername(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  function toggleAutoBackup() {
    const next = !auto;
    setAutoBackupEnabled(next);
    setAuto(next);
  }

  function handleExport() {
    downloadBackup(buildBackup(sessions, bodyWeights));
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const backup = parseBackup(text);
      if (
        !confirm(
          `Importer ${backup.sessions.length} séances et ${backup.bodyWeights.length} pesées ? Les données actuelles seront remplacées.`,
        )
      )
        return;
      onImport(backup.sessions, backup.bodyWeights);
    } catch (err) {
      alert(`Import impossible : ${(err as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId || !onUpdateAvatar) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 2 Mo.");
      return;
    }
    const client = getSupabase();
    if (!client) return;
    setAvatarUploading(true);
    setError("");
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadErr } = await client.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = client.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await onUpdateAvatar(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setAvatarUploading(false);
      if (avatarRef.current) avatarRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {onBack && <HubHeader title="Retour" onBack={onBack} />}
      {/* Profil */}
      <Section title="Profil">
        <Row
          icon={<User className="w-5 h-5" />}
          label="Pseudo"
          action={
            editingUsername ? (
              <div className="flex items-center gap-2">
                <input
                  className="input !w-36 !py-1 text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveUsername();
                  }}
                  autoFocus
                  disabled={saving}
                />
                <button
                  onClick={() => void saveUsername()}
                  disabled={saving || !username.trim()}
                  className="p-1 rounded hover:bg-bg-elev text-accent"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingUsername(false);
                    setError("");
                    setUsername(profile?.username ?? "");
                  }}
                  className="p-1 rounded hover:bg-bg-elev text-text-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingUsername(true)}
                className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
              >
                <span className="font-mono">
                  @{profile?.username ?? "—"}
                </span>
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )
          }
        />
        {onUpdateAvatar && (
          <Row
            icon={<Camera className="w-5 h-5" />}
            label="Photo de profil"
            action={
              <div className="flex items-center gap-2">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-sm">
                    {profile?.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <button
                  onClick={() => avatarRef.current?.click()}
                  disabled={avatarUploading}
                  className="text-sm text-accent hover:text-accent-soft"
                >
                  {avatarUploading ? "Upload…" : "Modifier"}
                </button>
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
            }
          />
        )}
        {error && (
          <div className="text-xs text-rose-300 px-4 pb-2">{error}</div>
        )}
      </Section>

      {/* Apparence */}
      <Section title="Apparence">
        <Row
          icon={
            theme === "dark" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )
          }
          label="Thème"
          action={
            <button
              onClick={onToggleTheme}
              className="text-sm text-text-muted hover:text-text"
            >
              {theme === "dark" ? "Sombre" : "Mauve & Blanc"}
            </button>
          }
        />
      </Section>

      {/* Données */}
      <Section title="Données">
        <Row
          icon={<ShieldCheck className="w-5 h-5" />}
          label="Auto-backup quotidien"
          action={
            <button
              onClick={toggleAutoBackup}
              className={[
                "w-10 h-6 rounded-full transition-colors relative",
                auto ? "bg-accent" : "bg-border",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  auto ? "left-[18px]" : "left-0.5",
                ].join(" ")}
              />
            </button>
          }
        />
        <Row
          icon={<Download className="w-5 h-5" />}
          label="Exporter (JSON)"
          action={
            <button
              onClick={handleExport}
              className="text-sm text-accent hover:text-accent-soft"
            >
              Télécharger
            </button>
          }
        />
        <Row
          icon={<Upload className="w-5 h-5" />}
          label="Importer (JSON)"
          action={
            <>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-sm text-accent hover:text-accent-soft"
              >
                Choisir un fichier
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFile}
              />
            </>
          }
        />
      </Section>

      {/* Impact IA */}
      <Section title="Mon Impact">
        <div className="px-4 py-3">
          <GreenImpact />
        </div>
      </Section>

      {/* À propos */}
      <Section title="À propos">
        <Row
          icon={<Info className="w-5 h-5" />}
          label="Version"
          action={
            <span className="text-sm text-text-dim font-mono">0.1.0</span>
          }
        />
        <Row
          icon={<ExternalLink className="w-5 h-5" />}
          label="Code source"
          action={
            <a
              href="https://github.com/gabrielorsatti/Personnal-gym-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-soft"
            >
              GitHub
            </a>
          }
        />
      </Section>

      {/* Légal */}
      <Section title="Légal">
        <Row
          icon={<Lock className="w-5 h-5" />}
          label="Confidentialité"
          action={
            <span className="text-xs text-text-dim max-w-[200px] text-right">
              Données chiffrées, isolation RLS par utilisateur.
            </span>
          }
        />
        <Row
          icon={<FileText className="w-5 h-5" />}
          label="Données personnelles"
          action={
            <span className="text-xs text-text-dim max-w-[200px] text-right">
              Aucune donnée n'est partagée ni vendue à des tiers.
            </span>
          }
        />
      </Section>

      {/* Déconnexion */}
      {onSignOut && (
        <Section>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {title && (
        <div className="text-xs font-semibold text-text-dim uppercase tracking-wide px-1 mb-1.5">
          {title}
        </div>
      )}
      <div className="card !p-0 divide-y divide-border overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3 text-text-muted min-w-0 shrink">
        <span className="shrink-0">{icon}</span>
        <span className="text-sm text-text truncate">{label}</span>
      </div>
      <div className="shrink-0 max-w-[55%]">{action}</div>
    </div>
  );
}
