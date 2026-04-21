create table if not exists public.echohypnose_session_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experience_id text not null,
  experience_title text not null,
  purchased_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_echohypnose_session_history_user_date
  on public.echohypnose_session_history (user_id, purchased_at desc);

create unique index if not exists idx_echohypnose_session_history_dedupe
  on public.echohypnose_session_history (user_id, experience_id, purchased_at);

alter table public.echohypnose_session_history enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'echohypnose_session_history'
      and policyname = 'echohypnose_session_history_select_own'
  ) then
    create policy "echohypnose_session_history_select_own"
      on public.echohypnose_session_history
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'echohypnose_session_history'
      and policyname = 'echohypnose_session_history_insert_own'
  ) then
    create policy "echohypnose_session_history_insert_own"
      on public.echohypnose_session_history
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;
