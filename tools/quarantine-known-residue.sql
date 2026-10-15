-- Fast quarantine for known factory/AI-residue phrases in unused available high stock.
-- Does not touch reserved, delivered, or reused rows.
-- Follow with: npx tsx tools/quarantine-card-residue.ts --apply

begin;

update public.idea_inventory inv
set score_band = 'low'::public.score_band,
    quality_floor_passed = false,
    metadata = coalesce(inv.metadata, '{}'::jsonb) || jsonb_build_object(
      'residue_quarantine', true,
      'residue_reason', 'sql_known_phrase',
      'quarantined_at', now()
    ),
    updated_at = now()
where inv.status = 'available'::public.inventory_status
  and inv.reuse_count = 0
  and inv.quality_floor_passed is true
  and inv.score_band = 'high'::public.score_band
  and inv.internal_rank_score >= 80
  and not exists (
    select 1
    from public.checkout_inventory_reservations reserved
    where reserved.status = 'active'
      and reserved.expires_at >= now() - interval '15 minutes'
      and (reserved.inventory_id = inv.id or reserved.idea_id = inv.idea_id)
  )
  and exists (
    select 1
    from public.idea_cards ic
    where ic.idea_id = inv.idea_id
      and (
        ic.card::text ilike '%hidden decision%'
        or ic.card::text ilike '%premium moment%'
        or ic.card::text ilike '%premium frame%'
        or ic.card::text ilike '%stop the scroll%'
        or ic.card::text ilike '%game-changing%'
        or ic.card::text ilike '%authentic impact%'
        or ic.card::text ilike '%seamless transition%'
        or ic.card::text ilike '%carry the energy%'
        or ic.title ~* 'brief[[:space:]]+[0-9]{2,}'
      )
  );

commit;
