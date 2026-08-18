-- WHR Army Builder development: campaign security follow-up.
-- Run after 010_campaign_security_hardening.sql.
--
-- Private campaign members now need to see fellow members so they can transfer
-- territories to them. This is safe to expose only within the same campaign.
-- Also replace the remaining arbitrary-user membership helper used by the
-- invite INSERT policy with an owner-scoped helper.

create or replace function public.whr_campaign_owner_can_check_member(
  p_campaign_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path=public,auth
as $$
  select
    public.whr_is_campaign_owner(p_campaign_id,auth.uid())
    and exists(
      select 1 from public.campaign_members cm
      where cm.campaign_id=p_campaign_id and cm.user_id=p_user_id
    );
$$;

revoke all on function public.whr_campaign_owner_can_check_member(uuid,uuid) from public;
grant execute on function public.whr_campaign_owner_can_check_member(uuid,uuid) to authenticated;

drop policy if exists "Campaign membership readable to participants and public campaigns" on public.campaign_members;
create policy "Campaign membership readable to participants and public campaigns"
on public.campaign_members for select to authenticated
using(
  public.whr_is_current_user_campaign_member(campaign_id)
  or public.whr_is_current_user_campaign_owner(campaign_id)
  or public.whr_is_campaign_public(campaign_id)
);

drop policy if exists "Owners can create campaign invites" on public.campaign_invites;
create policy "Owners can create campaign invites"
on public.campaign_invites for insert to authenticated
with check(
  invited_by=auth.uid()
  and invited_user_id<>auth.uid()
  and public.whr_is_current_user_campaign_owner(campaign_id)
  and not public.whr_campaign_owner_can_check_member(campaign_id,invited_user_id)
);
