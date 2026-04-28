create extension if not exists pgcrypto;

create table if not exists public.soon_arenas (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  invite_code text unique not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.soon_arena_members (
  arena_id uuid not null references public.soon_arenas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
  primary key (arena_id, user_id)
);

create table if not exists public.soon_arena_bubbles (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null references public.soon_arenas(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  sample_id text not null,
  x double precision not null,
  y double precision not null,
  r double precision not null,
  layer text not null,
  hue integer,
  halo_style text,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.soon_arena_members
  add column if not exists role text;

update public.soon_arena_members
set role = coalesce(role, 'viewer')
where role is null;

alter table public.soon_arena_members
  alter column role set default 'viewer',
  alter column role set not null;

alter table public.soon_arenas
  alter column owner_user_id set not null;

alter table public.soon_arena_bubbles
  alter column created_by_user_id set not null;

do $$
declare
  v_constraint text;
begin
  -- soon_arenas.owner_user_id -> auth.users(id) ON DELETE CASCADE
  select con.conname
  into v_constraint
  from pg_constraint con
  where con.conrelid = 'public.soon_arenas'::regclass
    and con.contype = 'f'
    and con.conkey = array[
      (select attnum from pg_attribute where attrelid = 'public.soon_arenas'::regclass and attname = 'owner_user_id' and not attisdropped)
    ];

  if v_constraint is not null then
    execute format('alter table public.soon_arenas drop constraint %I', v_constraint);
  end if;

  alter table public.soon_arenas
    add constraint soon_arenas_owner_user_id_fkey
    foreign key (owner_user_id)
    references auth.users(id)
    on delete cascade;
end
$$;

do $$
declare
  v_constraint text;
begin
  -- soon_arena_members.user_id -> auth.users(id) ON DELETE CASCADE
  select con.conname
  into v_constraint
  from pg_constraint con
  where con.conrelid = 'public.soon_arena_members'::regclass
    and con.contype = 'f'
    and con.conkey = array[
      (select attnum from pg_attribute where attrelid = 'public.soon_arena_members'::regclass and attname = 'user_id' and not attisdropped)
    ];

  if v_constraint is not null then
    execute format('alter table public.soon_arena_members drop constraint %I', v_constraint);
  end if;

  alter table public.soon_arena_members
    add constraint soon_arena_members_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade;
end
$$;

do $$
declare
  v_constraint text;
begin
  -- soon_arena_bubbles.created_by_user_id -> auth.users(id) ON DELETE CASCADE
  select con.conname
  into v_constraint
  from pg_constraint con
  where con.conrelid = 'public.soon_arena_bubbles'::regclass
    and con.contype = 'f'
    and con.conkey = array[
      (select attnum from pg_attribute where attrelid = 'public.soon_arena_bubbles'::regclass and attname = 'created_by_user_id' and not attisdropped)
    ];

  if v_constraint is not null then
    execute format('alter table public.soon_arena_bubbles drop constraint %I', v_constraint);
  end if;

  alter table public.soon_arena_bubbles
    add constraint soon_arena_bubbles_created_by_user_id_fkey
    foreign key (created_by_user_id)
    references auth.users(id)
    on delete cascade;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'soon_arena_members_role_check'
      and conrelid = 'public.soon_arena_members'::regclass
  ) then
    alter table public.soon_arena_members
      add constraint soon_arena_members_role_check
      check (role in ('owner', 'editor', 'viewer'));
  end if;
end
$$;
