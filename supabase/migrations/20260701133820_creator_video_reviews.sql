-- Historical migration tombstone.
--
-- This version exists in deployed/local Supabase migration history, but the
-- creator video review feature was retired by 20260808120000. Recreating its
-- removed tables and Storage policies during a clean bootstrap would add a
-- feature that is immediately deleted. Keep the version represented so
-- migration history remains reconcilable; the later retirement migration is
-- intentionally written with IF EXISTS guards.
do $$ begin null; end $$;