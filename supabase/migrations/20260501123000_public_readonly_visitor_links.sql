alter table if exists public.arenas enable row level security;
alter table if exists public.arena_bubbles enable row level security;

drop policy if exists arenas_public_read_published on public.arenas;
create policy arenas_public_read_published
on public.arenas
for select
to anon
using (is_active = true and status = 'published');

drop policy if exists arena_bubbles_public_read_published on public.arena_bubbles;
create policy arena_bubbles_public_read_published
on public.arena_bubbles
for select
to anon
using (
  exists (
    select 1 from public.arenas
    where arenas.id = arena_bubbles.arena_id
      and arenas.is_active = true
      and arenas.status = 'published'
  )
);

drop policy if exists arenas_owner_all on public.arenas;
create policy arenas_owner_all
on public.arenas
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists arena_bubbles_owner_all on public.arena_bubbles;
create policy arena_bubbles_owner_all
on public.arena_bubbles
for all
to authenticated
using (
  exists (
    select 1 from public.arenas
    where arenas.id = arena_bubbles.arena_id
      and arenas.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.arenas
    where arenas.id = arena_bubbles.arena_id
      and arenas.owner_id = auth.uid()
  )
);
