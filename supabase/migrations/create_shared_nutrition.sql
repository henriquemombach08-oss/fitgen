create table if not exists public.shared_nutrition (
  id uuid primary key default gen_random_uuid(),
  plan jsonb not null,
  goal text,
  diet_type text,
  body_data jsonb,
  training_time text,
  created_at timestamptz default now()
);
alter table public.shared_nutrition enable row level security;
create policy "Public read" on public.shared_nutrition for select using (true);
create policy "Public insert" on public.shared_nutrition for insert with check (true);
