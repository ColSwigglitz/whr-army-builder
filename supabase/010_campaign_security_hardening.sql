-- WHR Army Builder development: campaign security hardening.
-- Run after 009_specific_territory_creation.sql.
--
-- Security goals:
--   * Random territory generation happens on the server, not in browser JS.
--   * Normal members cannot call the specific-territory RPC to choose a type.
--   * Campaign owner retains manual territory creation/assignment/value control.
--   * Normal members may transfer only their own territories to another member.
--   * Current-user RLS helpers do not expose arbitrary-user membership probes.

-- Current-user helper functions for RLS. These are the only membership/owner
-- predicate helpers that authenticated clients need to execute directly.
create or replace function public.whr_is_current_user_campaign_owner(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public,auth
as $$
  select exists(
    select 1 from public.campaigns c
    where c.id=p_campaign_id and c.owner_id=auth.uid()
  );
$$;

create or replace function public.whr_is_current_user_campaign_member(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public,auth
as $$
  select exists(
    select 1 from public.campaign_members cm
    where cm.campaign_id=p_campaign_id and cm.user_id=auth.uid()
  );
$$;

create or replace function public.whr_current_user_has_pending_campaign_invite(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public,auth
as $$
  select exists(
    select 1 from public.campaign_invites ci
    where ci.campaign_id=p_campaign_id
      and ci.invited_user_id=auth.uid()
      and ci.status='pending'
  );
$$;

revoke all on function public.whr_is_current_user_campaign_owner(uuid) from public;
revoke all on function public.whr_is_current_user_campaign_member(uuid) from public;
revoke all on function public.whr_current_user_has_pending_campaign_invite(uuid) from public;
grant execute on function public.whr_is_current_user_campaign_owner(uuid) to authenticated;
grant execute on function public.whr_is_current_user_campaign_member(uuid) to authenticated;
grant execute on function public.whr_current_user_has_pending_campaign_invite(uuid) to authenticated;

-- The older two-argument helpers are still useful inside SECURITY DEFINER
-- functions/triggers where an arbitrary owner/member must be checked, but they
-- no longer need to be directly executable by authenticated clients.
revoke all on function public.whr_is_campaign_owner(uuid,uuid) from public;
revoke all on function public.whr_is_campaign_member(uuid,uuid) from public;
revoke all on function public.whr_has_pending_campaign_invite(uuid,uuid) from public;

-- Repoint RLS policies at current-user-only helpers.
drop policy if exists "Campaigns readable when visible to user" on public.campaigns;
create policy "Campaigns readable when visible to user"
on public.campaigns for select to authenticated
using(
  visibility='public'
  or owner_id=auth.uid()
  or public.whr_is_current_user_campaign_member(id)
  or public.whr_current_user_has_pending_campaign_invite(id)
);

drop policy if exists "Campaign membership readable to participants and public campaigns" on public.campaign_members;
create policy "Campaign membership readable to participants and public campaigns"
on public.campaign_members for select to authenticated
using(
  user_id=auth.uid()
  or public.whr_is_current_user_campaign_owner(campaign_id)
  or public.whr_is_campaign_public(campaign_id)
);

drop policy if exists "Applicants and owners can read campaign applications" on public.campaign_applications;
create policy "Applicants and owners can read campaign applications"
on public.campaign_applications for select to authenticated
using(applicant_id=auth.uid() or public.whr_is_current_user_campaign_owner(campaign_id));

drop policy if exists "Users can apply to public campaigns" on public.campaign_applications;
create policy "Users can apply to public campaigns"
on public.campaign_applications for insert to authenticated
with check(
  applicant_id=auth.uid()
  and public.whr_is_campaign_public(campaign_id)
  and not public.whr_is_current_user_campaign_owner(campaign_id)
  and not public.whr_is_current_user_campaign_member(campaign_id)
);

drop policy if exists "Invitees and owners can read campaign invites" on public.campaign_invites;
create policy "Invitees and owners can read campaign invites"
on public.campaign_invites for select to authenticated
using(invited_user_id=auth.uid() or public.whr_is_current_user_campaign_owner(campaign_id));

drop policy if exists "Owners can create campaign invites" on public.campaign_invites;
create policy "Owners can create campaign invites"
on public.campaign_invites for insert to authenticated
with check(
  invited_by=auth.uid()
  and invited_user_id<>auth.uid()
  and public.whr_is_current_user_campaign_owner(campaign_id)
  and not public.whr_is_campaign_member(campaign_id,invited_user_id)
);

drop policy if exists "Owners can cancel pending campaign invites" on public.campaign_invites;
create policy "Owners can cancel pending campaign invites"
on public.campaign_invites for update to authenticated
using(status='pending' and public.whr_is_current_user_campaign_owner(campaign_id))
with check(status='cancelled');

drop policy if exists "Owners can insert armies" on public.army_lists;
create policy "Owners can insert armies"
on public.army_lists for insert to authenticated
with check(owner_id=auth.uid() and (campaign_id is null or public.whr_is_current_user_campaign_member(campaign_id)));

drop policy if exists "Owners can update armies" on public.army_lists;
create policy "Owners can update armies"
on public.army_lists for update to authenticated
using(owner_id=auth.uid())
with check(owner_id=auth.uid() and (campaign_id is null or public.whr_is_current_user_campaign_member(campaign_id)));

drop policy if exists "Campaign members can read campaign armies" on public.army_lists;
create policy "Campaign members can read campaign armies"
on public.army_lists for select to authenticated
using(campaign_id is not null and public.whr_is_current_user_campaign_member(campaign_id));

drop policy if exists "Campaign members can read territories" on public.campaign_territories;
create policy "Campaign members can read territories"
on public.campaign_territories for select to authenticated
using(public.whr_is_current_user_campaign_member(campaign_id));

drop policy if exists "Campaign members can read territory history" on public.territory_transfer_history;
create policy "Campaign members can read territory history"
on public.territory_transfer_history for select to authenticated
using(public.whr_is_current_user_campaign_member(campaign_id));

drop policy if exists "Campaign members can read territory value history" on public.territory_value_history;
create policy "Campaign members can read territory value history"
on public.territory_value_history for select to authenticated
using(public.whr_is_current_user_campaign_member(campaign_id));

-- Private creation primitive. No authenticated EXECUTE grant. It performs all
-- value/range/limit checks but intentionally leaves authorisation to wrappers.
create or replace function public.whr_create_campaign_territory_internal(
  p_campaign_id uuid,
  p_territory_type_id text,
  p_owner_id uuid,
  p_effect_value integer,
  p_parent_territory_id uuid,
  p_created_by uuid
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
  select campaign_type_id into v_campaign_type from public.campaigns where id=p_campaign_id;
  if v_campaign_type is distinct from 'phoenix_games' then
    raise exception 'Territories are currently supported only for Phoenix Games campaigns';
  end if;
  if not exists(select 1 from public.territory_types where id=p_territory_type_id and active=true) then
    raise exception 'Unknown territory type';
  end if;
  if p_owner_id is null or not public.whr_is_campaign_member(p_campaign_id,p_owner_id) then
    raise exception 'Territory owner must be a campaign member';
  end if;

  if p_parent_territory_id is not null then
    select * into v_parent from public.campaign_territories where id=p_parent_territory_id for update;
    if not found or v_parent.campaign_id<>p_campaign_id or v_parent.territory_type_id<>'lost_valley' then
      raise exception 'Child territories must belong to a Lost Valley in this campaign';
    end if;
    if p_territory_type_id='lost_valley' then raise exception 'A Lost Valley cannot contain another Lost Valley'; end if;
    select count(*) into v_child_count from public.campaign_territories where parent_territory_id=p_parent_territory_id;
    if v_child_count>=2 then raise exception 'A Lost Valley can contain only two territories'; end if;
    p_owner_id:=v_parent.owner_id;
  else
    select count(*) into v_count from public.campaign_territories
    where campaign_id=p_campaign_id and owner_id=p_owner_id and counts_toward_limit=true;
    if v_count>=12 then raise exception 'A player may own no more than 12 territories'; end if;
  end if;

  select value_min,value_max,value_step into v_min,v_max,v_step
  from public.territory_types where id=p_territory_type_id;
  if v_min is null then
    if p_effect_value is not null then raise exception 'This territory type does not use a variable value'; end if;
    v_value:=null;
  else
    v_value:=coalesce(p_effect_value,public.whr_random_territory_value(p_territory_type_id));
    if v_value<v_min or v_value>v_max or mod(v_value-v_min,coalesce(v_step,1))<>0 then
      raise exception 'Invalid territory value';
    end if;
  end if;

  insert into public.campaign_territories(
    campaign_id,territory_type_id,owner_id,effect_value,parent_territory_id,
    counts_toward_limit,locked_to_parent,created_by
  ) values(
    p_campaign_id,p_territory_type_id,p_owner_id,v_value,p_parent_territory_id,
    p_parent_territory_id is null,p_parent_territory_id is not null,p_created_by
  ) returning id into v_id;

  insert into public.territory_transfer_history(campaign_id,territory_id,from_owner_id,to_owner_id,changed_by,reason)
  values(p_campaign_id,v_id,null,p_owner_id,p_created_by,'Territory created');
  return v_id;
end;
$$;
revoke all on function public.whr_create_campaign_territory_internal(uuid,text,uuid,integer,uuid,uuid) from public;

-- Specific territory creation is campaign-owner-only.
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
begin
  if not public.whr_is_campaign_owner(p_campaign_id,auth.uid()) then
    raise exception 'Only the campaign owner can create a specific territory';
  end if;
  return public.whr_create_campaign_territory_internal(
    p_campaign_id,p_territory_type_id,p_owner_id,p_effect_value,p_parent_territory_id,auth.uid()
  );
end;
$$;
revoke all on function public.whr_create_campaign_territory(uuid,text,uuid,integer,uuid) from public;
grant execute on function public.whr_create_campaign_territory(uuid,text,uuid,integer,uuid) to authenticated;

-- Random generation is fully server-side. Neither the territory type nor a
-- variable value is supplied by the browser.
create or replace function public.whr_generate_random_campaign_territory(
  p_campaign_id uuid,
  p_owner_id uuid
)
returns uuid
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_type text;
  v_child_1 text;
  v_child_2 text;
  v_valley uuid;
  v_is_owner boolean;
begin
  if not public.whr_is_campaign_member(p_campaign_id,auth.uid()) then
    raise exception 'You must be a campaign member to generate a territory';
  end if;
  v_is_owner:=public.whr_is_campaign_owner(p_campaign_id,auth.uid());
  if not v_is_owner and p_owner_id is distinct from auth.uid() then
    raise exception 'Campaign members may generate territories only for themselves';
  end if;
  if p_owner_id is null or not public.whr_is_campaign_member(p_campaign_id,p_owner_id) then
    raise exception 'Territory owner must be a campaign member';
  end if;

  select id into v_type
  from public.territory_types
  where active=true
  order by random()
  limit 1;
  if v_type is null then raise exception 'No active territory types are available'; end if;

  if v_type='lost_valley' then
    v_valley:=public.whr_create_campaign_territory_internal(
      p_campaign_id,'lost_valley',p_owner_id,null,null,auth.uid()
    );
    select id into v_child_1 from public.territory_types
      where active=true and id<>'lost_valley' order by random() limit 1;
    select id into v_child_2 from public.territory_types
      where active=true and id<>'lost_valley' order by random() limit 1;
    perform public.whr_create_campaign_territory_internal(
      p_campaign_id,v_child_1,p_owner_id,null,v_valley,auth.uid()
    );
    perform public.whr_create_campaign_territory_internal(
      p_campaign_id,v_child_2,p_owner_id,null,v_valley,auth.uid()
    );
    return v_valley;
  end if;

  return public.whr_create_campaign_territory_internal(
    p_campaign_id,v_type,p_owner_id,null,null,auth.uid()
  );
end;
$$;
revoke all on function public.whr_generate_random_campaign_territory(uuid,uuid) from public;
grant execute on function public.whr_generate_random_campaign_territory(uuid,uuid) to authenticated;

-- Keep the older Lost Valley RPC for compatibility, but make it owner-only;
-- normal players can no longer choose their random Lost Valley children.
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
  if not public.whr_is_campaign_owner(p_campaign_id,auth.uid()) then
    raise exception 'Only the campaign owner can choose Lost Valley territories';
  end if;
  if p_child_type_1='lost_valley' or p_child_type_2='lost_valley' then
    raise exception 'A Lost Valley cannot contain another Lost Valley';
  end if;
  v_valley:=public.whr_create_campaign_territory_internal(
    p_campaign_id,'lost_valley',p_owner_id,null,null,auth.uid()
  );
  perform public.whr_create_campaign_territory_internal(
    p_campaign_id,p_child_type_1,p_owner_id,null,v_valley,auth.uid()
  );
  perform public.whr_create_campaign_territory_internal(
    p_campaign_id,p_child_type_2,p_owner_id,null,v_valley,auth.uid()
  );
  return v_valley;
end;
$$;
revoke all on function public.whr_create_lost_valley(uuid,uuid,text,text) from public;
grant execute on function public.whr_create_lost_valley(uuid,uuid,text,text) to authenticated;

-- Normal transfers must have a real campaign-member destination; campaign
-- owners can delete a territory if they need to remove it from play.
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
  if not public.whr_is_campaign_member(v_t.campaign_id,auth.uid()) then
    raise exception 'You must be a campaign member to transfer territories';
  end if;
  v_is_campaign_owner:=public.whr_is_campaign_owner(v_t.campaign_id,auth.uid());
  if not v_is_campaign_owner and v_t.owner_id is distinct from auth.uid() then
    raise exception 'You may transfer only territories that you own';
  end if;
  if v_t.parent_territory_id is not null or v_t.locked_to_parent then
    raise exception 'Lost Valley child territories move only with their Lost Valley';
  end if;
  if p_to_owner_id is null or not public.whr_is_campaign_member(v_t.campaign_id,p_to_owner_id) then
    raise exception 'New owner must be a campaign member';
  end if;
  if p_to_owner_id=v_t.owner_id then return; end if;

  select count(*) into v_count from public.campaign_territories
  where campaign_id=v_t.campaign_id and owner_id=p_to_owner_id
    and counts_toward_limit=true and id<>v_t.id;
  if v_count>=12 then raise exception 'The receiving player already owns 12 territories'; end if;

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
end;
$$;
revoke all on function public.whr_transfer_campaign_territory(uuid,uuid,text) from public;
grant execute on function public.whr_transfer_campaign_territory(uuid,uuid,text) to authenticated;
