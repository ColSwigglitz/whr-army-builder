// Halflings of the Moot: allies, liberated magic, Thieves, flying livestock and one Dwarf Rune Item.
(() => {
  const ID="halflings_moot";
  const isHalfling=()=>state.data?.faction?.id===ID && state.selectedArmyId===ID;
  const tags=u=>u?.tags||[];
  const nativeRegs=()=>state.roster.filter(e=>e.sectionKey==="regiments" && tags(getUnit(e.sectionKey,e.unitId)).includes("halfling_regiment"));
  const empireAllies=()=>state.roster.filter(e=>tags(getUnit(e.sectionKey,e.unitId)).includes("allied_empire"));
  const woodAllies=()=>state.roster.filter(e=>tags(getUnit(e.sectionKey,e.unitId)).includes("allied_wood_elf"));
  const allyLimit=()=>Math.floor(nativeRegs().length/2);
  const foreignItem=id=>getMagicItem(id)?.halflingForeignItem;
  const foreignSource=id=>getMagicItem(id)?.halflingSourceFaction;
  const externalAllowance=()=>Math.max(1,Math.ceil(Number(state.pointsLimit||0)/800));

  function legalLiberatedItem(item) {
    if (!item?.halflingForeignItem) return false;
    if (item.category==="enchanted_item") return true;
    if (item.category==="magic_weapon") {
      const text=`${item.name||""} ${item.rules||""}`.toLowerCase();
      return !/(lance|spear|halberd|flail|double handed|double-handed|great weapon|staff|pistol|crossbow|handgun|throwing|bolas)/.test(text);
    }
    if (item.category==="magic_armour") return /light armour/i.test(String(item.rules||""));
    return false;
  }
  function isNativeHalflingBearer(unit) { return tags(unit).includes("halfling_character") || tags(unit).includes("halfling_regiment"); }
  function selectedForeignCount(ignoreId=null, draft=null) {
    let n=0;
    for (const e of state.roster) {
      if (e.id===ignoreId) continue;
      const u=getUnit(e.sectionKey,e.unitId);
      if (!isNativeHalflingBearer(u)) continue;
      n += (e.magicItems||[]).filter(foreignItem).length;
      n += (e.champion?.magicItems||[]).filter(foreignItem).length;
    }
    if (draft) {
      const u=getUnit(draft.sectionKey,draft.unitId);
      if (isNativeHalflingBearer(u)) {
        n += (draft.magicItems||[]).filter(foreignItem).length;
        n += (draft.champion?.magicItems||[]).filter(foreignItem).length;
      }
    }
    return n;
  }

  function patchData() {
    if (!isHalfling() || state.data.__halflingPatched) return;
    state.data.__halflingPatched=true;
    for (const u of state.data.faction.characters||[]) {
      if (tags(u).includes("human_wizard")) u.rules=[...(u.rules||[]),"Wizard uses College Magic."];
    }
  }

  const oldRenderBrowser=renderUnitBrowser;
  renderUnitBrowser=function(){ if(isHalfling()) patchData(); return oldRenderBrowser(); };

  const oldAddUnit=addUnit;
  addUnit=function(sectionKey,unitId){
    if(!isHalfling()) return oldAddUnit(sectionKey,unitId);
    patchData(); const unit=getUnit(sectionKey,unitId); if(!unit)return;
    if(tags(unit).includes("zero_one") && state.roster.some(e=>e.unitId===unitId)){alert(`${unit.name} may only be included once.`);return;}
    if(tags(unit).includes("allied_empire")) {
      if(woodAllies().length){alert("Empire Troops cannot be included in a Halfling army that already contains Wood Elf allies.");return;}
      if(empireAllies().length>=allyLimit()){alert("You need two native Halfling regiments for each Empire allied regiment.");return;}
    }
    if(tags(unit).includes("allied_wood_elf")) {
      if(empireAllies().length){alert("Wood Elf allies cannot be included in a Halfling army that already contains Empire Troops.");return;}
      if(woodAllies().length>=allyLimit()){alert("You need two native Halfling regiments for each Wood Elf allied regiment.");return;}
    }
    if(unit.id==="treeman" && !woodAllies().length){alert("A Treeman may only be included if the army also includes Wood Elf allies.");return;}
    if(unit.id==="cockatrice_independent" && state.roster.some(e=>e.unitId==="moot_general" && e.mount==="cockatrice")){alert("The army can include only one Cockatrice, either as the General's mount or independently.");return;}
    return oldAddUnit(sectionKey,unitId);
  };

  const oldGetMagic=getAllowedMagicItems;
  getAllowedMagicItems=function(unit,context){
    let items=oldGetMagic(unit,context); if(!isHalfling()) return items;
    if(tags(unit).includes("allied_empire")) return (state.data.commonMagicItems||[]).concat((state.data.factionMagicItems||[]).filter(i=>i.halflingSourceFaction==="empire"));
    if(tags(unit).includes("allied_wood_elf")) return (state.data.commonMagicItems||[]).concat((state.data.factionMagicItems||[]).filter(i=>i.halflingSourceFaction==="wood_elves"));
    if(!isNativeHalflingBearer(unit)) return items;
    const settings=context==="champion"?unit.champion?.magicItems:unit.magicItems;
    if(!settings)return [];
    const cats=settings.allowedCategories||["magic_weapon","magic_armour","enchanted_item"];
    return [...(state.data.commonMagicItems||[]),...(state.data.factionMagicItems||[]).filter(legalLiberatedItem)].filter(i=>cats.includes(i.category));
  };

  const oldBanner=renderMagicBannerEditor;
  renderMagicBannerEditor=function(entry,unit){
    if(!isHalfling()) return oldBanner(entry,unit);
    if(tags(unit).includes("allied_empire") || tags(unit).includes("allied_wood_elf")) {
      const src=tags(unit).includes("allied_empire")?"empire":"wood_elves", orig=state.data.factionMagicItems;
      state.data.factionMagicItems=(orig||[]).filter(i=>i.halflingSourceFaction===src);
      try{return oldBanner(entry,unit);}finally{state.data.factionMagicItems=orig;}
    }
    const orig=state.data.factionMagicItems; state.data.factionMagicItems=[];
    try{return oldBanner(entry,unit);}finally{state.data.factionMagicItems=orig;}
  };

  function runeCategories(){return state.data?.faction?.systems?.dwarfRunes?.categories||{};}
  function runeById(id){return Object.values(runeCategories()).flat().find(r=>r.id===id);}
  function runeBearerEligible(unit,entry){return isNativeHalflingBearer(unit) && !tags(unit).includes("thief") && !tags(unit).includes("human_wizard") && Number((entry.sectionKey==="regiments"?unit.champion?.magicItems:unit.magicItems)?.maximum||0)>0;}
  function ensureRunes(entry){entry.halflingRuneItem ||= {category:"weapon",runes:[]}; return entry.halflingRuneItem;}
  function runeUsedElsewhere(entryId){return state.roster.some(e=>e.id!==entryId && (e.halflingRuneItem?.runes||[]).length) || state.roster.some(e=>e.id!==entryId && (e.champion?.halflingRuneItem?.runes||[]).length);}
  function runeCost(entry){const r=entry.halflingRuneItem; return (r?.runes||[]).reduce((s,id)=>s+Number(runeById(id)?.cost||0),0);}
  function renderRuneEditor(entry,unit,champion=false){
    const target=champion?(entry.champion ||= {selected:false,magicItems:[]}):entry;
    if(!runeBearerEligible(unit,entry) || (champion && !entry.champion?.selected)) return "";
    const cfg=ensureRunes(target), used=runeUsedElsewhere(entry.id), cats=["weapon","armour","talisman"].filter(c=>(runeCategories()[c]||[]).length);
    if(!cats.length)return "";
    return `<section class="editor-section"><div class="magic-header"><h3 class="editor-section-title" style="margin:0;">Dwarf Rune Item</h3><span class="magic-counter">1 per army</span></div>
      <div class="field-hint">The Moot may craft one Dwarf Rune Item. A runic item uses one magic-item slot.</div>
      ${used && !(cfg.runes||[]).length?`<div class="warning-box">The army already contains its one Dwarf Rune Item.</div>`:`<div class="dialog-field"><label>Runic item type</label><select data-halfling-rune-category data-rune-champion="${champion}">${cats.map(c=>`<option value="${c}" ${cfg.category===c?"selected":""}>${humanise(c)}</option>`).join("")}</select></div>
      ${[0,1,2].map((slot)=>`<div class="dialog-field"><label>Rune ${slot+1}</label><select data-halfling-rune-slot="${slot}" data-rune-champion="${champion}"><option value="">None</option>${(runeCategories()[cfg.category]||[]).map(r=>`<option value="${escapeHtml(r.id)}" ${cfg.runes?.[slot]===r.id?"selected":""}>${escapeHtml(r.name)} (${formatPoints(r.cost)} pts)</option>`).join("")}</select></div>`).join("")}`}
    </section>`;
  }

  const oldCharEditor=renderCharacterEditor;
  renderCharacterEditor=function(entry,unit){let h=oldCharEditor(entry,unit); if(!isHalfling())return h; if(tags(unit).includes("thief")){
    const opts=nativeRegs().filter(e=>["halfling_bowmen","halfling_slingers","halfling_militia","pantry_guard","field_wardens"].includes(e.unitId));
    h+=`<section class="editor-section"><h3 class="editor-section-title">Hidden In Regiment</h3><select data-halfling-thief-regiment><option value="">Choose regiment</option>${opts.map(e=>`<option value="${e.id}" ${entry.hiddenInRegimentId===e.id?"selected":""}>${escapeHtml(getUnit(e.sectionKey,e.unitId).name)}</option>`).join("")}</select></section>`;
  } else h+=renderRuneEditor(entry,unit,false); return h;};
  const oldRegEditor=renderRegimentEditor;
  renderRegimentEditor=function(entry,unit){let h=oldRegEditor(entry,unit); if(isHalfling()&&entry.champion?.selected&&tags(unit).includes("halfling_regiment"))h+=renderRuneEditor(entry,unit,true);return h;};

  const oldWire=wireEditorControls;
  wireEditorControls=function(){oldWire(); if(!isHalfling()||!state.draft)return; const entry=state.draft;
    els.dialogContent.querySelector("[data-halfling-thief-regiment]")?.addEventListener("change",e=>{entry.hiddenInRegimentId=e.target.value||null;updateDialogTotal();});
    els.dialogContent.querySelectorAll("[data-halfling-rune-category]").forEach(s=>s.addEventListener("change",()=>{const t=s.dataset.runeChampion==="true"?entry.champion:entry;ensureRunes(t).category=s.value;ensureRunes(t).runes=[];renderEditor();}));
    els.dialogContent.querySelectorAll("[data-halfling-rune-slot]").forEach(s=>s.addEventListener("change",()=>{const t=s.dataset.runeChampion==="true"?entry.champion:entry,cfg=ensureRunes(t),slot=Number(s.dataset.halflingRuneSlot);while(cfg.runes.length<3)cfg.runes.push("");cfg.runes[slot]=s.value;const chosen=cfg.runes.filter(Boolean),defs=chosen.map(runeById);if(defs.filter(r=>r?.master).length>1){alert("A runic item may contain only one Master Rune.");cfg.runes[slot]="";}const d=runeById(s.value),times=chosen.filter(x=>x===s.value).length;if(s.value&&d&&!d.repeatable&&times>1){alert("That rune cannot be repeated on the same item.");cfg.runes[slot]="";}renderEditor();}));
  };

  const oldCalc=calculateEntry;
  calculateEntry=function(entry){let total=oldCalc(entry); if(!isHalfling())return total; total+=runeCost(entry); if(entry.champion?.selected)total+=runeCost(entry.champion); return total;};

  const oldSave=saveEditor;
  saveEditor=function(){if(isHalfling()&&state.draft){const e=state.draft,u=getUnit(e.sectionKey,e.unitId);
    if(tags(u).includes("thief")){if(!e.hiddenInRegimentId){alert("Choose the Halfling regiment in which the Thief is hiding.");return;}if(state.roster.some(x=>x.id!==e.id&&x.hiddenInRegimentId===e.hiddenInRegimentId)){alert("Only one Halfling Thief may hide in each regiment.");return;}}
    if(e.unitId==="moot_general"&&e.mount==="cockatrice"&&state.roster.some(x=>x.id!==e.id&&x.unitId==="cockatrice_independent")){alert("The army can include only one Cockatrice.");return;}
    if(e.unitId==="halfling_riders"&&e.optionSelections?.flying_livestock){if(state.roster.some(x=>x.id!==e.id&&x.unitId==="halfling_riders"&&x.optionSelections?.flying_livestock)){alert("Only one Halfling Rider regiment may ride flying livestock.");return;}e.command.standardBearer=false;e.magicBanner=null;}
    if(e.unitId==="pantry_guard"&&e.optionSelections?.spears&&e.optionSelections?.bows){alert("Pantry Guard cannot take both spears and bows.");return;}
    if(selectedForeignCount(e.id,e)>externalAllowance()){alert(`This ${state.pointsLimit}-point army may include at most ${externalAllowance()} liberated magic item${externalAllowance()===1?"":"s"} from other army books.`);return;}
    const runeCount=(e.halflingRuneItem?.runes||[]).filter(Boolean).length+(e.champion?.halflingRuneItem?.runes||[]).filter(Boolean).length;if(runeCount&&runeUsedElsewhere(e.id)){alert("A Halfling army may craft only one Dwarf Rune Item.");return;}
  } return oldSave();};

  const oldRegPts=calculateRegimentPoints;
  calculateRegimentPoints=function(){let total=oldRegPts(); if(!isHalfling())return total; const first=state.roster.find(e=>e.unitId==="treeman"); if(first)total+=calculateEntry(first); return total;};

  const oldStatus=renderArmyStatus;
  renderArmyStatus=function(total){oldStatus(total);if(!isHalfling())return;const badAllies=empireAllies().length+woodAllies().length>allyLimit();const panel=document.createElement("div");panel.className=`army-system-panel${badAllies?" warn":""}`;panel.innerHTML=`<div class="army-system-copy"><strong>Moot Allies & Liberated Magic</strong><span>${nativeRegs().length} native Halfling regiment(s): ${allyLimit()} allied regiment slot(s). ${empireAllies().length?"Empire route":woodAllies().length?"Wood Elf route":"No ally route chosen"}. Liberated items: ${selectedForeignCount()} / ${externalAllowance()}.</span></div>`;els.armyStatus.prepend(panel);};

  const oldDescribe=describeEntry;
  describeEntry=function(entry){let text=oldDescribe(entry);if(!isHalfling())return text;const bits=[];if(entry.hiddenInRegimentId){const target=state.roster.find(e=>e.id===entry.hiddenInRegimentId);if(target)bits.push(`Hidden in ${getUnit(target.sectionKey,target.unitId)?.name}`);}for(const target of [entry,entry.champion]){if((target?.halflingRuneItem?.runes||[]).filter(Boolean).length)bits.push(`Dwarf Rune Item: ${target.halflingRuneItem.runes.filter(Boolean).map(id=>runeById(id)?.name||id).join(", ")}`);}return bits.length?`${text==="Base configuration"?"":text+" · "}${bits.join(" · ")}`:text;};

  const oldMountRow=rosterPadUnitMountRow;
  rosterPadUnitMountRow=function(entry,unit){if(isHalfling()&&unit?.id==="halfling_riders"&&entry.optionSelections?.flying_livestock){const view=clone(unit);view.unitMount={mountId:"flying_livestock",name:"Flying Livestock Beast",quantity:"per_model",equipment:[]};return oldMountRow(entry,view);}return oldMountRow(entry,unit);};
})();