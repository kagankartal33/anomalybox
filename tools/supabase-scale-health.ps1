param(
  [string]$DbContainer = "supabase_db_ViralBox"
)

$ErrorActionPreference = "Stop"

function Invoke-ScaleSql {
  param([Parameter(Mandatory = $true)][string]$Sql)
  docker exec -i $DbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -c $Sql
}

Write-Host "== ViralBox Supabase Scale Health =="
Write-Host ""

Write-Host "-- Largest public tables"
Invoke-ScaleSql @"
select
  relname as table_name,
  n_live_tup as estimated_rows,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
from pg_stat_user_tables
where schemaname = 'public'
order by pg_total_relation_size(relid) desc
limit 20;
"@

Write-Host ""
Write-Host "-- Inventory by creator mode"
Invoke-ScaleSql @"
select
  p.slug as persona_slug,
  count(inv.id) as stock_cards,
  count(distinct c.slug) as category_routes
from public.creator_personas p
left join public.idea_inventory inv
  on inv.persona_id = p.id
 and (inv.metadata ->> 'external_batch_id') like 'stock\_cards\_%' escape '\'
left join public.categories c on c.id = inv.category_id
where p.enabled
group by p.slug
order by stock_cards desc;
"@

Write-Host ""
Write-Host "-- Background job queue"
Invoke-ScaleSql @"
select
  status,
  queue_name,
  count(*) as jobs,
  min(scheduled_at) as oldest_scheduled_at
from public.internal_background_jobs
group by status, queue_name
order by status, queue_name;
"@

Write-Host ""
Write-Host "-- Missing/unused critical indexes"
Invoke-ScaleSql @"
select
  indexrelname as index_name,
  relname as table_name,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
from pg_stat_user_indexes
where schemaname = 'public'
  and indexrelname in (
    'idea_inventory_available_delivery_idx',
    'idea_inventory_stock_cards_route_idx',
    'internal_background_jobs_poll_idx',
    'idea_candidates_batch_work_idx',
    'idea_quality_checks_batch_work_idx'
  )
order by relname, indexrelname;
"@

Write-Host ""
Write-Host "-- Installed scaling extensions"
Invoke-ScaleSql @"
select extname, extnamespace::regnamespace as schema
from pg_extension
where extname in ('pg_stat_statements', 'pgmq', 'vector')
order by extname;
"@