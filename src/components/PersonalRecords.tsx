import { Trophy } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { computeRecords } from "../lib/records";
import type { Session } from "../types";

interface Props {
  sessions: Session[];
}

// Affiche les records personnels par mouvement (charge max et 1RM estimé).
export function PersonalRecords({ sessions }: Props) {
  const records = computeRecords(sessions);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-semibold">Records personnels</h3>
      </div>
      {records.length === 0 ? (
        <div className="text-text-dim text-sm py-6 text-center">
          Pas encore de records. Soulève des trucs lourds.
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
                <span className="chip bg-accent-muted/40 text-accent-soft">
                  {pr.categorie}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Stat
                  label="Charge max"
                  value={
                    pr.maxPoids > 0
                      ? `${pr.maxPoids} kg × ${pr.maxPoidsReps}`
                      : "PDC"
                  }
                  hint={formatDate(pr.maxPoidsDate)}
                />
                <Stat
                  label="1RM estimé"
                  value={
                    pr.best1RM > 0 ? `${Math.round(pr.best1RM)} kg` : "—"
                  }
                  hint={formatDate(pr.best1RMDate)}
                />
              </div>
              <div className="text-[10px] text-text-dim mt-2">
                {pr.totalSessions} séance{pr.totalSessions > 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
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
  return format(parseISO(iso), "d MMM yyyy", { locale: fr });
}
