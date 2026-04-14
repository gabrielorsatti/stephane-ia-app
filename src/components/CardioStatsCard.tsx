import { Bike, Footprints, Mountain, Timer } from "lucide-react";
import {
  aggregateCardio,
  cardioEntries,
  computePace,
  formatPace,
} from "../lib/cardio";
import type { Session } from "../types";

interface Props {
  sessions: Session[];
}

// Carte dédiée aux performances cardio : distinctes des KPIs musculation
// pour éviter le mélange volume kg / distance km.
export function CardioStatsCard({ sessions }: Props) {
  const { totalDistance, totalDuration, totalDenivele, entryCount } =
    aggregateCardio(sessions);

  const recent = [...sessions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .flatMap((s) =>
      cardioEntries(s).map((ex) => ({ date: s.date, ex })),
    )
    .slice(0, 5);

  if (entryCount === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Footprints className="w-5 h-5 text-powder" />
          <h3 className="text-sm font-semibold">Cardio</h3>
        </div>
        <p className="text-xs text-text-dim">
          Aucune activité cardio enregistrée. Ajoute "Course 5km en 25min" ou
          "Vélo 20km allure 3:00" dans la saisie.
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <Footprints className="w-5 h-5 text-powder" />
        <h3 className="text-sm font-semibold">Cardio</h3>
        <span className="text-xs text-text-dim ml-auto">
          {entryCount} entrée{entryCount > 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Mini
          icon={<Footprints className="w-4 h-4" />}
          label="Distance"
          value={`${totalDistance.toFixed(1)} km`}
        />
        <Mini
          icon={<Timer className="w-4 h-4" />}
          label="Durée"
          value={formatDuration(totalDuration)}
        />
        <Mini
          icon={<Mountain className="w-4 h-4" />}
          label="D+"
          value={`${Math.round(totalDenivele)} m`}
        />
      </div>

      <div className="space-y-1.5">
        <div className="text-xs uppercase tracking-wide text-text-dim">
          Dernières sorties
        </div>
        {recent.map((r, i) => {
          const pace = r.ex.cardio ? computePace(r.ex.cardio) : null;
          const isBike = r.ex.nom.toLowerCase().includes("vélo");
          return (
            <div
              key={i}
              className="flex items-center gap-2 text-xs bg-bg-soft border border-border rounded-lg px-2.5 py-1.5"
            >
              {isBike ? (
                <Bike className="w-3.5 h-3.5 text-powder shrink-0" />
              ) : (
                <Footprints className="w-3.5 h-3.5 text-powder shrink-0" />
              )}
              <span className="font-mono text-text-dim shrink-0">
                {r.date.slice(5)}
              </span>
              <span className="truncate">{r.ex.nom}</span>
              <span className="ml-auto font-mono text-text-muted shrink-0">
                {r.ex.cardio?.distance != null
                  ? `${r.ex.cardio.distance}km`
                  : ""}
                {r.ex.cardio?.duree != null
                  ? ` · ${formatDuration(r.ex.cardio.duree)}`
                  : ""}
                {pace ? ` · ${formatPace(pace)}/km` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mini({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-bg-soft border border-border rounded-lg p-2">
      <div className="flex items-center gap-1 text-text-dim text-[10px] uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function formatDuration(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h${rest.toString().padStart(2, "0")}` : `${h}h`;
}
