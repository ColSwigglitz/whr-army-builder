import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const notes = [];

function fail(message) { failures.push(message); }
function assert(condition, message) { if (!condition) fail(message); }
function readJson(file) { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); }

function loadArmyData(dataFile) {
  const stubPath = path.join(root, 'data', dataFile);
  const stub = JSON.parse(fs.readFileSync(stubPath, 'utf8'));
  let data = stub;

  const fallbackPayload = dataFile.replace(/\.json$/i, '.payload');
  const payloadFile = stub.meta?.payloadFile || (fs.existsSync(path.join(root, 'data', fallbackPayload)) ? fallbackPayload : null);
  if (payloadFile) {
    const encoded = fs.readFileSync(path.join(root, 'data', payloadFile), 'utf8').trim();
    data = JSON.parse(zlib.gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8'));
  }

  if (data.meta?.sharedDataFile) {
    const shared = readJson(path.join('data', data.meta.sharedDataFile));
    data.equipment = [...(shared.equipment || []), ...(data.equipment || [])];
    data.profiles = [...(shared.profiles || []), ...(data.profiles || [])];
    data.mounts = [...(shared.mounts || []), ...(data.mounts || [])];
  }

  // Runtime global_consistency_fixes.js injects this profile/mount for Empire.
  if (data.faction?.id === 'empire') {
    data.profiles = data.profiles || [];
    data.mounts = data.mounts || [];
    if (!data.profiles.some(p => p.id === 'warrior_priest_chariot_profile')) {
      data.profiles.push({id:'warrior_priest_chariot_profile'});
    }
    if (!data.mounts.some(m => m.id === 'warrior_priest_chariot')) {
      data.mounts.push({id:'warrior_priest_chariot',profileId:'warrior_priest_chariot_profile'});
    }
  }

  return data;
}

function auditArmyData() {
  const manifest = readJson('data/armies.json');
  assert(manifest.armies.length === 24, `Expected 24 selectable configurations, found ${manifest.armies.length}`);
  assert(manifest.armies.every(a => a.available), 'Every v1 catalogue army/configuration should be available');

  const seenIds = new Set();
  for (const army of manifest.armies) {
    assert(!seenIds.has(army.id), `Duplicate army id: ${army.id}`);
    seenIds.add(army.id);

    let data;
    try { data = loadArmyData(army.dataFile); }
    catch (error) { fail(`${army.name}: failed to load/inflate data (${error.message})`); continue; }

    const faction = data.faction || {};
    const sections = ['characters', 'regiments', 'warMachines', 'specialCharacters'];
    const units = sections.flatMap(key => (faction[key] || []).map(unit => ({...unit, sectionKey:key})));
    assert(units.length > 0, `${army.name}: no runtime army choices found`);

    const profileIds = new Set((data.profiles || []).map(p => p.id));
    const mountIds = new Set((data.mounts || []).map(m => m.id));

    for (const unit of units) {
      if (unit.profileId) assert(profileIds.has(unit.profileId), `${army.name}: ${unit.name} missing profile ${unit.profileId}`);
      if (unit.champion?.profileId) assert(profileIds.has(unit.champion.profileId), `${army.name}: ${unit.name} champion missing profile ${unit.champion.profileId}`);
      if (unit.crew?.profileId) assert(profileIds.has(unit.crew.profileId), `${army.name}: ${unit.name} crew missing profile ${unit.crew.profileId}`);
      for (const extra of unit.additionalProfiles || []) {
        if (extra.profileId) assert(profileIds.has(extra.profileId), `${army.name}: ${unit.name} additional profile missing ${extra.profileId}`);
      }
      for (const mount of unit.mountOptions || []) {
        assert(mountIds.has(mount.mountId), `${army.name}: ${unit.name} missing mount ${mount.mountId}`);
      }
      if (unit.unitMount?.mountId) assert(mountIds.has(unit.unitMount.mountId), `${army.name}: ${unit.name} missing unit mount ${unit.unitMount.mountId}`);

      if (unit.sectionKey === 'regiments' && unit.points?.type === 'per_model' && Number(unit.points.value) > 0) {
        const sourceMin = Math.max(1, Number(unit.size?.minimum || 1));
        const minimumPoints = Number(data.globalArmyRules?.minimumRegimentModelPoints || 50);
        const required = Math.max(sourceMin, Math.ceil(minimumPoints / Number(unit.points.value)));
        assert(required * Number(unit.points.value) >= minimumPoints, `${army.name}: ${unit.name} cannot satisfy 50-point regiment minimum`);
      }
    }

    notes.push(`${army.name}: ${units.length} choices, ${profileIds.size} profiles, ${mountIds.size} mounts`);
  }
}

async function auditGlobalReleaseRules() {
  const source = fs.readFileSync(path.join(root, 'global_release_rules.js'), 'utf8');
  const commonItems = [
    {id:'enchanted_shield', name:'Enchanted Shield', category:'magic_armour', requirements:['bearer_can_take_shield']},
    {id:'armour_endurance', name:'Armour of Endurance', category:'magic_armour', requirements:['bearer_can_take_heavy_armour']},
    {id:'oaken_armour', name:'Oaken Armour', category:'magic_armour', requirements:['bearer_can_take_light_armour']},
    {id:'flail_skulls', name:'Flail of Skulls', category:'magic_weapon', requirements:['bearer_can_take_flail']}
  ];
  const factionItems = [{id:'tomb_blade', name:'Tomb Blade', category:'magic_weapon'}];
  const itemMap = new Map([...commonItems, ...factionItems].map(i => [i.id, i]));

  const context = {
    console,
    window: {},
    state: {
      data: {
        globalArmyRules:{minimumRegimentModelPoints:50},
        commonMagicItems:commonItems,
        factionMagicItems:factionItems,
        faction:{regiments:[]}
      },
      draft:{magicItems:[], champion:{magicItems:[]}}
    },
    getMagicItem: id => itemMap.get(id),
    getAllowedMagicItems: () => [],
    selectArmy: async () => {},
    renderUnitBrowser: () => {},
    renderArmy: () => {}
  };
  vm.createContext(context);
  vm.runInContext(source, context, {filename:'global_release_rules.js'});

  const unit = {
    magicItems:{maximum:2,allowedPools:['common','undead'],allowedCategories:['magic_weapon','magic_armour']},
    equipmentOptions:[{id:'armour',choices:['heavy_armour'],alsoMayTake:['shield']}]
  };

  let items = context.getAllowedMagicItems(unit, 'character');
  assert(items.some(i => i.id === 'tomb_blade'), 'Faction pool alias (e.g. undead) should expose factionMagicItems');
  assert(items.some(i => i.id === 'enchanted_shield'), 'Shield-eligible bearer should see magic shields');
  assert(items.some(i => i.id === 'armour_endurance'), 'Heavy-armour-eligible bearer should see heavy magic armour');
  assert(!items.some(i => i.id === 'oaken_armour'), 'Bearer without light-armour access should not see light magic armour');
  assert(!items.some(i => i.id === 'flail_skulls'), 'Bearer without flail access should not see a flail-equivalent magic weapon');

  context.state.draft.magicItems = ['enchanted_shield'];
  items = context.getAllowedMagicItems(unit, 'character');
  assert(items.some(i => i.id === 'enchanted_shield'), 'Selected magic armour must remain visible so it can be removed');
  assert(!items.some(i => i.id === 'armour_endurance'), 'A second piece of magic armour must not be selectable');

  const cheap = {points:{type:'per_model',value:3},size:{minimum:5}};
  assert(context.window.whrEffectiveRegimentMinimum(cheap) === 17, '3-point models should require 17 models to reach the 50-point minimum');
  const expensive = {points:{type:'per_model',value:12},size:{minimum:5}};
  assert(context.window.whrEffectiveRegimentMinimum(expensive) === 5, 'Existing minimum should remain when it already exceeds 50 points');
}

auditArmyData();
await auditGlobalReleaseRules();

console.log(`Audited ${notes.length} army configurations.`);
for (const note of notes) console.log(`  ${note}`);
if (failures.length) {
  console.error(`\n${failures.length} regression failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('\nV1 release regression checks passed.');
