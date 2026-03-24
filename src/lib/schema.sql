-- WRAP App Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  entry_type text check (entry_type in ('new', 'alumni', 'coaching_client')),
  onboarding_completed boolean default false,
  onboarding_step text default 'entry_routing',
  anchor_goal text,
  anchor_goal_timeline text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4D Activation responses
create table public.drift_to_drive (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  dream_response text,
  magic_wand_story text,
  values_identified text[], -- array of 3-5 values
  desire_response text,
  disturbance_response text,
  reasons_why text, -- compressed 100 reasons exercise
  decision_starts text[], -- things to start
  decision_stops text[], -- things to stop
  decision_level text check (decision_level in ('wish', 'hope', 'commitment')),
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Life areas
create table public.life_areas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  icon text, -- emoji or icon identifier
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Annual outcomes (1-3 per life area)
create table public.annual_outcomes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  life_area_id uuid references public.life_areas(id) on delete cascade,
  year integer not null,
  outcome_text text not null,
  is_quantifiable boolean default false,
  target_metric text, -- "200 lbs", "$300K revenue", etc.
  current_metric text, -- tracked progress
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Monthly objectives
create table public.monthly_objectives (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  life_area_id uuid references public.life_areas(id) on delete cascade,
  annual_outcome_id uuid references public.annual_outcomes(id) on delete set null,
  year integer not null,
  month integer not null check (month between 1 and 12),
  objective_text text not null,
  objective_type text check (objective_type in ('project', 'outcome', 'task')),
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Weekly actions
create table public.weekly_actions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  life_area_id uuid references public.life_areas(id) on delete cascade,
  monthly_objective_id uuid references public.monthly_objectives(id) on delete set null,
  year integer not null,
  month integer not null,
  week_number integer not null check (week_number between 1 and 5),
  action_text text not null,
  response_type text check (response_type in ('binary', 'progress', 'carry_forward')) default 'binary',
  target_number numeric, -- for progress type: "100 contacts"
  completed boolean,
  progress_value numeric, -- actual progress logged
  carried_forward boolean default false,
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Weekly WRAP session reviews
create table public.wrap_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  year integer not null,
  month integer not null,
  week_number integer not null,
  session_date date,
  -- Review phase
  review_notes text,
  -- Reflect phase
  what_worked text,
  what_to_adjust text,
  -- Commit phase
  top_commitments text[], -- 3-5 must-happen items
  -- Metadata
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Desire list (persistent wishlist)
create table public.desire_list (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  item_text text not null,
  is_completed boolean default false,
  promoted_to_outcome boolean default false,
  created_at timestamp with time zone default now()
);

-- Done list
create table public.done_list (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  item_text text not null,
  completed_date date,
  created_at timestamp with time zone default now()
);

-- Row Level Security: users can only see their own data
alter table public.profiles enable row level security;
alter table public.drift_to_drive enable row level security;
alter table public.life_areas enable row level security;
alter table public.annual_outcomes enable row level security;
alter table public.monthly_objectives enable row level security;
alter table public.weekly_actions enable row level security;
alter table public.wrap_sessions enable row level security;
alter table public.desire_list enable row level security;
alter table public.done_list enable row level security;

-- RLS Policies
create policy "Users can manage own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users can manage own drift_to_drive" on public.drift_to_drive
  for all using (auth.uid() = user_id);

create policy "Users can manage own life_areas" on public.life_areas
  for all using (auth.uid() = user_id);

create policy "Users can manage own annual_outcomes" on public.annual_outcomes
  for all using (auth.uid() = user_id);

create policy "Users can manage own monthly_objectives" on public.monthly_objectives
  for all using (auth.uid() = user_id);

create policy "Users can manage own weekly_actions" on public.weekly_actions
  for all using (auth.uid() = user_id);

create policy "Users can manage own wrap_sessions" on public.wrap_sessions
  for all using (auth.uid() = user_id);

create policy "Users can manage own desire_list" on public.desire_list
  for all using (auth.uid() = user_id);

create policy "Users can manage own done_list" on public.done_list
  for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Default life areas helper function
create or replace function public.create_default_life_areas(p_user_id uuid)
returns void as $$
begin
  insert into public.life_areas (user_id, name, icon, sort_order) values
    (p_user_id, 'Spiritual / Purpose', '🙏', 1),
    (p_user_id, 'Relationships', '❤️', 2),
    (p_user_id, 'Health', '💪', 3),
    (p_user_id, 'Career / Value', '🎯', 4),
    (p_user_id, 'Financial', '💰', 5),
    (p_user_id, 'Overflow / Lifestyle', '✨', 6);
end;
$$ language plpgsql security definer;
