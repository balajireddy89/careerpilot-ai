-- Run this in Supabase SQL Editor AFTER schema.sql
-- Enables admin panel to read all student profiles

alter table public.student_profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.student_profiles where user_id = auth.uid()),
    false
  );
$$;

drop policy if exists "Admins can view all profiles" on public.student_profiles;
create policy "Admins can view all profiles"
  on public.student_profiles
  for select
  using (public.is_admin_user());

-- Bootstrap primary admin (must have signed up once):
update public.student_profiles
set is_admin = true
where lower(email) = lower('reddy.kuppila2006@gmail.com');
