import { BookOpen, ChevronDown, Lightbulb, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EXERCISE_TIPS } from "../data/exerciseTips";
import { EXERCISE_CATALOG, exercisesByCategory, normalize } from "../lib/exercises";
import { ALL_CATEGORIES, type Category } from "../types";

// Liste complète des exercices du catalogue, groupés par catégorie,
// avec recherche texte et affichage des alias principaux.
export function ExerciseCatalog() {
  const [query, setQuery] = useState("");
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const grouped = useMemo(() => exercisesByCategory(), []);

  const q = normalize(query);
  const filtered = useMemo(() => {
    if (!q) return grouped;
    const out = {} as Record<Category, typeof EXERCISE_CATALOG>;
    for (const cat of ALL_CATEGORIES) {
      const list = (grouped[cat] ?? []).filter((def) => {
        if (normalize(def.canonical).includes(q)) return true;
        return def.aliases.some((a) => normalize(a).includes(q));
      });
      if (list.length) out[cat] = list;
    }
    return out;
  }, [grouped, q]);

  const categories = ALL_CATEGORIES.filter((c) => (filtered[c]?.length ?? 0) > 0);
  const total = EXERCISE_CATALOG.length;

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent-soft" />
            <h3 className="text-sm font-semibold">
              Catalogue d'exercices
            </h3>
          </div>
          <span className="chip bg-accent-muted text-text-muted">
            {total} mouvements
          </span>
        </div>
        <p className="text-xs text-text-muted mb-3">
          Tu peux saisir n'importe lequel dans le champ de saisie du dashboard,
          soit par son nom exact, soit par un de ses alias (ex. « dc »,
          « sdt », « ohp »). Les variantes machine / haltères / barre sont
          comptées comme des exercices distincts pour le suivi des records.
        </p>
        <div className="relative">
          <Search className="w-4 h-4 text-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="input pl-9"
            placeholder="Rechercher un exercice, un alias, une catégorie…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="card text-center text-sm text-text-dim py-8">
          Aucun exercice ne correspond à « {query} ».
        </div>
      ) : (
        categories.map((cat) => {
          const list = filtered[cat] ?? [];
          return (
            <div key={cat} className="card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">{cat}</h4>
                <span className="text-xs text-text-dim">
                  {list.length} exercice{list.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {list.map((def) => {
                  const tip = EXERCISE_TIPS[def.canonical];
                  const isExpanded = expandedTip === def.canonical;
                  return (
                    <div
                      key={def.canonical}
                      className="bg-bg-soft border border-border rounded-lg px-3 py-2"
                    >
                      <div className="text-sm font-medium">{def.canonical}</div>
                      {def.aliases.length > 0 && (
                        <div className="text-[11px] text-text-dim mt-0.5 truncate">
                          alias : {def.aliases.slice(0, 4).join(", ")}
                          {def.aliases.length > 4 ? "…" : ""}
                        </div>
                      )}
                      {tip && (
                        <div className="mt-1.5">
                          <button
                            className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-soft transition-colors"
                            onClick={() => setExpandedTip(isExpanded ? null : def.canonical)}
                          >
                            <Lightbulb className="w-3 h-3" />
                            Conseils
                            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                          {isExpanded && (
                            <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                              {tip}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
