alter table if exists public.soon_arena_bubbles
  add column if not exists updated_by_user_id uuid references auth.users(id),
  add column if not exists version bigint not null default 0,
  add column if not exists locked_by_user_id uuid references auth.users(id),
  add column if not exists lock_expires_at timestamptz;

create or replace function public.bump_soon_arena_bubble_version()
returns trigger
language plpgsql
as $$
begin
  new.version := coalesce(old.version, 0) + 1;
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists bump_soon_arena_bubble_version_trigger on public.soon_arena_bubbles;

create trigger bump_soon_arena_bubble_version_trigger
before update on public.soon_arena_bubbles
for each row
execute function public.bump_soon_arena_bubble_version();
