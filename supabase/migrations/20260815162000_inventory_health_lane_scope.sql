-- inventory_health default scope is the 12 purchase lanes.
-- Optional category slug inspects one store lane without hitting PostgREST max_rows.
-- available_creator_modes_for_lane powers store checkout against exact persona stock.

drop function if exists public.inventory_health();

create or replace function public.inventory_health(p_category_slug text default null)
returns table (
  category_slug text,
  persona_slug text,
  low_count bigint,
  mid_count bigint,
  high_count bigint,
  low_target integer,
  mid_target integer,
  high_target integer,
  low_threshold integer,
  mid_threshold integer,
  high_threshold integer,
  needs_generation boolean
)
language sql
security invoker
set search_path = public, pg_temp
as $$
  with pairs as (
    select c.id as category_id, p.id as persona_id
    from public.categories c
    cross join public.creator_personas p
    where c.enabled = true
      and p.enabled = true
      and (
        (p_category_slug is not null and c.slug = p_category_slug)
        or (
          p_category_slug is null
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
        )
      )
  ),
  sellable as (
    select
      inv.category_id,
      inv.persona_id,
      inv.score_band,
      inv.id
    from public.idea_inventory inv
    join public.idea_cards ic on ic.idea_id = inv.idea_id
    left join public.idea_candidates cand on cand.id = inv.idea_id
    where inv.status = 'available'::public.inventory_status
      and inv.reuse_count = 0
      and inv.max_reuse_count = 1
      and inv.quality_floor_passed is true
      and inv.internal_rank_score >= 80
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
  ),
  counts as (
    select
      pairs.category_id,
      pairs.persona_id,
      count(sellable.id) filter (where sellable.score_band = 'low') as low_count,
      count(sellable.id) filter (where sellable.score_band = 'mid') as mid_count,
      count(sellable.id) filter (where sellable.score_band = 'high') as high_count
    from pairs
    left join sellable
      on sellable.category_id = pairs.category_id
     and sellable.persona_id = pairs.persona_id
    group by pairs.category_id, pairs.persona_id
  )
  select
    c.slug as category_slug,
    p.slug as persona_slug,
    counts.low_count,
    counts.mid_count,
    counts.high_count,
    0 as low_target,
    0 as mid_target,
    30 as high_target,
    0 as low_threshold,
    0 as mid_threshold,
    8 as high_threshold,
    counts.high_count < 8 as needs_generation
  from counts
  join public.categories c on c.id = counts.category_id
  join public.creator_personas p on p.id = counts.persona_id
  order by needs_generation desc, c.sort_order, p.sort_order, c.slug, p.slug;
$$;

create or replace function public.available_creator_modes_for_lane(p_category_slug text)
returns table (persona_slug text, high_count bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    p.slug as persona_slug,
    count(inv.id)::bigint as high_count
  from public.creator_personas p
  join public.categories c
    on c.slug = p_category_slug
   and c.enabled = true
  left join public.idea_inventory inv
    on inv.persona_id = p.id
   and inv.category_id = c.id
   and inv.status = 'available'::public.inventory_status
   and inv.reuse_count = 0
   and inv.max_reuse_count = 1
   and inv.quality_floor_passed is true
   and inv.internal_rank_score >= 80
   and inv.score_band = 'high'::public.score_band
   and public.idea_has_sellable_card(inv.idea_id)
   and public.inventory_scope_matches_candidate(inv.idea_id, inv.category_id, inv.persona_id)
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
  where p.enabled = true
  group by p.slug, p.sort_order
  order by p.sort_order, p.slug;
$$;

revoke all on function public.inventory_health(text) from public, anon, authenticated;
revoke all on function public.available_creator_modes_for_lane(text) from public, anon, authenticated;
grant execute on function public.inventory_health(text) to service_role;
grant execute on function public.available_creator_modes_for_lane(text) to service_role;

notify pgrst, 'reload schema';
