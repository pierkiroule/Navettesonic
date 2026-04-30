-- Arena fish ownership, guest numbering and atomic join RPC.

alter table if exists public.arena_bubbles
  add column if not exists player_number smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'arena_bubbles_player_number_check'
      and conrelid = 'public.arena_bubbles'::regclass
  ) then
    alter table public.arena_bubbles
      add constraint arena_bubbles_player_number_check
      check (player_number is null or (player_number between 1 and 10));
  end if;
end $$;

create index if not exists arena_bubbles_arena_id_idx
  on public.arena_bubbles (arena_id);

create unique index if not exists arena_bubbles_arena_created_by_uidx
  on public.arena_bubbles (arena_id, created_by);

create unique index if not exists arena_bubbles_arena_player_number_uidx
  on public.arena_bubbles (arena_id, player_number)
  where player_number is not null;

alter table if exists public.arena_bubbles enable row level security;

drop policy if exists arena_bubbles_select_member_or_owner on public.arena_bubbles;
create policy arena_bubbles_select_member_or_owner
  on public.arena_bubbles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.arenas a
      where a.id = arena_bubbles.arena_id
        and (a.owner_id = auth.uid() or exists (
          select 1
          from public.arena_participants ap
          where ap.arena_id = a.id
            and ap.user_id = auth.uid()
        ))
    )
  );

drop policy if exists arena_bubbles_insert_member_self_or_owner on public.arena_bubbles;
create policy arena_bubbles_insert_member_self_or_owner
  on public.arena_bubbles
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.arenas a
      where a.id = arena_bubbles.arena_id
        and (
          a.owner_id = auth.uid()
          or (
            arena_bubbles.created_by = auth.uid()
            and exists (
              select 1
              from public.arena_participants ap
              where ap.arena_id = a.id
                and ap.user_id = auth.uid()
            )
          )
        )
    )
  );

drop policy if exists arena_bubbles_update_owner_or_creator on public.arena_bubbles;
create policy arena_bubbles_update_owner_or_creator
  on public.arena_bubbles
  for update
  to authenticated
  using (
    arena_bubbles.created_by = auth.uid()
    or exists (
      select 1 from public.arenas a
      where a.id = arena_bubbles.arena_id
        and a.owner_id = auth.uid()
    )
  )
  with check (
    arena_bubbles.created_by = auth.uid()
    or exists (
      select 1 from public.arenas a
      where a.id = arena_bubbles.arena_id
        and a.owner_id = auth.uid()
    )
  );

drop policy if exists arena_bubbles_delete_owner_or_creator on public.arena_bubbles;
create policy arena_bubbles_delete_owner_or_creator
  on public.arena_bubbles
  for delete
  to authenticated
  using (
    arena_bubbles.created_by = auth.uid()
    or exists (
      select 1 from public.arenas a
      where a.id = arena_bubbles.arena_id
        and a.owner_id = auth.uid()
    )
  );

create or replace function public.join_arena_and_claim_fish(invite_code text)
returns table(arena_id uuid, bubble_id uuid, player_number smallint, label text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_arena_id uuid;
  v_owner_id uuid;
  v_norm_code text;
  v_player_number smallint;
  v_bubble_id uuid;
  v_label text;
  v_try int := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_norm_code := upper(trim(invite_code));

  select a.id, a.owner_id
    into v_arena_id, v_owner_id
  from public.arenas a
  where upper(trim(a.invite_code)) = v_norm_code
  limit 1;

  if v_arena_id is null then
    raise exception 'Arena not found for invite code';
  end if;

  insert into public.arena_participants(arena_id, user_id, role)
  values (v_arena_id, v_user_id, 'guest')
  on conflict (arena_id, user_id)
  do nothing;

  select b.id, b.player_number, b.label
    into v_bubble_id, v_player_number, v_label
  from public.arena_bubbles b
  where b.arena_id = v_arena_id
    and b.created_by = v_user_id
  limit 1;

  if v_bubble_id is not null then
    return query select v_arena_id, v_bubble_id, v_player_number, v_label;
    return;
  end if;

  if v_user_id = v_owner_id then
    insert into public.arena_bubbles (
      arena_id, created_by, label, player_number, x, y, radius, hue, layer, halo_style
    )
    values (
      v_arena_id, v_user_id, 'Host', null, 0.5, 0.5, 56, 195, 'front', 'aura-soft'
    )
    on conflict (arena_id, created_by)
    do update set updated_at = now()
    returning id, player_number, label into v_bubble_id, v_player_number, v_label;

    return query select v_arena_id, v_bubble_id, v_player_number, v_label;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext('arena_fish_claim:' || v_arena_id::text));

  <<retry_insert>>
  loop
    v_try := v_try + 1;

    select gs.n
      into v_player_number
    from generate_series(1, 10) as gs(n)
    where not exists (
      select 1
      from public.arena_bubbles b
      where b.arena_id = v_arena_id
        and b.player_number = gs.n
    )
    order by gs.n
    limit 1;

    if v_player_number is null then
      raise exception 'Arena is full (10 invited players)';
    end if;

    begin
      v_label := format('Joueur %s', v_player_number);
      insert into public.arena_bubbles (
        arena_id, created_by, label, player_number, x, y, radius, hue, layer, halo_style
      )
      values (
        v_arena_id, v_user_id, v_label, v_player_number, 0.5, 0.5, 56, 205, 'front', 'aura-soft'
      )
      returning id into v_bubble_id;

      return query select v_arena_id, v_bubble_id, v_player_number, v_label;
      return;
    exception
      when unique_violation then
        if v_try >= 3 then
          raise;
        end if;
    end;
  end loop;
end;
$$;

revoke all on function public.join_arena_and_claim_fish(text) from public;
grant execute on function public.join_arena_and_claim_fish(text) to authenticated;
