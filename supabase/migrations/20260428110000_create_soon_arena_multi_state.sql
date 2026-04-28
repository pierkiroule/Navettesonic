create extension if not exists pgcrypto;

create table if not exists public.soon_arenas (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id),
  title text,
  invite_code text unique not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.soon_arena_members (
  arena_id uuid not null references public.soon_arenas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  primary key (arena_id, user_id)
);

create table if not exists public.soon_arena_bubbles (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null references public.soon_arenas(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id),
  sample_id text not null,
  x double precision not null,
  y double precision not null,
  r double precision not null,
  layer text not null,
  hue integer,
  halo_style text,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.soon_arena_bubbles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'soon_arena_bubbles'
      and policyname = 'soon_arena_bubbles_select_member'
  ) then
    create policy "soon_arena_bubbles_select_member"
      on public.soon_arena_bubbles
      for select
      using (
        exists (
          select 1
          from public.soon_arena_members sam
          where sam.arena_id = soon_arena_bubbles.arena_id
            and sam.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'soon_arena_bubbles'
      and policyname = 'soon_arena_bubbles_insert_owner_editor'
  ) then
    create policy "soon_arena_bubbles_insert_owner_editor"
      on public.soon_arena_bubbles
      for insert
      with check (
        exists (
          select 1
          from public.soon_arena_members sam
          where sam.arena_id = soon_arena_bubbles.arena_id
            and sam.user_id = auth.uid()
            and sam.role in ('owner', 'editor')
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'soon_arena_bubbles'
      and policyname = 'soon_arena_bubbles_update_owner_editor'
  ) then
    create policy "soon_arena_bubbles_update_owner_editor"
      on public.soon_arena_bubbles
      for update
      using (
        exists (
          select 1
          from public.soon_arena_members sam
          where sam.arena_id = soon_arena_bubbles.arena_id
            and sam.user_id = auth.uid()
            and sam.role in ('owner', 'editor')
        )
      )
      with check (
        exists (
          select 1
          from public.soon_arena_members sam
          where sam.arena_id = soon_arena_bubbles.arena_id
            and sam.user_id = auth.uid()
            and sam.role in ('owner', 'editor')
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'soon_arena_bubbles'
      and policyname = 'soon_arena_bubbles_delete_owner_editor'
  ) then
    create policy "soon_arena_bubbles_delete_owner_editor"
      on public.soon_arena_bubbles
      for delete
      using (
        exists (
          select 1
          from public.soon_arena_members sam
          where sam.arena_id = soon_arena_bubbles.arena_id
            and sam.user_id = auth.uid()
            and sam.role in ('owner', 'editor')
        )
      );
  end if;
end
$$;
