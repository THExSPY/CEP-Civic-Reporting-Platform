-- ============================================================
-- Migration 003: Proof of Cleanup, Tags, and Admin Capabilities
-- Run this in the Supabase SQL editor (Project > SQL Editor)
-- ============================================================

-- 1. Add tags and proof of cleanup fields to reports table
alter table public.reports
  add column if not exists tags text[] not null default '{}',
  add column if not exists proof_photo_url text,
  add column if not exists proof_description text,
  add column if not exists proof_submitted_at timestamptz,
  add column if not exists proof_submitted_by uuid references public.profiles(id);

create index if not exists reports_tags_idx on public.reports using gin(tags);

-- 2. Refresh the convenience view for the map to include tags and proof
drop view if exists public.report_points;
create view public.report_points as
select
  id,
  location_description,
  description,
  status,
  photo_url,
  created_at,
  ST_Y(location::geometry) as lat,
  ST_X(location::geometry) as lng,
  tags,
  proof_photo_url,
  reporter_name
from public.reports;

-- 3. RLS policies for Admin management (role = 'ngo_admin')
-- Note: drop if exists to prevent duplication on multiple runs
drop policy if exists "Admins can update any report" on public.reports;
create policy "Admins can update any report"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ngo_admin'
    )
  );

drop policy if exists "Admins can delete reports" on public.reports;
create policy "Admins can delete reports"
  on public.reports for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ngo_admin'
    )
  );

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'ngo_admin'
    )
  );

grant select on public.report_points to anon, authenticated;
