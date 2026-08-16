// Norse army systems: raider mode, Heroic Individuals, Shape Changers, Dwarf runes and monster composition.
(() => {
  const ID="norse";
  const isNorse=()=>state.selectedArmyId===ID&&state.data?.faction?.id===ID;
  const tags=u=>u?.tags||[];
  const opts=()=>{state.armyOptions=state.armyOptions||{};return state.armyOptions;};
  const mode=()=>opts().norseRaidMode||"sea";
  const runeSystem=()=>state.data?.faction?.systems?.dwarfRunes||{};
  const runeCategories=()=>runeSystem().categories||{};
  const runeById=id=>Object.values(runeCategories()).flat().find(r=>r.id===id);
  const magicPool=()=>[...(state.data?.commonMagicItems||[]),...(state.data?.factionMagicItems||[])];
  const magicByLocalId=id=>magicPool().find(i=>i.id===id);

  function patchData(){
    if(!isNorse()||state.data.__norsePatched)return;
    state.data.__norsePatched=true;
    const eagle=state.data.faction.warMachines.find(u=>u.id==="great_eagle");if(eagle)eagle.selection={};
    const mammoth=state.data.faction.warMachines.find(u=>u.id==="mammoth");if(mammoth)mammoth.composition={rules:[{when:{instanceNumber:1},category:"regiments"}]};
  }

  function ensureHeroics(entry,unit){
    if(tags(unit).includes("heroic_multi")){
      entry.norseHeroics=entry.norseHeroics||{champions:[],shieldmaidens:[],ulfhednar:0};
      entry.norseHeroics.champions=Array.isArray(entry.norseHeroics.champions)?entry.norseHeroics.champions:[];
      entry.norseHeroics.shieldmaidens=Array.isArray(entry.norseHeroics.shieldmaidens)?entry.norseHeroics.shieldmaidens:[];
      entry.norseHeroics.ulfhednar=Math.max(0,Number(entry.norseHeroics.ulfhednar||0));
    }
    if(unit.id==="norse_dwarf_troll_slayers"){
      entry.norseGiantSlayers=Array.isArray(entry.norseGiantSlayers)?entry.norseGiantSlayers:[];
    }
    if(tags(unit).includes("dwarf")){
      entry.norseDwarfRunes=entry.norseDwarfRunes||{champion:{weapon:[],armour:[],talisman:[]},standard:[]};
      for(const k of ["weapon","armour","talisman"])entry.norseDwarfRunes.champion[k]=Array.isArray(entry.norseDwarfRunes.champion[k])?entry.norseDwarfRunes.champion[k]:[];
      entry.norseDwarfRunes.standard=Array.isArray(entry.norseDwarfRunes.standard)?entry.norseDwarfRunes.standard:[];
    }
  }

  const oldCreate=createEntry;
  createEntry=function(sectionKey,unit){
    const e=oldCreate(sectionKey,unit);if(!isNorse())return e;patchData();ensureHeroics(e,unit);
    if(unit.id==="shape_changer")e.hiddenInRegimentId=null;
    if(unit.id==="beasts_beastmasters")e.optionSelections={...(e.optionSelections||{}),beastmasters:1,beastType:"bears",beasts:3};
    if(unit.id==="norse_warriors")e.norseAmbush=false;
    return e;
  };

  function allowedByMode(unit){return unit?.id!=="mammoth"||mode()==="land";}
  const oldBrowser=renderUnitBrowser;
  renderUnitBrowser=function(){
    if(!isNorse())return oldBrowser();patchData();
    const f=state.data.faction, original=f.warMachines;f.warMachines=original.filter(allowedByMode);
    try{return oldBrowser();}finally{f.warMachines=original;}
  };

  function hasGiantSlayers(){return state.roster.some(e=>e.unitId==="norse_dwarf_troll_slayers"&&(e.norseGiantSlayers||[]).length>0);}
  const oldAdd=addUnit;
  addUnit=function(sectionKey,unitId){
    if(!isNorse())return oldAdd(sectionKey,unitId);patchData();
    const unit=getUnit(sectionKey,unitId);if(!unit||!allowedByMode(unit))return;
    if((unit.selection?.maximum===1||tags(unit).includes("zero_one"))&&state.roster.some(e=>e.unitId===unitId)){alert(`${unit.name} may only be included once.`);return;}
    if(unitId==="stone_trolls"&&state.roster.some(e=>e.unitId==="norse_dwarf_troll_slayers")){alert("Stone Trolls cannot be included with Norse Dwarf Troll Slayers.");return;}
    if(unitId==="norse_dwarf_troll_slayers"&&state.roster.some(e=>e.unitId==="stone_trolls")){alert("Norse Dwarf Troll Slayers cannot be included with Stone Trolls.");return;}
    if(unitId==="giant"&&hasGiantSlayers()){alert("Giants cannot be included with Giant Slayers.");return;}
    if(unitId==="mounted_norse_warriors"){
      const foot=state.roster.filter(e=>e.unitId==="norse_warriors").length,mounted=state.roster.filter(e=>e.unitId===unitId).length;
      if(mounted>=foot){alert("Mounted Norse Warrior regiments may not outnumber Norse Warrior regiments on foot.");return;}
    }
    return oldAdd(sectionKey,unitId);
  };

  function selectedTrooperCost(entry,unit){return Number(unit.points?.value||0)+Number(selectedPerModelOptionCost(entry,unit)||0);}
  function usedMagicIds(excludeEntryId=null){
    const used=new Set();
    for(const e of state.roster){
      if(e.id===excludeEntryId)continue;
      for(const id of e.magicItems||[])used.add(id);for(const id of e.champion?.magicItems||[])used.add(id);if(e.magicBanner)used.add(e.magicBanner);
      for(const id of e.norseHeroics?.champions||[])if(id)used.add(id);for(const id of e.norseHeroics?.shieldmaidens||[])if(id)used.add(id);
      for(const gs of e.norseGiantSlayers||[])if(gs?.magic)used.add(gs.magic);
    }
    return used;
  }
  function heroMagicOptions(current,entry,weaponOnly=false){
    const used=usedMagicIds(entry.id);const cats=weaponOnly?["magic_weapon"]:["magic_weapon","magic_armour","enchanted_item"];
    return magicPool().filter(i=>cats.includes(i.category)).map(i=>`<option value="${escapeHtml(i.id)}" ${current===i.id?"selected":""} ${used.has(i.id)&&current!==i.id?"disabled":""}>${escapeHtml(i.name)} (${formatPoints(i.cost)} pts)</option>`).join("");
  }
  function resizeMagicArray(arr,count){const out=[...arr];while(out.length<count)out.push(null);return out.slice(0,count);}

  function renderHeroics(entry,unit){
    ensureHeroics(entry,unit);const h=entry.norseHeroics;if(!h)return"";
    const canShield=unit.id!=="berserkers";
    return `<section class="editor-section"><h3 class="editor-section-title">Heroic Individuals</h3><div class="field-hint">Eligible Norse regiments may include multiple champions. Each Norse Champion or Shieldmaiden may carry one magic item; Ulfhednar may not.</div>
      <div class="dialog-field"><label>Norse Champions</label><input type="number" min="0" step="1" value="${h.champions.length}" data-norse-hero-count="champions"></div>
      ${h.champions.map((id,i)=>`<div class="dialog-field"><label>Champion ${i+1} magic item</label><select data-norse-hero-magic="champions" data-norse-hero-index="${i}"><option value="">None</option>${heroMagicOptions(id,entry)}</select></div>`).join("")}
      ${canShield?`<div class="dialog-field"><label>Shieldmaidens</label><input type="number" min="0" step="1" value="${h.shieldmaidens.length}" data-norse-hero-count="shieldmaidens"></div>${h.shieldmaidens.map((id,i)=>`<div class="dialog-field"><label>Shieldmaiden ${i+1} magic item</label><select data-norse-hero-magic="shieldmaidens" data-norse-hero-index="${i}"><option value="">None</option>${heroMagicOptions(id,entry)}</select></div>`).join("")}`:""}
      <div class="dialog-field"><label>Ulfhednar</label><input type="number" min="0" step="1" value="${h.ulfhednar}" data-norse-ulfhednar></div></section>`;
  }

  function availableRunes(category){return (runeCategories()[category]||[]).filter(r=>!r.onlyRunesmith&&(!r.allowedUnits||!r.allowedUnits.length));}
  function runeSelect(category,selected,attrs="") {return `<select ${attrs}><option value="">None</option>${availableRunes(category).map(r=>`<option value="${escapeHtml(r.id)}" ${selected===r.id?"selected":""}>${escapeHtml(r.name)} (${formatPoints(r.cost)} pts)</option>`).join("")}</select>`;}
  function renderRuneSlots(selected,category,attrs){return [0,1,2].map(i=>`<div class="dialog-field"><label>Rune ${i+1}</label>${runeSelect(category,selected[i]||"",`${attrs} data-norse-rune-slot="${i}"`)}</div>`).join("");}
  function renderDwarfRunes(entry,unit){
    ensureHeroics(entry,unit);if(!tags(unit).includes("dwarf"))return"";const r=entry.norseDwarfRunes;
    let html="";
    if(unit.id==="norse_dwarf_warriors"&&entry.champion?.selected){
      html+=`<section class="editor-section"><h3 class="editor-section-title">Dwarf Champion Runic Item</h3><div class="field-hint">A runic item uses the Champion's single magic-item allowance. Use only one category.</div>${["weapon","armour","talisman"].map(cat=>`<h4>${humanise(cat)}</h4>${renderRuneSlots(r.champion[cat],cat,`data-norse-champ-rune="${cat}"`)}`).join("")}</section>`;
    }
    if(entry.command?.standardBearer)html+=`<section class="editor-section"><h3 class="editor-section-title">Runic Standard</h3><div class="field-hint">A runic standard replaces a conventional magic banner.</div>${renderRuneSlots(r.standard,"protection","data-norse-standard-rune")}</section>`;
    return html;
  }
  function renderGiantSlayers(entry){
    const gs=entry.norseGiantSlayers||[];
    return `<section class="editor-section"><h3 class="editor-section-title">Giant Slayers</h3><div class="field-hint">Any number may join the Troll Slayers. Each costs 20 pts + one trooper and may take one magic weapon, including a Dwarf runic weapon.</div><div class="dialog-field"><label>Giant Slayers</label><input type="number" min="0" step="1" value="${gs.length}" data-norse-giant-count></div>${gs.map((g,i)=>`<div class="editor-section"><h4>Giant Slayer ${i+1}</h4><div class="dialog-field"><label>Conventional magic weapon</label><select data-norse-giant-magic="${i}"><option value="">None</option>${heroMagicOptions(g.magic||null,entry,true)}</select></div><div class="field-hint">Or create a runic weapon:</div>${renderRuneSlots(g.runes||[],"weapon",`data-norse-giant-rune="${i}"`)}</div>`).join("")}</section>`;
  }

  const oldCharEditor=renderCharacterEditor;
  renderCharacterEditor=function(entry,unit){
    let html=oldCharEditor(entry,unit);if(!isNorse())return html;
    if(unit.id==="shape_changer"){
      const targets=state.roster.filter(e=>e.sectionKey==="regiments"&&["norse_huscarls","berserkers","norse_warriors"].includes(e.unitId));
      html+=`<section class="editor-section"><h3 class="editor-section-title">Hidden Shape Changer</h3><div class="field-hint">Must begin hidden in Huscarls, Norse Warriors or Berserkers. Only one Shape Changer per regiment.</div><div class="dialog-field"><label>Hide in regiment</label><select data-norse-shape-target><option value="">Choose regiment</option>${targets.map(t=>{const used=state.roster.some(x=>x.id!==entry.id&&x.unitId==="shape_changer"&&x.hiddenInRegimentId===t.id);return `<option value="${escapeHtml(t.id)}" ${entry.hiddenInRegimentId===t.id?"selected":""} ${used?"disabled":""}>${escapeHtml(getUnit(t.sectionKey,t.unitId)?.name||"Regiment")}</option>`}).join("")}</select></div></section>`;
    }
    return html;
  };

  const oldRegEditor=renderRegimentEditor;
  renderRegimentEditor=function(entry,unit){
    if(isNorse()&&unit.id==="beasts_beastmasters"){
      const o=entry.optionSelections||{};return `<section class="editor-section"><h3 class="editor-section-title">Norse Beasts and Beastmasters</h3><div class="field-hint">0–1. Choose either Bears or Giant Wolves; Beastmasters are 13 pts each.</div><div class="dialog-field"><label>Beastmasters</label><input type="number" min="1" step="1" value="${Number(o.beastmasters||1)}" data-norse-beastmasters></div><div class="dialog-field"><label>Beast type</label><select data-norse-beast-type><option value="bears" ${o.beastType!=="wolves"?"selected":""}>Bears (15 pts)</option><option value="wolves" ${o.beastType==="wolves"?"selected":""}>Giant Wolves (10 pts)</option></select></div><div class="dialog-field"><label>Beasts</label><input type="number" min="1" step="1" value="${Number(o.beasts||3)}" data-norse-beasts></div></section>`;
    }
    let html=oldRegEditor(entry,unit);if(!isNorse())return html;ensureHeroics(entry,unit);
    if(tags(unit).includes("heroic_multi"))html+=renderHeroics(entry,unit);
    if(unit.id==="norse_warriors"&&mode()==="sea")html+=`<section class="editor-section"><h3 class="editor-section-title">Sea Raider Ambush</h3><label class="check-row"><input type="checkbox" data-norse-ambush ${entry.norseAmbush?"checked":""}><span class="check-row-content"><span class="check-row-title">Use Ambush</span><span class="check-row-sub">Only one Norse Warrior regiment may Ambush, and only when the Hird has no Mammoths.</span></span></label></section>`;
    if(unit.id==="norse_dwarf_troll_slayers")html+=renderGiantSlayers(entry);
    if(tags(unit).includes("dwarf"))html+=renderDwarfRunes(entry,unit);
    return html;
  };

  function validRuneList(ids){
    const details=ids.filter(Boolean).map(runeById).filter(Boolean);if(details.filter(r=>r.master).length>1)return false;
    for(const r of details){const n=ids.filter(id=>id===r.id).length;if(!r.repeatable&&n>1)return false;if(r.maxRepeats&&n>Number(r.maxRepeats))return false;}return true;
  }
  const oldWire=wireEditorControls;
  wireEditorControls=function(){
    oldWire();if(!isNorse()||!state.draft)return;const e=state.draft,u=getUnit(e.sectionKey,e.unitId);ensureHeroics(e,u);
    els.dialogContent.querySelector("[data-norse-shape-target]")?.addEventListener("change",ev=>{e.hiddenInRegimentId=ev.target.value||null;updateDialogTotal();});
    els.dialogContent.querySelector("[data-norse-beastmasters]")?.addEventListener("input",ev=>{e.optionSelections.beastmasters=Math.max(1,Number(ev.target.value||1));updateDialogTotal();});
    els.dialogContent.querySelector("[data-norse-beasts]")?.addEventListener("input",ev=>{e.optionSelections.beasts=Math.max(1,Number(ev.target.value||1));updateDialogTotal();});
    els.dialogContent.querySelector("[data-norse-beast-type]")?.addEventListener("change",ev=>{e.optionSelections.beastType=ev.target.value;updateDialogTotal();});
    els.dialogContent.querySelectorAll("[data-norse-hero-count]").forEach(inp=>inp.addEventListener("change",()=>{const k=inp.dataset.norseHeroCount;e.norseHeroics[k]=resizeMagicArray(e.norseHeroics[k],Math.max(0,Number(inp.value||0)));renderEditor();}));
    els.dialogContent.querySelectorAll("[data-norse-hero-magic]").forEach(sel=>sel.addEventListener("change",()=>{e.norseHeroics[sel.dataset.norseHeroMagic][Number(sel.dataset.norseHeroIndex)]=sel.value||null;updateDialogTotal();}));
    els.dialogContent.querySelector("[data-norse-ulfhednar]")?.addEventListener("change",ev=>{e.norseHeroics.ulfhednar=Math.max(0,Number(ev.target.value||0));updateDialogTotal();});
    els.dialogContent.querySelector("[data-norse-ambush]")?.addEventListener("change",ev=>{if(ev.target.checked&&state.roster.some(x=>x.id!==e.id&&x.norseAmbush)){alert("Only one Norse Warrior regiment may use Ambush.");ev.target.checked=false;return;}e.norseAmbush=ev.target.checked;});
    els.dialogContent.querySelector("[data-norse-giant-count]")?.addEventListener("change",ev=>{const n=Math.max(0,Number(ev.target.value||0));if(n>0&&state.roster.some(x=>x.unitId==="giant")){alert("Giant Slayers cannot be included with Giants.");ev.target.value=e.norseGiantSlayers.length;return;}while(e.norseGiantSlayers.length<n)e.norseGiantSlayers.push({magic:null,runes:[]});e.norseGiantSlayers=e.norseGiantSlayers.slice(0,n);renderEditor();});
    els.dialogContent.querySelectorAll("[data-norse-giant-magic]").forEach(sel=>sel.addEventListener("change",()=>{const g=e.norseGiantSlayers[Number(sel.dataset.norseGiantMagic)];g.magic=sel.value||null;if(g.magic)g.runes=[];renderEditor();}));
    const runeHandler=(sel,target)=>{sel.addEventListener("change",()=>{const slot=Number(sel.dataset.norseRuneSlot),next=[...target];while(next.length<3)next.push("");next[slot]=sel.value||"";if(!validRuneList(next)){alert("Invalid rune combination: only one Master Rune and non-repeatable runes cannot be duplicated.");renderEditor();return;}target.splice(0,target.length,...next.filter(Boolean));renderEditor();});};
    els.dialogContent.querySelectorAll("[data-norse-champ-rune]").forEach(sel=>runeHandler(sel,e.norseDwarfRunes.champion[sel.dataset.norseChampRune]));
    els.dialogContent.querySelectorAll("[data-norse-standard-rune]").forEach(sel=>runeHandler(sel,e.norseDwarfRunes.standard));
    els.dialogContent.querySelectorAll("[data-norse-giant-rune]").forEach(sel=>{const g=e.norseGiantSlayers[Number(sel.dataset.norseGiantRune)];runeHandler(sel,g.runes);sel.addEventListener("change",()=>{if(g.runes.length)g.magic=null;});});
  };

  function runeCost(ids){return (ids||[]).reduce((s,id)=>s+Number(runeById(id)?.cost||0),0);}
  function heroicCost(entry,unit){
    if(!entry.norseHeroics)return 0;const troop=selectedTrooperCost(entry,unit),h=entry.norseHeroics;
    let total=h.champions.length*(20+troop)+h.shieldmaidens.length*(30+troop)+Number(h.ulfhednar||0)*(40+Number(unit.points?.value||0));
    for(const id of [...h.champions,...h.shieldmaidens])if(id)total+=Number(magicByLocalId(id)?.cost||0);return total;
  }
  function giantSlayerCost(entry,unit){return (entry.norseGiantSlayers||[]).reduce((s,g)=>s+20+Number(unit.points?.value||0)+Number(g.magic?magicByLocalId(g.magic)?.cost||0:0)+runeCost(g.runes),0);}
  function dwarfRuneCost(entry){if(!entry.norseDwarfRunes)return 0;const r=entry.norseDwarfRunes;return runeCost(r.standard)+Object.values(r.champion).reduce((s,a)=>s+runeCost(a),0);}
  const oldCalc=calculateEntry;
  calculateEntry=function(entry){
    let total=oldCalc(entry);if(!isNorse())return total;const u=getUnit(entry.sectionKey,entry.unitId);if(!u)return total;
    if(u.id==="beasts_beastmasters"){const o=entry.optionSelections||{};return Number(o.beastmasters||1)*13+Number(o.beasts||1)*(o.beastType==="wolves"?10:15);}
    total+=heroicCost(entry,u)+giantSlayerCost(entry,u)+dwarfRuneCost(entry);return total;
  };
  const oldRegPoints=calculateRegimentPoints;
  calculateRegimentPoints=function(){
    let total=oldRegPoints();if(!isNorse())return total;
    for(const e of state.roster){if(e.sectionKey!=="regiments")continue;const u=getUnit(e.sectionKey,e.unitId);total-=heroicCost(e,u)+giantSlayerCost(e,u);}
    return total;
  };

  const oldSave=saveEditor;
  saveEditor=function(){
    if(isNorse()&&state.draft){const e=state.draft,u=getUnit(e.sectionKey,e.unitId);ensureHeroics(e,u);
      if(u.id==="shape_changer"&&!e.hiddenInRegimentId){alert("Choose the regiment in which the Shape Changer begins hidden.");return;}
      if(e.norseAmbush&&mode()!=="sea"){alert("Ambush is only available to Sea Raiders.");return;}
      if(u.id==="norse_dwarf_warriors"&&e.norseDwarfRunes){const r=e.norseDwarfRunes,items=Object.values(r.champion).filter(a=>a.length);if(items.length>1){alert("A Dwarf Champion may carry only one runic item.");return;}if(items.length&&e.champion?.magicItems?.length){alert("A runic item uses the Dwarf Champion's single magic-item allowance.");return;}}
      if(e.norseDwarfRunes?.standard?.length&&e.magicBanner){alert("A regiment cannot carry both a runic standard and a conventional magic banner.");return;}
    }return oldSave();
  };

  const oldStatus=renderArmyStatus;
  renderArmyStatus=function(total){
    oldStatus(total);if(!isNorse())return;patchData();
    const mounted=state.roster.filter(e=>e.unitId==="mounted_norse_warriors").length,foot=state.roster.filter(e=>e.unitId==="norse_warriors").length,mammoths=state.roster.filter(e=>e.unitId==="mammoth").length;
    const warnings=[];if(mounted>foot)warnings.push("Mounted Norse Warrior regiments outnumber Norse Warrior regiments on foot.");if(mode()==="sea"&&mammoths)warnings.push("Sea Raiders cannot include Mammoths.");if(state.roster.some(e=>e.norseAmbush)&&mammoths)warnings.push("A Hird cannot use Ambush and include Mammoths.");
    els.armyStatus.insertAdjacentHTML("afterbegin",`<div class="status-card"><strong>Raider Style</strong><div class="field-hint">Sea Raiders: one Norse Warrior regiment may Ambush. Land Raiders: Mammoths are available.</div><select data-norse-mode><option value="sea" ${mode()==="sea"?"selected":""}>Sea Raiders</option><option value="land" ${mode()==="land"?"selected":""}>Land Raiders</option></select></div>${warnings.length?`<div class="warning-box"><strong>Norse restrictions</strong><div>${warnings.map(escapeHtml).join("<br>")}</div></div>`:""}`);
    els.armyStatus.querySelector("[data-norse-mode]")?.addEventListener("change",ev=>{const next=ev.target.value;if(next==="sea"&&state.roster.some(e=>e.unitId==="mammoth")){alert("Remove all Mammoths before switching to Sea Raiders.");ev.target.value=mode();return;}if(next==="land"&&state.roster.some(e=>e.norseAmbush)){alert("Remove the Ambush selection before switching to Land Raiders.");ev.target.value=mode();return;}opts().norseRaidMode=next;renderUnitBrowser();renderArmy();});
  };

  function profileRow(label,profileId,notes="") {const p=profileById.get(profileId);if(!p)return"";return `<tr class="sub-profile-row"><td class="unit-cell">↳ ${escapeHtml(label)}</td>${rosterPadProfileCells(p)}<td class="save">–</td><td class="notes-cell">${escapeHtml(notes)}</td><td class="points-cell"></td></tr>`;}
  const oldPad=rosterPadRow;
  rosterPadRow=function(entry){
    let html=oldPad(entry);if(!isNorse())return html;const u=getUnit(entry.sectionKey,entry.unitId),rows=[];
    if(u?.id==="beasts_beastmasters"){const o=entry.optionSelections||{},wolves=o.beastType==="wolves",n=Number(o.beasts||1),m=Number(o.beastmasters||1);rows.push(profileRow(`${n} ${wolves?"Giant Wolves":"Bears"}`,wolves?"giant_wolf":"bear","Beasts"));rows.push(profileRow(`${m} Beastmaster${m===1?"":"s"}`,"norse_beastmaster","Handlers"));}
    if(u?.id==="mammoth")rows.push(profileRow("4 Norse Hunters","norse_hunter","Howdah crew: bows and heavy throwing spears"));
    if(u?.id==="mounted_norse_warriors"&&entry.optionSelections?.warhorses){html=html.replace(/<tr class="sub-profile-row">[\s\S]*?Normal Horse[\s\S]*?<\/tr>/,"" );rows.push(profileRow(`${entry.size} Warhorses`,"warhorse","Mounts"));}
    return rows.length?html.replace("</tr>",`</tr>${rows.join("")}`):html;
  };

  const oldNotes=rosterPadNotes;
  rosterPadNotes=function(entry,unit){const notes=oldNotes(entry,unit);if(!isNorse())return notes;
    if(entry.norseAmbush)notes.push("Sea Raider Ambush");if(entry.hiddenInRegimentId)notes.push("Begins hidden in an eligible Norse infantry regiment");
    if(entry.norseHeroics){if(entry.norseHeroics.champions.length)notes.push(`${entry.norseHeroics.champions.length} Norse Champion(s)`);if(entry.norseHeroics.shieldmaidens.length)notes.push(`${entry.norseHeroics.shieldmaidens.length} Shieldmaiden(s)`);if(entry.norseHeroics.ulfhednar)notes.push(`${entry.norseHeroics.ulfhednar} Ulfhednar`);}
    if(entry.norseGiantSlayers?.length)notes.push(`${entry.norseGiantSlayers.length} Giant Slayer(s)`);return [...new Set(notes)];};
})();
