-- Historical migration tombstone.
--
-- This follow-up version belongs to the retired creator video review feature.
-- It remains as a no-op so existing Supabase histories and clean bootstraps
-- share the same ordered version set without reviving obsolete tables.
do $$ begin null; end $$;