alter table if exists public.arenas enable row level security;
alter table if exists public.arena_bubbles enable row level security;

drop policy if exists arenas_public_read_active on public.arenas;
create policy arenas_public_read_active
on public.arenas
for select
to anon
using (
  is_active = true
  and coalesce(status, 'published') in ('published', 'open', 'waiting')
);

drop policy if exists arena_bubbles_public_read_active on public.arena_bubbles;
create policy arena_bubbles_public_read_active
on public.arena_bubbles
for select
to anon
using (
  exists (
    select 1
    from public.arenas
    where arenas.id = arena_bubbles.arena_id
      and arenas.is_active = true
      and coalesce(arenas.status, 'published') in ('published', 'open', 'waiting')
  )
);

drop policy if exists arenas_host_insert on public.arenas;
create policy arenas_host_insert on public.arenas
for insert to authenticated
with check (owner_id = auth.uid());

drop policy if exists arenas_host_select on public.arenas;
create policy arenas_host_select on public.arenas
for select to authenticated
using (owner_id = auth.uid() or is_active = true);

drop policy if exists arenas_host_update on public.arenas;
create policy arenas_host_update on public.arenas
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists arenas_host_delete on public.arenas;
create policy arenas_host_delete on public.arenas
for delete to authenticated
using (owner_id = auth.uid());

drop policy if exists arena_bubbles_host_select on public.arena_bubbles;
create policy arena_bubbles_host_select on public.arena_bubbles
for select to authenticated
using (exists (select 1 from public.arenas where arenas.id = arena_bubbles.arena_id and (arenas.owner_id = auth.uid() or arenas.is_active = true)));

drop policy if exists arena_bubbles_host_insert on public.arena_bubbles;
create policy arena_bubbles_host_insert on public.arena_bubbles
for insert to authenticated
with check (exists (select 1 from public.arenas where arenas.id = arena_bubbles.arena_id and arenas.owner_id = auth.uid()));

drop policy if exists arena_bubbles_host_update on public.arena_bubbles;
create policy arena_bubbles_host_update on public.arena_bubbles
for update to authenticated
using (exists (select 1 from public.arenas where arenas.id = arena_bubbles.arena_id and arenas.owner_id = auth.uid()))
with check (exists (select 1 from public.arenas where arenas.id = arena_bubbles.arena_id and arenas.owner_id = auth.uid()));

drop policy if exists arena_bubbles_host_delete on public.arena_bubbles;
create policy arena_bubbles_host_delete on public.arena_bubbles
for delete to authenticated
using (exists (select 1 from public.arenas where arenas.id = arena_bubbles.arena_id and arenas.owner_id = auth.uid()));
