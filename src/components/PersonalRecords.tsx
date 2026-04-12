import { Pencil, Plus, Trophy } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { computeRecords, type PersonalRecord } from "../lib/records";
import type { PersonalRecordOverride, Session } from "../types";
import { RecordEditor } from "./RecordEditor";

interface Props {
  sessions: Session[];
  overrides: PersonalRecordOverride[];
  onUpsertOverride: (o: PersonalRecordOverride) => void;
  onRemoveOverride: (nom: string) => void;
}

// Affiche les records personnels, applique les overrides manuels et permet
// d'en éditer / en créer.
export function PersonalRecords({
  sessions,
  overrides,
  onUpsertOverride,
  onRemoveOverride,
}: Props) {
  const [editing, setEditing] = useState<Partial<PersonalRecordOverride> | null>(
    null,
  );

  const records = computeRecords(sessions, overrides);

  function openEditor(rec: PersonalRecord) {
    const existing = overrides.find((o) => o.nom === rec.nom);
    setEditing(
      existing ?? {
        nom: rec.nom,
        categorie: rec.categorie as PersonalRecordOverride["categorie"],
        maxPoids: rec.maxPoids || undefined,
        maxPoidsReps: rec.maxPoidsReps || undefined,
        maxPoidsDate: rec.maxPoidsDate || undefined,
        best1RM: rec.best1RM ? Math.round(rec.best1RM) : undefined,
        best1RMDate: rec.best1RMDate || undefined,
      },
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-semibold">Records personnels</h3>
        </div>
        <button
          className="btn-ghost !py-1.5"
          onClick={() => setEditing({})}
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
      {records.length === 0 ? (
        <div className="text-text-dim text-sm py-6 text-center">
          Pas encore de records. Enregistre une séance ou ajoute un PR manuel.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {records.map((pr) => (
            <div
              key={pr.nom}
              className="bg-bg-soft border border-border rounded-lg p-3"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-medium text-sm">{pr.nom}</span>
                <div className="flex items-center gap-1.5">
                  {pr.manualOverride && (
                    <span
                      className="chip bg-bg-elev border border-border text-text-dim"
                      title="Record renseigné manuellement"
                    >
                      manuel
                    </span>
                  )}
                  <span className="chip bg-accent-muted text-text-muted">
                    {pr.categorie}
                  </span>
                  <button
                    className="btn-ghost !p-1.5"
                    onClick={() => openEditor(pr)}
                    title="Modifier ce record"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Stat
                  label="Charge max"
                  value={
                    pr.maxPoids > 0
                      ? `${pr.maxPoids} kg${pr.maxPoidsReps ? ` × ${pr.maxPoidsReps}` : ""}`
                      : "PDC"
                  }
                  hint={formatDate(pr.maxPoidsDate)}
                />
                <Stat
                  label="1RM estimé"
                  value={pr.best1RM > 0 ? `${Math.round(pr.best1RM)} kg` : "—"}
                  hint={formatDate(pr.best1RMDate)}
                />
              </div>
              {pr.notes && (
                <div className="text-[11px] text-text-muted italic mt-2">
                  « {pr.notes} »
                </div>
              )}
              <div className="text-[10px] text-text-dim mt-2">
                {pr.totalSessions > 0
                  ? `${pr.totalSessions} séance${pr.totalSessions > 1 ? "s" : ""}`
                  : "Aucune séance associée"}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <RecordEditor
          initial={editing}
          onSave={(o) => {
            onUpsertOverride(o);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
          onDelete={
            editing.nom
              ? () => {
                  onRemoveOverride(editing.nom!);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-text-dim uppercase tracking-wide text-[10px]">
        {label}
      </div>
      <div className="font-semibold text-text">{value}</div>
      {hint && <div className="text-text-dim text-[10px]">{hint}</div>}
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "d MMM yyyy", { locale: fr });
  } catch {
    return "";
  }
}
