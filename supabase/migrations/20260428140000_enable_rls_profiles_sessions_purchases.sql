-- Enable RLS and owner-based policies for user-scoped tables.

alter table if exists public.profiles enable row level security;
alter table if exists public.immersoon_sessions enable row level security;
alter table if exists public.session_explorations enable row level security;
alter table if exists public.user_purchases enable row level security;

-- profiles: ownership is profile.id = auth.uid()
do $$
begin
  if to_regclass('public.profiles') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_own'
    ) then
      create policy "profiles_select_own"
        on public.profiles
        for select
        using (id = auth.uid());
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_insert_own'
    ) then
      create policy "profiles_insert_own"
        on public.profiles
        for insert
        with check (id = auth.uid());
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own'
    ) then
      create policy "profiles_update_own"
        on public.profiles
        for update
        using (id = auth.uid())
        with check (id = auth.uid());
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_delete_own'
    ) then
      create policy "profiles_delete_own"
        on public.profiles
        for delete
        using (id = auth.uid());
    end if;
  end if;
end
$$;

-- immersoon_sessions: ownership is immersoon_sessions.user_id = auth.uid()
do $$
begin
  if to_regclass('public.immersoon_sessions') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'immersoon_sessions' and policyname = 'immersoon_sessions_select_own'
    ) then
      create policy "immersoon_sessions_select_own"
        on public.immersoon_sessions
        for select
        using (user_id = auth.uid());
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'immersoon_sessions' and policyname = 'immersoon_sessions_insert_own'
    ) then
      create policy "immersoon_sessions_insert_own"
        on public.immersoon_sessions
        for insert
        with check (user_id = auth.uid());
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'immersoon_sessions' and policyname = 'immersoon_sessions_update_own'
    ) then
      create policy "immersoon_sessions_update_own"
        on public.immersoon_sessions
        for update
        using (user_id = auth.uid())
        with check (user_id = auth.uid());
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'immersoon_sessions' and policyname = 'immersoon_sessions_delete_own'
    ) then
      create policy "immersoon_sessions_delete_own"
        on public.immersoon_sessions
        for delete
        using (user_id = auth.uid());
    end if;
  end if;
end
$$;

-- user_purchases: ownership is user_purchases.user_id = auth.uid()
do $$
begin
  if to_regclass('public.user_purchases') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'user_purchases' and policyname = 'user_purchases_select_own'
    ) then
      create policy "user_purchases_select_own"
        on public.user_purchases
        for select
        using (user_id = auth.uid());
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'user_purchases' and policyname = 'user_purchases_insert_own'
    ) then
      create policy "user_purchases_insert_own"
        on public.user_purchases
        for insert
        with check (user_id = auth.uid());
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'user_purchases' and policyname = 'user_purchases_update_own'
    ) then
      create policy "user_purchases_update_own"
        on public.user_purchases
        for update
        using (user_id = auth.uid())
        with check (user_id = auth.uid());
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'user_purchases' and policyname = 'user_purchases_delete_own'
    ) then
      create policy "user_purchases_delete_own"
        on public.user_purchases
        for delete
        using (user_id = auth.uid());
    end if;
  end if;
end
$$;

-- session_explorations: ownership inherited from linked session via session_id.
do $$
begin
  if to_regclass('public.session_explorations') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'session_explorations' and policyname = 'session_explorations_select_own'
    ) then
      create policy "session_explorations_select_own"
        on public.session_explorations
        for select
        using (
          exists (
            select 1
            from public.immersoon_sessions s
            where s.id = session_explorations.session_id
              and s.user_id = auth.uid()
          )
        );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'session_explorations' and policyname = 'session_explorations_insert_own'
    ) then
      create policy "session_explorations_insert_own"
        on public.session_explorations
        for insert
        with check (
          exists (
            select 1
            from public.immersoon_sessions s
            where s.id = session_explorations.session_id
              and s.user_id = auth.uid()
          )
        );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'session_explorations' and policyname = 'session_explorations_update_own'
    ) then
      create policy "session_explorations_update_own"
        on public.session_explorations
        for update
        using (
          exists (
            select 1
            from public.immersoon_sessions s
            where s.id = session_explorations.session_id
              and s.user_id = auth.uid()
          )
        )
        with check (
          exists (
            select 1
            from public.immersoon_sessions s
            where s.id = session_explorations.session_id
              and s.user_id = auth.uid()
          )
        );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'session_explorations' and policyname = 'session_explorations_delete_own'
    ) then
      create policy "session_explorations_delete_own"
        on public.session_explorations
        for delete
        using (
          exists (
            select 1
            from public.immersoon_sessions s
            where s.id = session_explorations.session_id
              and s.user_id = auth.uid()
          )
        );
    end if;
  end if;
end
$$;
