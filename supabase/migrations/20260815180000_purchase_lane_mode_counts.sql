-- One-shot sellable matrix for the store: every enabled purchase lane × creator mode.

create or replace function public.purchase_lane_mode_counts()
returns table (category_slug text, persona_slug text, high_count bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  with lanes as (
    select c.id, c.slug, c.sort_order
    from public.categories c
    where c.enabled = true
      and c.slug in (
        'beauty',
        'fashion',
        'commerce_affiliate',
        'creator_education',
        'entertainment_comedy',
        'fitness_wellness_safe',
        'food',
        'lifestyle',
        'luxury',
        'parenting_family',
        'thought_leadership',
        'travel'
      )
  ),
  sellable as (
    select inv.category_id, inv.persona_id
    from public.idea_inventory inv
    join lanes lane_scope on lane_scope.id = inv.category_id
    join public.idea_cards ic on ic.idea_id = inv.idea_id
    left join public.idea_candidates cand on cand.id = inv.idea_id
    where inv.status = 'available'::public.inventory_status
      and inv.reuse_count = 0
      and inv.max_reuse_count = 1
      and inv.quality_floor_passed is true
      and inv.internal_rank_score >= 80
      and inv.score_band = 'high'::public.score_band
      and public.card_payload_is_sellable(ic.card, ic.title)
      and not (cand.category_id is not null and cand.category_id <> inv.category_id)
      and not (cand.persona_id is not null and cand.persona_id <> inv.persona_id)
      and not exists (
        select 1
        from public.idea_box_items used
        where used.idea_id = inv.idea_id
           or used.inventory_id = inv.id
      )
      and not exists (
        select 1
        from public.checkout_inventory_reservations reserved
        where reserved.status = 'active'
          and reserved.expires_at >= now() - interval '15 minutes'
          and (reserved.inventory_id = inv.id or reserved.idea_id = inv.idea_id)
      )
  )
  select
    c.slug as category_slug,
    p.slug as persona_slug,
    count(s.category_id)::bigint as high_count
  from lanes c
  cross join public.creator_personas p
  left join sellable s
    on s.category_id = c.id
   and s.persona_id = p.id
  where p.enabled = true
  group by c.slug, c.sort_order, p.slug, p.sort_order
  order by c.sort_order, c.slug, p.sort_order, p.slug;
$$;

revoke all on function public.purchase_lane_mode_counts() from public, anon, authenticated;
grant execute on function public.purchase_lane_mode_counts() to service_role;

notify pgrst, 'reload schema';
