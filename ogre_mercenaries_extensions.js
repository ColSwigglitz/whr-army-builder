// Ogre Mercenaries faction behaviour: allied tribes, Beastmaster packs and list-construction rules.
(() => {
  const ARMY_ID="ogre_mercenaries";
  const isOgre=()=>state.data?.faction?.id===ARMY_ID && state.selectedArmyId===ARMY_ID;
  const tags=u=>u?.tags||[];
  const has=(u,t)=>tags(u).includes(t);
  const tribe=()=>state.armyOptions?.ogreAllyTribe||"";
  const isAlly=u=>has(u,"ogre_ally");
  const isNativeOgreRegiment=u=>has(u,"ogre")&&!isAlly(u);

  function visibleForTribe(unit){ return !isAlly(unit) || unit.ogreAllyTribe===tribe(); }
  function withFilteredFaction(fn){
    const f=state.data?.faction;if(!f)return fn();
    const saved={characters:f.characters,regiments:f.regiments,warMachines:f.warMachines,specialCharacters:f.specialCharacters};
    f.characters=saved.characters.filter(visibleForTribe);f.regiments=saved.regiments.filter(visibleForTribe);f.warMachines=saved.warMachines.filter(visibleForTribe);
    try{return fn();}finally{Object.assign(f,saved);}
  }

  // WHR core command rules: monstrous regiments receive a musician for free,
  // may buy a standard bearer for 10 pts, and a regiment with a standard may
  // carry a magic banner unless its army-book entry specifically forbids it.
  function patchNativeOgreCommand(){
    for(const unit of state.data?.faction?.regiments||[]){
      if(!isNativeOgreRegiment(unit))continue;
      unit.command={...(unit.command||{}),useGlobalDefaults:true};
      unit.magicBanner={...(unit.magicBanner||{}),allowed:true};
    }
  }

  const oldSelectArmy=selectArmy;
  selectArmy=async function(armyId){
    await oldSelectArmy(armyId);
    if(!isOgre())return;
    state.armyOptions=state.armyOptions||{};
    state.armyOptions.ogreAllyTribe=state.armyOptions.ogreAllyTribe||"";
    patchNativeOgreCommand();
    renderUnitBrowser();renderArmy();
  };

  const oldRenderUnitBrowser=renderUnitBrowser;
  renderUnitBrowser=function(){ if(!isOgre())return oldRenderUnitBrowser(); return withFilteredFaction(()=>oldRenderUnitBrowser()); };

  const oldCreateEntry=createEntry;
  createEntry=function(sectionKey,unit){
    const entry=oldCreateEntry(sectionKey,unit);
    if(!isOgre())return entry;
    if(unit?.id==="ogre_beastmaster_pack"){
      entry.optionSelections=entry.optionSelections||{};
      entry.optionSelections.beastmasters=1;entry.optionSelections.sabretooths=1;
    }
    return entry;
  };

  function zeroOne(unit){return Number(unit?.selection?.maximum||0)===1||has(unit,"zero_one");}
  const oldAddUnit=addUnit;
  addUnit=function(sectionKey,unitId){
    if(!isOgre())return oldAddUnit(sectionKey,unitId);
    const unit=getUnit(sectionKey,unitId);if(!unit)return;
    if(zeroOne(unit)&&state.roster.some(e=>e.unitId===unitId)){alert(`${unit.name} may only be included once.`);return;}
    if(isAlly(unit)&&unit.ogreAllyTribe!==tribe()){alert("Choose that allied tribe before adding this unit.");return;}
    return oldAddUnit(sectionKey,unitId);
  };

  const oldCalculateEntry=calculateEntry;
  calculateEntry=function(entry){
    let total=oldCalculateEntry(entry);if(!isOgre())return total;
    const unit=getUnit(entry.sectionKey,entry.unitId);if(!unit)return total;
    if(unit.id==="ogre_beastmaster_pack"){
      const models=Math.max(0,Number(entry.optionSelections?.beastmasters||0))*30 + Math.max(0,Number(entry.optionSelections?.sabretooths||0))*20;
      // oldCalculateEntry contributes command and magic-banner costs; the pack's
      // own model cost is maintained by the mixed-pack controls above.
      return models+total;
    }
    return total;
  };

  const oldRenderRegimentEditor=renderRegimentEditor;
  renderRegimentEditor=function(entry,unit){
    if(!isOgre()||unit.id!=="ogre_beastmaster_pack")return oldRenderRegimentEditor(entry,unit);
    let html=`<section class="editor-section"><h3 class="editor-section-title">Beastmaster Pack</h3>
      <div class="field-hint">0–1 pack. Ogre Beastmasters cost 30 pts each; Sabretooth Tigers cost 20 pts each.</div>
      <div class="dialog-field"><label>Ogre Beastmasters</label><input type="number" min="1" step="1" value="${Number(entry.optionSelections?.beastmasters||1)}" data-ogre-beastmasters></div>
      <div class="dialog-field"><label>Sabretooth Tigers</label><input type="number" min="1" step="1" value="${Number(entry.optionSelections?.sabretooths||1)}" data-ogre-sabretooths></div>
      <div class="dialog-note">Sabretooth Tigers cause fear and may take manoeuvres as though they have a musician.</div></section>`;
    html+=renderCommandEditor(entry,unit);
    if(entry.command?.standardBearer&&unit.magicBanner?.allowed)html+=renderMagicBannerEditor(entry,unit);
    return html;
  };

  const oldWire=wireEditorControls;
  wireEditorControls=function(){
    oldWire();if(!isOgre()||!state.draft)return;
    els.dialogContent.querySelector("[data-ogre-beastmasters]")?.addEventListener("input",e=>{state.draft.optionSelections.beastmasters=Math.max(1,Number(e.target.value||1));updateDialogTotal();});
    els.dialogContent.querySelector("[data-ogre-sabretooths]")?.addEventListener("input",e=>{state.draft.optionSelections.sabretooths=Math.max(1,Number(e.target.value||1));updateDialogTotal();});
  };

  const oldSave=saveEditor;
  saveEditor=function(){
    if(isOgre()&&state.draft){const u=getUnit(state.draft.sectionKey,state.draft.unitId);if(u?.id==="ogre_beastmaster_pack"&&(Number(state.draft.optionSelections?.beastmasters||0)<1||Number(state.draft.optionSelections?.sabretooths||0)<1)){alert("The Beastmaster pack must include at least one Ogre Beastmaster and one Sabretooth Tiger.");return;}}
    return oldSave();
  };

  const oldMagic=getAllowedMagicItems;
  getAllowedMagicItems=function(unit,context){
    let items=oldMagic(unit,context);if(!isOgre())return items;
    if(isAlly(unit)){
      const source=unit.ogreAllySource;
      return items.filter(item=>!item.ogreAllySource || item.ogreAllySource===source).filter(item=>!["iron_boot","iron_fist","smuckle_buckle"].includes(item.id));
    }
    return items.filter(item=>!item.ogreAllySource);
  };

  const oldBanner=renderMagicBannerEditor;
  renderMagicBannerEditor=function(entry,unit){
    if(!isOgre())return oldBanner(entry,unit);
    const common=state.data.commonMagicItems, faction=state.data.factionMagicItems;
    if(isAlly(unit)){
      state.data.factionMagicItems=faction.filter(item=>item.ogreAllySource===unit.ogreAllySource);
    }else{
      // Native Ogres have no Ogre-specific magic-banner section. Keep the
      // common banner pool, but do not leak imported allied-race banners.
      state.data.factionMagicItems=faction.filter(item=>!item.ogreAllySource);
    }
    try{return oldBanner(entry,unit);}finally{state.data.commonMagicItems=common;state.data.factionMagicItems=faction;}
  };

  function nativeOgrePoints(){return state.roster.reduce((sum,e)=>{const u=getUnit(e.sectionKey,e.unitId);return sum+(!isAlly(u)?calculateEntry(e):0);},0);}
  function alliedMachineCount(){return state.roster.filter(e=>{const u=getUnit(e.sectionKey,e.unitId);return e.sectionKey==="warMachines"&&isAlly(u);}).length;}
  function invalidAllyEntries(){return state.roster.filter(e=>{const u=getUnit(e.sectionKey,e.unitId);return isAlly(u)&&u.ogreAllyTribe!==tribe();});}

  const oldStatus=renderArmyStatus;
  renderArmyStatus=function(total){
    oldStatus(total);if(!isOgre())return;
    const labels={"":"No allied tribe","common_goblins":"Common Goblins","forest_goblins":"Forest Goblins","night_goblins":"Night Goblins","hobgoblins":"Hobgoblins","halflings":"Halflings"};
    const warnings=[];
    if(!state.roster.some(e=>e.sectionKey==="regiments"&&has(getUnit(e.sectionKey,e.unitId),"ogre_core")))warnings.push("The army must include at least one native regiment of Ogres, Ogre Maneaters or Ogre Lead-belchers.");
    if(!state.roster.some(e=>e.sectionKey==="characters"&&has(getUnit(e.sectionKey,e.unitId),"ogre")&&!has(getUnit(e.sectionKey,e.unitId),"bsb")))warnings.push("The army General must be an Ogre character.");
    const allowance=Math.floor(nativeOgrePoints()/1000), machines=alliedMachineCount();if(machines>allowance)warnings.push(`Only ${allowance} allied war machine/chariot${allowance===1?"":"s"} may be included at the current native Ogre points total; ${machines} selected.`);
    if(invalidAllyEntries().length)warnings.push("The roster contains units from an allied tribe other than the currently selected tribe.");
    els.armyStatus.insertAdjacentHTML("beforeend",`<div class="warning-box" style="margin-top:10px"><strong>Allied Tribe</strong><div class="dialog-field" style="margin-top:6px"><select data-ogre-ally-tribe>${Object.entries(labels).map(([v,l])=>`<option value="${v}" ${tribe()===v?"selected":""}>${l}</option>`).join("")}</select></div><div class="field-hint">Choose at most one tribe. Allied characters use their own army-book magic items, never Ogre items.</div>${warnings.length?`<div style="margin-top:8px">${warnings.map(escapeHtml).join("<br>")}</div>`:""}</div>`);
    els.armyStatus.querySelector("[data-ogre-ally-tribe]")?.addEventListener("change",e=>{state.armyOptions.ogreAllyTribe=e.target.value;renderUnitBrowser();renderArmy();});
  };

  function extraRow(label,profileId,notes=""){
    const p=profileById.get(profileId);if(!p)return"";return `<tr class="sub-profile-row"><td class="unit-cell">↳ ${escapeHtml(label)}</td>${rosterPadProfileCells(p)}<td class="save">–</td><td class="notes-cell">${escapeHtml(notes)}</td><td class="points-cell"></td></tr>`;
  }
  const oldPad=rosterPadRow;
  rosterPadRow=function(entry){
    let html=oldPad(entry);if(!isOgre())return html;const u=getUnit(entry.sectionKey,entry.unitId);const rows=[];
    if(u?.id==="ogre_beastmaster_pack")rows.push(extraRow(`${entry.optionSelections?.sabretooths||0} Sabretooth Tiger${Number(entry.optionSelections?.sabretooths||0)===1?"":"s"}`,"sabretooth_tiger","Fear; beastmaster pack"));
    if(u?.id==="rhino_rider")rows.push(extraRow("Rhino","rhino","Fear; heavy-chariot style mount"));
    return rows.length?html.replace("</tr>",`</tr>${rows.join("")}`):html;
  };
})();
