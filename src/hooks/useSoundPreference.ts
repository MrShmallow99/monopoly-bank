"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "monopoly-sound-enabled";

/**
 * Read sound preference from localStorage. Must only be called in useEffect
 * (after mount) to avoid SSR/hydration errors — no window/localStorage on server.
 */
function getStored(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return true;
    return stored !== "false";
  } catch {
    return true;
  }
}

export function useSoundPreference(): [
  boolean,
  (enabled: boolean) => void,
  boolean
] {
  // Default to true without ever touching localStorage during initial render
  const [enabled, setEnabledState] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabledState(getStored());
    setMounted(true);
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, String(value));
      } catch {
        // ignore
      }
    }
  }, []);

  return [enabled, setEnabled, mounted];
}

/** Must match the key used in src/lib/sounds.ts */
export { STORAGE_KEY as SOUND_PREFERENCE_STORAGE_KEY };
