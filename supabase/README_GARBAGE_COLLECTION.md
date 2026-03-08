# Garbage collection for Monopoly rooms

## 1. Current behavior

- **Codebase:** There is **no** automatic cleanup of old or finished rooms. The only delete in the app is when creating a room fails after inserting the room (then the orphan room is deleted).
- **Database:** Deleting a row from `rooms` **cascades** to `players` and `transactions` (both use `ON DELETE CASCADE`), so one `DELETE FROM rooms WHERE ...` is enough.

## 2. What the GC does

Rooms (and their players and transactions) are deleted when **either**:

- The room was **created more than 24 hours ago**, or  
- The room is **finished** (`is_active = false`).

A Postgres function `gc_old_monopoly_rooms()` runs this delete and returns the number of rooms deleted. A **pg_cron** job is scheduled to call it **every 4 hours**.

## 3. Where to run the SQL in Supabase

1. Open your project: **https://supabase.com/dashboard** → your project.
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Paste the contents of **`supabase/migrations/20250308_garbage_collection_rooms.sql`** (the whole file).
5. Click **Run** (or Ctrl+Enter).

If **pg_cron** is not enabled yet:

1. Go to **Database** → **Extensions** (left sidebar).
2. Search for **pg_cron**, enable it.
3. Run the SQL again.

## 4. Running GC only on a schedule (no cron)

If you prefer **not** to use pg_cron (e.g. no extension or different host), you can:

- Create only the function (Step 1 in the migration file).
- Call it from an external scheduler (e.g. GitHub Actions, cron on a server):

  ```sql
  SELECT gc_old_monopoly_rooms();
  ```

Or run that same `SELECT` manually in the SQL Editor whenever you want a one-off cleanup.

## 5. Changing the schedule or the 24h rule

- **Schedule:** In the SQL, edit the cron expression in `cron.schedule(...)`. Example: `'0 * * * *'` = every hour at minute 0.
- **24h rule:** In the function body, change `interval '24 hours'` (e.g. to `'48 hours'` or `'12 hours'`).

After editing, re-run the migration SQL (unschedule + schedule again if you changed the cron).
