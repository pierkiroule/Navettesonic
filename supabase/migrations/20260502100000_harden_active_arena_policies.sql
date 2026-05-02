-- Harden active arena policies:
-- - anonymous visitors can read only published arenas and their bubbles
-- - writes are reserved to authenticated owners
-- - visitors (anon) cannot write

alter table if exists public.arenas enable row level security;
alter table if exists public.arena_bubbles enable row level security;

-- Remove legacy policies that could allow non-owner writes.
drop policy if exists arena_bubbles_insert_member_self_or_owner on public.arena_bubbles;
drop policy if exists arena_bubbles_update_owner_or_creator on public.arena_bubbles;
drop policy if exists arena_bubbles_delete_owner_or_creator on public.arena_bubbles;
drop policy if exists arena_bubbles_select_member_or_owner on public.arena_bubbles;

-- Public read for published arenas only.
drop policy if exists arenas_public_read_published on public.arenas;
create policy arenas_public_read_published
on public.arenas
for select
to anon
using (is_active = true and status = 'published');

-- Public read for bubbles belonging to published arenas only.
drop policy if exists arena_bubbles_public_read_published on public.arena_bubbles;
create policy arena_bubbles_public_read_published
on public.arena_bubbles
for select
to anon
using (
  exists (
    select 1
    from public.arenas
    where arenas.id = arena_bubbles.arena_id
      and arenas.is_active = true
      and arenas.status = 'published'
  )
);

-- Owner-only access for authenticated users on arenas.
drop policy if exists arenas_owner_all on public.arenas;
create policy arenas_owner_all
on public.arenas
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Owner-only access for authenticated users on arena bubbles.
drop policy if exists arena_bubbles_owner_all on public.arena_bubbles;
create policy arena_bubbles_owner_all
on public.arena_bubbles
for all
to authenticated
using (
  exists (
    select 1
    from public.arenas
    where arenas.id = arena_bubbles.arena_id
      and arenas.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.arenas
    where arenas.id = arena_bubbles.arena_id
      and arenas.owner_id = auth.uid()
  )
);
