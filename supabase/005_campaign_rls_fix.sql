-- WHR Army Builder development: fix recursive campaign RLS policies.
-- Run after 004_campaign_foundation.sql.
--
-- 004 used policies where campaigns queried campaign_members/campaign_invites,
-- while those tables queried campaigns in their own policies. PostgreSQL then
-- recursively re-evaluated the policies and raised:
--   infinite recursion detected in policy for relation "campaigns"
--
-- These SECURITY DEFINER helpers perform the cross-table ownership/membership
-- checks without re-entering RLS on every hop.

create or replace function public.whr_is_campaign_owner(p_campaign_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path=public,auth
as $$
  select exists(
    select 1
    from public.campaigns c
    where c.id = p_campaign_id
      and c.owner_id = p_user_id
  );
$$;

create or replace function public.whr_is_campaign_member(p_campaign_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path=public,auth
as $$
  select exists(
    select 1
    from public.campaign_members cm
    where cm.campaign_id = p_campaign_id
      and cm.user_id = p_user_id
  );
$$;

create or replace function public.whr_has_pending_campaign_invite(p_campaign_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path=public,auth
as $$
  select exists(
    select 1
    from public.campaign_invites ci
    where ci.campaign_id = p_campaign_id
      and ci.invited_user_id = p_user_id
      and ci.status = 'pending'
  );
$$;

revoke all on function public.whr_is_campaign_owner(uuid,uuid) from public;
revoke all on function public.whr_is_campaign_member(uuid,uuid) from public;
revoke all on function public.whr_has_pending_campaign_invite(uuid,uuid) from public;
grant execute on function public.whr_is_campaign_owner(uuid,uuid) to authenticated;
grant execute on function public.whr_is_campaign_member(uuid,uuid) to authenticated;
grant execute on function public.whr_has_pending_campaign_invite(uuid,uuid) to authenticated;

-- Campaign visibility no longer directly queries RLS-protected child tables.
drop policy if exists "Campaigns readable when visible to user" on public.campaigns;
create policy "Campaigns readable when visible to user"
on public.campaigns
for select
to authenticated
using (
  visibility = 'public'
  or owner_id = auth.uid()
  or public.whr_is_campaign_member(id, auth.uid())
  or public.whr_has_pending_campaign_invite(id, auth.uid())
);

-- Membership policy no longer queries campaigns directly.
drop policy if exists "Campaign membership readable to participants and public campaigns" on public.campaign_members;
create policy "Campaign membership readable to participants and public campaigns"
on public.campaign_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.whr_is_campaign_owner(campaign_id, auth.uid())
  or exists (
    select 1
    from public.campaigns c
    where c.id = campaign_members.campaign_id
      and c.visibility = 'public'
  )
);

-- The public-campaign membership check above can still enter campaigns RLS.
-- Use a helper for visibility too, so there are no cross-policy cycles at all.
create or replace function public.whr_is_campaign_public(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1
    from public.campaigns c
    where c.id = p_campaign_id
      and c.visibility = 'public'
  );
$$;

revoke all on function public.whr_is_campaign_public(uuid) from public;
grant execute on function public.whr_is_campaign_public(uuid) to authenticated;

drop policy if exists "Campaign membership readable to participants and public campaigns" on public.campaign_members;
create policy "Campaign membership readable to participants and public campaigns"
on public.campaign_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.whr_is_campaign_owner(campaign_id, auth.uid())
  or public.whr_is_campaign_public(campaign_id)
);

-- Applications: applicant can see own; owner can see campaign applications.
drop policy if exists "Applicants and owners can read campaign applications" on public.campaign_applications;
create policy "Applicants and owners can read campaign applications"
on public.campaign_applications
for select
to authenticated
using (
  applicant_id = auth.uid()
  or public.whr_is_campaign_owner(campaign_id, auth.uid())
);

-- Applying no longer directly queries campaigns/members under RLS.
drop policy if exists "Users can apply to public campaigns" on public.campaign_applications;
create policy "Users can apply to public campaigns"
on public.campaign_applications
for insert
to authenticated
with check (
  applicant_id = auth.uid()
  and public.whr_is_campaign_public(campaign_id)
  and not public.whr_is_campaign_owner(campaign_id, auth.uid())
  and not public.whr_is_campaign_member(campaign_id, auth.uid())
);

-- Invites: invitee can see own; campaign owner can manage them.
drop policy if exists "Invitees and owners can read campaign invites" on public.campaign_invites;
create policy "Invitees and owners can read campaign invites"
on public.campaign_invites
for select
to authenticated
using (
  invited_user_id = auth.uid()
  or public.whr_is_campaign_owner(campaign_id, auth.uid())
);

drop policy if exists "Owners can create campaign invites" on public.campaign_invites;
create policy "Owners can create campaign invites"
on public.campaign_invites
for insert
to authenticated
with check (
  invited_by = auth.uid()
  and invited_user_id <> auth.uid()
  and public.whr_is_campaign_owner(campaign_id, auth.uid())
  and not public.whr_is_campaign_member(campaign_id, invited_user_id)
);

drop policy if exists "Owners can cancel pending campaign invites" on public.campaign_invites;
create policy "Owners can cancel pending campaign invites"
on public.campaign_invites
for update
to authenticated
using (
  status = 'pending'
  and public.whr_is_campaign_owner(campaign_id, auth.uid())
)
with check (status = 'cancelled');
