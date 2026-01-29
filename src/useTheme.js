// src/useTheme.js
import { useEffect, useMemo, useState } from "react";
import { themes } from "./themes";

const STORAGE_KEY = "widget_theme_id";

function applyThemeVars(vars) {
  const root = document.querySelector(":root");
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function useTheme() {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || themes[0].id;
  });

  const theme = useMemo(
    () => themes.find((t) => t.id === themeId) || themes[0],
    [themeId]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme.id);
    applyThemeVars(theme.vars);
  }, [theme]);

  return { themeId: theme.id, theme, themes, setThemeId };
}