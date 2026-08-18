-- WHR Army Builder development: secure campaign deletion.
-- Run after 011_campaign_security_followup.sql.
--
-- Campaign deletion is owner-only and requires the caller to supply the exact
-- campaign name as an additional destructive-action confirmation.
-- All campaign-owned data is removed by the existing FK ON DELETE CASCADE
-- relationships (members, applications, invites, armies, territories and
-- territory history/value history).

create or replace function public.whr_delete_campaign(
  p_campaign_id uuid,
  p_confirm_name text
)
returns void
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_campaign public.campaigns%rowtype;
begin
  select * into v_campaign
  from public.campaigns
  where id=p_campaign_id
  for update;

  if not found then
    raise exception 'Campaign not found';
  end if;

  if v_campaign.owner_id is distinct from auth.uid() then
    raise exception 'Only the campaign owner can delete this campaign';
  end if;

  if p_confirm_name is null or p_confirm_name is distinct from v_campaign.name then
    raise exception 'Campaign name confirmation does not match';
  end if;

  delete from public.campaigns
  where id=v_campaign.id;
end;
$$;

revoke all on function public.whr_delete_campaign(uuid,text) from public;
grant execute on function public.whr_delete_campaign(uuid,text) to authenticated;
