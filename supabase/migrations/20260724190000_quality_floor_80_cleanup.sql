-- Raise operational quality floor to 80 and remove weaker inventory.
-- Reband remaining cards so low/mid/high stay usable for box allocations.

-- 1) Remove unused inventory below the new floor.
delete from public.idea_inventory inv
where inv.internal_rank_score < 80
  and not exists (
    select 1
    from public.idea_box_items items
    where items.inventory_id = inv.id
       or items.idea_id = inv.idea_id
  );

-- 2) Flag any remaining below-floor rows that could not be deleted (already delivered).
update public.idea_inventory
set quality_floor_passed = false
where internal_rank_score < 80;

update public.idea_inventory
set quality_floor_passed = true
where internal_rank_score >= 80;

-- 3) Reband score ranges inside the 80-100 window:
--    low  = 80-85.99
--    mid  = 86-91.99
--    high = 92-100
update public.idea_inventory
set score_band = case
  when internal_rank_score >= 92 then 'high'::public.score_band
  when internal_rank_score >= 86 then 'mid'::public.score_band
  else 'low'::public.score_band
end
where internal_rank_score >= 80;

-- 4) Drop orphan idea cards that no longer have inventory or delivery history.
delete from public.idea_cards cards
where not exists (
  select 1 from public.idea_inventory inv where inv.idea_id = cards.idea_id
)
and not exists (
  select 1 from public.idea_box_items items where items.idea_id = cards.idea_id
);
