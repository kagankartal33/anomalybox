do $$
declare
  constraint_name text;
begin
  select c.conname
  into constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'dataset_training_observations'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) like '%source_kind%'
  limit 1;

  if constraint_name is not null then
    execute format(
      'alter table public.dataset_training_observations drop constraint %I',
      constraint_name
    );
  end if;
end $$;

alter table public.dataset_training_observations
  add constraint dataset_training_observations_source_kind_check
  check (
    source_kind in (
      'markdown',
      'notebook',
      'csv',
      'csv_summary',
      'json',
      'jsonl',
      'sqlite',
      'sql',
      'text',
      'docx',
      'epub',
      'unknown'
    )
  );

create index if not exists dataset_training_observations_metadata_source_slug_idx
on public.dataset_training_observations ((metadata ->> 'source_slug'));
