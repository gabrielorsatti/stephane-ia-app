-- Migration : Profils utilisateurs, amitiés et admin.
-- À exécuter dans Supabase SQL Editor APRÈS le schema.sql de base.

-- ---------------------------------------------------------------
-- 1. Table profiles (liée 1:1 à auth.users)
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
-- 2. Table friendships (relations bidirectionnelles)
-- ---------------------------------------------------------------

create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles(id) on delete cascade,
  receiver_id  uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  -- Empêche les doublons directionnels.
  unique (sender_id, receiver_id),
  -- Empêche de s'ajouter soi-même.
  check (sender_id <> receiver_id)
);

create index if not exists friendships_receiver_idx
  on public.friendships (receiver_id, status);

create index if not exists friendships_sender_idx
  on public.friendships (sender_id, status);

-- ---------------------------------------------------------------
-- 3. Trigger : auto-création du profil à l'inscription
-- ---------------------------------------------------------------
-- Génère un username par défaut "user_XXXXX" que l'utilisateur
-- pourra personnaliser immédiatement après.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    'user_' || substr(md5(new.id::text), 1, 8)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- 4. RLS — Profils
-- ---------------------------------------------------------------

alter table public.profiles enable row level security;

-- Tout utilisateur authentifié peut lire n'importe quel profil
-- (username + stats publiques). Jamais d'email exposé.
create policy "profiles: authenticated read"
  on public.profiles for select
  using (auth.uid() is not null);

-- Un utilisateur ne peut modifier que son propre profil.
create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- L'insert est géré par le trigger (security definer), pas par le client.
-- On autorise quand même l'insert owner-only comme filet de sécurité.
create policy "profiles: owner insert"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Pas de delete : un profil disparaît uniquement via CASCADE de auth.users.

-- ---------------------------------------------------------------
-- 5. RLS — Friendships
-- ---------------------------------------------------------------

alter table public.friendships enable row level security;

-- Lecture : un utilisateur voit les amitiés où il est sender OU receiver.
create policy "friendships: participant read"
  on public.friendships for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Insertion : seul le sender peut créer une demande.
create policy "friendships: sender insert"
  on public.friendships for insert
  with check (auth.uid() = sender_id);

-- Update (accepter/refuser) : seul le receiver peut modifier le status.
create policy "friendships: receiver update"
  on public.friendships for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Delete (retirer un ami / annuler une demande) : les deux parties peuvent.
create policy "friendships: participant delete"
  on public.friendships for delete
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- ---------------------------------------------------------------
-- 6. Vue stats publiques (sessions) — PAS de body_weights
-- ---------------------------------------------------------------
-- On ne crée pas de vue SQL mais on s'appuie sur une RLS élargie
-- pour que les amis puissent lire les sessions d'un autre user.
-- Par défaut les sessions restent owner-only. On ajoute une policy
-- "amis acceptés peuvent lire" :

-- On remplace la policy "owner read" existante par une version étendue
-- qui autorise aussi la lecture par les amis acceptés.
drop policy if exists "sessions: owner read" on public.sessions;

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

-- body_weights reste strictement privé (RLS existante : auth.uid() = user_id).
-- Aucune policy supplémentaire ici.
