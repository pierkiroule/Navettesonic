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
required_policies(table_name, policy_name) as (
  values
    ('arenas', 'arenas_public_read_published'),
    ('arenas', 'arenas_owner_all'),
    ('arena_bubbles', 'arena_bubbles_public_read_published'),
    ('arena_bubbles', 'arena_bubbles_owner_all')
),
forbidden_anon_write_policies(table_name, policy_name) as (
  values
    ('arenas', 'arenas_anon_insert'),
    ('arenas', 'arenas_anon_update'),
    ('arenas', 'arenas_anon_delete'),
    ('arena_bubbles', 'arena_bubbles_anon_insert'),
    ('arena_bubbles', 'arena_bubbles_anon_update'),
    ('arena_bubbles', 'arena_bubbles_anon_delete')
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
missing_policies as (
  select rp.table_name, rp.policy_name
  from required_policies rp
  left join pg_policies p
    on p.schemaname = 'public'
   and p.tablename = rp.table_name
   and p.policyname = rp.policy_name
  where p.policyname is null
),
present_forbidden_anon_write_policies as (
  select f.table_name, f.policy_name
  from forbidden_anon_write_policies f
  join pg_policies p
    on p.schemaname = 'public'
   and p.tablename = f.table_name
   and p.policyname = f.policy_name
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
select 'policies' as check_type, coalesce(json_agg(json_build_object('table', table_name, 'policy', policy_name)), '[]'::json) as details
from missing_policies
union all
select 'forbidden_anon_write_policies' as check_type, coalesce(json_agg(json_build_object('table', table_name, 'policy', policy_name)), '[]'::json) as details
from present_forbidden_anon_write_policies
union all
select 'rpc' as check_type, json_build_array(accept_arena_invite_status) as details
from rpc_check;
