-- Harden user_purchases integrity and access paths.

-- 1) Unique purchase per user + pack.
create unique index if not exists user_purchases_user_pack_uidx
  on public.user_purchases (user_id, pack_id);

-- 2) Common FK lookup indexes.
create index if not exists user_purchases_user_id_idx
  on public.user_purchases (user_id);

create index if not exists user_purchases_pack_id_idx
  on public.user_purchases (pack_id);

create index if not exists user_purchases_session_id_idx
  on public.user_purchases (session_id);

create index if not exists user_purchases_exploration_id_idx
  on public.user_purchases (exploration_id);

-- 3) Status domain constraint.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_purchases_status_check'
      and conrelid = 'public.user_purchases'::regclass
  ) then
    alter table public.user_purchases
      add constraint user_purchases_status_check
      check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled'))
      not valid;
  end if;
end$$;

-- 4) Chronology constraint.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_purchases_ended_at_after_started_at_check'
      and conrelid = 'public.user_purchases'::regclass
  ) then
    alter table public.user_purchases
      add constraint user_purchases_ended_at_after_started_at_check
      check (ended_at is null or ended_at >= started_at)
      not valid;
  end if;
end$$;
