-- inventory_health and availability counts must stay join-based.
-- Per-row composite helpers timed out on the full category × persona grid.

create or replace function public.available_inventory_counts(
  p_category_slug text,
  p_persona_slug text default null
)
returns table (score_band public.score_band, available_count bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    inv.score_band,
    count(*)::bigint as available_count
  from public.idea_inventory inv
  join public.categories c on c.id = inv.category_id
  join public.creator_personas p on p.id = inv.persona_id
  join public.idea_cards ic on ic.idea_id = inv.idea_id
  left join public.idea_candidates cand on cand.id = inv.idea_id
  where c.slug = p_category_slug
    and c.enabled = true
    and p.enabled = true
    and (p_persona_slug is null or p.slug = p_persona_slug)
    and inv.status = 'available'::public.inventory_status
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
      where used.inventory_id = inv.id
         or used.idea_id = inv.idea_id
    )
    and not exists (
      select 1
      from public.checkout_inventory_reservations reserved
      where reserved.status = 'active'
        and reserved.expires_at >= now() - interval '15 minutes'
        and (reserved.inventory_id = inv.id or reserved.idea_id = inv.idea_id)
    )
  group by inv.score_band;
$$;

create or replace function public.inventory_health()
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

revoke all on function public.available_inventory_counts(text, text) from public, anon, authenticated;
revoke all on function public.inventory_health() from public, anon, authenticated;
grant execute on function public.available_inventory_counts(text, text) to service_role;
grant execute on function public.inventory_health() to service_role;

notify pgrst, 'reload schema';
