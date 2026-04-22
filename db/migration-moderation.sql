-- Reports table for flagging posts/comments
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete cascade not null,
  reported_content_id text not null,
  content_type text not null check (content_type in ('session', 'comment')),
  reason text not null,
  created_at timestamptz default now()
);

alter table public.reports enable row level security;
create policy "Users can insert their own reports"
  on public.reports for insert to authenticated
  with check (auth.uid() = reporter_id);
create policy "Users can read their own reports"
  on public.reports for select to authenticated
  using (auth.uid() = reporter_id);

-- Blocks table
create table if not exists public.blocks (
  blocker_id uuid references auth.users(id) on delete cascade not null,
  blocked_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.blocks enable row level security;
create policy "Users manage their own blocks"
  on public.blocks for all to authenticated
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);
