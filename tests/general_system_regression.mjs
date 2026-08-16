import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const source = fs.readFileSync(path.join(root, 'general_system.js'), 'utf8');

const units = new Map([
  ['lord', {id:'lord', name:'Lord', profileId:'lord_profile', generalEligible:true, tags:[]}],
  ['hero', {id:'hero', name:'Hero', profileId:'hero_profile', generalEligible:true, tags:[]}],
  ['hero_twin', {id:'hero_twin', name:'Second Lord', profileId:'lord_profile', generalEligible:true, tags:[]}],
  ['bsb', {id:'bsb', name:'Battle Standard Bearer', profileId:'lord_profile', generalEligible:true, tags:['bsb']}]
]);
const profiles = new Map([
  ['lord_profile', {id:'lord_profile', stats:{Ld:9}}],
  ['hero_profile', {id:'hero_profile', stats:{Ld:8}}]
]);

const state = {
  data:{
    faction:{id:'test', characters:[...units.values()], specialCharacters:[]},
    globalArmyRules:{general:{mustBeAmongHighestLeadership:true,battleStandardBearerEligible:false,regimentalChampionEligible:false}}
  },
  roster:[
    {id:'a', sectionKey:'characters', unitId:'lord', optionSelections:{}},
    {id:'b', sectionKey:'characters', unitId:'hero', optionSelections:{}},
    {id:'c', sectionKey:'characters', unitId:'bsb', optionSelections:{}}
  ],
  generalEntryId:null,
  currentSaveId:null
};

const context = {
  console,
  state,
  profileById:profiles,
  getUnit:(section, id) => units.get(id),
  document:{head:{insertAdjacentHTML(){}}, createElement(){return {};}, body:{appendChild(){}}},
  window:{alert(){}},
  els:{roster:null, armyStatus:{insertAdjacentHTML(){}}},
  renderArmy(){},
  renderArmyStatus(){},
  makeRosterSnapshot(){return {schemaVersion:1};},
  loadRoster:async()=>{},
  getSavedRosters(){return [];},
  newRoster(){},
  selectArmy:async()=>{},
  showArmySelection(){},
  printableUnitName(entry, unit){return unit.name;},
  escapeHtml:value=>String(value)
};
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(source, context, {filename:'general_system.js'});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(context.window.whrGeneral.highestEligibleLeadership() === 9, 'Highest eligible Leadership should be 9');
let permitted = context.window.whrGeneral.permittedGeneralEntries();
assert(permitted.length === 1 && permitted[0].id === 'a', 'Only the highest-Ld non-BSB character should initially be permitted');
assert(!context.window.whrGeneral.entryGeneralEligible(state.roster[2]), 'BSB must not be eligible as General');

state.roster.push({id:'d', sectionKey:'characters', unitId:'hero_twin', optionSelections:{}});
permitted = context.window.whrGeneral.permittedGeneralEntries();
assert(permitted.length === 2 && permitted.some(e=>e.id==='a') && permitted.some(e=>e.id==='d'), 'Equal highest-Ld characters should both be valid General choices');

context.window.whrGeneral.setGeneral('d');
assert(state.generalEntryId === 'd', 'Selecting a permitted General should store its roster entry id');
const snapshot = context.makeRosterSnapshot();
assert(snapshot.generalEntryId === 'd' && snapshot.schemaVersion >= 2, 'Saved roster snapshot should persist General selection');
assert(context.printableUnitName(state.roster[3], units.get('hero_twin')).includes('[GENERAL]'), 'Roster Pad name should mark the General');

console.log('General system regression checks passed.');
