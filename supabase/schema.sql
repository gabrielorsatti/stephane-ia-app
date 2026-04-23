-- Stephane IA — schéma Supabase
-- À exécuter une fois dans le SQL Editor d'un nouveau projet Supabase.
-- Idempotent : peut être rejoué sans casser.

-- ─── sessions ────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  exercices    jsonb not null default '[]'::jsonb,
  notes        text,
  body_weight  numeric,
  updated_at   timestamptz not null default now()
);
create index if not exists sessions_user_date_idx
  on public.sessions (user_id, date desc);

-- ─── body_weights ────────────────────────────────────────────────────
create table if not exists public.body_weights (
  user_id  uuid not null references auth.users(id) on delete cascade,
  date     date not null,
  poids    numeric not null,
  primary key (user_id, date)
);

-- ─── pr_overrides ────────────────────────────────────────────────────
create table if not exists public.pr_overrides (
  user_id         uuid not null references auth.users(id) on delete cascade,
  nom             text not null,
  categorie       text,
  max_poids       numeric,
  max_poids_reps  integer,
  max_poids_date  date,
  best_1rm        numeric,
  best_1rm_date   date,
  notes           text,
  primary key (user_id, nom)
);

-- ─── programs ────────────────────────────────────────────────────────
create table if not exists public.programs (
  user_id     uuid not null references auth.users(id) on delete cascade,
  id          text not null,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

-- ─── Row-Level Security ──────────────────────────────────────────────
alter table public.sessions      enable row level security;
alter table public.body_weights  enable row level security;
alter table public.pr_overrides  enable row level security;
alter table public.programs      enable row level security;

-- Politique générique "own rows only" sur chaque table.
do $$
declare t text;
begin
  for t in select unnest(array['sessions','body_weights','pr_overrides','programs'])
  loop
    execute format('drop policy if exists own_rows_select on public.%I', t);
    execute format('drop policy if exists own_rows_cud on public.%I', t);
    execute format(
      'create policy own_rows_select on public.%I for select using (auth.uid() = user_id)',
      t
    );
    execute format(
      'create policy own_rows_cud on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end$$;
