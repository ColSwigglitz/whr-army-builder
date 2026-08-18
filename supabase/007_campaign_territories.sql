-- WHR Army Builder development: Phoenix Games campaign territories.
-- Run after 006_campaign_armies.sql.
--
-- Territory *types* describe the 18 Phoenix Games territory categories.
-- campaign_territories are individual territory instances. Variable bonuses are
-- generated once at creation and stored on the instance, so the value follows
-- that territory when ownership changes.

create table if not exists public.territory_types (
  id text primary key,
  name text not null unique,
  description text not null default '',
  effect_kind text not null default 'none',
  value_min integer,
  value_max integer,
  value_step integer,
  sort_order integer not null default 0,
  active boolean not null default true
);

insert into public.territory_types(id,name,description,effect_kind,value_min,value_max,value_step,sort_order) values
('wizards_tower','Wizard''s Tower','Allows one additional Level 1 Wizard.','wizard_level_1',null,null,null,10),
('sacred_grove','Sacred Grove','Allows one Level 2 Wizard.','wizard_level_2',null,null,null,20),
('shrine','Shrine','Allows one Level 3 Wizard and one additional magic item worth up to 50 points.','wizard_level_3_magic_50',null,null,null,30),
('temple','Temple','Allows one Level 4 Wizard and one additional magic item worth up to 75 points.','wizard_level_4_magic_75',null,null,null,40),
('village','Village','Allows one unit Champion.','champion_1',null,null,null,50),
('town','Town','Allows three additional Champions, Heroes or Battle Standard Bearers.','town_flexible_3',null,null,null,60),
('trade_route','Trade Route','Allows one additional magic item worth up to 50 points.','magic_50',null,null,null,70),
('silver_mine','Silver Mine','Allows up to three additional magic items worth up to 75 points each.','magic_75_x3',null,null,null,80),
('gold_mine','Gold Mine','Allows up to three additional magic items worth up to 100 points each.','magic_100_x3',null,null,null,90),
('treasure_hoard','Treasure Hoard','Allows up to five additional magic items with no points limit.','magic_unlimited_x5',null,null,null,100),
('road','Road','Adds a permanently determined 10-60 points, in increments of 10, to the army limit.','army_points',10,60,10,110),
('bridge','Bridge','Adds a permanently determined 20-120 points, in increments of 10, to the army limit.','army_points',20,120,10,120),
('pass','Pass','Adds a permanently determined 30-180 points, in increments of 10, to the army limit.','army_points',30,180,10,130),
('mountains','Mountains','Allows a permanently determined 1-3 additional large monsters.','large_monsters',1,3,1,140),
('forest','Forest','Allows a permanently determined 1-3 additional war machines.','war_machines',1,3,1,150),
('ruins','Ruins','Has an in-game effect; it does not alter army construction.','none',null,null,null,160),
('lost_valley','Lost Valley','Contains two permanently attached territories. The valley and its two children count as one territory for the owner''s limit.','lost_valley',null,null,null,170),
('spy','Spy','Has an in-game effect; it does not alter army construction.','none',null,null,null,180)
on conflict(id) do update set
  name=excluded.name,
  description=excluded.description,
  effect_kind=excluded.effect_kind,
  value_min=excluded.value_min,
  value_max=excluded.value_max,
  value_step=excluded.value_step,
  sort_order=excluded.sort_order,
  active=true;

create table if not exists public.campaign_territories (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  territory_type_id text not null references public.territory_types(id),
  owner_id uuid references auth.users(id) on delete set null,
  effect_value integer,
  parent_territory_id uuid references public.campaign_territories(id) on delete cascade,
  counts_toward_limit boolean not null default true,
  locked_to_parent boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  acquired_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_territory_not_own_parent check (parent_territory_id is null or parent_territory_id <> id)
);
create index if not exists campaign_territories_campaign_idx on public.campaign_territories(campaign_id);
create index if not exists campaign_territories_owner_idx on public.campaign_territories(campaign_id,owner_id);
create index if not exists campaign_territories_parent_idx on public.campaign_territories(parent_territory_id);

create table if not exists public.territory_transfer_history (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  territory_id uuid not null references public.campaign_territories(id) on delete cascade,
  from_owner_id uuid references auth.users(id) on delete set null,
  to_owner_id uuid references auth.users(id) on delete set null,
  changed_by uuid references auth.users(id) on delete set null,
  reason text not null default '',
  changed_at timestamptz not null default now()
);
create index if not exists territory_transfer_history_campaign_idx on public.territory_transfer_history(campaign_id,changed_at desc);

