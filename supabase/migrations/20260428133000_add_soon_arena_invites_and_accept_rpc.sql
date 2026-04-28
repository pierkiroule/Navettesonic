create extension if not exists pgcrypto;

create table if not exists public.soon_arena_members (
  arena_id uuid not null references public.soon_arenas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
  primary key (arena_id, user_id)
);

alter table public.soon_arena_members
  add column if not exists role text;

update public.soon_arena_members
set role = coalesce(role, 'viewer')
where role is null;

alter table public.soon_arena_members
  alter column role set default 'viewer',
  alter column role set not null;

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

create table if not exists public.soon_arena_invites (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid not null references public.soon_arenas(id) on delete cascade,
  token text not null unique,
  invited_by_user_id uuid not null references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.soon_arena_invites enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'soon_arena_invites'
      and policyname = 'soon_arena_invites_insert_owner_only'
  ) then
    create policy "soon_arena_invites_insert_owner_only"
      on public.soon_arena_invites
      for insert
      with check (
        auth.uid() = invited_by_user_id
        and exists (
          select 1
          from public.soon_arena_members sam
          where sam.arena_id = soon_arena_invites.arena_id
            and sam.user_id = auth.uid()
            and sam.role = 'owner'
        )
      );
  end if;
end
$$;

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
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_invite
  from public.soon_arena_invites
  where token = p_token
    and accepted_at is null
  for update;

  if not found then
    raise exception 'INVITE_NOT_FOUND_OR_ALREADY_ACCEPTED';
  end if;

  insert into public.soon_arena_members (arena_id, user_id, role)
  values (v_invite.arena_id, v_user_id, 'editor')
  on conflict (arena_id, user_id)
  do update
    set role = case
      when public.soon_arena_members.role = 'owner' then 'owner'
      else 'editor'
    end;

  update public.soon_arena_invites
  set accepted_at = timezone('utc'::text, now()),
      accepted_by_user_id = v_user_id
  where id = v_invite.id
    and accepted_at is null;

  return v_invite.arena_id;
end;
$$;

revoke all on function public.accept_arena_invite(text) from public;
grant execute on function public.accept_arena_invite(text) to authenticated;
