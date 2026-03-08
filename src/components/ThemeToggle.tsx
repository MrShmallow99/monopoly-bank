"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="p-2 rounded-xl bg-monopoly-dark-card dark:bg-monopoly-dark-card border border-monopoly-green/30 dark:border-monopoly-green/30 text-gray-500 w-10 h-10"
        aria-label="מצב תצוגה"
      >
        <span className="text-lg">◐</span>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-xl bg-monopoly-light-card dark:bg-monopoly-dark-card border border-monopoly-light-border dark:border-monopoly-green/30 text-monopoly-green dark:text-monopoly-gold hover:bg-monopoly-light-border/50 dark:hover:bg-monopoly-green/20 transition-colors w-10 h-10 flex items-center justify-center"
      aria-label={isDark ? "מעבר למצב בהיר" : "מעבר למצב כהה"}
      title={isDark ? "מצב בהיר" : "מצב כהה"}
    >
      {isDark ? (
        <span className="text-lg" aria-hidden>☀️</span>
      ) : (
        <span className="text-lg" aria-hidden>🌙</span>
      )}
    </button>
  );
}
