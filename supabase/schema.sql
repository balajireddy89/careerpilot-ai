-- CareerPilot AI — run this entire file in Supabase SQL Editor
-- Dashboard → SQL → New query → paste → Run

-- ---------------------------------------------------------------------------
-- Student profiles (one row per authenticated user)
-- ---------------------------------------------------------------------------
create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,

  onboarded boolean not null default false,

  name text default '',
  email text default '',
  phone text default '',
  college text default '',
  degree text default '',
  branch text default '',
  current_year text default '3rd',
  graduation_year int default 2027,
  cgpa text default '',
  target_role text default 'Full Stack Developer',

  aims jsonb not null default '[]'::jsonb,
  preferred_paths jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  skills_proficiency jsonb not null default '{}'::jsonb,

  resume_details jsonb not null default '{
    "fileName": "",
    "uploadedAt": "",
    "score": 0,
    "atsScore": 0,
    "formattingScore": 0,
    "keywordsScore": 0,
    "detectedKeywords": [],
    "missingKeywords": [],
    "suggestions": []
  }'::jsonb,

  projects jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,

  coding_rating jsonb not null default '{"dsa": 1, "algorithms": 1, "problemSolving": 1}'::jsonb,
  coding_stats jsonb not null default '{
    "solvedEasy": 0,
    "solvedMedium": 0,
    "solvedHard": 0,
    "totalEasy": 30,
    "totalMedium": 40,
    "totalHard": 20,
    "accuracy": 0,
    "score": 0
  }'::jsonb,

  aptitude_stats jsonb not null default '{
    "quantitative": 0,
    "logical": 0,
    "verbal": 0,
    "testsTaken": 0,
    "score": 0
  }'::jsonb,

  hr_rating jsonb not null default '{
    "confidence": 1,
    "publicSpeaking": 1,
    "communication": 1,
    "englishProficiency": 1
  }'::jsonb,

  interview_stats jsonb not null default '{
    "hrScore": 0,
    "techScore": 0,
    "communication": 0,
    "confidence": 0,
    "sessionsCount": 0
  }'::jsonb,

  preferred_companies jsonb not null default '[]'::jsonb,
  work_type text default 'Hybrid',
  interests jsonb not null default '[]'::jsonb,
  weekly_hours text default '10-20',

  personality_results jsonb not null default '{
    "enjoyCoding": false,
    "enjoyData": false,
    "preferDesign": false,
    "likeMath": false,
    "enjoyTeamwork": false
  }'::jsonb,

  points int not null default 100,
  daily_streak int not null default 1,
  badges jsonb not null default '[]'::jsonb,
  profile_completion int not null default 0,
  is_admin boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_profiles_user_id_idx on public.student_profiles (user_id);

-- ---------------------------------------------------------------------------
-- Auto-create profile row when a user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.student_profiles (user_id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, 'student@local'), '@', 1)
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_profiles_updated_at on public.student_profiles;

create trigger student_profiles_updated_at
  before update on public.student_profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.student_profiles enable row level security;

drop policy if exists "Users can view own profile" on public.student_profiles;
create policy "Users can view own profile"
  on public.student_profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.student_profiles;
create policy "Users can insert own profile"
  on public.student_profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.student_profiles;
create policy "Users can update own profile"
  on public.student_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
