import { useCallback, useEffect, useState } from "react";

export type Theme = "mauve" | "dark";
const KEY = "gym-tracker:theme";
const DEFAULT: Theme = "mauve";

const THEME_COLOR: Record<Theme, string> = {
  mauve: "#f8f7fc",
  dark: "#0f0d19",
};

function read(): Theme {
  if (typeof window === "undefined") return DEFAULT;
  const v = localStorage.getItem(KEY);
  if (v === "mauve" || v === "dark") return v;
  if (v === "rose") {
    localStorage.setItem(KEY, "mauve");
    return "mauve";
  }
  return DEFAULT;
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
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme !== "dark");
  root.style.colorScheme = theme === "dark" ? "dark" : "light";
  setMeta("theme-color", THEME_COLOR[theme]);
  setMeta(
    "apple-mobile-web-app-status-bar-style",
    theme === "dark" ? "black-translucent" : "default",
  );
}

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
    setTheme((t) => (t === "mauve" ? "dark" : "mauve"));
  }, []);

  return { theme, setTheme, toggle };
}

export function bootstrapTheme() {
  apply(read());
}
