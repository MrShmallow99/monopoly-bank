-- ============================================
-- Monopoly Electronic Banking – Schema updates
-- Run this in Supabase SQL Editor.
-- ============================================

-- Rooms: allow debt (negative balance) and end-game flag
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS allow_debt BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Players: bankruptcy flag
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS is_bankrupt BOOLEAN NOT NULL DEFAULT false;

-- Optional: ensure realtime gets room updates (e.g. is_active).
-- If rooms is already in the publication, the ADD TABLE line will error; you can ignore it.
ALTER TABLE rooms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
