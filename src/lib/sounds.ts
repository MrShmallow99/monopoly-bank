/**
 * Sound playback using new Audio() per call so sounds can overlap.
 * Safe for SSR: no-op when window is undefined.
 */

const SOUNDS = {
  button: "/sounds/button.opus",
  transferMinus: "/sounds/transfer_minus.opus",
  transferPlus: "/sounds/transfer_plus.mp3",
} as const;

function play(src: string): void {
  if (typeof window === "undefined") return;
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
