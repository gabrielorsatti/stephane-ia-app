import type { BodyWeightEntry, Session } from "../types";

// Format du fichier de sauvegarde. Versionné pour faciliter les migrations.
export interface BackupFile {
  version: 1;
  exportedAt: string;
  sessions: Session[];
  bodyWeights: BodyWeightEntry[];
}

export function buildBackup(
  sessions: Session[],
  bodyWeights: BodyWeightEntry[],
): BackupFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions,
    bodyWeights,
  };
}

// Déclenche le téléchargement du JSON via un blob temporaire.
export function downloadBackup(file: BackupFile): void {
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gym-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Clé LocalStorage traçant la date (YYYY-MM-DD) du dernier auto-backup.
const AUTO_BACKUP_KEY = "gym-tracker:last-auto-backup";
const AUTO_BACKUP_ENABLED_KEY = "gym-tracker:auto-backup-enabled";

export function isAutoBackupEnabled(): boolean {
  return localStorage.getItem(AUTO_BACKUP_ENABLED_KEY) === "1";
}

export function setAutoBackupEnabled(on: boolean): void {
  if (on) localStorage.setItem(AUTO_BACKUP_ENABLED_KEY, "1");
  else localStorage.removeItem(AUTO_BACKUP_ENABLED_KEY);
}

// Copie redondante en LocalStorage sous une clé séparée — si la clé
// principale se corrompt, on a toujours cette sauvegarde locale à restaurer.
const MIRROR_KEY = "gym-tracker:mirror:v1";
export function writeMirror(
  sessions: Session[],
  bodyWeights: BodyWeightEntry[],
): void {
  try {
    localStorage.setItem(
      MIRROR_KEY,
      JSON.stringify(buildBackup(sessions, bodyWeights)),
    );
  } catch {
    /* quota dépassé — on ignore, la clé principale reste intacte */
  }
}

export function readMirror(): BackupFile | null {
  try {
    const raw = localStorage.getItem(MIRROR_KEY);
    if (!raw) return null;
    return parseBackup(raw);
  } catch {
    return null;
  }
}

// Déclenche un téléchargement JSON au plus une fois par jour, silencieusement.
// Sécurité anti-perte : si l'utilisateur vide son cache, il a au pire un
// backup de la veille dans son dossier Téléchargements.
// Note : le navigateur peut bloquer un download hors d'un geste utilisateur,
// donc on n'appelle cette fonction qu'au moment d'une modif (add/update).
export function maybeAutoBackup(
  sessions: Session[],
  bodyWeights: BodyWeightEntry[],
): void {
  writeMirror(sessions, bodyWeights);
  if (!isAutoBackupEnabled()) return;
  if (sessions.length === 0) return;
  const today = new Date().toISOString().slice(0, 10);
  const last = localStorage.getItem(AUTO_BACKUP_KEY);
  if (last === today) return;
  try {
    downloadBackup(buildBackup(sessions, bodyWeights));
    localStorage.setItem(AUTO_BACKUP_KEY, today);
  } catch {
    // Navigateur a refusé le download — on retentera demain.
  }
}

// Valide et parse un JSON importé. Lance une erreur explicite si le format
// ne correspond pas.
export function parseBackup(raw: string): BackupFile {
  const obj = JSON.parse(raw);
  if (!obj || typeof obj !== "object") throw new Error("JSON invalide");
  if (obj.version !== 1) {
    throw new Error(`Version de sauvegarde non supportée : ${obj.version}`);
  }
  if (!Array.isArray(obj.sessions) || !Array.isArray(obj.bodyWeights)) {
    throw new Error("Structure de sauvegarde invalide");
  }
  return obj as BackupFile;
}
