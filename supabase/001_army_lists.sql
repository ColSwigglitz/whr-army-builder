-- WHR Army Builder development schema: cloud-saved army lists
-- Run this in Supabase SQL Editor for the development project.

create table if not exists public.army_lists (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  army_id text,
  faction_id text,
  faction_name text,
  points_limit integer not null default 2000,
  total_points numeric not null default 0,
  roster_data jsonb not null,
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists army_lists_owner_id_idx on public.army_lists(owner_id);
create index if not exists army_lists_visibility_idx on public.army_lists(visibility);
create index if not exists army_lists_updated_at_idx on public.army_lists(updated_at desc);

alter table public.army_lists enable row level security;

drop policy if exists "Owners can read own armies" on public.army_lists;
drop policy if exists "Authenticated users can read shared armies" on public.army_lists;
drop policy if exists "Owners can insert armies" on public.army_lists;
drop policy if exists "Owners can update armies" on public.army_lists;
drop policy if exists "Owners can delete armies" on public.army_lists;

create policy "Owners can read own armies"
on public.army_lists
for select
to authenticated
using (owner_id = auth.uid());

create policy "Authenticated users can read shared armies"
on public.army_lists
for select
to authenticated
using (visibility = 'shared');

create policy "Owners can insert armies"
on public.army_lists
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Owners can update armies"
on public.army_lists
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners can delete armies"
on public.army_lists
for delete
to authenticated
using (owner_id = auth.uid());
