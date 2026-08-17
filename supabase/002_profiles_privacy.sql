-- WHR Army Builder development: public-safe user profiles.
-- Run after 001_army_lists.sql in the Supabase SQL editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(trim(display_name)) between 3 and 30)
);

create unique index if not exists profiles_display_name_lower_unique
  on public.profiles (lower(display_name));

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by signed in users" on public.profiles;
create policy "Profiles are readable by signed in users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- Profile rows contain only the public display name and user UUID. Email addresses
-- remain in Supabase Auth and are never copied into this public-readable table.
