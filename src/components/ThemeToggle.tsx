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
        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-500/40 dark:border-amber-500/50 text-amber-700 dark:text-gray-400 w-10 h-10 shadow-sm"
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
      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-500/40 dark:border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors w-10 h-10 flex items-center justify-center shadow-sm dark:shadow-none"
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
