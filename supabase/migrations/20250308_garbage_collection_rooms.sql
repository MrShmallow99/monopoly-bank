-- ============================================
-- Monopoly: Garbage collection for old/finished rooms
-- Run this in Supabase SQL Editor (see README_GARBAGE_COLLECTION.md).
-- ============================================
-- Deletes rooms (and CASCADE deletes their players + transactions) when:
--   • Room was created more than 24 hours ago, OR
--   • Room is finished (is_active = false).
-- ============================================

-- ---------------------------------------------------------------------------
-- STEP 1: Cleanup function (run this even if you skip pg_cron)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION gc_old_monopoly_rooms()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM rooms
    WHERE created_at < (now() - interval '24 hours')
       OR is_active = false
    RETURNING id
  )
  SELECT count(*)::integer INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;

-- Manual run once (optional): SELECT gc_old_monopoly_rooms();

-- ---------------------------------------------------------------------------
-- STEP 2: Enable pg_cron extension
-- If this fails: Dashboard → Database → Extensions → enable "pg_cron".
-- On some plans pg_cron may not be available; then run the function manually
-- or from an external scheduler.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ---------------------------------------------------------------------------
-- STEP 3: Schedule job every 4 hours
-- Cron format: minute hour day-of-month month day-of-week
-- '0 */4 * * *' = at minute 0 of every 4th hour
-- ---------------------------------------------------------------------------
SELECT cron.unschedule('gc-monopoly-rooms')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gc-monopoly-rooms');

SELECT cron.schedule(
  'gc-monopoly-rooms',
  '0 */4 * * *',
  'SELECT gc_old_monopoly_rooms();'
);
