-- Schéma Supabase pour Stephane IA.
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

create table if not exists public.gyms (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  brand         text,
  location_type text, -- 'city_center' | 'suburban' | 'business_district'
  created_at    timestamptz not null default now()
);

create index if not exists gyms_user_idx on public.gyms (user_id);

create table if not exists public.occupancy_feedback (
  id           uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references public.gyms(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  hour         integer not null check (hour between 0 and 23),
  day_of_week  integer not null check (day_of_week between 0 and 6),
  level        text not null check (level in ('vide', 'moyen', 'bonde')),
  created_at   timestamptz not null default now()
);

create index if not exists occupancy_feedback_gym_idx
  on public.occupancy_feedback (gym_id, hour, day_of_week);

create table if not exists public.record_overrides (
  user_id                    uuid not null references auth.users(id) on delete cascade,
  nom                        text not null,
  categorie                  text,
  max_poids                  numeric,
  max_poids_reps             integer,
  max_poids_date             date,
  best_1rm                   numeric,
  best_1rm_date              date,
  max_reps_bodyweight        integer,
  max_reps_bodyweight_date   date,
  notes                      text,
  updated_at                 timestamptz not null default now(),
  primary key (user_id, nom)
);

-- ---------------------------------------------------------------
-- Row Level Security : un utilisateur ne voit que ses propres lignes.
-- ---------------------------------------------------------------

alter table public.sessions            enable row level security;
alter table public.body_weights        enable row level security;
alter table public.nutrition_logs      enable row level security;
alter table public.record_overrides    enable row level security;
alter table public.gyms                enable row level security;
alter table public.occupancy_feedback  enable row level security;

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

create policy "record_overrides: owner read"
  on public.record_overrides for select
  using (auth.uid() = user_id);

create policy "record_overrides: owner write"
  on public.record_overrides for insert
  with check (auth.uid() = user_id);

create policy "record_overrides: owner update"
  on public.record_overrides for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "record_overrides: owner delete"
  on public.record_overrides for delete
  using (auth.uid() = user_id);

create policy "gyms: owner read"   on public.gyms for select using (auth.uid() = user_id);
create policy "gyms: owner write"  on public.gyms for insert with check (auth.uid() = user_id);
create policy "gyms: owner update" on public.gyms for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "gyms: owner delete" on public.gyms for delete using (auth.uid() = user_id);

create policy "occupancy_feedback: owner read"   on public.occupancy_feedback for select using (auth.uid() = user_id);
create policy "occupancy_feedback: owner write"  on public.occupancy_feedback for insert with check (auth.uid() = user_id);
create policy "occupancy_feedback: owner update" on public.occupancy_feedback for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "occupancy_feedback: owner delete" on public.occupancy_feedback for delete using (auth.uid() = user_id);
