update public.box_products
set price_usd_cents = case slug
  when 'viral_box_500' then 2900
  when 'premium_viral_box_1000' then 5900
  else price_usd_cents
end
where slug in ('viral_box_500', 'premium_viral_box_1000');
