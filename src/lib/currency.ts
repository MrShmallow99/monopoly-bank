/** Minimum transaction amount: 0 NIS (amount must be > 0 for a transfer) */
export const MIN_TRANSACTION = 0;

/** Maximum single transaction: 20,000,000 NIS */
export const MAX_TRANSACTION = 20_000_000;

/** Starting balance: 15,000,000 NIS */
export const STARTING_BALANCE = 15_000_000;

/** Pass Go amount: 2,000,000 NIS */
export const PASS_GO_AMOUNT = 2_000_000;

const BANK_ID = "BANK";

export function getBankId() {
  return BANK_ID;
}

/**
 * Format amount for display: M for millions, K for thousands.
 * e.g. 1,500,000 -> "1.5M", 500,000 -> "500K", 15,000 -> "15K"
 */
export function formatAmount(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const thousands = amount / 1_000;
    return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
  }
  return amount.toString();
}

/**
 * Format amount as exact number with comma separators (e.g. 15,020,000).
 * Use for primary balance display so every digit is visible.
 */
export function formatAmountExact(amount: number): string {
  return amount.toLocaleString("he-IL");
}

/**
 * Parse user input (e.g. "1.5M", "500K") to number.
 */
export function parseAmountInput(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const match = trimmed.toUpperCase().match(/^([\d.,]+)\s*([KM])?$/);
  if (!match) return null;
  let num = parseFloat(match[1].replace(/,/g, "."));
  if (Number.isNaN(num) || num < 0) return null;
  const suffix = match[2];
  if (suffix === "M") num *= 1_000_000;
  else if (suffix === "K") num *= 1_000;
  return Math.round(num);
}

export function validateAmount(
  amount: number
): { valid: true } | { valid: false; error: string } {
  if (!Number.isSafeInteger(amount) || amount <= MIN_TRANSACTION) {
    return { valid: false, error: "הסכום חייב להיות מספר שלם גדול מ-0" };
  }
  if (amount > MAX_TRANSACTION) {
    return { valid: false, error: `הסכום המקסימלי הוא ${formatAmount(MAX_TRANSACTION)} (20M)` };
  }
  return { valid: true };
}

/**
 * Strict validation for transaction amount before DB insert (defense against tampering).
 * Returns the same shape as validateAmount.
 */
export function validateTransactionAmount(
  amount: unknown
): { valid: true; amount: number } | { valid: false; error: string } {
  if (typeof amount !== "number" || !Number.isSafeInteger(amount)) {
    return { valid: false, error: "סכום לא תקין" };
  }
  if (amount <= 0) {
    return { valid: false, error: "הסכום חייב להיות גדול מ-0" };
  }
  if (amount > MAX_TRANSACTION) {
    return { valid: false, error: `הסכום המקסימלי הוא ${formatAmount(MAX_TRANSACTION)}` };
  }
  return { valid: true, amount };
}

/** Validate revive balance amount (must be non-negative integer). */
export function validateReviveAmount(
  amount: unknown
): { valid: true; amount: number } | { valid: false; error: string } {
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 0) {
    return { valid: false, error: "סכום לא תקין" };
  }
  if (amount > MAX_TRANSACTION) {
    return { valid: false, error: `הסכום המקסימלי הוא ${formatAmount(MAX_TRANSACTION)}` };
  }
  return { valid: true, amount };
}
