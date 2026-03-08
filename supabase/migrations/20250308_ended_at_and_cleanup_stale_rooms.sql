-- ============================================
-- Rooms: ended_at timestamp + cleanup of stale finished rooms
-- Run after schema and 20250308_allow_debt_bankrupt_is_active.
-- players/transactions already have ON DELETE CASCADE to rooms.
-- ============================================

-- Add nullable ended_at (set when Host ends the game)
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ DEFAULT NULL;

-- RPC: delete all rooms that ended more than 15 minutes ago (cascades to players & transactions)
CREATE OR REPLACE FUNCTION cleanup_stale_rooms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rooms
  WHERE ended_at IS NOT NULL
    AND ended_at < (NOW() - INTERVAL '15 minutes');
END;
$$;
