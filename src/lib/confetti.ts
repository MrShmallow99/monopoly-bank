/**
 * Confetti animation helpers using canvas-confetti.
 * Safe for SSR; no-op when window is undefined.
 * Canvas is non-interactive so it doesn't block clicks.
 */

async function getConfetti() {
  if (typeof window === "undefined") return null;
  try {
    const confetti = (await import("canvas-confetti")).default;
    return confetti;
  } catch {
    return null;
  }
}

/**
 * Pass Go: fast center burst, clears in ~2–3 seconds. Doesn't obscure UI.
 */
export async function firePassGoConfetti(): Promise<void> {
  const confetti = await getConfetti();
  if (!confetti) return;
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { x: 0.5, y: 0.5 },
    startVelocity: 28,
    decay: 0.92,
    scalar: 0.9,
    ticks: 180,
    zIndex: 9999,
  });
}

/**
 * Game win: sustained cascade from both sides, ~5–6 seconds. Bursts every 200ms so it doesn't lag.
 */
export async function fireWinConfetti(): Promise<void> {
  const confetti = await getConfetti();
  if (!confetti) return;
  const duration = 5600;
  const end = Date.now() + duration;
  const burst = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      startVelocity: 28,
      decay: 0.91,
      scalar: 1.05,
      ticks: 260,
      zIndex: 9999,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      startVelocity: 28,
      decay: 0.91,
      scalar: 1.05,
      ticks: 260,
      zIndex: 9999,
    });
  };
  burst();
  const interval = setInterval(() => {
    if (Date.now() < end) burst();
    else clearInterval(interval);
  }, 200);
}
