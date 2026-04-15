import { useMemo } from "react";
import { useTheme } from "./useTheme";

// Lit les variables CSS du thème actif et les expose sous forme de valeurs
// `rgb(...)` utilisables directement dans les props Recharts. Le `theme`
// en dépendance force une relecture à chaque changement de palette.
export function useChartColors() {
  const { theme } = useTheme();
  return useMemo(() => {
    const get = (name: string) => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
      return v ? `rgb(${v})` : "#888";
    };
    return {
      c1: get("--c-chart-1"),
      c2: get("--c-chart-2"),
      c3: get("--c-chart-3"),
      grid: get("--c-chart-grid"),
      axis: get("--c-chart-axis"),
      bgCard: get("--c-bg-card"),
      border: get("--c-border"),
      text: get("--c-text"),
      textMuted: get("--c-text-muted"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}
