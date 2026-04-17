import { Scale } from "lucide-react";
import { useState } from "react";
import type { BodyWeightEntry } from "../types";
import { BodyWeightChart } from "./BodyWeightChart";
import { HubHeader } from "./HubHeader";
import { NavCard } from "./NavCard";
import { NutritionView } from "./NutritionView";

type View = "main" | "weight";

interface Props {
  bodyWeightEntries: BodyWeightEntry[];
  onAddBodyWeight: (entry: BodyWeightEntry) => void;
}

export function NutritionHub({ bodyWeightEntries, onAddBodyWeight }: Props) {
  const [view, setView] = useState<View>("main");

  if (view === "weight") {
    return (
      <>
        <HubHeader title="Retour à Nutrition" onBack={() => setView("main")} />
        <BodyWeightChart entries={bodyWeightEntries} onAdd={onAddBodyWeight} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <NutritionView />
      <NavCard
        icon={Scale}
        label="Poids de corps"
        description="Suivi et courbe d'évolution"
        onClick={() => setView("weight")}
      />
    </div>
  );
}
