-- WHR Army Builder development: campaign foundation.
-- Run after 001_army_lists.sql, 002_profiles_privacy.sql and 003_account_retention.sql.
--
-- Provides:
--   * extensible campaign types (Phoenix Games is the initial type)
--   * campaign ownership and membership
--   * public/private campaigns
--   * public join applications with an applicant message
--   * owner accept/deny workflow
--   * direct user invitations with accept/decline workflow

create extension if not exists pgcrypto;

create table if not exists public.campaign_types (
  id text primary key,
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.campaign_types (id, name, description, active)
values ('phoenix_games','Phoenix Games','The initial WHR Army Builder campaign format. Additional campaign formats can be added later.',true)
on conflict (id) do update set name=excluded.name, description=excluded.description, active=excluded.active;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_type_id text not null references public.campaign_types(id),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  visibility text not null default 'private' check (visibility in ('public','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_name_length check (char_length(trim(name)) between 3 and 80),
  constraint campaigns_description_length check (char_length(description) <= 500)
);
create index if not exists campaigns_owner_idx on public.campaigns(owner_id);
create index if not exists campaigns_visibility_idx on public.campaigns(visibility);
create index if not exists campaigns_type_idx on public.campaigns(campaign_type_id);

create table if not exists public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);
create index if not exists campaign_members_user_idx on public.campaign_members(user_id);

create table if not exists public.campaign_applications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending','accepted','denied','withdrawn')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null,
  constraint campaign_application_message_length check (char_length(message) <= 500)
);
create unique index if not exists campaign_applications_one_pending on public.campaign_applications(campaign_id, applicant_id) where status='pending';
create index if not exists campaign_applications_campaign_idx on public.campaign_applications(campaign_id,status);
create index if not exists campaign_applications_applicant_idx on public.campaign_applications(applicant_id,status);

create table if not exists public.campaign_invites (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  invited_user_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint campaign_invite_message_length check (char_length(message) <= 500)
);
create unique index if not exists campaign_invites_one_pending on public.campaign_invites(campaign_id, invited_user_id) where status='pending';
create index if not exists campaign_invites_campaign_idx on public.campaign_invites(campaign_id,status);
create index if not exists campaign_invites_user_idx on public.campaign_invites(invited_user_id,status);

create or replace function public.whr_campaign_add_owner_member()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.campaign_members(campaign_id,user_id,role)
  values(new.id,new.owner_id,'owner')
  on conflict(campaign_id,user_id) do update set role='owner';
  return new;
end; $$;
drop trigger if exists whr_campaign_owner_member_trigger on public.campaigns;
create trigger whr_campaign_owner_member_trigger after insert on public.campaigns for each row execute function public.whr_campaign_add_owner_member();

alter table public.campaign_types enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.campaign_applications enable row level security;
alter table public.campaign_invites enable row level security;

drop policy if exists "Campaign types readable by signed in users" on public.campaign_types;
create policy "Campaign types readable by signed in users" on public.campaign_types for select to authenticated using(active=true);

drop policy if exists "Campaigns readable when visible to user" on public.campaigns;
create policy "Campaigns readable when visible to user" on public.campaigns for select to authenticated using(
  visibility='public' or owner_id=auth.uid()
  or exists(select 1 from public.campaign_members cm where cm.campaign_id=campaigns.id and cm.user_id=auth.uid())
  or exists(select 1 from public.campaign_invites ci where ci.campaign_id=campaigns.id and ci.invited_user_id=auth.uid() and ci.status='pending')
);
drop policy if exists "Users can create owned campaigns" on public.campaigns;
create policy "Users can create owned campaigns" on public.campaigns for insert to authenticated with check(owner_id=auth.uid());
drop policy if exists "Owners can update campaigns" on public.campaigns;
create policy "Owners can update campaigns" on public.campaigns for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists "Owners can delete campaigns" on public.campaigns;
create policy "Owners can delete campaigns" on public.campaigns for delete to authenticated using(owner_id=auth.uid());

-- Deliberately avoids self-referencing campaign_members inside its own RLS policy.
-- Users can always read their own membership; owners can read all members; public
-- campaigns expose membership to signed-in users. Private non-owner members do
-- not need other-member visibility for this initial workflow.
drop policy if exists "Campaign membership readable to participants and public campaigns" on public.campaign_members;
create policy "Campaign membership readable to participants and public campaigns" on public.campaign_members for select to authenticated using(
  user_id=auth.uid()
  or exists(select 1 from public.campaigns c where c.id=campaign_members.campaign_id and (c.visibility='public' or c.owner_id=auth.uid()))
);

