import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info, Plus, Star, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { buildOccupancyCurve } from "../lib/occupancyModel";
import { useChartColors } from "../hooks/useChartColors";
import { useGyms } from "../hooks/useGyms";
import { useOccupancyFeedback } from "../hooks/useOccupancyFeedback";
import { LOCATION_TYPES, type LocationType } from "../types";

const LOCATION_LABELS: Record<LocationType, string> = {
  city_center: "Centre-ville",
  suburban: "Périurbain",
  business_district: "Quartier d'affaires",
};

// Widget d'affluence prédictive par salle. Pas de donnée live — on combine
// une courbe théorique, le type de quartier, et les Crowd Checks de
// l'utilisateur pour cette salle spécifique.
export function OccupancyChart() {
  const c = useChartColors();
  const { gyms, addGym, removeGym, favoriteId, favorite, setFavorite } =
    useGyms();
  const { forGym } = useOccupancyFeedback();
  const [showAdd, setShowAdd] = useState(false);

  const currentHour = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  const feedbacks = favorite ? forGym(favorite.id) : [];

  const data = useMemo(
    () =>
      buildOccupancyCurve({
        currentHour,
        dayOfWeek,
        locationType: favorite?.locationType,
        feedbacks,
      }),
    [currentHour, dayOfWeek, favorite?.locationType, feedbacks],
  );
  const nowValue = data[currentHour].value;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-accent shrink-0" />
          <h3 className="text-sm font-semibold truncate">
            {favorite
              ? `Affluence — ${favorite.name}`
              : "Affluence prévisible"}
          </h3>
        </div>
        <span className="chip bg-bg-elev text-text-muted">
          Maintenant · ~{nowValue}%
        </span>
      </div>

      {gyms.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {gyms.map((g) => {
            const on = favoriteId === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setFavorite(on ? null : g.id)}
                className={[
                  "px-2 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1",
                  on
                    ? "bg-accent text-bg border-accent"
                    : "bg-bg-soft border-border text-text-muted hover:text-text",
                ].join(" ")}
                title={g.brand ?? undefined}
              >
                {on && <Star className="w-3 h-3" fill="currentColor" />}
                <span className="truncate max-w-[140px]">{g.name}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="px-2 py-1 rounded-md text-xs font-medium border border-dashed border-border text-text-muted hover:text-text flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Ajouter
          </button>
        </div>
      )}

      {(gyms.length === 0 || showAdd) && (
        <AddGymForm
          onAdd={(input) => {
            const g = addGym(input);
            setFavorite(g.id);
            setShowAdd(false);
          }}
          onCancel={gyms.length > 0 ? () => setShowAdd(false) : undefined}
        />
      )}

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
            <XAxis
              dataKey="label"
              stroke={c.axis}
              fontSize={10}
              interval={2}
            />
            <YAxis stroke={c.axis} fontSize={10} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: c.bgCard,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
              }}
              labelStyle={{ color: c.textMuted }}
              formatter={(v: number, _n, item) => {
                const tagged = (item?.payload as { hasFeedback?: boolean })
                  ?.hasFeedback;
                return [`${v}%`, tagged ? "Observé" : "Estimation"];
              }}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((p) => (
                <Cell
                  key={p.hour}
                  fill={p.isCurrent ? c.c1 : p.hasFeedback ? c.c2 : c.c3}
                  fillOpacity={p.isCurrent ? 1 : p.hasFeedback ? 0.9 : 0.55}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {favorite && (
        <div className="flex items-center justify-between mt-2 text-[11px] text-text-dim">
          <span>
            {feedbacks.length > 0
              ? `${feedbacks.length} Crowd Check${feedbacks.length > 1 ? "s" : ""} enregistré${feedbacks.length > 1 ? "s" : ""}`
              : "Aucun Crowd Check pour cette salle — enregistre une séance pour commencer."}
          </span>
          <button
            onClick={() => {
              if (confirm(`Retirer ${favorite.name} de tes salles ?`)) {
                removeGym(favorite.id);
              }
            }}
            className="text-text-dim hover:text-danger inline-flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Retirer
          </button>
        </div>
      )}

      <div className="flex items-start gap-2 mt-3 text-[11px] text-text-dim">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        <span>
          Pas de donnée temps réel côté chaînes. Le modèle combine horaires
          typiques, type de quartier et tes retours pour affiner la prédiction.
        </span>
      </div>
    </div>
  );
}

function AddGymForm({
  onAdd,
  onCancel,
}: {
  onAdd: (input: {
    name: string;
    brand?: string;
    locationType?: LocationType;
  }) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [locationType, setLocationType] = useState<LocationType | "">("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({
      name: trimmed,
      brand: brand.trim() || undefined,
      locationType: locationType || undefined,
    });
    setName("");
    setBrand("");
    setLocationType("");
  }

  return (
    <form
      onSubmit={submit}
      className="mb-3 p-3 bg-bg-soft border border-border rounded-lg space-y-2"
    >
      <input
        type="text"
        placeholder="Nom (ex: Fitness Park Arcueil)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input w-full text-sm"
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Enseigne (Basic-Fit…)"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="input text-sm"
        />
        <select
          value={locationType}
          onChange={(e) => setLocationType(e.target.value as LocationType | "")}
          className="input text-sm"
        >
          <option value="">Type de quartier…</option>
          {LOCATION_TYPES.map((l) => (
            <option key={l} value={l}>
              {LOCATION_LABELS[l]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary text-xs flex-1">
          Ajouter cette salle
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost text-xs"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
