import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "rose";
const KEY = "gym-tracker:theme";
const DEFAULT: Theme = "dark";

// Couleurs utilisées pour la barre de statut iOS / Android. On garde ces
// valeurs en dur ici plutôt que de les relire depuis les CSS vars pour
// pouvoir les appliquer avant le premier render.
const THEME_COLOR: Record<Theme, string> = {
  dark: "#0f1316",
  rose: "#f8e8e8",
};

function read(): Theme {
  if (typeof window === "undefined") return DEFAULT;
  const v = localStorage.getItem(KEY);
  return v === "rose" || v === "dark" ? v : DEFAULT;
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  // On bascule aussi une classe light/dark pour que le user-agent (iOS
  // Safari notamment) ne force pas son propre color-scheme système.
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme !== "dark");
  root.style.colorScheme = theme === "dark" ? "dark" : "light";
  setMeta("theme-color", THEME_COLOR[theme]);
  // La barre de statut iOS en PWA : "default" = barre claire texte sombre,
  // "black-translucent" = overlay sombre. On aligne sur le thème.
  setMeta(
    "apple-mobile-web-app-status-bar-style",
    theme === "dark" ? "black-translucent" : "default",
  );
}

// Hook simple : lit/écrit le thème dans localStorage et reflète l'attribut
// data-theme sur <html>, ce qui active le jeu de CSS variables correspondant.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => read());

  useEffect(() => {
    apply(theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.documentElement.setAttribute("data-theme-ready", "");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "rose" : "dark"));
  }, []);

  return { theme, setTheme, toggle };
}

// À appeler le plus tôt possible (ex: main.tsx) pour éviter un flash de
// thème par défaut avant le premier render.
export function bootstrapTheme() {
  apply(read());
}
