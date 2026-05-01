-- Cleanup invalid data before enforcing stricter constraints.
delete from public.soon_arena_invites where created_by is null;
delete from public.soon_arenas where owner_id is null or code is null or btrim(code) = '';

-- Align invite ownership column naming.
alter table public.soon_arena_invites
  add column if not exists created_by uuid references auth.users(id) on delete cascade;

update public.soon_arena_invites
set created_by = invited_by_user_id
where created_by is null and invited_by_user_id is not null;

alter table public.soon_arena_invites
  alter column created_by set not null;

alter table public.soon_arena_invites
  drop column if exists invited_by_user_id;

-- Enforce non-null ownership/invite code on arenas.
alter table public.soon_arenas
  alter column owner_id set default auth.uid(),
  alter column owner_id set not null,
  alter column code set not null;

-- Recreate key RLS policies with hardened checks.
drop policy if exists "soon_arenas_insert" on public.soon_arenas;
create policy "soon_arenas_insert"
  on public.soon_arenas
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and code is not null
    and btrim(code) <> ''
  );

drop policy if exists "soon_arena_invites_insert_owner_only" on public.soon_arena_invites;
create policy "soon_arena_invites_insert_owner_only"
  on public.soon_arena_invites
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
  );
