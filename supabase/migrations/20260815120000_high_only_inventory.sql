-- Only high-band inventory is sellable. Floor stays 80.

update public.box_products
set allocation = case slug
  when 'viral_box_500' then '{"high":2}'::jsonb
  when 'premium_viral_box_1000' then '{"high":5}'::jsonb
  else jsonb_build_object('high', greatest(coalesce(idea_count, 1), 1))
end,
updated_at = now();

update public.idea_inventory
set score_band = 'high'::public.score_band,
    quality_floor_passed = true
where internal_rank_score >= 80;

update public.idea_inventory
set quality_floor_passed = false
where internal_rank_score < 80;
