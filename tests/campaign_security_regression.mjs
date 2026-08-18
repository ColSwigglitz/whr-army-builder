import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(process.cwd());
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const checks = [];
const check = (name,fn) => {
  try { fn(); checks.push({name,ok:true}); console.log(`PASS  ${name}`); }
  catch (error) { checks.push({name,ok:false,error}); console.error(`FAIL  ${name}\n      ${error.message}`); }
};
const contains = (text,needle,message=needle) => assert.ok(text.includes(needle),`Expected ${message}`);

const m004 = read('supabase/004_campaign_foundation.sql');
const m006 = read('supabase/006_campaign_armies.sql');
const m007 = read('supabase/007_campaign_territories.sql');
const m008 = read('supabase/008_territory_permissions_admin.sql');
const m009 = read('supabase/009_specific_territory_creation.sql');
const m010 = read('supabase/010_campaign_security_hardening.sql');
const m011 = read('supabase/011_campaign_security_followup.sql');
const m012 = read('supabase/012_campaign_deletion.sql');
const randomUi = read('dev_territory_random_server.js');
const deleteUi = read('dev_campaign_delete.js');
const loader = read('global_release_finalize.js');

check('Campaign tables have RLS enabled', () => {
  for (const table of ['campaigns','campaign_members','campaign_applications','campaign_invites'])
    contains(m004,`alter table public.${table} enable row level security`,table);
});

check('Territory tables have RLS enabled', () => {
  for (const table of ['campaign_territories','territory_transfer_history'])
    contains(m007,`alter table public.${table} enable row level security`,table);
  contains(m008,'alter table public.territory_value_history enable row level security','territory value history RLS');
});

check('Territory instances have no direct client write policy', () => {
  const policies = [...`${m007}\n${m008}\n${m009}\n${m010}\n${m011}`.matchAll(/create\s+policy\s+"[^"]+"\s+on\s+public\.campaign_territories[\s\S]*?;/gi)].map(m => m[0].toLowerCase());
  for (const policy of policies) {
    assert.ok(!/for\s+(insert|update|delete)/i.test(policy),`Direct territory write policy found: ${policy.slice(0,120)}`);
  }
});

check('Specific territory creation is owner-only on server', () => {
  contains(m010,'Only the campaign owner can create a specific territory');
  contains(m010,'public.whr_is_campaign_owner(p_campaign_id,auth.uid())');
});

check('Random territory type is selected inside Supabase', () => {
  contains(m010,'create or replace function public.whr_generate_random_campaign_territory');
  contains(m010,'order by random()');
  contains(m010,"if not v_is_owner and p_owner_id is distinct from auth.uid()");
});

check('Browser random flow uses server random RPC', () => {
  contains(randomUi,'whr_generate_random_campaign_territory');
  contains(loader,'dev_territory_random_server.js?v=1');
});

check('Normal users cannot choose arbitrary Lost Valley children', () => {
  contains(m010,'Only the campaign owner can choose Lost Valley territories');
  contains(m009,'Only the campaign owner can manually create a Lost Valley');
});

check('Campaign owner alone can delete territories', () => {
  contains(m008,'Only the campaign owner can delete territories');
});

check('Campaign owner alone can override variable values', () => {
  contains(m008,'Only the campaign owner can change a territory value');
  contains(m008,"if p_effect_value<v_min or p_effect_value>v_max");
});

check('Members can transfer only territories they own', () => {
  contains(m010,"if not v_is_campaign_owner and v_t.owner_id is distinct from auth.uid()");
  contains(m010,"New owner must be a campaign member");
});

check('Lost Valley children cannot transfer independently', () => {
  contains(m010,'Lost Valley child territories move only with their Lost Valley');
  contains(m010,'where parent_territory_id=v_t.id for update');
});

check('12-territory limit is enforced server-side', () => {
  contains(m010,"if v_count>=12 then raise exception 'A player may own no more than 12 territories'");
  contains(m010,"if v_count>=12 then raise exception 'The receiving player already owns 12 territories'");
});

check('Campaign army writes remain owner-only and member-bound', () => {
  contains(m006,'owner_id = auth.uid()');
  contains(m010,'Owners can insert armies');
  contains(m010,'public.whr_is_current_user_campaign_member(campaign_id)');
  const base = read('supabase/001_army_lists.sql');
  contains(base,'for delete');
  contains(base,'using (owner_id = auth.uid())');
});

check('Campaign members can read campaign armies', () => {
  contains(m010,'Campaign members can read campaign armies');
  contains(m010,'public.whr_is_current_user_campaign_member(campaign_id)');
});

check('Private campaign members can discover fellow members for transfers', () => {
  contains(m011,'Campaign membership readable to participants and public campaigns');
  contains(m011,'public.whr_is_current_user_campaign_member(campaign_id)');
});

check('Arbitrary-user membership helper is not executable by authenticated clients', () => {
  contains(m010,'revoke all on function public.whr_is_campaign_member(uuid,uuid) from public');
  assert.ok(!/grant execute on function public\.whr_is_campaign_member\(uuid,uuid\) to authenticated/i.test(m010),'010 must not re-grant arbitrary membership helper');
});

check('Campaign deletion is server-side, owner-only and name-confirmed', () => {
  contains(m012,'create or replace function public.whr_delete_campaign');
  contains(m012,'v_campaign.owner_id is distinct from auth.uid()');
  contains(m012,'p_confirm_name is distinct from v_campaign.name');
  contains(m012,'delete from public.campaigns');
});

check('Campaign-owned records cascade when a campaign is deleted', () => {
  for (const table of ['campaign_members','campaign_applications','campaign_invites'])
    contains(m004,`campaign_id uuid not null references public.campaigns(id) on delete cascade`,`${table} campaign cascade`);
  contains(m006,'campaign_id uuid references public.campaigns(id) on delete cascade','army campaign cascade');
  contains(m007,'campaign_id uuid not null references public.campaigns(id) on delete cascade','territory campaign cascade');
  contains(m008,'campaign_id uuid not null references public.campaigns(id) on delete cascade','territory value history campaign cascade');
});

check('Delete UI requires exact campaign name before enabling destructive action', () => {
  contains(deleteUi,'input.value !== campaign.name');
  contains(deleteUi,'whr_delete_campaign');
  contains(deleteUi,'Delete Campaign Permanently');
  contains(loader,'dev_campaign_delete.js?v=1');
});

check('No Supabase service-role or secret key is committed to browser/source files', () => {
  const skip = new Set(['.git','node_modules']);
  const dangerous = /(service[_-]?role|sb_secret_|SUPABASE_SERVICE_ROLE_KEY)/i;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      if (skip.has(entry.name)) continue;
      const full = path.join(dir,entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(js|mjs|html|css|json)$/i.test(entry.name)) continue;
      const rel = path.relative(root,full);
      if (rel === 'tests/campaign_security_regression.mjs') continue;
      const text = fs.readFileSync(full,'utf8');
      assert.ok(!dangerous.test(text),`Potential privileged Supabase secret marker found in ${rel}`);
    }
  }
  walk(root);
});

const failed = checks.filter(c => !c.ok);
console.log(`\nCampaign security regression: ${checks.length-failed.length}/${checks.length} passed.`);
if (failed.length) process.exit(1);
