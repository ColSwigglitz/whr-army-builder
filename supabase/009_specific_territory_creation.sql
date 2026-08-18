-- WHR Army Builder development: campaign-owner specific territory creation.
-- Run after 008_territory_permissions_admin.sql.
--
-- The existing whr_create_campaign_territory RPC already allows the campaign
-- owner to choose an exact territory type, assignee and valid fixed value.
-- This helper adds the equivalent behaviour for Lost Valley and its two locked
-- child territories, including explicit child values where applicable.

create or replace function public.whr_create_lost_valley_manual(
  p_campaign_id uuid,
  p_owner_id uuid,
  p_child_type_1 text,
  p_child_value_1 integer default null,
  p_child_type_2 text default null,
  p_child_value_2 integer default null
)
returns uuid
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_valley uuid;
begin
  if not public.whr_is_campaign_owner(p_campaign_id,auth.uid()) then
    raise exception 'Only the campaign owner can manually create a Lost Valley';
  end if;

  if p_child_type_1 is null or p_child_type_2 is null then
    raise exception 'A Lost Valley requires two attached territories';
  end if;

  if p_child_type_1='lost_valley' or p_child_type_2='lost_valley' then
    raise exception 'A Lost Valley cannot contain another Lost Valley';
  end if;

  v_valley := public.whr_create_campaign_territory(
    p_campaign_id,
    'lost_valley',
    p_owner_id,
    null,
    null
  );

  perform public.whr_create_campaign_territory(
    p_campaign_id,
    p_child_type_1,
    p_owner_id,
    p_child_value_1,
    v_valley
  );

  perform public.whr_create_campaign_territory(
    p_campaign_id,
    p_child_type_2,
    p_owner_id,
    p_child_value_2,
    v_valley
  );

  return v_valley;
end;
$$;

revoke all on function public.whr_create_lost_valley_manual(uuid,uuid,text,integer,text,integer) from public;
grant execute on function public.whr_create_lost_valley_manual(uuid,uuid,text,integer,text,integer) to authenticated;
