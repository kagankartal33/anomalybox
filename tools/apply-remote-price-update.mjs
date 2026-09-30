const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is unavailable.");

const query = `
  update public.box_products
  set price_usd_cents = case slug
    when 'viral_box_500' then 900
    when 'premium_viral_box_1000' then 1900
    else price_usd_cents
  end,
  updated_at = now()
  where slug in ('viral_box_500', 'premium_viral_box_1000')
  returning slug, price_usd_cents;
`;

const response = await fetch(
  "https://api.supabase.com/v1/projects/psqqqhcfmfojrqsvzzzb/database/query",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
);

const body = await response.text();
if (!response.ok) throw new Error(`Supabase query failed (${response.status}): ${body}`);
console.log(body);