alter table public.territory_types enable row level security;
alter table public.campaign_territories enable row level security;
alter table public.territory_transfer_history enable row level security;

drop policy if exists "Territory types readable by signed in users" on public.territory_types;
create policy "Territory types readable by signed in users" on public.territory_types
for select to authenticated using(active=true);

drop policy if exists "Campaign members can read territories" on public.campaign_territories;
create policy "Campaign members can read territories" on public.campaign_territories
for select to authenticated using(public.whr_is_campaign_member(campaign_id,auth.uid()));

drop policy if exists "Campaign members can read territory history" on public.territory_transfer_history;
create policy "Campaign members can read territory history" on public.territory_transfer_history
for select to authenticated using(public.whr_is_campaign_member(campaign_id,auth.uid()));

-- No direct INSERT/UPDATE/DELETE policies are granted for territory instances.
-- All writes go through the security-definer functions below so fixed values,
-- Lost Valley children and the 12-territory ownership limit cannot be bypassed.

create or replace function public.whr_random_territory_value(p_type_id text)
returns integer
language plpgsql
volatile
security definer
set search_path=public
as $$
declare
  v_min integer;
  v_max integer;
  v_step integer;
  v_count integer;
begin
  select value_min,value_max,value_step into v_min,v_max,v_step
  from public.territory_types where id=p_type_id and active=true;
  if v_min is null then return null; end if;
  v_step := coalesce(v_step,1);
  v_count := ((v_max-v_min)/v_step)+1;
  return v_min + (floor(random()*v_count)::integer * v_step);
end; $$;

