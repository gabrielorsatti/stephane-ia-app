import { Scale } from "lucide-react";
import { useState } from "react";
import type { BodyWeightEntry } from "../types";
import { BodyWeightChart } from "./BodyWeightChart";
import { HubHeader } from "./HubHeader";
import { NavCard } from "./NavCard";
import { NutritionView } from "./NutritionView";
import { SlideBack, SlideIn } from "./Transition";

type View = "main" | "weight";

interface Props {
  bodyWeightEntries: BodyWeightEntry[];
  onAddBodyWeight: (entry: BodyWeightEntry) => void;
}

export function NutritionHub({ bodyWeightEntries, onAddBodyWeight }: Props) {
  const [view, setView] = useState<View>("main");
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  function goTo(v: View) {
    setDirection("forward");
    setView(v);
  }

  function goBack() {
    setDirection("back");
    setView("main");
  }

  const Wrap = direction === "forward" ? SlideIn : SlideBack;

  if (view === "weight") {
    return (
      <Wrap id="nutrition-weight">
        <HubHeader title="Retour à Nutrition" onBack={goBack} />
        <BodyWeightChart entries={bodyWeightEntries} onAdd={onAddBodyWeight} />
      </Wrap>
    );
  }

  return (
    <Wrap id="nutrition-main">
      <div className="space-y-4">
        <NutritionView />
        <NavCard
          icon={Scale}
          label="Poids de corps"
          description="Suivi et courbe d'évolution"
          onClick={() => goTo("weight")}
        />
      </div>
    </Wrap>
  );
}
