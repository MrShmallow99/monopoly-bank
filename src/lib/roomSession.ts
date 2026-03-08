/**
 * Room session binding: stores which playerId "owns" access to a room from this browser.
 * Used to prevent room hijacking (e.g. opening another player's room URL).
 * Only access from client (localStorage).
 */

const PREFIX = "monopoly-room-";

function key(code: string): string {
  const normalized = String(code).replace(/\D/g, "").slice(0, 6);
  return PREFIX + normalized;
}

export function getRoomPlayerId(roomCode: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(key(roomCode));
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function setRoomPlayerId(roomCode: string, playerId: string): void {
  if (typeof window === "undefined") return;
  try {
    const k = key(roomCode);
    if (playerId && playerId.length > 0) {
      localStorage.setItem(k, playerId);
    } else {
      localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}

export function clearRoomSession(roomCode: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key(roomCode));
  } catch {
    // ignore
  }
}