create or replace function public.whr_create_campaign_territory(
  p_campaign_id uuid,
  p_territory_type_id text,
  p_owner_id uuid,
  p_effect_value integer default null,
  p_parent_territory_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_id uuid;
  v_campaign_type text;
  v_min integer;
  v_max integer;
  v_step integer;
  v_value integer;
  v_parent public.campaign_territories%rowtype;
  v_count integer;
  v_child_count integer;
begin
  if not public.whr_is_campaign_owner(p_campaign_id,auth.uid()) then
    raise exception 'Only the campaign owner can create territories';
  end if;
  select campaign_type_id into v_campaign_type from public.campaigns where id=p_campaign_id;
  if v_campaign_type is distinct from 'phoenix_games' then raise exception 'Territories are currently supported only for Phoenix Games campaigns'; end if;
  if not exists(select 1 from public.territory_types where id=p_territory_type_id and active=true) then raise exception 'Unknown territory type'; end if;
  if p_owner_id is not null and not public.whr_is_campaign_member(p_campaign_id,p_owner_id) then raise exception 'Territory owner must be a campaign member'; end if;

  if p_parent_territory_id is not null then
    select * into v_parent from public.campaign_territories where id=p_parent_territory_id for update;
    if not found or v_parent.campaign_id<>p_campaign_id or v_parent.territory_type_id<>'lost_valley' then raise exception 'Child territories must belong to a Lost Valley in this campaign'; end if;
    if p_territory_type_id='lost_valley' then raise exception 'A Lost Valley cannot contain another Lost Valley'; end if;
    select count(*) into v_child_count from public.campaign_territories where parent_territory_id=p_parent_territory_id;
    if v_child_count>=2 then raise exception 'A Lost Valley can contain only two territories'; end if;
    p_owner_id := v_parent.owner_id;
  elsif p_owner_id is not null then
    select count(*) into v_count from public.campaign_territories where campaign_id=p_campaign_id and owner_id=p_owner_id and counts_toward_limit=true;
    if v_count>=12 then raise exception 'A player may own no more than 12 territories'; end if;
  end if;

  select value_min,value_max,value_step into v_min,v_max,v_step from public.territory_types where id=p_territory_type_id;
  if v_min is null then
    if p_effect_value is not null then raise exception 'This territory type does not use a variable value'; end if;
    v_value := null;
  else
    v_value := coalesce(p_effect_value,public.whr_random_territory_value(p_territory_type_id));
    if v_value<v_min or v_value>v_max or mod(v_value-v_min,coalesce(v_step,1))<>0 then raise exception 'Invalid territory value'; end if;
  end if;

  insert into public.campaign_territories(
    campaign_id,territory_type_id,owner_id,effect_value,parent_territory_id,
    counts_toward_limit,locked_to_parent,created_by
  ) values(
    p_campaign_id,p_territory_type_id,p_owner_id,v_value,p_parent_territory_id,
    p_parent_territory_id is null,p_parent_territory_id is not null,auth.uid()
  ) returning id into v_id;

  insert into public.territory_transfer_history(campaign_id,territory_id,from_owner_id,to_owner_id,changed_by,reason)
  values(p_campaign_id,v_id,null,p_owner_id,auth.uid(),'Territory created');
  return v_id;
end; $$;

create or replace function public.whr_create_lost_valley(
  p_campaign_id uuid,
  p_owner_id uuid,
  p_child_type_1 text,
  p_child_type_2 text
)
returns uuid
language plpgsql
security definer
set search_path=public,auth
as $$
declare v_valley uuid;
begin
  if p_child_type_1='lost_valley' or p_child_type_2='lost_valley' then raise exception 'A Lost Valley cannot contain another Lost Valley'; end if;
  v_valley := public.whr_create_campaign_territory(p_campaign_id,'lost_valley',p_owner_id,null,null);
  perform public.whr_create_campaign_territory(p_campaign_id,p_child_type_1,p_owner_id,null,v_valley);
  perform public.whr_create_campaign_territory(p_campaign_id,p_child_type_2,p_owner_id,null,v_valley);
  return v_valley;
end; $$;

create or replace function public.whr_transfer_campaign_territory(
  p_territory_id uuid,
  p_to_owner_id uuid,
  p_reason text default ''
)
returns void
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_t public.campaign_territories%rowtype;
  v_count integer;
  v_child record;
begin
  select * into v_t from public.campaign_territories where id=p_territory_id for update;
  if not found then raise exception 'Territory not found'; end if;
  if not public.whr_is_campaign_owner(v_t.campaign_id,auth.uid()) then raise exception 'Only the campaign owner can transfer territories'; end if;
  if v_t.parent_territory_id is not null or v_t.locked_to_parent then raise exception 'Lost Valley child territories move only with their Lost Valley'; end if;
  if p_to_owner_id is not null and not public.whr_is_campaign_member(v_t.campaign_id,p_to_owner_id) then raise exception 'New owner must be a campaign member'; end if;
  if p_to_owner_id=v_t.owner_id then return; end if;
  if p_to_owner_id is not null then
    select count(*) into v_count from public.campaign_territories where campaign_id=v_t.campaign_id and owner_id=p_to_owner_id and counts_toward_limit=true and id<>v_t.id;
    if v_count>=12 then raise exception 'The receiving player already owns 12 territories'; end if;
  end if;

  update public.campaign_territories set owner_id=p_to_owner_id,acquired_at=now(),updated_at=now() where id=v_t.id;
  insert into public.territory_transfer_history(campaign_id,territory_id,from_owner_id,to_owner_id,changed_by,reason)
  values(v_t.campaign_id,v_t.id,v_t.owner_id,p_to_owner_id,auth.uid(),coalesce(p_reason,''));

  -- Lost Valley children are permanently attached and follow the valley.
  for v_child in select * from public.campaign_territories where parent_territory_id=v_t.id for update loop
    update public.campaign_territories set owner_id=p_to_owner_id,acquired_at=now(),updated_at=now() where id=v_child.id;
    insert into public.territory_transfer_history(campaign_id,territory_id,from_owner_id,to_owner_id,changed_by,reason)
    values(v_t.campaign_id,v_child.id,v_child.owner_id,p_to_owner_id,auth.uid(),'Moved with Lost Valley');
  end loop;
end; $$;

create or replace function public.whr_delete_campaign_territory(p_territory_id uuid)
returns void
language plpgsql
security definer
set search_path=public,auth
as $$
declare v_t public.campaign_territories%rowtype;
begin
  select * into v_t from public.campaign_territories where id=p_territory_id;
  if not found then return; end if;
  if not public.whr_is_campaign_owner(v_t.campaign_id,auth.uid()) then raise exception 'Only the campaign owner can delete territories'; end if;
  if v_t.parent_territory_id is not null then raise exception 'Delete the Lost Valley rather than an attached child territory'; end if;
  delete from public.campaign_territories where id=p_territory_id;
end; $$;

revoke all on function public.whr_random_territory_value(text) from public;
revoke all on function public.whr_create_campaign_territory(uuid,text,uuid,integer,uuid) from public;
revoke all on function public.whr_create_lost_valley(uuid,uuid,text,text) from public;
revoke all on function public.whr_transfer_campaign_territory(uuid,uuid,text) from public;
revoke all on function public.whr_delete_campaign_territory(uuid) from public;
grant execute on function public.whr_create_campaign_territory(uuid,text,uuid,integer,uuid) to authenticated;
grant execute on function public.whr_create_lost_valley(uuid,uuid,text,text) to authenticated;
grant execute on function public.whr_transfer_campaign_territory(uuid,uuid,text) to authenticated;
grant execute on function public.whr_delete_campaign_territory(uuid) to authenticated;
