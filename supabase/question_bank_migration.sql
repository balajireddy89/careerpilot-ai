-- Run AFTER schema.sql and admin_migration.sql
-- Question banks, roadmap templates, admin management

-- ---------------------------------------------------------------------------
-- Content categories (subjects per module)
-- ---------------------------------------------------------------------------
create table if not exists public.content_categories (
  id uuid primary key default gen_random_uuid(),
  module_type text not null check (module_type in ('technical', 'aptitude', 'coding')),
  name text not null,
  created_at timestamptz not null default now(),
  unique (module_type, name)
);

-- ---------------------------------------------------------------------------
-- MCQ questions (technical interview + aptitude)
-- ---------------------------------------------------------------------------
create table if not exists public.mcq_questions (
  id uuid primary key default gen_random_uuid(),
  module_type text not null check (module_type in ('technical', 'aptitude')),
  category_name text not null,
  external_id text,
  question_text text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mcq_questions_module_category_idx
  on public.mcq_questions (module_type, category_name) where is_active = true;

-- ---------------------------------------------------------------------------
-- Coding challenges (admin-curated)
-- ---------------------------------------------------------------------------
create table if not exists public.coding_challenges (
  id uuid primary key default gen_random_uuid(),
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  category_name text default 'General',
  external_id text,
  title text not null,
  description text not null,
  test_cases jsonb not null default '[]'::jsonb,
  solution_java text default '',
  solution_python text default '',
  solution_js text default '',
  template_java text default '',
  template_python text default '',
  template_js text default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coding_challenges_difficulty_idx
  on public.coding_challenges (difficulty) where is_active = true;

-- ---------------------------------------------------------------------------
-- Roadmap templates (admin-managed syllabi)
-- ---------------------------------------------------------------------------
create table if not exists public.roadmap_templates (
  id uuid primary key default gen_random_uuid(),
  course_name text not null unique,
  months jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Roadmap XP tracking on student profiles
-- ---------------------------------------------------------------------------
alter table public.student_profiles
  add column if not exists roadmap_rewards jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists mcq_questions_updated_at on public.mcq_questions;
create trigger mcq_questions_updated_at
  before update on public.mcq_questions
  for each row execute function public.set_updated_at();

drop trigger if exists coding_challenges_updated_at on public.coding_challenges;
create trigger coding_challenges_updated_at
  before update on public.coding_challenges
  for each row execute function public.set_updated_at();

drop trigger if exists roadmap_templates_updated_at on public.roadmap_templates;
create trigger roadmap_templates_updated_at
  before update on public.roadmap_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.content_categories enable row level security;
alter table public.mcq_questions enable row level security;
alter table public.coding_challenges enable row level security;
alter table public.roadmap_templates enable row level security;

-- Read active content for all authenticated users
drop policy if exists "Anyone can read categories" on public.content_categories;
create policy "Anyone can read categories"
  on public.content_categories for select to authenticated using (true);

drop policy if exists "Anyone can read active mcq" on public.mcq_questions;
create policy "Anyone can read active mcq"
  on public.mcq_questions for select to authenticated using (is_active = true);

drop policy if exists "Anyone can read active coding" on public.coding_challenges;
create policy "Anyone can read active coding"
  on public.coding_challenges for select to authenticated using (is_active = true);

drop policy if exists "Anyone can read active roadmaps" on public.roadmap_templates;
create policy "Anyone can read active roadmaps"
  on public.roadmap_templates for select to authenticated using (is_active = true);

-- Admin full access
drop policy if exists "Admins manage categories" on public.content_categories;
create policy "Admins manage categories"
  on public.content_categories for all to authenticated
  using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "Admins manage mcq" on public.mcq_questions;
create policy "Admins manage mcq"
  on public.mcq_questions for all to authenticated
  using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "Admins manage coding" on public.coding_challenges;
create policy "Admins manage coding"
  on public.coding_challenges for all to authenticated
  using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "Admins manage roadmaps" on public.roadmap_templates;
create policy "Admins manage roadmaps"
  on public.roadmap_templates for all to authenticated
  using (public.is_admin_user()) with check (public.is_admin_user());

-- Admins can also read inactive rows
drop policy if exists "Admins read all mcq" on public.mcq_questions;
create policy "Admins read all mcq"
  on public.mcq_questions for select to authenticated using (public.is_admin_user());

drop policy if exists "Admins read all coding" on public.coding_challenges;
create policy "Admins read all coding"
  on public.coding_challenges for select to authenticated using (public.is_admin_user());

-- Admins can update is_admin on other profiles
drop policy if exists "Admins can update profiles" on public.student_profiles;
create policy "Admins can update profiles"
  on public.student_profiles for update to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- ---------------------------------------------------------------------------
-- Seed default categories
-- ---------------------------------------------------------------------------
insert into public.content_categories (module_type, name) values
  ('technical', 'Java'),
  ('technical', 'Python'),
  ('technical', 'JavaScript'),
  ('technical', 'Databases & SQL'),
  ('technical', 'Data Structures & Algorithms'),
  ('technical', 'Operating Systems'),
  ('technical', 'Computer Networks'),
  ('technical', 'System Design'),
  ('technical', 'Web Development'),
  ('technical', 'DevOps & Cloud'),
  ('technical', 'Machine Learning'),
  ('technical', 'C++'),
  ('aptitude', 'quantitative'),
  ('aptitude', 'logical'),
  ('aptitude', 'verbal'),
  ('coding', 'General')
on conflict (module_type, name) do nothing;

-- Bootstrap primary admin (must have signed up once)
update public.student_profiles
set is_admin = true
where lower(email) = lower('reddy.kuppila2006@gmail.com');
