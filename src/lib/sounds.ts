/**
 * Sound playback using new Audio() per call so sounds can overlap.
 * Safe for SSR: no-op when window is undefined.
 * Respects user preference in localStorage (monopoly-sound-enabled).
 */

const SOUNDS = {
  button: "/sounds/button.opus",
  transferMinus: "/sounds/transfer_minus.opus",
  transferPlus: "/sounds/transfer_plus.mp3",
} as const;

const STORAGE_KEY = "monopoly-sound-enabled";

function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return true;
    return stored !== "false";
  } catch {
    return true;
  }
}

function play(src: string): void {
  if (typeof window === "undefined") return;
  if (!isSoundEnabled()) return;
  try {
    const audio = new Audio(src);
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

export function playButton(): void {
  play(SOUNDS.button);
}

export function playTransferMinus(): void {
  play(SOUNDS.transferMinus);
}

export function playTransferPlus(): void {
  play(SOUNDS.transferPlus);
}
