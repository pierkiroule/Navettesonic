-- Harden multi-user integrity across explorations/sessions/purchases.
-- Safe to run repeatedly (idempotent guards).

-- 1) Ensure exploration join codes are unique when the table/column exist.
do $$
begin
  if to_regclass('public.explorations') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'explorations'
         and column_name = 'code'
     ) then
    create unique index if not exists explorations_code_uidx
      on public.explorations (code)
      where code is not null;
  end if;
end
$$;

-- 2) Optionally support "1 session -> 1 exploration" directly on immersoon_sessions.
do $$
begin
  if to_regclass('public.immersoon_sessions') is not null then
    alter table public.immersoon_sessions
      add column if not exists exploration_id uuid;

    if to_regclass('public.explorations') is not null then
      if not exists (
        select 1
        from pg_constraint
        where conname = 'immersoon_sessions_exploration_id_fkey'
          and conrelid = 'public.immersoon_sessions'::regclass
      ) then
        alter table public.immersoon_sessions
          add constraint immersoon_sessions_exploration_id_fkey
          foreign key (exploration_id)
          references public.explorations(id)
          on delete set null;
      end if;

      create index if not exists immersoon_sessions_exploration_id_idx
        on public.immersoon_sessions (exploration_id);
    end if;
  end if;
end
$$;

-- 3) Enforce anti-duplication for purchases.
create unique index if not exists user_purchases_user_pack_uidx
  on public.user_purchases (user_id, pack_id);

-- 4) Core FK indexes for multi-user performance.
do $$
begin
  if to_regclass('public.explorations') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'explorations' and column_name = 'pack_id'
     ) then
    create index if not exists explorations_pack_id_idx
      on public.explorations (pack_id);
  end if;

  if to_regclass('public.immersoon_sessions') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'immersoon_sessions' and column_name = 'user_id'
     ) then
    create index if not exists immersoon_sessions_user_id_idx
      on public.immersoon_sessions (user_id);
  end if;

  if to_regclass('public.session_explorations') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'session_explorations' and column_name = 'session_id'
    ) then
      create index if not exists session_explorations_session_id_idx
        on public.session_explorations (session_id);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'session_explorations' and column_name = 'exploration_id'
    ) then
      create index if not exists session_explorations_exploration_id_idx
        on public.session_explorations (exploration_id);
    end if;
  end if;

  if to_regclass('public.user_purchases') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'user_purchases' and column_name = 'user_id'
     ) then
    create index if not exists user_purchases_user_id_idx
      on public.user_purchases (user_id);
  end if;
end
$$;

-- 5) Add optimistic-lock helper column on session_explorations.
do $$
begin
  if to_regclass('public.session_explorations') is not null then
    alter table public.session_explorations
      add column if not exists updated_at timestamptz not null default timezone('utc'::text, now());
  end if;
end
$$;

create or replace function public.set_session_explorations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.session_explorations') is not null then
    drop trigger if exists trg_session_explorations_updated_at on public.session_explorations;

    create trigger trg_session_explorations_updated_at
    before update on public.session_explorations
    for each row
    execute function public.set_session_explorations_updated_at();
  end if;
end
$$;
