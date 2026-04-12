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
