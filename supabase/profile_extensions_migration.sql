-- Run in Supabase SQL Editor if your project was created before these columns existed

alter table public.student_profiles
  add column if not exists primary_priority text default '',
  add column if not exists learning_roadmap jsonb not null default '[]'::jsonb,
  add column if not exists quiz_rewards jsonb not null default '{}'::jsonb,
  add column if not exists coding_rewards jsonb not null default '{}'::jsonb;

alter table public.student_profiles
  alter column target_role set default '';
