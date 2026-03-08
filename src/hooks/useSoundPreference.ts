"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "monopoly-sound-enabled";

function getStored(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return true;
  return stored !== "false";
}

export function useSoundPreference(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    setEnabledState(getStored());
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
  }, []);

  return [enabled, setEnabled];
}

/** Must match the key used in src/lib/sounds.ts */
export { STORAGE_KEY as SOUND_PREFERENCE_STORAGE_KEY };
