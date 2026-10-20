-- ============================================================
-- Migration 004: Separate Admin/NGO Roles, Dead Account Cleanup,
-- & Strict Admin-Only Role Assignment Trigger
-- Hierarchy: Admin -> NGOs & Partners -> Volunteers -> Citizens
-- Run this in the Supabase SQL editor (Project > SQL Editor)
-- ============================================================

-- 1. Add 'admin' and 'ngo' to user_role enum
alter type public.user_role add value if not exists 'admin';
alter type public.user_role add value if not exists 'ngo';

-- 2. Upgrade existing 'ngo_admin' accounts to 'admin'
update public.profiles set role = 'admin' where role = 'ngo_admin';

-- 3. Strict Role Protection Trigger: ONLY platform admins can change the `role` column
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- If role column is being modified
  if new.role is distinct from old.role then
    -- Check if the modifying user is an active admin
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'ngo_admin')
    ) then
      raise exception 'Unauthorized: Only platform admins can assign or change user roles.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_protect_profile_role on public.profiles;
create trigger tr_protect_profile_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

-- 4. Default Citizen Sign-up: Every public signup starts strictly as 'resident'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- All public signups default strictly to 'resident' (Citizen)
  -- Upgrades to volunteer, ngo, or recycler must be assigned by an Admin.
  insert into public.profiles (id, first_name, last_name, full_name, role, organization_name)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(trim(concat_ws(' ', new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name')), '')
    ),
    'resident',
    new.raw_user_meta_data->>'organization_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 5. Secure Function: Allow Admin to delete dead/spam accounts
create or replace function public.delete_user_by_admin(target_user_id uuid)
returns void
language plpgsql
security definer set search_path = public, auth
as $$
begin
  -- Verify caller is platform admin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'ngo_admin')
  ) then
    raise exception 'Unauthorized: Only platform admins can delete accounts';
  end if;

  -- Prevent admin from accidentally deleting themselves
  if target_user_id = auth.uid() then
    raise exception 'Cannot delete your own admin account';
  end if;

  -- Delete from auth.users (cascades automatically to public.profiles)
  delete from auth.users where id = target_user_id;
end;
$$;

grant execute on function public.delete_user_by_admin(uuid) to authenticated;

-- 6. Update RLS policies to reflect the new hierarchy

-- Responders policy (Volunteers, Recyclers, NGOs, Admins can claim/update)
drop policy if exists "Volunteers and recyclers can claim/update status" on public.reports;
drop policy if exists "Volunteers, recyclers, and NGOs can claim/update status" on public.reports;
create policy "Volunteers, recyclers, and NGOs can claim/update status"
  on public.reports for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('volunteer', 'recycler', 'ngo', 'admin', 'ngo_admin')
    )
  );

-- Admin full report control policy
drop policy if exists "Admins can update any report" on public.reports;
create policy "Admins can update any report"
  on public.reports for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'ngo_admin')
    )
  );

drop policy if exists "Admins can delete reports" on public.reports;
create policy "Admins can delete reports"
  on public.reports for delete using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'ngo_admin')
    )
  );

-- Admin profile management policy
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'ngo_admin')
    )
  );
