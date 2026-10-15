param(
  [string]$BatchPattern = "^(quality_gate_v2_|test_generator_)"
)

$ErrorActionPreference = "Stop"

$sql = @"
begin;

create temp table tmp_viralbox_test_batches on commit drop as
select id
from public.idea_generation_batches
where external_batch_id ~ '$BatchPattern';

create temp table tmp_viralbox_test_ideas on commit drop as
select id
from public.idea_candidates
where generation_batch_id in (select id from tmp_viralbox_test_batches);

create temp table tmp_viralbox_test_deliveries on commit drop as
select distinct delivery_id as id
from public.idea_box_items
where idea_id in (select id from tmp_viralbox_test_ideas);

create temp table tmp_viralbox_test_purchases on commit drop as
select distinct purchase_id as id
from public.idea_box_deliveries
where id in (select id from tmp_viralbox_test_deliveries)
  and purchase_id is not null;

delete from public.idea_box_items
where delivery_id in (select id from tmp_viralbox_test_deliveries)
   or idea_id in (select id from tmp_viralbox_test_ideas);

delete from public.idea_box_deliveries
where id in (select id from tmp_viralbox_test_deliveries);

delete from public.purchases
where id in (select id from tmp_viralbox_test_purchases);

delete from public.idea_inventory
where idea_id in (select id from tmp_viralbox_test_ideas);

delete from public.idea_candidates
where id in (select id from tmp_viralbox_test_ideas);

delete from public.idea_import_errors
where batch_id in (select id from tmp_viralbox_test_batches);

delete from public.idea_generation_batches
where id in (select id from tmp_viralbox_test_batches);

commit;
"@

docker exec -i supabase_db_ViralBox psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -q -c $sql | Out-Null
