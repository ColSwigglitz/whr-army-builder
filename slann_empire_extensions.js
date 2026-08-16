// Slann Empire construction systems: native tribes, handlers, Heirlooms and source restrictions.
(() => {
  const ID="slann_empire";
  const isSlann=()=>state.selectedArmyId===ID&&state.data?.faction?.id===ID;
  const tags=u=>u?.tags||[];
  const heirlooms=()=>state.data?.faction?.systems?.heirlooms||[];
  const heirloomById=id=>heirlooms().find(x=>x.id===id);

  function patchData(){
    if(!isSlann()||state.data.__slannEmpirePatched)return;
    state.data.__slannEmpirePatched=true;
    const swarm=state.data.faction.warMachines.find(u=>u.id==="jungle_swarm");
    if(swarm)swarm.composition={rules:[{when:{instanceNumber:1},category:"regiments"}]};
  }

  const oldCreate=createEntry;
  createEntry=function(sectionKey,unit){
    const e=oldCreate(sectionKey,unit);if(!isSlann())return e;patchData();
    e.slannHeirlooms=[];
    if(unit.id==="slann_animal_handlers")e.optionSelections={beastmasters:1,hounds:5};
    return e;
  };

  const oldAdd=addUnit;
  addUnit=function(sectionKey,unitId){
    if(!isSlann())return oldAdd(sectionKey,unitId);patchData();
    const unit=getUnit(sectionKey,unitId);if(!unit)return;
    if((unit.selection?.maximum===1||tags(unit).includes("zero_one"))&&state.roster.some(e=>e.unitId===unitId)){alert(`${unit.name} may only be included once.`);return;}
    if(tags(unit).includes("native_tribe")&&state.roster.some(e=>tags(getUnit(e.sectionKey,e.unitId)).includes("native_tribe"))){alert("The Slann Empire may include only one Native Tribe regiment in total.");return;}
    return oldAdd(sectionKey,unitId);
  };

  const baseMagicMax=unit=>Number(unit?.magicItems?.maximum??unit?.magicItemLimit??0);
  const heirloomAllowed=unit=>tags(unit).includes("slann")&&unit.id!=="war_altar";
  const oldMaximum=getMagicMaximum;
  getMagicMaximum=function(unit,context){
    const max=oldMaximum(unit,context);
    if(!isSlann()||context!=="character"||!state.draft||!heirloomAllowed(unit))return max;
    return Math.max(0,Number(max||baseMagicMax(unit))-(state.draft.slannHeirlooms||[]).length);
  };

  const oldMagic=getAllowedMagicItems;
  getAllowedMagicItems=function(unit,context){
    let items=oldMagic(unit,context);if(!isSlann())return items;
    const isSkink=tags(unit).includes("skink")||/skink/i.test(unit?.name||"");
    const wizard=tags(unit).includes("wizard")||Boolean(unit?.wizard);
    return items.filter(item=>{
      if(item.id==="dagger_sotek"&&!isSkink)return false;
      if(item.wizardOnly&&!wizard)return false;
      if(item.category==="arcane_item"&&!wizard&&unit?.id!=="war_altar")return false;
      if(unit?.id==="war_altar"&&!['enchanted_item','arcane_item'].includes(item.category))return false;
      return true;
    });
  };

  const oldBanner=renderMagicBannerEditor;
  renderMagicBannerEditor=function(entry,unit){
    if(!isSlann())return oldBanner(entry,unit);
    const banners=[...(state.data.commonMagicItems||[]),...(state.data.factionMagicItems||[])].filter(i=>i.category==="magic_banner"&&(i.id!=="shackle_standard"||unit.id==="lobotomised_slaves"));
    return `<section class="editor-section"><h3 class="editor-section-title">Magic Banner</h3><div class="dialog-field"><label>Banner</label><select data-magic-banner><option value="">None</option>${banners.map(item=>{const used=magicItemUsedElsewhere(item.id,entry.id,"banner");return `<option value="${escapeHtml(item.id)}" ${entry.magicBanner===item.id?"selected":""} ${used&&entry.magicBanner!==item.id?"disabled":""}>${escapeHtml(item.name)} (${formatPoints(item.cost)} pts)</option>`}).join("")}</select></div></section>`;
  };

  function renderHeirlooms(entry,unit){
    if(!heirloomAllowed(unit))return "";
    const selected=entry.slannHeirlooms||[],max=baseMagicMax(unit);
    return `<section class="editor-section"><div class="magic-header"><h3 class="editor-section-title" style="margin:0;">Heirlooms of the Old Slann</h3><span class="magic-counter">${selected.length} / ${max} slots</span></div><div class="field-hint">Technological artefacts: not magical and not unique army-wide, but each occupies a normal magic-item slot. Each character may take each Heirloom once.</div>${heirlooms().map(h=>`<label class="check-row"><input type="checkbox" data-slann-heirloom="${escapeHtml(h.id)}" ${selected.includes(h.id)?"checked":""}><span class="check-row-content"><span class="check-row-title"><span>${escapeHtml(h.name)}</span><span>+${formatPoints(h.cost)} pts</span></span><span class="check-row-sub">${escapeHtml(h.rules)}</span></span></label>`).join("")}</section>`;
  }

  const oldChar=renderCharacterEditor;
  renderCharacterEditor=function(entry,unit){const html=oldChar(entry,unit);return isSlann()?html+renderHeirlooms(entry,unit):html;};

  const oldReg=renderRegimentEditor;
  renderRegimentEditor=function(entry,unit){
    if(isSlann()&&unit.id==="slann_animal_handlers"){
      const o=entry.optionSelections||{};
      return `<section class="editor-section"><h3 class="editor-section-title">Slann Animal Handlers</h3><div class="field-hint">0–1. Slann Beastmasters cost 14 pts each; Lizard Hounds cost 8 pts each. No command, champion or joining characters.</div><div class="dialog-field"><label>Slann Beastmasters</label><input type="number" min="1" step="1" value="${Number(o.beastmasters||1)}" data-slann-beastmasters></div><div class="dialog-field"><label>Lizard Hounds</label><input type="number" min="1" step="1" value="${Number(o.hounds||5)}" data-slann-hounds></div></section>`;
    }
    return oldReg(entry,unit);
  };

  const oldWire=wireEditorControls;
  wireEditorControls=function(){
    oldWire();if(!isSlann()||!state.draft)return;const e=state.draft,u=getUnit(e.sectionKey,e.unitId);
    els.dialogContent.querySelector("[data-slann-beastmasters]")?.addEventListener("input",ev=>{e.optionSelections.beastmasters=Math.max(1,Number(ev.target.value||1));updateDialogTotal();});
    els.dialogContent.querySelector("[data-slann-hounds]")?.addEventListener("input",ev=>{e.optionSelections.hounds=Math.max(1,Number(ev.target.value||1));updateDialogTotal();});
    els.dialogContent.querySelectorAll("[data-slann-heirloom]").forEach(ch=>ch.addEventListener("change",()=>{
      e.slannHeirlooms=e.slannHeirlooms||[];const id=ch.dataset.slannHeirloom;
      if(ch.checked){if(e.slannHeirlooms.length+(e.magicItems||[]).length>=baseMagicMax(u)){alert("This character has no remaining magic-item slots.");ch.checked=false;return;}if(!e.slannHeirlooms.includes(id))e.slannHeirlooms.push(id);}else e.slannHeirlooms=e.slannHeirlooms.filter(x=>x!==id);
      renderEditor();
    }));
  };

  const oldCalc=calculateEntry;
  calculateEntry=function(entry){
    let total=oldCalc(entry);if(!isSlann())return total;const unit=getUnit(entry.sectionKey,entry.unitId);if(!unit)return total;
    if(unit.id==="slann_animal_handlers")total=Number(entry.optionSelections?.beastmasters||1)*14+Number(entry.optionSelections?.hounds||5)*8;
    for(const id of entry.slannHeirlooms||[])total+=Number(heirloomById(id)?.cost||0);
    return total;
  };

  const oldRegPts=calculateRegimentPoints;
  calculateRegimentPoints=function(){
    if(!isSlann())return oldRegPts();let total=0,seen={};
    for(const entry of state.roster){const unit=getUnit(entry.sectionKey,entry.unitId);if(!unit)continue;seen[unit.id]=(seen[unit.id]||0)+1;if(entry.sectionKey==="regiments"){total+=calculateEntry(entry)-calculateChampionCost(entry,unit);continue;}const rule=unit.composition?.rules?.find(r=>r.when?.instanceNumber===seen[unit.id]&&r.category==="regiments");if(rule)total+=calculateEntry(entry);}
    return total;
  };

  const oldStatus=renderArmyStatus;
  renderArmyStatus=function(total){
    oldStatus(total);if(!isSlann())return;
    let slann=0,aux=0;for(const e of state.roster){if(e.sectionKey!=="regiments")continue;const u=getUnit(e.sectionKey,e.unitId);if(tags(u).includes("slann"))slann++;if(tags(u).includes("auxiliary"))aux++;}
    const warnings=[];if(aux>slann)warnings.push(`Slann regiment requirement: ${slann} Slann vs ${aux} Auxiliary. Add ${aux-slann} Slann regiment${aux-slann===1?"":"s"}.`);
    const eligible=state.roster.filter(e=>["characters","specialCharacters"].includes(e.sectionKey)&&tags(getUnit(e.sectionKey,e.unitId)).includes("slann")&&!tags(getUnit(e.sectionKey,e.unitId)).includes("not_general"));
    if(state.roster.length&&!eligible.length)warnings.push("The army General must be a Slann character; add an eligible Slann character.");
    if(warnings.length)els.armyStatus.innerHTML+=`<div class="status-warning">${warnings.map(escapeHtml).join("<br>")}</div>`;
  };

  const oldArmour=calculatePrintedArmourSave;
  calculatePrintedArmourSave=function(entry,unit){
    if(isSlann()){
      if(["skink_hero","skink_shaman","terradon_riders","chameleon_skinks"].includes(unit?.id))return "6+";
      if(["saurus_hero","saurus_temple_guard","saurus_warriors"].includes(unit?.id))return "5+";
      if(["kroxigors","stegadon","salamander"].includes(unit?.id))return "4+";
    }
    return oldArmour(entry,unit);
  };

  const oldPad=rosterPadRow;
  rosterPadRow=function(entry){
    let html=oldPad(entry);if(!isSlann())return html;const unit=getUnit(entry.sectionKey,entry.unitId);
    const add=(pid,label)=>{const p=profileById.get(pid);if(!p)return;const s=p.stats;html+=`<div class="roster-pad-subprofile"><strong>${escapeHtml(label||p.name)}</strong> M ${s.M} WS ${s.WS} BS ${s.BS} S ${s.S} T ${s.T} W ${s.W} I ${s.I} A ${s.A} Ld ${s.Ld}</div>`;};
    if(unit?.id==="slann_animal_handlers"){add("slann_beastmaster","Slann Beastmasters");add("lizard_hound","Lizard Hounds");}
    if(unit?.id==="terradon_riders"){add("terradon","Terradons");add("skink_warrior","Skink Riders");}
    if(unit?.id==="stegadon")add("skink_crew","Skink Crew");
    if(unit?.id==="salamander")add("skink_crew","Skink Handlers");
    return html;
  };
})();
