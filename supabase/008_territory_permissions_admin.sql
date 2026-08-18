-- WHR Army Builder development: territory ownership permissions and owner overrides.
-- Run after 007_campaign_territories.sql.
--
-- Rules:
--   * Campaign owner may generate/assign territories for any campaign member.
--   * Campaign members may generate territories only for themselves.
--   * A territory owner may transfer their own territory to another member.
--   * Campaign owner may transfer any territory.
--   * Only campaign owner may delete territories.
--   * Campaign owner may override the fixed numeric value on variable territories.

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
  v_is_owner boolean;
begin
  if not public.whr_is_campaign_member(p_campaign_id,auth.uid()) then
    raise exception 'You must be a member of this campaign to generate territories';
  end if;

  v_is_owner := public.whr_is_campaign_owner(p_campaign_id,auth.uid());
  if not v_is_owner and p_owner_id is distinct from auth.uid() then
    raise exception 'Campaign members may generate territories only for themselves';
  end if;

  select campaign_type_id into v_campaign_type from public.campaigns where id=p_campaign_id;
  if v_campaign_type is distinct from 'phoenix_games' then
    raise exception 'Territories are currently supported only for Phoenix Games campaigns';
  end if;

  if not exists(select 1 from public.territory_types where id=p_territory_type_id and active=true) then
    raise exception 'Unknown territory type';
  end if;

  if p_owner_id is not null and not public.whr_is_campaign_member(p_campaign_id,p_owner_id) then
    raise exception 'Territory owner must be a campaign member';
  end if;

  if p_parent_territory_id is not null then
    select * into v_parent from public.campaign_territories where id=p_parent_territory_id for update;
    if not found or v_parent.campaign_id<>p_campaign_id or v_parent.territory_type_id<>'lost_valley' then
      raise exception 'Child territories must belong to a Lost Valley in this campaign';
    end if;
    if p_territory_type_id='lost_valley' then
      raise exception 'A Lost Valley cannot contain another Lost Valley';
    end if;
    select count(*) into v_child_count from public.campaign_territories where parent_territory_id=p_parent_territory_id;
    if v_child_count>=2 then raise exception 'A Lost Valley can contain only two territories'; end if;
    p_owner_id := v_parent.owner_id;
    if not v_is_owner and p_owner_id is distinct from auth.uid() then
      raise exception 'Campaign members may generate Lost Valley children only for their own Lost Valley';
    end if;
  elsif p_owner_id is not null then
    select count(*) into v_count
    from public.campaign_territories
    where campaign_id=p_campaign_id and owner_id=p_owner_id and counts_toward_limit=true;
    if v_count>=12 then raise exception 'A player may own no more than 12 territories'; end if;
  end if;

  select value_min,value_max,value_step into v_min,v_max,v_step
  from public.territory_types where id=p_territory_type_id;

  if v_min is null then
    if p_effect_value is not null then raise exception 'This territory type does not use a variable value'; end if;
    v_value := null;
  else
    -- Only the campaign owner may choose an explicit value at creation.
    if p_effect_value is not null and not v_is_owner then
      raise exception 'Only the campaign owner may manually set territory values';
    end if;
    v_value := coalesce(p_effect_value,public.whr_random_territory_value(p_territory_type_id));
    if v_value<v_min or v_value>v_max or mod(v_value-v_min,coalesce(v_step,1))<>0 then
      raise exception 'Invalid territory value';
    end if;
  end if;

  insert into public.campaign_territories(
    campaign_id,territory_type_id,owner_id,effect_value,parent_territory_id,
    counts_toward_limit,locked_to_parent,created_by
  ) values(
    p_campaign_id,p_territory_type_id,p_owner_id,v_value,p_parent_territory_id,
    p_parent_territory_id is null,p_parent_territory_id is not null,auth.uid()
  ) returning id into v_id;

  insert into public.territory_transfer_history(campaign_id,territory_id,from_owner_id,to_owner_id,changed_by,reason)
  values(p_campaign_id,v_id,null,p_owner_id,auth.uid(),'Territory generated');

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
declare
  v_valley uuid;
  v_is_owner boolean;
begin
  if not public.whr_is_campaign_member(p_campaign_id,auth.uid()) then
    raise exception 'You must be a member of this campaign to generate territories';
  end if;
  v_is_owner := public.whr_is_campaign_owner(p_campaign_id,auth.uid());
  if not v_is_owner and p_owner_id is distinct from auth.uid() then
    raise exception 'Campaign members may generate territories only for themselves';
  end if;
  if p_child_type_1='lost_valley' or p_child_type_2='lost_valley' then
    raise exception 'A Lost Valley cannot contain another Lost Valley';
  end if;

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
  v_is_campaign_owner boolean;
