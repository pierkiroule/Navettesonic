alter table public.soon_arena_invites
  add column if not exists expires_at timestamptz not null default (timezone('utc'::text, now()) + interval '7 days'),
  add column if not exists max_acceptances integer not null default 1,
  add column if not exists accepted_count integer not null default 0;

update public.soon_arena_invites
set accepted_count = case when accepted_at is null then 0 else 1 end
where accepted_count is null;

alter table public.soon_arena_invites
  alter column accepted_count set default 0,
  alter column accepted_count set not null,
  alter column max_acceptances set default 1,
  alter column max_acceptances set not null,
  alter column expires_at set default (timezone('utc'::text, now()) + interval '7 days'),
  alter column expires_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'soon_arena_invites_max_acceptances_check'
      and conrelid = 'public.soon_arena_invites'::regclass
  ) then
    alter table public.soon_arena_invites
      add constraint soon_arena_invites_max_acceptances_check
      check (max_acceptances > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'soon_arena_invites_accepted_count_check'
      and conrelid = 'public.soon_arena_invites'::regclass
  ) then
    alter table public.soon_arena_invites
      add constraint soon_arena_invites_accepted_count_check
      check (accepted_count >= 0 and accepted_count <= max_acceptances);
  end if;
end
$$;

create index if not exists soon_arena_invites_arena_id_idx
  on public.soon_arena_invites (arena_id);

create index if not exists soon_arena_invites_token_lookup_idx
  on public.soon_arena_invites (token)
  where accepted_count < max_acceptances;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'soon_arena_invites'
      and policyname = 'soon_arena_invites_insert_owner_only'
  ) then
    drop policy "soon_arena_invites_insert_owner_only" on public.soon_arena_invites;
  end if;

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
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'soon_arena_invites'
      and policyname = 'soon_arena_invites_delete_owner_only'
  ) then
    drop policy "soon_arena_invites_delete_owner_only" on public.soon_arena_invites;
  end if;

  create policy "soon_arena_invites_delete_owner_only"
    on public.soon_arena_invites
    for delete
    using (
      exists (
        select 1
        from public.soon_arena_members sam
        where sam.arena_id = soon_arena_invites.arena_id
          and sam.user_id = auth.uid()
          and sam.role = 'owner'
      )
    );
end
$$;

create or replace function public.accept_invite(p_token text)
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
    and expires_at > timezone('utc'::text, now())
    and accepted_count < max_acceptances
  for update;

  if not found then
    raise exception 'INVITE_EXPIRED_OR_QUOTA_REACHED';
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
  set accepted_at = coalesce(accepted_at, timezone('utc'::text, now())),
      accepted_by_user_id = coalesce(accepted_by_user_id, v_user_id),
      accepted_count = accepted_count + 1
  where id = v_invite.id
    and accepted_count < max_acceptances;

  if not found then
    raise exception 'INVITE_QUOTA_REACHED';
  end if;

  return v_invite.arena_id;
end;
$$;

create or replace function public.accept_arena_invite(p_token text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.accept_invite(p_token);
$$;

revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;

revoke all on function public.accept_arena_invite(text) from public;
grant execute on function public.accept_arena_invite(text) to authenticated;
