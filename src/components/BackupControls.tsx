import { Download, Upload } from "lucide-react";
import { useRef } from "react";
import { buildBackup, downloadBackup, parseBackup } from "../lib/backup";
import type { BodyWeightEntry, Session } from "../types";

interface Props {
  sessions: Session[];
  bodyWeights: BodyWeightEntry[];
  onImport: (sessions: Session[], bodyWeights: BodyWeightEntry[]) => void;
}

// Boutons export / import JSON (sauvegarde locale, migration facile).
export function BackupControls({ sessions, bodyWeights, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

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
      ) {
        return;
      }
      onImport(backup.sessions, backup.bodyWeights);
    } catch (err) {
      alert(`Import impossible : ${(err as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex gap-1">
      <button
        className="btn-ghost !px-2 !py-1.5"
        onClick={handleExport}
        title="Exporter mes données en JSON"
      >
        <Download className="w-4 h-4" />
      </button>
      <button
        className="btn-ghost !px-2 !py-1.5"
        onClick={() => fileRef.current?.click()}
        title="Importer un fichier JSON"
      >
        <Upload className="w-4 h-4" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFile}
      />
    </div>
  );
}
