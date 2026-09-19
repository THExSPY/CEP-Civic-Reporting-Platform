-- ============================================================
-- Civic Reporting Platform — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor)
-- ============================================================

create extension if not exists postgis;

-- ---------- PROFILES ----------
-- One row per authenticated user. role decides what they can do.
create type user_role as enum ('resident', 'volunteer', 'recycler', 'ngo_admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'resident',
  organization_name text,          -- filled in for 'recycler' / 'ngo_admin' signups
  phone text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ---------- REPORTS ----------
create type report_status as enum ('open', 'claimed', 'collected', 'resolved');

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  reporter_name text,                       -- fallback for anonymous-style reports
  location_description text not null,
  location geography(Point, 4326) not null, -- lat/lng captured from the browser
  description text not null,
  photo_url text,
  status report_status not null default 'open',
  claimed_by uuid references profiles(id),  -- recycler/volunteer who picked it up
  claimed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_location_idx on reports using gist (location);
create index reports_status_idx on reports (status);

alter table reports enable row level security;

create policy "Reports are viewable by everyone"
  on reports for select using (true);

create policy "Authenticated users can create reports"
  on reports for insert with check (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy "Reporters can update their own open reports"
  on reports for update using (auth.uid() = reporter_id);

create policy "Volunteers and recyclers can claim/update status"
  on reports for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('volunteer', 'recycler', 'ngo_admin')
    )
  );

-- ---------- AUTO-CREATE PROFILE ON SIGNUP ----------
-- Client-side inserts into `profiles` right after signUp() fail whenever
-- email confirmation is on, because there's no session yet (auth.uid() is
-- null, so the RLS check above blocks it). A trigger on auth.users runs
-- with elevated privileges and sidesteps that entirely — the standard
-- Supabase pattern. Role/name/org come through from signUp()'s `options.data`.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, organization_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'resident'),
    new.raw_user_meta_data->>'organization_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- RECYCLING PARTNERS ----------
-- Extra detail for organizations, shown on the partners map layer.
create table recycling_partners (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  org_name text not null,
  materials_accepted text[],      -- e.g. {'plastic','e-waste','paper'}
  service_area text,              -- free text, e.g. "Kothrud, Karve Nagar"
  location geography(Point, 4326),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table recycling_partners enable row level security;

create policy "Partners are viewable by everyone"
  on recycling_partners for select using (true);

create policy "Users can register their own org"
  on recycling_partners for insert with check (auth.uid() = profile_id);

create policy "Users can update their own org"
  on recycling_partners for update using (auth.uid() = profile_id);

-- ---------- STORAGE ----------
-- Create a public bucket called "report-photos" from the Supabase dashboard
-- (Storage > New bucket > public), or via SQL:
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

create policy "Anyone can view report photos"
  on storage.objects for select using (bucket_id = 'report-photos');

create policy "Authenticated users can upload report photos"
  on storage.objects for insert with check (
    bucket_id = 'report-photos' and auth.role() in ('authenticated', 'anon')
  );

-- ---------- CONVENIENCE VIEW for the map ----------
create view report_points as
select
  id,
  location_description,
  description,
  status,
  photo_url,
  created_at,
  ST_Y(location::geometry) as lat,
  ST_X(location::geometry) as lng
from reports;
