-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Passengers: people Jo drives
create table public.passengers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null,
  home_address text not null,
  home_lat     double precision,
  home_lon     double precision,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Named locations: reusable destinations (e.g. "St Vincent's Hospital")
create table public.locations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  name       text not null,
  address    text not null,
  lat        double precision,
  lon        double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- App settings: one row per user (Jo's home address)
create table public.app_settings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade unique,
  home_address text not null,
  home_lat     double precision,
  home_lon     double precision,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger passengers_updated_at
  before update on public.passengers
  for each row execute function update_updated_at();

create trigger locations_updated_at
  before update on public.locations
  for each row execute function update_updated_at();

create trigger app_settings_updated_at
  before update on public.app_settings
  for each row execute function update_updated_at();

-- Row Level Security
alter table public.passengers  enable row level security;
alter table public.locations   enable row level security;
alter table public.app_settings enable row level security;

-- RLS policies: users can only access their own rows

create policy "passengers: own rows only"
  on public.passengers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "locations: own rows only"
  on public.locations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "app_settings: own rows only"
  on public.app_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
