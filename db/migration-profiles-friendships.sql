-- ================================================================
-- Migration : Profils, Amitiés, RLS, Backfill, Admin.
-- Script complet et idempotent — safe à re-exécuter.
-- À lancer dans Supabase SQL Editor en une seule passe.
-- ================================================================

-- ---------------------------------------------------------------
-- 1. Table profiles (1:1 avec auth.users)
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create unique index if not exists profiles_username_idx
  on public.profiles (lower(username));

-- ---------------------------------------------------------------
-- 2. Table friendships (demandes + amitiés)
-- ---------------------------------------------------------------
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles(id) on delete cascade,
  receiver_id  uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  unique (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

create index if not exists friendships_receiver_idx
  on public.friendships (receiver_id, status);
create index if not exists friendships_sender_idx
  on public.friendships (sender_id, status);

-- ---------------------------------------------------------------
-- 3. Trigger : auto-création profil pour les FUTURS inscrits
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'user_' || substr(md5(new.id::text), 1, 8))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- 4. RLS — Profiles
-- ---------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles: authenticated read" on public.profiles;
create policy "profiles: authenticated read"
  on public.profiles for select
  using (auth.uid() is not null);

drop policy if exists "profiles: owner update" on public.profiles;
create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles: owner insert" on public.profiles;
create policy "profiles: owner insert"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------
-- 5. RLS — Friendships
-- ---------------------------------------------------------------
alter table public.friendships enable row level security;

drop policy if exists "friendships: participant read" on public.friendships;
create policy "friendships: participant read"
  on public.friendships for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "friendships: sender insert" on public.friendships;
create policy "friendships: sender insert"
  on public.friendships for insert
  with check (auth.uid() = sender_id);

drop policy if exists "friendships: receiver update" on public.friendships;
create policy "friendships: receiver update"
  on public.friendships for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

drop policy if exists "friendships: participant delete" on public.friendships;
create policy "friendships: participant delete"
  on public.friendships for delete
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- ---------------------------------------------------------------
-- 6. RLS — Sessions : amis acceptés peuvent lire
-- ---------------------------------------------------------------
drop policy if exists "sessions: owner read" on public.sessions;
drop policy if exists "sessions: owner or friend read" on public.sessions;

create policy "sessions: owner or friend read"
  on public.sessions for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.sender_id = auth.uid() and f.receiver_id = user_id)
          or (f.receiver_id = auth.uid() and f.sender_id = user_id)
        )
    )
  );

-- body_weights : AUCUNE modification — reste owner-only.

-- ---------------------------------------------------------------
-- 7. Backfill : profil pour chaque utilisateur existant
-- ---------------------------------------------------------------
insert into public.profiles (id, username)
select
  u.id,
  'user_' || right(u.id::text, 5)
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------
-- 8. Admin : flag le créateur
-- ---------------------------------------------------------------
update public.profiles
set is_admin = true
where id = 'e6bc1982-f421-4847-8d1a-bb6d9b5e694f';

-- ---------------------------------------------------------------
-- 9. Vérification
-- ---------------------------------------------------------------
select id, username, is_admin, created_at from public.profiles order by created_at;
