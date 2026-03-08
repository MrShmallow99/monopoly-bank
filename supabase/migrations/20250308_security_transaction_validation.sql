-- ============================================
-- Security: transaction validation trigger
-- Run in Supabase SQL Editor after schema and 20250308_allow_debt_bankrupt_is_active.
-- Prevents: negative/zero amount (backstop to CHECK), insufficient balance when room disallows debt.
-- ============================================

CREATE OR REPLACE FUNCTION validate_transaction_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allow_debt boolean;
  v_sender_balance bigint;
BEGIN
  -- Amount already enforced by CHECK (amount > 0); redundant guard
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Transaction amount must be positive';
  END IF;

  -- When sender is not the bank, enforce balance when room disallows debt
  IF NEW.from_player IS NOT NULL AND NEW.from_player <> 'BANK' THEN
    SELECT r.allow_debt INTO v_allow_debt
    FROM rooms r
    WHERE r.id = NEW.room_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Room not found';
    END IF;
    IF NOT COALESCE(v_allow_debt, false) THEN
      SELECT p.balance INTO v_sender_balance
      FROM players p
      WHERE p.id = NEW.from_player::uuid AND p.room_id = NEW.room_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Sender player not found in room';
      END IF;
      IF v_sender_balance IS NULL OR v_sender_balance < NEW.amount THEN
        RAISE EXCEPTION 'Insufficient balance for this transaction';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_transaction_insert ON transactions;
CREATE TRIGGER trigger_validate_transaction_insert
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_transaction_insert();
