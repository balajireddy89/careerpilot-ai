-- Create HR questions table for company-specific interview simulation
create table if not exists public.hr_questions (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  question_text text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for speedy queries by company name
create index if not exists hr_questions_company_name_idx
  on public.hr_questions (company_name) where is_active = true;

-- Update trigger for updated_at
drop trigger if exists hr_questions_updated_at on public.hr_questions;
create trigger hr_questions_updated_at
  before update on public.hr_questions
  for each row execute function public.set_updated_at();

-- Enable Row Level Security (RLS)
alter table public.hr_questions enable row level security;

-- Read policy: Any authenticated user can read active questions
drop policy if exists "Anyone can read active hr questions" on public.hr_questions;
create policy "Anyone can read active hr questions"
  on public.hr_questions for select to authenticated using (is_active = true);

-- Write/Admin policy: Only admins can manage hr questions
drop policy if exists "Admins manage hr questions" on public.hr_questions;
create policy "Admins manage hr questions"
  on public.hr_questions for all to authenticated
  using (public.is_admin_user()) with check (public.is_admin_user());

-- Read policy for admin (including inactive rows)
drop policy if exists "Admins read all hr questions" on public.hr_questions;
create policy "Admins read all hr questions"
  on public.hr_questions for select to authenticated using (public.is_admin_user());
