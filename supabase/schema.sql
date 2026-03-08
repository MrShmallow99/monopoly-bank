-- Monopoly Electronic Banking - Supabase Schema
-- Run this script in the Supabase SQL Editor to create tables and enable real-time.

-- ============================================
-- TABLES
-- ============================================

-- Rooms: game sessions identified by a short code
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rooms_code_length CHECK (char_length(code) >= 4 AND char_length(code) <= 6),
  CONSTRAINT rooms_code_digits CHECK (code ~ '^[0-9]+$')
);

-- Players: participants in a room
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  balance BIGINT NOT NULL DEFAULT 15000000,
  is_banker BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, name)
);

-- Transactions: all money movements (from_player and to_player can be player UUID or 'BANK')
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  from_player TEXT NOT NULL,
  to_player TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_transactions_room_id ON transactions(room_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(room_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (optional, allow all for no-auth setup)
-- ============================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth - access by room code only)
CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- REALTIME (enable for subscriptions)
-- If you re-run this script, the ADD TABLE lines may error (table already in publication); that's OK.
-- ============================================
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE players REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Optional: function to generate a random 4-6 digit room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_len INT := 4 + floor(random() * 3)::int;
BEGIN
  LOOP
    new_code := lpad(floor(random() * pow(10, code_len))::text, code_len, '0');
    IF NOT EXISTS (SELECT 1 FROM rooms WHERE code = new_code) THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
