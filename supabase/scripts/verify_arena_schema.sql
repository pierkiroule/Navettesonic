with required_tables as (
  select unnest(array['arenas','arena_participants','arena_bubbles']) as table_name
),
required_columns as (
  select * from (values
    ('arenas','id'),('arenas','owner_id'),('arenas','invite_code'),('arenas','title'),('arenas','is_active'),('arenas','status'),('arenas','created_at'),('arenas','updated_at'),
    ('arena_participants','arena_id'),('arena_participants','user_id'),('arena_participants','role'),('arena_participants','joined_at'),('arena_participants','last_seen_at'),
    ('arena_bubbles','id'),('arena_bubbles','arena_id'),('arena_bubbles','created_by'),('arena_bubbles','sample_id'),('arena_bubbles','label'),('arena_bubbles','x'),('arena_bubbles','y'),('arena_bubbles','radius'),('arena_bubbles','hue'),('arena_bubbles','layer'),('arena_bubbles','halo_style'),('arena_bubbles','version'),('arena_bubbles','created_at'),('arena_bubbles','updated_at')
  ) as t(table_name,column_name)
),
missing_tables as (
  select rt.table_name from required_tables rt
  left join information_schema.tables t on t.table_schema='public' and t.table_name=rt.table_name
  where t.table_name is null
),
missing_columns as (
  select rc.table_name, rc.column_name from required_columns rc
  left join information_schema.columns c on c.table_schema='public' and c.table_name=rc.table_name and c.column_name=rc.column_name
  where c.column_name is null
)
select json_build_object(
  'missing_tables', coalesce((select json_agg(table_name) from missing_tables), '[]'::json),
  'missing_columns', coalesce((select json_agg(json_build_object('table',table_name,'column',column_name)) from missing_columns), '[]'::json)
) as schema_check;
