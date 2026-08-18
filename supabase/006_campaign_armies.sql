-- WHR Army Builder development: campaign-associated armies.
-- Run after 005_campaign_rls_fix.sql.

alter table public.army_lists
  add column if not exists campaign_id uuid references public.campaigns(id) on delete cascade;

create index if not exists army_lists_campaign_id_idx
  on public.army_lists(campaign_id, updated_at desc);

-- Campaign identity is stored in roster_data by the browser. Keep the relational
-- campaign_id column in sync, and reject attempts to associate an army with a
-- campaign the owner is not a member of.
create or replace function public.whr_sync_campaign_army()
returns trigger
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_campaign_text text;
  v_campaign_id uuid;
begin
  v_campaign_text := nullif(new.roster_data->>'campaignId', '');

  if v_campaign_text is null then
    new.campaign_id := null;
    return new;
  end if;

  begin
    v_campaign_id := v_campaign_text::uuid;
  exception when invalid_text_representation then
    raise exception 'Invalid campaign id in roster data';
  end;

  if not public.whr_is_campaign_member(v_campaign_id, new.owner_id) then
    raise exception 'Army owner is not a member of this campaign';
  end if;

  new.campaign_id := v_campaign_id;
  return new;
end;
$$;

revoke all on function public.whr_sync_campaign_army() from public;

drop trigger if exists whr_sync_campaign_army_trigger on public.army_lists;
create trigger whr_sync_campaign_army_trigger
before insert or update of roster_data, owner_id
on public.army_lists
for each row execute function public.whr_sync_campaign_army();

-- Existing owner policies are tightened so a campaign association can only be
-- written while the owner is still a member of that campaign.
drop policy if exists "Owners can insert armies" on public.army_lists;
create policy "Owners can insert armies"
on public.army_lists
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and (campaign_id is null or public.whr_is_campaign_member(campaign_id, auth.uid()))
);

drop policy if exists "Owners can update armies" on public.army_lists;
create policy "Owners can update armies"
on public.army_lists
for update
to authenticated
using (owner_id = auth.uid())
with check (
  owner_id = auth.uid()
  and (campaign_id is null or public.whr_is_campaign_member(campaign_id, auth.uid()))
);

-- Campaign members may see armies associated with their campaign regardless of
-- the army's normal Private / Shared flag. Editing and deleting remain owner-only.
drop policy if exists "Campaign members can read campaign armies" on public.army_lists;
create policy "Campaign members can read campaign armies"
on public.army_lists
for select
to authenticated
using (
  campaign_id is not null
  and public.whr_is_campaign_member(campaign_id, auth.uid())
);

-- Backfill campaign_id for any campaign roster payloads created before this
-- migration was installed.
update public.army_lists
set campaign_id = nullif(roster_data->>'campaignId','')::uuid
where campaign_id is null
  and nullif(roster_data->>'campaignId','') is not null;
