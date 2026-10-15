-- Remove creator video review feature (tables, storage policies, enums, bucket).

drop policy if exists "creator_review_videos_owner_select" on storage.objects;
drop policy if exists "creator_review_videos_owner_insert" on storage.objects;
drop policy if exists "creator_review_videos_owner_update" on storage.objects;
drop policy if exists "creator_review_videos_owner_delete" on storage.objects;

-- Supabase Storage protects its catalog from direct SQL deletion. Removing
-- objects here aborts the entire migration as soon as the bucket is non-empty
-- and can orphan physical files even when the catalog delete is forced.
-- The policies below make the retired bucket inaccessible; an operator may
-- delete the bucket later through the Storage API after applying retention
-- requirements. Keep this schema migration non-destructive and replay-safe.
do $$
begin
  if exists (
    select 1
    from storage.buckets
    where id = 'creator-review-videos'
  ) then
    raise notice 'Retaining creator-review-videos bucket; remove it through the Storage API after retention review.';
  end if;
end
$$;

drop table if exists public.creator_video_review_events cascade;
drop table if exists public.creator_video_review_checks cascade;
drop table if exists public.creator_video_review_attempts cascade;
drop table if exists public.creator_video_reviews cascade;

drop type if exists public.creator_video_review_check_status cascade;
drop type if exists public.creator_video_review_decision cascade;
drop type if exists public.creator_video_review_status cascade;
