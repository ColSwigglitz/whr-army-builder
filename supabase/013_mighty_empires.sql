-- WHR Army Builder development: Mighty Empires campaign support.
-- Run after the existing campaign migrations.
--
-- This migration:
--   * registers Mighty Empires as an active campaign type
--   * adds persistent hex-map state
--   * adds per-player exploration/fog-of-war state
--   * adds banner/field-army state for later army-builder integration

insert into public.campaign_types (id, name, description, active)
values (
  'mighty_empires',
  'Mighty Empires',
  'Hex-based exploration and conquest campaign inspired by classic fantasy map campaigns.',
  true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active;

create table if not exists public.mighty_empire_hexes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  q integer not null,
  r integer not null,
  terrain_type text not null check (terrain_type in ('lowland','highland','river_valley','coastal','sea','swamp')),
  terrain_variant text,
  rotation smallint not null default 0 check (rotation in (0,60,120,180,240,300)),
  settlement_type text check (settlement_type is null or settlement_type in ('barren','village','fortress','city','capital')),
  owner_id uuid references auth.users(id) on delete set null,
  razed boolean not null default false,
  under_siege boolean not null default false,
  special_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, q, r)
);

create index if not exists mighty_empire_hexes_campaign_idx on public.mighty_empire_hexes(campaign_id);
create index if not exists mighty_empire_hexes_owner_idx on public.mighty_empire_hexes(campaign_id, owner_id);

create table if not exists public.mighty_empire_hex_exploration (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  hex_id uuid not null references public.mighty_empire_hexes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  explored boolean not null default false,
  explored_at timestamptz,
  primary key (hex_id, user_id)
);
create index if not exists mighty_empire_exploration_user_idx on public.mighty_empire_hex_exploration(campaign_id, user_id);

create table if not exists public.mighty_empire_banners (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  hex_id uuid references public.mighty_empire_hexes(id) on delete set null,
  name text not null,
  faction_id text,
  roster_id uuid,
  points integer not null default 0 check (points >= 0),
  baggage integer not null default 0 check (baggage between 0 and 6),
  status text not null default 'active' check (status in ('active','defeated','scattered','besieging','garrisoned','destroyed')),
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mighty_empire_banners_campaign_idx on public.mighty_empire_banners(campaign_id);
create index if not exists mighty_empire_banners_owner_idx on public.mighty_empire_banners(campaign_id, owner_id);
create index if not exists mighty_empire_banners_hex_idx on public.mighty_empire_banners(hex_id);

alter table public.mighty_empire_hexes enable row level security;
alter table public.mighty_empire_hex_exploration enable row level security;
alter table public.mighty_empire_banners enable row level security;

drop policy if exists "Campaign members can read Mighty Empires hexes" on public.mighty_empire_hexes;
create policy "Campaign members can read Mighty Empires hexes" on public.mighty_empire_hexes
for select to authenticated using (public.whr_is_campaign_member(campaign_id, auth.uid()));

drop policy if exists "Campaign owners can manage Mighty Empires hexes" on public.mighty_empire_hexes;
create policy "Campaign owners can manage Mighty Empires hexes" on public.mighty_empire_hexes
for all to authenticated
using (public.whr_is_campaign_owner(campaign_id, auth.uid()))
with check (public.whr_is_campaign_owner(campaign_id, auth.uid()));

drop policy if exists "Players can read their Mighty Empires exploration" on public.mighty_empire_hex_exploration;
create policy "Players can read their Mighty Empires exploration" on public.mighty_empire_hex_exploration
for select to authenticated
using (user_id = auth.uid() or public.whr_is_campaign_owner(campaign_id, auth.uid()));

drop policy if exists "Players can manage their Mighty Empires exploration" on public.mighty_empire_hex_exploration;
create policy "Players can manage their Mighty Empires exploration" on public.mighty_empire_hex_exploration
for all to authenticated
using (user_id = auth.uid() and public.whr_is_campaign_member(campaign_id, auth.uid()))
with check (user_id = auth.uid() and public.whr_is_campaign_member(campaign_id, auth.uid()));

drop policy if exists "Campaign members can read Mighty Empires banners" on public.mighty_empire_banners;
create policy "Campaign members can read Mighty Empires banners" on public.mighty_empire_banners
for select to authenticated using (public.whr_is_campaign_member(campaign_id, auth.uid()));

drop policy if exists "Players can manage their Mighty Empires banners" on public.mighty_empire_banners;
create policy "Players can manage their Mighty Empires banners" on public.mighty_empire_banners
for all to authenticated
using (owner_id = auth.uid() and public.whr_is_campaign_member(campaign_id, auth.uid()))
with check (owner_id = auth.uid() and public.whr_is_campaign_member(campaign_id, auth.uid()));

create or replace function public.whr_validate_mighty_empire_campaign()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_type text;
begin
  select campaign_type_id into v_type from public.campaigns where id = new.campaign_id;
  if v_type is distinct from 'mighty_empires' then
    raise exception 'Mighty Empires data can only belong to a Mighty Empires campaign';
  end if;
  return new;
end;
$$;

drop trigger if exists whr_validate_mighty_empire_hex on public.mighty_empire_hexes;
create trigger whr_validate_mighty_empire_hex before insert or update on public.mighty_empire_hexes
for each row execute function public.whr_validate_mighty_empire_campaign();

drop trigger if exists whr_validate_mighty_empire_exploration on public.mighty_empire_hex_exploration;
create trigger whr_validate_mighty_empire_exploration before insert or update on public.mighty_empire_hex_exploration
for each row execute function public.whr_validate_mighty_empire_campaign();

drop trigger if exists whr_validate_mighty_empire_banner on public.mighty_empire_banners;
create trigger whr_validate_mighty_empire_banner before insert or update on public.mighty_empire_banners
for each row execute function public.whr_validate_mighty_empire_campaign();
