-- ============================================
-- Auto-bankruptcy when balance hits 0 (no-debt mode)
-- Run in Supabase SQL Editor after schema and 20250308_allow_debt_bankrupt_is_active.
-- When a player's balance is updated to 0 and the room has allow_debt = false,
-- set is_bankrupt = true automatically.
-- ============================================

CREATE OR REPLACE FUNCTION auto_bankrupt_on_zero_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allow_debt boolean;
BEGIN
  IF NEW.balance = 0 THEN
    SELECT r.allow_debt INTO v_allow_debt
    FROM rooms r
    WHERE r.id = NEW.room_id;
    IF FOUND AND NOT COALESCE(v_allow_debt, true) THEN
      NEW.is_bankrupt := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_bankrupt_on_zero_balance ON players;
CREATE TRIGGER trigger_auto_bankrupt_on_zero_balance
  BEFORE UPDATE OF balance ON players
  FOR EACH ROW
  WHEN (NEW.balance = 0)
  EXECUTE FUNCTION auto_bankrupt_on_zero_balance();
