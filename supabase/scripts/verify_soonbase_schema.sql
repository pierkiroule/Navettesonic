-- Post-migration verification for Soonbase arena schema.
-- Usage:
--   supabase db query < supabase/scripts/verify_soonbase_schema.sql

with required_tables(name) as (
  values
    ('soon_arenas'::text),
    ('soon_arena_members'),
    ('soon_arena_bubbles'),
    ('soon_arena_invites')
),
required_columns(table_name, column_name) as (
  values
    ('soon_arenas','id'),
    ('soon_arenas','owner_id'),
    ('soon_arenas','code'),
    ('soon_arenas','is_active'),
    ('soon_arena_members','arena_id'),
    ('soon_arena_members','user_id'),
    ('soon_arena_members','role'),
    ('soon_arena_bubbles','id'),
    ('soon_arena_bubbles','arena_id'),
    ('soon_arena_bubbles','created_by'),
    ('soon_arena_bubbles','sample_id'),
    ('soon_arena_invites','id'),
    ('soon_arena_invites','arena_id'),
    ('soon_arena_invites','token'),
    ('soon_arena_invites','created_by'),
    ('soon_arena_invites','max_acceptances'),
    ('soon_arena_invites','accepted_count')
),
missing_tables as (
  select rt.name as missing_table
  from required_tables rt
  left join information_schema.tables t
    on t.table_schema = 'public' and t.table_name = rt.name
  where t.table_name is null
),
missing_columns as (
  select rc.table_name, rc.column_name
  from required_columns rc
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = rc.table_name
   and c.column_name = rc.column_name
  where c.column_name is null
),
rpc_check as (
  select case when exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'accept_arena_invite'
  ) then 'ok' else 'missing' end as accept_arena_invite_status
)
select 'tables' as check_type, coalesce(json_agg(missing_table), '[]'::json) as details
from missing_tables
union all
select 'columns' as check_type, coalesce(json_agg(json_build_object('table', table_name, 'column', column_name)), '[]'::json) as details
from missing_columns
union all
select 'rpc' as check_type, json_build_array(accept_arena_invite_status) as details
from rpc_check;
