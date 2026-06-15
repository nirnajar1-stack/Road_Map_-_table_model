"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeContext } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme, ready } = useThemeContext();

  if (!ready) return null;

  return (
    <button
      onClick={toggleTheme}
      className="btn-ghost-sm !opacity-100 flex items-center gap-2"
      title={theme === "dark" ? "מצב בהיר" : "מצב כהה"}
      aria-label={theme === "dark" ? "עבור למצב בהיר" : "עבור למצב כהה"}
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      <span className="hidden sm:inline">{theme === "dark" ? "בהיר" : "כהה"}</span>
    </button>
  );
}
