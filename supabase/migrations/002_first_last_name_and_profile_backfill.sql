-- Run this ONCE in Supabase → SQL Editor on an existing project.
-- (Fresh projects get all of this from schema.sql already.)

-- 1. First / last name columns
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

-- 2. Signup trigger now stores first/last name
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, full_name, role, organization_name)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(trim(concat_ws(' ', new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name')), '')
    ),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'resident'),
    new.raw_user_meta_data->>'organization_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. Make sure the trigger is attached (older setups may be missing it)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Backfill: create profile rows for users who never got one
insert into public.profiles (id, full_name, role)
select
  u.id,
  nullif(u.raw_user_meta_data->>'full_name', ''),
  coalesce((u.raw_user_meta_data->>'role')::user_role, 'resident')
from auth.users u
on conflict (id) do nothing;

-- 5. Split existing full names into first / last
update public.profiles
set first_name = split_part(full_name, ' ', 1),
    last_name  = nullif(trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), '')
where first_name is null
  and full_name is not null
  and full_name <> '';
