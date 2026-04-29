-- Repair/normalize Soonbase arena schema so it stays compatible with the web app.

-- 1) Core arena table.
create table if not exists public.soon_arenas (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  invite_code text unique,
  is_active boolean not null default true,
  status text,
  is_closed boolean not null default false,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.soon_arenas
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists invite_code text,
  add column if not exists is_active boolean not null default true,
  add column if not exists status text,
  add column if not exists is_closed boolean not null default false,
  add column if not exists closed_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists soon_arenas_invite_code_key on public.soon_arenas(invite_code);

-- 2) Members table.
create table if not exists public.soon_arena_members (
  arena_id uuid not null references public.soon_arenas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (arena_id, user_id)
);

alter table public.soon_arena_members
  add column if not exists role text not null default 'editor',
  add column if not exists created_at timestamptz not null default now();

-- 3) Bubbles table used by realtime sync.
create table if not exists public.soon_arena_bubbles (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null references public.soon_arenas(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  sample_id text not null,
  layer text,
  x double precision,
  y double precision,
  r double precision,
  hue integer,
  halo_style text,
  version bigint not null default 1,
  locked_by_user_id uuid references auth.users(id) on delete set null,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.soon_arena_bubbles
  add column if not exists created_by_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists sample_id text,
  add column if not exists layer text,
  add column if not exists x double precision,
  add column if not exists y double precision,
  add column if not exists r double precision,
  add column if not exists hue integer,
  add column if not exists halo_style text,
  add column if not exists version bigint not null default 1,
  add column if not exists locked_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists locked_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.soon_arena_bubbles
set sample_id = coalesce(sample_id, 'unknown-sample')
where sample_id is null;

alter table public.soon_arena_bubbles
  alter column sample_id set not null;

-- 4) Invites table used by invite-code flow and RPC.
create table if not exists public.soon_arena_invites (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null references public.soon_arenas(id) on delete cascade,
  token text not null,
  invited_by_user_id uuid not null references auth.users(id) on delete cascade,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  max_acceptances integer not null default 1,
  accepted_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique(token)
);

alter table public.soon_arena_invites
  add column if not exists invited_by_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists accepted_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists expires_at timestamptz,
  add column if not exists max_acceptances integer not null default 1,
  add column if not exists accepted_count integer not null default 0,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists soon_arena_invites_token_key on public.soon_arena_invites(token);
create index if not exists soon_arena_invites_arena_id_idx on public.soon_arena_invites(arena_id);

-- 5) Required checks + RPC expected by the app.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'soon_arena_members_role_check'
      and conrelid = 'public.soon_arena_members'::regclass
  ) then
    alter table public.soon_arena_members
      add constraint soon_arena_members_role_check check (role in ('owner', 'editor', 'viewer'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'soon_arena_invites_max_acceptances_check'
      and conrelid = 'public.soon_arena_invites'::regclass
  ) then
    alter table public.soon_arena_invites
      add constraint soon_arena_invites_max_acceptances_check check (max_acceptances >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'soon_arena_invites_accepted_count_check'
      and conrelid = 'public.soon_arena_invites'::regclass
  ) then
    alter table public.soon_arena_invites
      add constraint soon_arena_invites_accepted_count_check check (accepted_count >= 0);
  end if;
end $$;

create or replace function public.accept_arena_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_invite public.soon_arena_invites%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select *
  into v_invite
  from public.soon_arena_invites
  where token = p_token
  limit 1;

  if v_invite.id is null then
    raise exception 'invalid invite token';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    raise exception 'invite expired';
  end if;

  if coalesce(v_invite.accepted_count, 0) >= coalesce(v_invite.max_acceptances, 1) then
    raise exception 'invite quota reached';
  end if;

  insert into public.soon_arena_members (arena_id, user_id, role)
  values (v_invite.arena_id, v_user_id, 'editor')
  on conflict (arena_id, user_id)
  do update set role = case when public.soon_arena_members.role = 'owner' then 'owner' else 'editor' end;

  update public.soon_arena_invites
  set accepted_count = coalesce(accepted_count, 0) + 1,
      accepted_by_user_id = coalesce(accepted_by_user_id, v_user_id)
  where id = v_invite.id;

  return v_invite.arena_id;
end;
$$;

revoke all on function public.accept_arena_invite(text) from public;
grant execute on function public.accept_arena_invite(text) to authenticated;
