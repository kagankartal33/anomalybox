-- Align the live catalog with the $9 Classic Red and $19 Signature Purple prices.
update public.box_products
set price_usd_cents = case slug
  when 'viral_box_500' then 900
  when 'premium_viral_box_1000' then 1900
  else price_usd_cents
end,
updated_at = now()
where slug in ('viral_box_500', 'premium_viral_box_1000')
  and price_usd_cents is distinct from case slug
    when 'viral_box_500' then 900
    when 'premium_viral_box_1000' then 1900
    else price_usd_cents
  end;
