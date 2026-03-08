/**
 * Sanitize user-generated text for safe display (defense in depth; React already escapes).
 * Removes control characters and null bytes. Use for player names, room codes, etc.
 */
const CONTROL_AND_NULL = /[\0-\x1F\x7F]/g;

export function sanitizeDisplayText(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  return s.replace(CONTROL_AND_NULL, "").trim();
}
