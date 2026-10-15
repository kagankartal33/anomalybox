import os
import json
import subprocess
import urllib.request

# Use supabase CLI db query to test exact postgrest query equivalent
sql = """
select json_build_object(
  'deliveries', (
    select json_agg(
      json_build_object(
        'id', d.id,
        'status', d.status,
        'delivered_at', d.delivered_at,
        'created_at', d.created_at,
        'metadata', d.metadata,
        'box_products', (select json_build_object('slug', bp.slug, 'name', bp.name) from public.box_products bp where bp.id = d.box_product_id),
        'categories', (select json_build_object('slug', c.slug, 'name', c.name) from public.categories c where c.id = d.category_id),
        'creator_personas', (select json_build_object('slug', cp.slug, 'name', cp.name) from public.creator_personas cp where cp.id = d.persona_id),
        'idea_box_items', (
          select json_agg(
            json_build_object(
              'id', bi.id,
              'idea_id', bi.idea_id,
              'slot_index', bi.slot_index,
              'title', ic.title
            ) order by bi.slot_index
          ) from public.idea_box_items bi
          join public.idea_cards ic on ic.idea_id = bi.idea_id
          where bi.delivery_id = d.id
        )
      ) order by d.created_at desc
    ) from public.idea_box_deliveries d
    where d.user_id = '3756096b-1fc1-4b3c-b471-317ff41afe15'
  )
);
"""

res = subprocess.run(
    ['npx.cmd', 'supabase', 'db', 'query', '--linked', sql.strip().replace('\n', ' ')],
    capture_output=True,
    text=True,
    shell=True
)

print("STDOUT:", res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)
