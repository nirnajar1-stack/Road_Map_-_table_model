"use client";

import { createContext, useContext } from "react";
import { useTheme, type Theme } from "@/hooks/useTheme";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  ready: boolean;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useTheme();
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}
