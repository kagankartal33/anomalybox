-- Update pricing for Classic Red Box ($50) and Signature Purple Box ($100)
update public.box_products
set price_usd_cents = case slug
  when 'viral_box_500' then 5000
  when 'premium_viral_box_1000' then 10000
  else price_usd_cents
end
where slug in ('viral_box_500', 'premium_viral_box_1000');
