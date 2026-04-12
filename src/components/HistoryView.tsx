import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ALL_CATEGORIES, type Category, type Session } from "../types";
import { SessionList } from "./SessionList";

interface Props {
  sessions: Session[];
  onRemove: (id: string) => void;
  onEdit?: (session: Session) => void;
}

// Historique filtrable : recherche texte + catégories.
// Une séance est retenue si au moins un de ses exercices passe le filtre.
export function HistoryView({ sessions, onRemove, onEdit }: Props) {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Set<Category>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      const matchesCat =
        categories.size === 0 ||
        s.exercices.some((ex) => categories.has(ex.categorie));
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        s.date.toLowerCase().includes(q) ||
        (s.notes ?? "").toLowerCase().includes(q) ||
        s.exercices.some((ex) => ex.nom.toLowerCase().includes(q))
      );
    });
  }, [sessions, query, categories]);

  function toggleCategory(cat: Category) {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const activeFilters = categories.size > 0 || query.length > 0;

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            className="input pl-9"
            placeholder="Rechercher un exercice, une note, une date…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
              onClick={() => setQuery("")}
              aria-label="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATEGORIES.map((cat) => {
            const active = categories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={[
                  "chip border transition-colors",
                  active
                    ? "bg-accent text-black border-accent"
                    : "bg-bg-soft text-text-muted border-border hover:text-text",
                ].join(" ")}
              >
                {cat}
              </button>
            );
          })}
        </div>
        {activeFilters && (
          <div className="text-xs text-text-dim flex items-center justify-between">
            <span>
              {filtered.length} séance{filtered.length > 1 ? "s" : ""} sur{" "}
              {sessions.length}
            </span>
            <button
              className="text-accent-soft hover:text-accent"
              onClick={() => {
                setQuery("");
                setCategories(new Set());
              }}
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>
      <SessionList
        sessions={filtered}
        onRemove={onRemove}
        onEdit={onEdit}
      />
    </div>
  );
}