drop policy if exists "Applicants and owners can read campaign applications" on public.campaign_applications;
create policy "Applicants and owners can read campaign applications" on public.campaign_applications for select to authenticated using(
  applicant_id=auth.uid() or exists(select 1 from public.campaigns c where c.id=campaign_applications.campaign_id and c.owner_id=auth.uid())
);
drop policy if exists "Users can apply to public campaigns" on public.campaign_applications;
create policy "Users can apply to public campaigns" on public.campaign_applications for insert to authenticated with check(
  applicant_id=auth.uid()
  and exists(select 1 from public.campaigns c where c.id=campaign_applications.campaign_id and c.visibility='public' and c.owner_id<>auth.uid())
  and not exists(select 1 from public.campaign_members cm where cm.campaign_id=campaign_applications.campaign_id and cm.user_id=auth.uid())
);
drop policy if exists "Applicants can withdraw pending applications" on public.campaign_applications;
create policy "Applicants can withdraw pending applications" on public.campaign_applications for update to authenticated using(applicant_id=auth.uid() and status='pending') with check(applicant_id=auth.uid() and status='withdrawn');

drop policy if exists "Invitees and owners can read campaign invites" on public.campaign_invites;
create policy "Invitees and owners can read campaign invites" on public.campaign_invites for select to authenticated using(
  invited_user_id=auth.uid() or exists(select 1 from public.campaigns c where c.id=campaign_invites.campaign_id and c.owner_id=auth.uid())
);
drop policy if exists "Owners can create campaign invites" on public.campaign_invites;
create policy "Owners can create campaign invites" on public.campaign_invites for insert to authenticated with check(
  invited_by=auth.uid() and invited_user_id<>auth.uid()
  and exists(select 1 from public.campaigns c where c.id=campaign_invites.campaign_id and c.owner_id=auth.uid())
  and not exists(select 1 from public.campaign_members cm where cm.campaign_id=campaign_invites.campaign_id and cm.user_id=invited_user_id)
);
drop policy if exists "Owners can cancel pending campaign invites" on public.campaign_invites;
create policy "Owners can cancel pending campaign invites" on public.campaign_invites for update to authenticated using(
  status='pending' and exists(select 1 from public.campaigns c where c.id=campaign_invites.campaign_id and c.owner_id=auth.uid())
) with check(status='cancelled');

create or replace function public.whr_decide_campaign_application(p_application_id uuid,p_decision text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_application public.campaign_applications%rowtype; v_owner uuid;
begin
  if p_decision not in('accepted','denied') then raise exception 'Decision must be accepted or denied'; end if;
  select * into v_application from public.campaign_applications where id=p_application_id for update;
  if not found or v_application.status<>'pending' then raise exception 'Application is not pending'; end if;
  select owner_id into v_owner from public.campaigns where id=v_application.campaign_id;
  if v_owner is distinct from auth.uid() then raise exception 'Only the campaign owner can decide this application'; end if;
  update public.campaign_applications set status=p_decision,decided_at=now(),decided_by=auth.uid() where id=p_application_id;
  if p_decision='accepted' then
    insert into public.campaign_members(campaign_id,user_id,role) values(v_application.campaign_id,v_application.applicant_id,'member') on conflict(campaign_id,user_id) do nothing;
    update public.campaign_invites set status='cancelled',responded_at=now() where campaign_id=v_application.campaign_id and invited_user_id=v_application.applicant_id and status='pending';
  end if;
end; $$;
revoke all on function public.whr_decide_campaign_application(uuid,text) from public;
grant execute on function public.whr_decide_campaign_application(uuid,text) to authenticated;

create or replace function public.whr_respond_campaign_invite(p_invite_id uuid,p_response text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_invite public.campaign_invites%rowtype;
begin
  if p_response not in('accepted','declined') then raise exception 'Response must be accepted or declined'; end if;
  select * into v_invite from public.campaign_invites where id=p_invite_id for update;
  if not found or v_invite.status<>'pending' then raise exception 'Invite is not pending'; end if;
  if v_invite.invited_user_id is distinct from auth.uid() then raise exception 'This invite does not belong to the current user'; end if;
  update public.campaign_invites set status=p_response,responded_at=now() where id=p_invite_id;
  if p_response='accepted' then
    insert into public.campaign_members(campaign_id,user_id,role) values(v_invite.campaign_id,v_invite.invited_user_id,'member') on conflict(campaign_id,user_id) do nothing;
    update public.campaign_applications set status='withdrawn',decided_at=now() where campaign_id=v_invite.campaign_id and applicant_id=v_invite.invited_user_id and status='pending';
  end if;
end; $$;
revoke all on function public.whr_respond_campaign_invite(uuid,text) from public;
grant execute on function public.whr_respond_campaign_invite(uuid,text) to authenticated;