begin
  select * into v_t from public.campaign_territories where id=p_territory_id for update;
  if not found then raise exception 'Territory not found'; end if;

  v_is_campaign_owner := public.whr_is_campaign_owner(v_t.campaign_id,auth.uid());
  if not v_is_campaign_owner and v_t.owner_id is distinct from auth.uid() then
    raise exception 'You may transfer only territories that you own';
  end if;
  if not public.whr_is_campaign_member(v_t.campaign_id,auth.uid()) then
    raise exception 'You must be a campaign member to transfer territories';
  end if;
  if v_t.parent_territory_id is not null or v_t.locked_to_parent then
    raise exception 'Lost Valley child territories move only with their Lost Valley';
  end if;
  if p_to_owner_id is not null and not public.whr_is_campaign_member(v_t.campaign_id,p_to_owner_id) then
    raise exception 'New owner must be a campaign member';
  end if;
  if p_to_owner_id=v_t.owner_id then return; end if;

  if p_to_owner_id is not null then
    select count(*) into v_count
    from public.campaign_territories
    where campaign_id=v_t.campaign_id
      and owner_id=p_to_owner_id
      and counts_toward_limit=true
      and id<>v_t.id;
    if v_count>=12 then raise exception 'The receiving player already owns 12 territories'; end if;
  end if;

  update public.campaign_territories
  set owner_id=p_to_owner_id,acquired_at=now(),updated_at=now()
  where id=v_t.id;

  insert into public.territory_transfer_history(campaign_id,territory_id,from_owner_id,to_owner_id,changed_by,reason)
  values(v_t.campaign_id,v_t.id,v_t.owner_id,p_to_owner_id,auth.uid(),coalesce(p_reason,''));

  for v_child in select * from public.campaign_territories where parent_territory_id=v_t.id for update loop
    update public.campaign_territories
    set owner_id=p_to_owner_id,acquired_at=now(),updated_at=now()
    where id=v_child.id;
    insert into public.territory_transfer_history(campaign_id,territory_id,from_owner_id,to_owner_id,changed_by,reason)
    values(v_t.campaign_id,v_child.id,v_child.owner_id,p_to_owner_id,auth.uid(),'Moved with Lost Valley');
  end loop;
end; $$;

-- Keep deletion campaign-owner-only.
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
  if not public.whr_is_campaign_owner(v_t.campaign_id,auth.uid()) then
    raise exception 'Only the campaign owner can delete territories';
  end if;
  if v_t.parent_territory_id is not null then
    raise exception 'Delete the Lost Valley rather than an attached child territory';
  end if;
  delete from public.campaign_territories where id=p_territory_id;
end; $$;

create table if not exists public.territory_value_history (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  territory_id uuid not null references public.campaign_territories(id) on delete cascade,
  old_value integer,
  new_value integer,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

alter table public.territory_value_history enable row level security;
drop policy if exists "Campaign members can read territory value history" on public.territory_value_history;
create policy "Campaign members can read territory value history"
on public.territory_value_history for select to authenticated
using(public.whr_is_campaign_member(campaign_id,auth.uid()));

create or replace function public.whr_update_campaign_territory_value(
  p_territory_id uuid,
  p_effect_value integer
)
returns void
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_t public.campaign_territories%rowtype;
  v_min integer;
  v_max integer;
  v_step integer;
begin
  select * into v_t from public.campaign_territories where id=p_territory_id for update;
  if not found then raise exception 'Territory not found'; end if;
  if not public.whr_is_campaign_owner(v_t.campaign_id,auth.uid()) then
    raise exception 'Only the campaign owner can change a territory value';
  end if;

  select value_min,value_max,value_step into v_min,v_max,v_step
  from public.territory_types
  where id=v_t.territory_type_id and active=true;

  if v_min is null then raise exception 'This territory type does not have a variable value'; end if;
  if p_effect_value<v_min or p_effect_value>v_max or mod(p_effect_value-v_min,coalesce(v_step,1))<>0 then
    raise exception 'Invalid territory value';
  end if;
  if p_effect_value=v_t.effect_value then return; end if;

  update public.campaign_territories
  set effect_value=p_effect_value,updated_at=now()
  where id=v_t.id;

  insert into public.territory_value_history(campaign_id,territory_id,old_value,new_value,changed_by)
  values(v_t.campaign_id,v_t.id,v_t.effect_value,p_effect_value,auth.uid());
end; $$;

revoke all on function public.whr_create_campaign_territory(uuid,text,uuid,integer,uuid) from public;
revoke all on function public.whr_create_lost_valley(uuid,uuid,text,text) from public;
revoke all on function public.whr_transfer_campaign_territory(uuid,uuid,text) from public;
revoke all on function public.whr_delete_campaign_territory(uuid) from public;
revoke all on function public.whr_update_campaign_territory_value(uuid,integer) from public;

grant execute on function public.whr_create_campaign_territory(uuid,text,uuid,integer,uuid) to authenticated;
grant execute on function public.whr_create_lost_valley(uuid,uuid,text,text) to authenticated;
grant execute on function public.whr_transfer_campaign_territory(uuid,uuid,text) to authenticated;
grant execute on function public.whr_delete_campaign_territory(uuid) to authenticated;
grant execute on function public.whr_update_campaign_territory_value(uuid,integer) to authenticated;
