-- Thorskins Island team campaign.
-- Apply after 013_mighty_empires.sql.
-- Owner is the Campaign Master and does NOT consume one of the eight player slots.

insert into public.campaign_types (id,name,description,active)
values ('thorskins_island','Thorskins Island','Eight players in four named teams of two. Each player fields a standard 1,500 point army. Team-mates may view each other''s armies; opposing teams may not. The campaign owner is a separate Campaign Master.',true)
on conflict (id) do update set name=excluded.name,description=excluded.description,active=excluded.active;

create table if not exists public.campaign_teams (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_team_name_length check(char_length(trim(name)) between 2 and 50),
  unique(campaign_id,name)
);

alter table public.campaign_members add column if not exists team_id uuid references public.campaign_teams(id) on delete set null;
create index if not exists campaign_members_team_idx on public.campaign_members(campaign_id,team_id);
create index if not exists campaign_teams_campaign_idx on public.campaign_teams(campaign_id);

alter table public.campaign_teams enable row level security;

drop policy if exists "Campaign teams readable by campaign participants" on public.campaign_teams;
create policy "Campaign teams readable by campaign participants" on public.campaign_teams for select to authenticated using(
  exists(select 1 from public.campaigns c where c.id=campaign_teams.campaign_id and c.owner_id=auth.uid())
  or exists(select 1 from public.campaign_members cm where cm.campaign_id=campaign_teams.campaign_id and cm.user_id=auth.uid())
);

drop policy if exists "Campaign owner or team members can rename teams" on public.campaign_teams;
create policy "Campaign owner or team members can rename teams" on public.campaign_teams for update to authenticated using(
  exists(select 1 from public.campaigns c where c.id=campaign_teams.campaign_id and c.owner_id=auth.uid())
  or exists(select 1 from public.campaign_members cm where cm.campaign_id=campaign_teams.campaign_id and cm.team_id=campaign_teams.id and cm.user_id=auth.uid())
) with check(
  exists(select 1 from public.campaigns c where c.id=campaign_teams.campaign_id and c.owner_id=auth.uid())
  or exists(select 1 from public.campaign_members cm where cm.campaign_id=campaign_teams.campaign_id and cm.team_id=campaign_teams.id and cm.user_id=auth.uid())
);

create or replace function public.whr_thorskins_initialise_teams(p_campaign_id uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_owner uuid; v_type text; i integer;
begin
  select owner_id,campaign_type_id into v_owner,v_type from public.campaigns where id=p_campaign_id;
  if v_owner is distinct from auth.uid() then raise exception 'Only the campaign owner can initialise teams'; end if;
  if v_type <> 'thorskins_island' then raise exception 'This is not a Thorskins Island campaign'; end if;
  for i in 1..4 loop
    insert into public.campaign_teams(campaign_id,name) values(p_campaign_id,'Team '||i)
    on conflict(campaign_id,name) do nothing;
  end loop;
end; $$;
revoke all on function public.whr_thorskins_initialise_teams(uuid) from public;
grant execute on function public.whr_thorskins_initialise_teams(uuid) to authenticated;

create or replace function public.whr_thorskins_assign_team(p_campaign_id uuid,p_user_id uuid,p_team_id uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_owner uuid; v_type text; v_players integer; v_team_players integer;
begin
  select owner_id,campaign_type_id into v_owner,v_type from public.campaigns where id=p_campaign_id;
  if v_owner is distinct from auth.uid() then raise exception 'Only the campaign owner can assign teams'; end if;
  if v_type <> 'thorskins_island' then raise exception 'This is not a Thorskins Island campaign'; end if;
  if p_user_id=v_owner then raise exception 'Campaign Master does not occupy a player slot'; end if;
  if not exists(select 1 from public.campaign_teams where id=p_team_id and campaign_id=p_campaign_id) then raise exception 'Team does not belong to campaign'; end if;
  if not exists(select 1 from public.campaign_members where campaign_id=p_campaign_id and user_id=p_user_id and role='member') then raise exception 'User is not a campaign player'; end if;
  select count(*) into v_players from public.campaign_members where campaign_id=p_campaign_id and role='member' and user_id<>v_owner;
  if v_players>8 then raise exception 'Thorskins Island supports exactly eight competing players'; end if;
  select count(*) into v_team_players from public.campaign_members where campaign_id=p_campaign_id and team_id=p_team_id and user_id<>p_user_id and role='member';
  if v_team_players>=2 then raise exception 'Each team can contain only two players'; end if;
  update public.campaign_members set team_id=p_team_id where campaign_id=p_campaign_id and user_id=p_user_id;
end; $$;
revoke all on function public.whr_thorskins_assign_team(uuid,uuid,uuid) from public;
grant execute on function public.whr_thorskins_assign_team(uuid,uuid,uuid) to authenticated;

create or replace function public.whr_can_view_campaign_army(p_campaign_id uuid,p_army_owner uuid)
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists(
    select 1 from public.campaigns c
    where c.id=p_campaign_id and (
      c.owner_id=auth.uid()
      or p_army_owner=auth.uid()
      or (
        c.campaign_type_id='thorskins_island'
        and exists(
          select 1 from public.campaign_members me
          join public.campaign_members them on them.campaign_id=me.campaign_id and them.team_id=me.team_id
          where me.campaign_id=c.id and me.user_id=auth.uid() and me.team_id is not null and them.user_id=p_army_owner
        )
      )
    )
  );
$$;
revoke all on function public.whr_can_view_campaign_army(uuid,uuid) from public;
grant execute on function public.whr_can_view_campaign_army(uuid,uuid) to authenticated;

-- Replace the broad campaign-member visibility from migration 006. For Thorskins
-- Island, the server exposes only the player's own army, their team-mate's army,
-- and all armies to the Campaign Master. Other campaign types retain the existing
-- member visibility behaviour.
drop policy if exists "Campaign members can read campaign armies" on public.army_lists;
create policy "Campaign members can read campaign armies"
on public.army_lists for select to authenticated using (
  campaign_id is not null and (
    public.whr_can_view_campaign_army(campaign_id,owner_id)
    or (
      not exists(select 1 from public.campaigns c where c.id=campaign_id and c.campaign_type_id='thorskins_island')
      and public.whr_is_campaign_member(campaign_id,auth.uid())
    )
  )
);
