// Completes Ogre allied-tribe entries that are absent from the current O&G dataset,
// and enforces the Ogre-list-specific allied magic restrictions.
(() => {
  const isOgre = () => state.data?.faction?.id === "ogre_mercenaries" && state.selectedArmyId === "ogre_mercenaries";
  const allyTags = tribe => ["ogre_ally", `ogre_ally_${tribe}`, "ogre_ally_source_orcs_goblins"];
  const P = "ogre_ally_";

  function addUnique(list, value) {
    if (!list.some(x => x.id === value.id)) list.push(value);
  }

  function goblinChampion(name, profileId) {
    return {
      name,
      profileId,
      cost: {base:10, add:{type:"unit_model_cost"}},
      magicItems: {max:1}
    };
  }

  function patchData() {
    if (!isOgre() || state.data.__ogreFinalPatched) return;
    const data = state.data;
    const faction = data.faction;

    // Ogre-allied Halflings explicitly do NOT use Liberated Magic.
    // Hobgoblins use the O&G pool which the Chaos Dwarf dataset exposes with og_ IDs,
    // not Chaos Dwarf items or Daemonic Rewards.
    data.factionMagicItems = (data.factionMagicItems || []).filter(item => {
      if (item.ogreAllySource === "halflings_moot") return false;
      if (item.ogreAllySource === "chaos_dwarfs") return item.id.startsWith("ogally_chaos_dwarfs_og_");
      return true;
    });

    const profiles = [
      {id:P+"forest_goblin",name:"Forest Goblin",stats:{M:4,WS:2,BS:3,S:3,T:3,W:1,I:2,A:1,Ld:5}},
      {id:P+"forest_goblin_champion",name:"Forest Goblin Champion",stats:{M:4,WS:3,BS:4,S:4,T:3,W:1,I:3,A:2,Ld:5}},
      {id:P+"night_goblin",name:"Night Goblin",stats:{M:4,WS:2,BS:3,S:3,T:3,W:1,I:2,A:1,Ld:5}},
      {id:P+"night_goblin_champion",name:"Night Goblin Champion",stats:{M:4,WS:3,BS:4,S:4,T:3,W:1,I:3,A:2,Ld:5}},
      {id:P+"night_goblin_fanatic",name:"Night Goblin Fanatic",stats:{M:"2D6",WS:2,BS:3,S:5,T:3,W:1,I:1,A:"1D6",Ld:5}},
      {id:P+"cave_squig",name:"Cave Squig",stats:{M:"2D6",WS:4,BS:0,S:5,T:3,W:1,I:5,A:2,Ld:2}}
    ];
    profiles.forEach(p => addUnique(data.profiles, p));

    const eq = [
      {id:P+"spear",name:"Spear",type:"melee_weapon"},
      {id:P+"double_handed_weapon",name:"Double Handed Weapon",type:"melee_weapon"},
      {id:P+"short_bow",name:"Short Bow",type:"missile_weapon"},
      {id:P+"shield",name:"Shield",type:"armour"},
      {id:P+"prodder",name:"Prodder (Spear)",type:"melee_weapon"},
      {id:P+"nets_clubs",name:"Nets and Clubs",type:"melee_weapon"}
    ];
    eq.forEach(e => addUnique(data.equipment, e));

    const forest = {
      id:P+"forest_goblin_infantry",
      name:"Forest Goblin Infantry — Allied",
      profileId:P+"forest_goblin",
      unitType:"infantry",
      points:{type:"per_model",value:2.5}, size:{minimum:5},
      tags:allyTags("forest_goblins"), ogreAllyTribe:"forest_goblins", ogreAllySource:"orcs_goblins",
      options:[
        {id:"weapon",type:"choice_group",choices:[
          {id:P+"spear",label:"Spears",cost:{type:"per_model",value:0.5},addsEquipment:[P+"spear"]},
          {id:P+"double_handed_weapon",label:"Double Handed Weapons",cost:{type:"per_model",value:2},addsEquipment:[P+"double_handed_weapon"]},
          {id:P+"short_bow",label:"Short Bows",cost:{type:"per_model",value:1},addsEquipment:[P+"short_bow"]}
        ]},
        {id:"shields",type:"toggle",cost:{type:"per_model",value:0.5},addsEquipment:[P+"shield"],rules:"Not available if armed with short bows."}
      ],
      champion:goblinChampion("Forest Goblin Champion",P+"forest_goblin_champion"),
      magicBanner:{allowed:true},
      rules:["Fear Elves unless they outnumber them two-to-one.","May traverse woods without movement reduction.","Ogre ally: the Forest Goblin poisoned-arrow army upgrade is not available."]
    };

    const nightInfantry = {
      id:P+"night_goblin_infantry",
      name:"Night Goblin Infantry — Allied",
      profileId:P+"night_goblin",
      unitType:"infantry",
      points:{type:"per_model",value:2.5}, size:{minimum:5},
      tags:allyTags("night_goblins"), ogreAllyTribe:"night_goblins", ogreAllySource:"orcs_goblins",
      options:[
        {id:"weapon",type:"choice_group",choices:[
          {id:P+"spear",label:"Spears",cost:{type:"per_model",value:0.5},addsEquipment:[P+"spear"]},
          {id:P+"double_handed_weapon",label:"Double Handed Weapons",cost:{type:"per_model",value:2},addsEquipment:[P+"double_handed_weapon"]},
          {id:P+"short_bow",label:"Short Bows",cost:{type:"per_model",value:1},addsEquipment:[P+"short_bow"]}
        ]},
        {id:"fanatics",type:"quantity",minimum:0,maximum:3,cost:{type:"fixed",value:30},rules:"Hidden Night Goblin Fanatics. Fanatic points do not count toward the 50-point regiment-model minimum."},
        {id:"mad_cap_mushroom",type:"toggle",cost:20,rules:"One Fanatic in the army may have a Mad Cap Mushroom; requires at least one Fanatic."},
        {id:"shields",type:"toggle",cost:{type:"per_model",value:0.5},addsEquipment:[P+"shield"],rules:"Not available if armed with short bows."}
      ],
      champion:goblinChampion("Night Goblin Champion",P+"night_goblin_champion"),
      magicBanner:{allowed:true},
      rules:["Fear Elves unless they outnumber them two-to-one.","Hate Dwarfs, but not Chaos Dwarfs.","May conceal up to three Night Goblin Fanatics."]
    };

    const hoppers = {
      id:P+"night_goblin_squig_hoppers",
      name:"Night Goblin Squig-Hoppers — Allied",
      profileId:P+"cave_squig",
      unitType:"infantry",
      points:{type:"per_model",value:25}, size:{minimum:2},
      tags:[...allyTags("night_goblins"),"skirmisher"], ogreAllyTribe:"night_goblins", ogreAllySource:"orcs_goblins",
      command:{musician:{allowed:false},standardBearer:{allowed:false}},
      rules:["No characters may join.","Immune to psychology; no animosity.","Deploy together, then each model acts independently.","Compulsory 2D6 bounce movement; use the Cave Squig profile because the rider does not fight."]
    };

    const hunters = {
      id:P+"night_goblin_squig_hunters",
      name:"Night Goblin Squig-Hunters — Allied",
      profileId:P+"night_goblin",
      unitType:"infantry",
      points:{type:"fixed",value:0},
      tags:allyTags("night_goblins"), ogreAllyTribe:"night_goblins", ogreAllySource:"orcs_goblins",
      command:{musician:{allowed:false},standardBearer:{allowed:false}},
      rules:["Mixed regiment: 6 pts per Night Goblin and 12 pts per Cave Squig.","At least one Night Goblin is required per three Cave Squigs.","No characters, standard, musician or champion may join.","Night Goblins carry prodders (spears); rank-and-file Cave Squigs are unbreakable and may go wild if handlers flee or are lost."]
    };

    const netters = {
      id:P+"night_goblin_netters_clubbers",
      name:"Night Goblin Netters and Clubbers — Allied",
      profileId:P+"night_goblin",
      unitType:"infantry",
      points:{type:"per_model",value:6}, size:{minimum:5},
      equipment:[P+"nets_clubs"],
      tags:allyTags("night_goblins"), ogreAllyTribe:"night_goblins", ogreAllySource:"orcs_goblins",
      champion:goblinChampion("Night Goblin Champion",P+"night_goblin_champion"),
      magicBanner:{allowed:true},
      rules:["Nets and clubs count as double handed weapons, but strike first regardless of the normal double-handed-weapon strike-last rule.","Fear Elves unless they outnumber them two-to-one; hate Dwarfs but not Chaos Dwarfs."]
    };

    [forest,nightInfantry,hoppers,hunters,netters].forEach(unit => addUnique(faction.regiments, unit));
    data.__ogreFinalPatched = true;
    buildIndexes();
  }

  const oldSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await oldSelectArmy(armyId);
    if (!isOgre()) return;
    patchData();
    renderUnitBrowser(); renderArmy();
  };

  const oldLoadRoster = loadRoster;
  loadRoster = async function(id) {
    const result = await oldLoadRoster(id);
    if (isOgre()) { patchData(); renderUnitBrowser(); renderArmy(); }
    return result;
  };

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (!isOgre()) return entry;
    if (unit?.id === P+"night_goblin_squig_hunters") {
      entry.optionSelections = entry.optionSelections || {};
      entry.optionSelections.night_goblins = 5;
      entry.optionSelections.cave_squigs = 2;
    }
    return entry;
  };

  const oldCalculate = calculateEntry;
  calculateEntry = function(entry) {
    if (!isOgre()) return oldCalculate(entry);
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (unit?.id === P+"night_goblin_squig_hunters") {
      return 6 * Math.max(0, Number(entry.optionSelections?.night_goblins || 0)) + 12 * Math.max(0, Number(entry.optionSelections?.cave_squigs || 0));
    }
    return oldCalculate(entry);
  };

  const oldRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isOgre() || unit.id !== P+"night_goblin_squig_hunters") return oldRegimentEditor(entry, unit);
    return `<section class="editor-section"><h3 class="editor-section-title">Squig-Hunter Pack</h3>
      <div class="field-hint">6 pts per Night Goblin; 12 pts per Cave Squig. At least one Night Goblin is required for every three Cave Squigs.</div>
      <div class="dialog-field"><label>Night Goblin handlers</label><input type="number" min="1" step="1" value="${Number(entry.optionSelections?.night_goblins || 5)}" data-ogre-night-handlers></div>
      <div class="dialog-field"><label>Cave Squigs</label><input type="number" min="1" step="1" value="${Number(entry.optionSelections?.cave_squigs || 2)}" data-ogre-cave-squigs></div>
      <div class="dialog-note">No standard, musician, champion or joined characters.</div></section>`;
  };

  const oldWire = wireEditorControls;
  wireEditorControls = function() {
    oldWire();
    if (!isOgre() || !state.draft) return;
    els.dialogContent.querySelector("[data-ogre-night-handlers]")?.addEventListener("input", e => { state.draft.optionSelections.night_goblins = Math.max(1, Number(e.target.value || 1)); updateDialogTotal(); });
    els.dialogContent.querySelector("[data-ogre-cave-squigs]")?.addEventListener("input", e => { state.draft.optionSelections.cave_squigs = Math.max(1, Number(e.target.value || 1)); updateDialogTotal(); });
  };

  const oldSave = saveEditor;
  saveEditor = function() {
    if (isOgre() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (unit?.id === P+"night_goblin_squig_hunters") {
        const ng = Number(state.draft.optionSelections?.night_goblins || 0), sq = Number(state.draft.optionSelections?.cave_squigs || 0);
        if (ng < 1 || sq < 1 || sq > ng * 3) { alert("Squig-Hunters require at least one Night Goblin per three Cave Squigs."); return; }
        if (ng * 6 + sq * 12 < 50) { alert("A Squig-Hunter regiment must contain at least 50 points of models."); return; }
      }
      if (unit?.id === P+"night_goblin_infantry") {
        const fanatics = Number(state.draft.optionSelections?.fanatics || 0);
        if (state.draft.optionSelections?.mad_cap_mushroom && fanatics < 1) { alert("A Mad Cap Mushroom requires at least one hidden Fanatic."); return; }
        if (state.draft.optionSelections?.mad_cap_mushroom && state.roster.some(e => e.id !== state.draft.id && e.optionSelections?.mad_cap_mushroom)) { alert("Only one Night Goblin Fanatic in the army may have a Mad Cap Mushroom."); return; }
        if (state.draft.optionSelections?.shields && state.draft.optionSelections?.weapon === P+"short_bow") { alert("Night Goblins with short bows cannot also take shields."); return; }
      }
      if (unit?.id === P+"forest_goblin_infantry" && state.draft.optionSelections?.shields && state.draft.optionSelections?.weapon === P+"short_bow") { alert("Forest Goblins with short bows cannot also take shields."); return; }
    }
    return oldSave();
  };

  function profileRow(label, profileId, notes="") {
    const p = profileById.get(profileId); if (!p) return "";
    return `<tr class="sub-profile-row"><td class="unit-cell">↳ ${escapeHtml(label)}</td>${rosterPadProfileCells(p)}<td class="save">–</td><td class="notes-cell">${escapeHtml(notes)}</td><td class="points-cell"></td></tr>`;
  }
  const oldPad = rosterPadRow;
  rosterPadRow = function(entry) {
    let html = oldPad(entry); if (!isOgre()) return html;
    const unit = getUnit(entry.sectionKey, entry.unitId); const rows=[];
    if (unit?.id === P+"night_goblin_squig_hunters") rows.push(profileRow(`${entry.optionSelections?.cave_squigs || 0} Cave Squigs`,P+"cave_squig","Mixed Squig-Hunter regiment"));
    if (unit?.id === P+"night_goblin_infantry" && Number(entry.optionSelections?.fanatics || 0)) rows.push(profileRow(`${entry.optionSelections.fanatics} Night Goblin Fanatic${Number(entry.optionSelections.fanatics)===1?"":"s"}`,P+"night_goblin_fanatic",entry.optionSelections?.mad_cap_mushroom?"One has Mad Cap Mushroom":"Hidden Fanatics"));
    return rows.length ? html.replace("</tr>",`</tr>${rows.join("")}`) : html;
  };
})();
