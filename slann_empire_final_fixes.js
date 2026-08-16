// Final Slann Empire source-completeness and printed-profile fixes.
(() => {
  const ID="slann_empire";
  const isSlann=()=>state.selectedArmyId===ID&&state.data?.faction?.id===ID;
  const byId=(section,id)=>(state.data?.faction?.[section]||[]).find(u=>u.id===id);

  function patchData(){
    if(!isSlann()||state.data.__slannEmpireFinalPatched)return;
    state.data.__slannEmpireFinalPatched=true;

    const equip={
      lobotomised_slaves:["shield"],
      slann_warriors:["light_armour","shield"],
      slann_venom_tribes:["blowpipe"],
      slann_totem_warriors:["light_armour","shield"],
      slann_totem_cold_one_riders:["light_armour","spear","shield"],
      kroxigors:["double_handed_weapon"],
      saurus_temple_guard:["halberd"],
      saurus_warriors:["hand_weapon","shield"],
      native_halflings:["blowpipe"],
      native_ghouls:["blowpipe"],
      native_amazons:["additional_hand_weapon","bow"],
      chameleon_skinks:["blowpipe"]
    };
    for(const [id,items] of Object.entries(equip)){const u=byId("regiments",id);if(u)u.fixedEquipment=items;}

    const venom=byId("regiments","slann_venom_tribes");
    if(venom){venom.tags=(venom.tags||[]).filter(t=>t!=="skirmisher");venom.command={useGlobalDefaults:true};}

    const riders=byId("regiments","slann_totem_cold_one_riders");
    if(riders)riders.unitMount={mountId:"cold_one",name:"Cold Ones"};
    const terradons=byId("regiments","terradon_riders");
    if(terradons)terradons.unitMount={mountId:"terradon",name:"Terradons"};

    // Treat each Swarm base as an individual roster entry so exactly the first
    // 40-point base contributes to Regiments and later bases count as Monsters.
    const swarm=byId("warMachines","jungle_swarm");
    if(swarm){swarm.points={type:"fixed",value:40};swarm.size=undefined;swarm.composition={rules:[{when:{instanceNumber:1},category:"regiments"}]};}
  }

  const oldSelect=selectArmy;
  selectArmy=async function(id){await oldSelect(id);if(isSlann()){patchData();renderUnitBrowser();renderArmy();}};

  const oldCreate=createEntry;
  createEntry=function(sectionKey,unit){const e=oldCreate(sectionKey,unit);if(!isSlann())return e;patchData();if(unit?.id==="slann_totem_cold_one_riders")e.slannChampionHornedOne=false;return e;};

  const oldReg=renderRegimentEditor;
  renderRegimentEditor=function(entry,unit){let html=oldReg(entry,unit);if(!isSlann()||unit?.id!=="slann_totem_cold_one_riders"||!entry.champion?.selected)return html;return html+`<section class="editor-section"><h3 class="editor-section-title">Spawn Master Mount</h3><label class="check-row"><input type="checkbox" data-slann-champ-horned ${entry.slannChampionHornedOne?"checked":""}><span class="check-row-content"><span class="check-row-title"><span>Replace the Spawn Master's Cold One with a Horned One</span><span>+10 pts</span></span><span class="check-row-sub">The ordinary riders remain mounted on Cold Ones.</span></span></label></section>`;};

  const oldWire=wireEditorControls;
  wireEditorControls=function(){oldWire();if(!isSlann()||!state.draft)return;els.dialogContent.querySelector("[data-slann-champ-horned]")?.addEventListener("change",ev=>{state.draft.slannChampionHornedOne=ev.target.checked;updateDialogTotal();});};

  const oldCalc=calculateEntry;
  calculateEntry=function(entry){let total=oldCalc(entry);if(isSlann()&&entry.unitId==="slann_totem_cold_one_riders"&&entry.champion?.selected&&entry.slannChampionHornedOne)total+=10;return total;};

  const oldSave=saveEditor;
  saveEditor=function(){if(isSlann()&&state.draft?.unitId==="slann_totem_cold_one_riders"&&!state.draft.champion?.selected)state.draft.slannChampionHornedOne=false;return oldSave();};

  function improve(result,steps=1){if(result==="–")return result;const n=Number(String(result).replace("+",""));return Number.isFinite(n)?`${Math.max(2,n-steps)}+`:result;}
  function selectedIds(entry,unit){return new Set(getSelectedEquipmentIds(entry,unit));}
  const previousArmour=calculatePrintedArmourSave;
  calculatePrintedArmourSave=function(entry,unit){
    patchData();
    if(!isSlann())return previousArmour(entry,unit);

    const id=unit?.id, eq=selectedIds(entry,unit);
    const natural = ["skink_hero","skink_shaman","terradon_riders","chameleon_skinks"].includes(id)?6:
      ["saurus_hero","saurus_temple_guard","saurus_warriors"].includes(id)?5:
      ["kroxigors","stegadon","salamander"].includes(id)?4:null;

    if(natural!=null){
      let save=natural;
      if(eq.has("light_armour"))save--;
      if(eq.has("heavy_armour"))save-=2;
      if(eq.has("shield"))save--;
      const mounted=Boolean(entry.mount)||Boolean(unit.unitMount?.mountId)||unit.unitType==="cavalry";
      if(mounted)save--;
      const cold=entry.mount==="cold_one"||entry.mount==="horned_one"||unit.unitMount?.mountId==="cold_one";
      if(cold)save--;
      return `${Math.max(2,save)}+`;
    }

    let result=previousArmour(entry,unit);
    const cold=entry.mount==="cold_one"||entry.mount==="horned_one"||unit?.unitMount?.mountId==="cold_one";
    if(cold)result=improve(result,1);
    return result;
  };

  const oldNotes=rosterPadNotes;
  rosterPadNotes=function(entry,unit){const notes=oldNotes(entry,unit);if(isSlann()&&unit?.id==="slann_totem_cold_one_riders"&&entry.champion?.selected&&entry.slannChampionHornedOne)notes.push("Spawn Master rides a Horned One (+10 pts)");return [...new Set(notes)];};

  const oldPad=rosterPadRow;
  rosterPadRow=function(entry){let html=oldPad(entry);if(!isSlann())return html;const unit=getUnit(entry.sectionKey,entry.unitId);if(unit?.id==="slann_totem_cold_one_riders"&&entry.champion?.selected&&entry.slannChampionHornedOne){const p=profileById.get("horned_one");if(p){const s=p.stats;html+=`<div class="roster-pad-subprofile"><strong>Spawn Master's Horned One</strong> M ${s.M} WS ${s.WS} BS ${s.BS} S ${s.S} T ${s.T} W ${s.W} I ${s.I} A ${s.A} Ld ${s.Ld}</div>`;}}return html;};
})();
