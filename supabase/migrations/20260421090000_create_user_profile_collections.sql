create table if not exists public.user_profile_collections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  owned_item_ids text[] not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.user_profile_collections enable row level security;

create policy if not exists "user_profile_collections_select_own"
on public.user_profile_collections
for select
using (auth.uid() = user_id);

create policy if not exists "user_profile_collections_insert_own"
on public.user_profile_collections
for insert
with check (auth.uid() = user_id);

create policy if not exists "user_profile_collections_update_own"
on public.user_profile_collections
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_user_profile_collections_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_user_profile_collections_updated_at on public.user_profile_collections;

create trigger trg_user_profile_collections_updated_at
before update on public.user_profile_collections
for each row
execute function public.set_user_profile_collections_updated_at();
