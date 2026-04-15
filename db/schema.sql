-- Schéma Supabase pour Personal Gym Tracker.
-- Exécute ce script dans l'éditeur SQL de ton projet Supabase
-- (https://supabase.com/dashboard → SQL Editor → New query → Run).

-- ---------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------

create table if not exists public.sessions (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  exercices   jsonb not null,
  notes       text,
  body_weight numeric,
  updated_at  timestamptz not null default now()
);

create table if not exists public.body_weights (
  date     date not null,
  user_id  uuid not null references auth.users(id) on delete cascade,
  poids    numeric not null,
  primary key (user_id, date)
);

create index if not exists sessions_user_date_idx
  on public.sessions (user_id, date desc);

create table if not exists public.nutrition_logs (
  id         text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  food_text  text not null,
  calories   integer not null default 0,
  protein    numeric not null default 0,
  carbs      numeric not null default 0,
  fat        numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists nutrition_logs_user_date_idx
  on public.nutrition_logs (user_id, date desc);

-- ---------------------------------------------------------------
-- Row Level Security : un utilisateur ne voit que ses propres lignes.
-- ---------------------------------------------------------------

alter table public.sessions        enable row level security;
alter table public.body_weights    enable row level security;
alter table public.nutrition_logs  enable row level security;

create policy "sessions: owner read"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "sessions: owner write"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions: owner update"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sessions: owner delete"
  on public.sessions for delete
  using (auth.uid() = user_id);

create policy "body_weights: owner read"
  on public.body_weights for select
  using (auth.uid() = user_id);

create policy "body_weights: owner write"
  on public.body_weights for insert
  with check (auth.uid() = user_id);

create policy "body_weights: owner update"
  on public.body_weights for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "body_weights: owner delete"
  on public.body_weights for delete
  using (auth.uid() = user_id);

create policy "nutrition_logs: owner read"
  on public.nutrition_logs for select
  using (auth.uid() = user_id);

create policy "nutrition_logs: owner write"
  on public.nutrition_logs for insert
  with check (auth.uid() = user_id);

create policy "nutrition_logs: owner update"
  on public.nutrition_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "nutrition_logs: owner delete"
  on public.nutrition_logs for delete
  using (auth.uid() = user_id);
