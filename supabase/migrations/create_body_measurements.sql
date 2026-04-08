create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  weight numeric(5,2),        -- kg
  body_fat numeric(4,2),      -- %
  chest numeric(5,2),         -- cm
  waist numeric(5,2),         -- cm
  hips numeric(5,2),          -- cm
  bicep numeric(4,2),         -- cm
  created_at timestamptz default now()
);
alter table public.body_measurements enable row level security;
create policy "Users own measurements" on public.body_measurements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.body_measurements(user_id, date desc);
