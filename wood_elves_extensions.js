// Wood Elf faction systems: Classic/Savage lists, Forest Creatures, Shape Changers, Sprites and Zoats.
(() => {
  const ID="wood_elves";
  const isWE=()=>state.data?.faction?.id===ID && state.selectedArmyId===ID;
  const tags=u=>u?.tags||[];
  const opts=()=>{state.armyOptions=state.armyOptions||{};return state.armyOptions;};
  const style=()=>opts().woodElfStyle||"classic";
  const spriteDefs=()=>state.data?.faction?.systems?.sprites||[];
  const spriteById=id=>spriteDefs().find(s=>s.id===id);

  function styleAllowed(unit){
    if(!unit)return false;
    if(style()==="savage")return !tags(unit).includes("classic_only");
    return !tags(unit).includes("savage_only");
  }
  function allUnits(){const f=state.data?.faction||{};return ["characters","regiments","warMachines","specialCharacters"].flatMap(k=>f[k]||[]);}
  function patchData(){
    if(!isWE()||state.data.__woodElfPatched)return;
    state.data.__woodElfPatched=true;
    const ancient=(state.data.faction.characters||[]).find(u=>u.id==="treeman_ancient");
    if(ancient)ancient.magicItems={maximum:0,allowedPools:[],allowedCategories:[]};
    const bsb=(state.data.faction.characters||[]).find(u=>u.id==="wood_elf_bsb");
    if(bsb?.magicItems)bsb.magicItems.allowedCategories=["magic_weapon","magic_armour","enchanted_item","magic_banner"];
  }

  const oldCreate=createEntry;
  createEntry=function(sectionKey,unit){
    const e=oldCreate(sectionKey,unit);if(!isWE())return e;patchData();
    e.woodElfSprites=[];
    if(unit.id==="shape_changer")e.hiddenInRegimentId=null;
    if(unit.id==="forest_creatures")e.optionSelections={...(e.optionSelections||{}),bears:1,hunting_dogs:0,wild_cats:0,wild_hogs:0,beastmasters:0};
    if(unit.defaultMount)e.mount=unit.defaultMount;
    return e;
  };

  const oldBrowser=renderUnitBrowser;
  renderUnitBrowser=function(){
    if(!isWE())return oldBrowser();patchData();
    const f=state.data.faction, backups={};
    for(const section of sectionConfig){backups[section.key]=f[section.key]||[];f[section.key]=backups[section.key].filter(styleAllowed);}
    try{return oldBrowser();}finally{for(const section of sectionConfig)f[section.key]=backups[section.key];}
  };

  const oldAdd=addUnit;
  addUnit=function(sectionKey,unitId){
    if(!isWE())return oldAdd(sectionKey,unitId);patchData();
    const unit=getUnit(sectionKey,unitId);if(!unit||!styleAllowed(unit))return;
    if(tags(unit).includes("zero_one")&&state.roster.some(e=>e.unitId===unitId)){alert(`${unit.name} may only be included once.`);return;}
    if(tags(unit).includes("max_two")&&state.roster.filter(e=>e.unitId===unitId).length>=2){alert(`${unit.name} may only be included twice.`);return;}
    return oldAdd(sectionKey,unitId);
  };

  function stagCost(unit){
    if(unit.id==="wood_elf_warlord")return 33;
    if(unit.id==="wood_elf_hero")return 26;
    if(unit.id==="wood_elf_bsb")return 19;
    if(tags(unit).includes("wizard"))return 0;
    return null;
  }
  function characterView(unit){
    if(!isWE())return unit;
    const v=JSON.parse(JSON.stringify(unit));
    v.mountOptions=(v.mountOptions||[]).filter(m=>style()!=="savage"||m.mountId!=="wood_elf_chariot_mount");
    if(style()==="savage"){
      const c=stagCost(unit);if(c!=null&&!v.mountOptions.some(m=>m.mountId==="stag"))v.mountOptions.push({mountId:"stag",cost:c});
    }
    return v;
  }
  const oldCharEditor=renderCharacterEditor;
  renderCharacterEditor=function(entry,unit){
    let html=oldCharEditor(entry,characterView(unit));
    if(!isWE())return html;
    if(unit.id==="shape_changer"){
      const targets=state.roster.filter(e=>e.id!==entry.id&&e.sectionKey==="regiments"&&["wood_elf_archers","wood_elf_warriors"].includes(e.unitId));
      html+=`<section class="editor-section"><h3 class="editor-section-title">Hidden Shape Changer</h3><div class="field-hint">A Shape Changer must begin hidden in a rank-and-file infantry regiment. Only one may be allocated to each regiment.</div><div class="dialog-field"><label>Hide in regiment</label><select data-we-shape-target><option value="">Choose regiment</option>${targets.map(t=>{const used=state.roster.some(x=>x.id!==entry.id&&x.unitId==="shape_changer"&&x.hiddenInRegimentId===t.id);return `<option value="${escapeHtml(t.id)}" ${entry.hiddenInRegimentId===t.id?"selected":""} ${used?"disabled":""}>${escapeHtml(getUnit(t.sectionKey,t.unitId)?.name||"Regiment")}</option>`}).join("")}</select></div></section>`;
    }
    html+=renderSpriteEditor(entry,unit,false);
    return html;
  };

  function spriteCapacity(unit,champion=false){
    if(champion&&unit.id==="dryads")return 1;
    if(["treeman_ancient","durthu"].includes(unit.id))return 2;
    if(unit.id==="drycha")return 1;
    return 0;
  }
  function spriteSelections(target){return target?.woodElfSprites||[];}
  function spriteUsedElsewhere(id,entryId,target){
    for(const e of state.roster){
      if(e.id===entryId)continue;
      if(spriteSelections(e).includes(id)||spriteSelections(e.champion).includes(id))return true;
    }
    const draft=state.draft;
    if(draft&&draft.id===entryId){
      if(target!==draft&&spriteSelections(draft).includes(id))return true;
      if(target!==draft.champion&&spriteSelections(draft.champion).includes(id))return true;
    }
    return false;
  }
  function renderSpriteEditor(entry,unit,champion){
    const cap=spriteCapacity(unit,champion);if(!cap)return "";
    const target=champion?(entry.champion||{}):entry;
    if(champion&&!entry.champion?.selected)return "";
    target.woodElfSprites=target.woodElfSprites||[];
    return `<section class="editor-section"><div class="magic-header"><h3 class="editor-section-title" style="margin:0;">Sprites</h3><span class="magic-counter">${target.woodElfSprites.length} / ${cap}</span></div><div class="field-hint">Sprites are unique army-wide and each occupies a magic-item slot, but is not itself a magic item.</div>${spriteDefs().map(s=>{const checked=target.woodElfSprites.includes(s.id),used=spriteUsedElsewhere(s.id,entry.id,target);return `<label class="check-row"><input type="checkbox" data-we-sprite="${escapeHtml(s.id)}" data-we-sprite-champion="${champion}" ${checked?"checked":""} ${used&&!checked?"disabled":""}><span class="check-row-content"><span class="check-row-title"><span>${escapeHtml(s.name)}</span><span>+${formatPoints(s.cost)} pts</span></span><span class="check-row-sub">${escapeHtml(s.rules)}</span></span></label>`}).join("")}</section>`;
  }

  const oldRegEditor=renderRegimentEditor;
  renderRegimentEditor=function(entry,unit){
    if(isWE()&&unit.id==="forest_creatures"){
      const o=entry.optionSelections||{};
      return `<section class="editor-section"><h3 class="editor-section-title">Forest Creature Pack</h3><div class="field-hint">Up to two packs. Bears, Hunting Dogs, Wild Cats and Wild Hogs may be mixed freely; Beastmasters are optional.</div>${[["bears","Bears",15],["hunting_dogs","Hunting Dogs",10],["wild_cats","Wild Cats",10],["wild_hogs","Wild Hogs",5],["beastmasters","Wood Elf Beastmasters",14]].map(([id,n,c])=>`<div class="dialog-field"><label>${n}</label><input type="number" min="0" step="1" data-we-pack="${id}" value="${Number(o[id]||0)}"><div class="field-hint">${c} pts each</div></div>`).join("")}</section>`;
    }
    let html=oldRegEditor(entry,unit);
    if(isWE()&&unit.id==="dryads")html+=renderSpriteEditor(entry,unit,true);
    return html;
  };

  const oldWire=wireEditorControls;
  wireEditorControls=function(){
    oldWire();if(!isWE()||!state.draft)return;const e=state.draft,u=getUnit(e.sectionKey,e.unitId);
    els.dialogContent.querySelector("[data-we-shape-target]")?.addEventListener("change",ev=>{e.hiddenInRegimentId=ev.target.value||null;updateDialogTotal();});
    els.dialogContent.querySelectorAll("[data-we-pack]").forEach(inp=>inp.addEventListener("input",()=>{e.optionSelections[inp.dataset.wePack]=Math.max(0,Number(inp.value||0));updateDialogTotal();}));
    els.dialogContent.querySelectorAll("[data-we-sprite]").forEach(ch=>ch.addEventListener("change",()=>{
      const target=ch.dataset.weSpriteChampion==="true"?(e.champion||{}):e;target.woodElfSprites=target.woodElfSprites||[];
      const cap=spriteCapacity(u,ch.dataset.weSpriteChampion==="true"),id=ch.dataset.weSprite;
      if(ch.checked){if(target.woodElfSprites.length>=cap){alert(`This model may take at most ${cap} Sprite${cap===1?"":"s"}.`);ch.checked=false;return;}if(spriteUsedElsewhere(id,e.id,target)){alert("That Sprite is already used elsewhere in the army.");ch.checked=false;return;}target.woodElfSprites.push(id);}else target.woodElfSprites=target.woodElfSprites.filter(x=>x!==id);
      renderEditor();
    }));
  };

  const oldCalc=calculateEntry;
  calculateEntry=function(entry){
    let total=oldCalc(entry);if(!isWE())return total;const unit=getUnit(entry.sectionKey,entry.unitId);if(!unit)return total;
    if(unit.id==="forest_creatures"){
      const o=entry.optionSelections||{};total=Number(o.bears||0)*15+Number(o.hunting_dogs||0)*10+Number(o.wild_cats||0)*10+Number(o.wild_hogs||0)*5+Number(o.beastmasters||0)*14;
    }
    if(entry.mount==="stag")total+=Number(stagCost(unit)||0);
    if(unit.id==="wood_elf_lords"&&entry.optionSelections?.barding&&entry.command?.standardBearer)total-=10;
    for(const id of spriteSelections(entry))total+=Number(spriteById(id)?.cost||0);
    if(entry.champion?.selected)for(const id of spriteSelections(entry.champion))total+=Number(spriteById(id)?.cost||0);
    return total;
  };

  const oldEq=getSelectedEquipmentIds;
  getSelectedEquipmentIds=function(entry,unit){
    const ids=new Set(oldEq(entry,unit));if(!isWE())return [...ids];
    for(const id of ["shield","light_armour"]){if(entry.optionSelections?.[id])ids.add(id);}
    if(unit.id==="glade_riders"&&entry.optionSelections?.shields)ids.add("shield");
    if(unit.id==="glade_riders"&&entry.optionSelections?.longbows){ids.delete("bow");ids.add("wood_elf_longbow");}
    if(unit.id==="wood_elf_warriors"){
      if(entry.optionSelections?.additional_hand_weapons){ids.delete("shield");ids.add("additional_hand_weapon");}
      if(entry.optionSelections?.double_handed_weapons){ids.delete("shield");ids.add("double_handed_weapon");}
      if(entry.optionSelections?.spears)ids.add("spear");
      if(entry.optionSelections?.light_armour)ids.add("light_armour");
    }
    if(unit.id==="warhawk_riders"){
      if(entry.optionSelections?.bows)ids.add("bow");if(entry.optionSelections?.longbows)ids.add("wood_elf_longbow");
      if(entry.optionSelections?.spears)ids.add("spear");if(entry.optionSelections?.shields)ids.add("shield");if(entry.optionSelections?.light_armour)ids.add("light_armour");
    }
    return [...ids];
  };

  const oldArmour=calculatePrintedArmourSave;
  calculatePrintedArmourSave=function(entry,unit){
    if(isWE()){
      if(unit.id==="war_dancers"||unit.id==="war_dancer_hero"||unit.id==="wychwethyl")return "–";
      if(unit.id==="dryads"||unit.id==="drycha")return "5+";
      if(unit.id==="treeman")return "3+";
      if(unit.id==="durthu")return "2+";
      if(unit.id==="tree_kin")return "4+";
      if(unit.id==="zoat_warriors"||unit.id==="zoat_character")return "5+";
      if(unit.id==="wood_elf_chariot")return "5+";
    }
    return oldArmour(entry,unit);
  };

  function canBow(unit){
    const eq=new Set(unit.fixedEquipment||[]);if(eq.has("bow")||eq.has("wood_elf_longbow"))return true;
    if(["wood_elf_warlord","wood_elf_hero"].includes(unit.id))return true;
    return false;
  }
  const oldMagic=getAllowedMagicItems;
  getAllowedMagicItems=function(unit,context){
    let items=oldMagic(unit,context);if(!isWE())return items;
    const wizard=tags(unit).includes("wizard")||(unit.id==="zoat_character"&&state.draft?.optionSelections?.wizard_level1);
    return items.filter(item=>{
      if(item.id==="antler_totem"&&!wizard)return false;
      if(["hagbane_arrows","bow_loren","hail_doom","arcane_bodkins"].includes(item.id)&&!canBow(unit))return false;
      if(["arcane_item","familiar"].includes(item.category)&&!wizard)return false;
      return true;
    });
  };

  const oldSave=saveEditor;
  saveEditor=function(){
    if(isWE()&&state.draft){const e=state.draft,u=getUnit(e.sectionKey,e.unitId);
      if(u?.id==="shape_changer"){
        if(!e.hiddenInRegimentId){alert("Choose the rank-and-file regiment in which the Shape Changer is hiding.");return;}
        if(state.roster.some(x=>x.id!==e.id&&x.unitId==="shape_changer"&&x.hiddenInRegimentId===e.hiddenInRegimentId)){alert("Only one Shape Changer may be allocated to each regiment.");return;}
      }
      if(u?.id==="forest_creatures"){
        const o=e.optionSelections||{}, creatures=Number(o.bears||0)+Number(o.hunting_dogs||0)+Number(o.wild_cats||0)+Number(o.wild_hogs||0);
        if(creatures<1){alert("A Forest Creature pack must contain at least one Forest Creature.");return;}
      }
      if(u?.id==="wood_elf_warriors"&&[e.optionSelections?.spears,e.optionSelections?.additional_hand_weapons,e.optionSelections?.double_handed_weapons].filter(Boolean).length>1){alert("Wood Elf Warriors may select only one weapon option.");return;}
      if(u?.id==="warhawk_riders"&&e.optionSelections?.bows&&e.optionSelections?.longbows){alert("Warhawk Riders may take bows or Wood Elf Longbows, not both.");return;}
      if(u?.id==="wood_elf_lords"&&e.optionSelections?.barding)e.command.standardBearer=true;
      if(u?.id==="wood_elf_chariot"&&Number(e.optionSelections?.extra_crew||0)+(e.optionSelections?.elven_commander?1:0)>2){alert("A Wood Elf Chariot may have at most two additional crew, including an Elven Commander.");return;}
      if(style()==="savage"&&e.mount==="wood_elf_chariot_mount"){alert("Savage Wood Elf characters cannot ride Wood Elf Chariots.");return;}
    }
    return oldSave();
  };

  const oldDescribe=describeEntry;
  describeEntry=function(entry){let text=oldDescribe(entry);if(!isWE())return text;const u=getUnit(entry.sectionKey,entry.unitId),bits=[];
    if(u?.id==="shape_changer"&&entry.hiddenInRegimentId){const t=state.roster.find(x=>x.id===entry.hiddenInRegimentId);if(t)bits.push(`Hidden in ${getUnit(t.sectionKey,t.unitId)?.name}`);}
    if(u?.id==="forest_creatures"){const o=entry.optionSelections||{};[["bears","Bears"],["hunting_dogs","Hunting Dogs"],["wild_cats","Wild Cats"],["wild_hogs","Wild Hogs"],["beastmasters","Beastmasters"]].forEach(([id,n])=>{if(Number(o[id]||0))bits.push(`${o[id]} ${n}`)});}
    const sp=[...spriteSelections(entry),...spriteSelections(entry.champion)];if(sp.length)bits.push(`Sprites: ${sp.map(id=>spriteById(id)?.name).filter(Boolean).join(", ")}`);
    if(u?.id==="dryads")bits.push(style()==="savage"?"Savage: skirmishers; no Aspects":"Classic: Birch/Oak/Willow Aspects");
    return bits.length?`${text==="Base configuration"?"":text+" · "}${bits.join(" · ")}`:text;
  };

  function zoatStatus(){
    const es=state.roster.filter(e=>tags(getUnit(e.sectionKey,e.unitId)).includes("zoat"));if(!es.length)return null;
    const chars=es.filter(e=>e.sectionKey==="characters"),regs=es.filter(e=>e.sectionKey==="regiments");
    const cp=chars.reduce((s,e)=>s+calculateEntry(e),0),rp=regs.reduce((s,e)=>s+calculateEntry(e),0),zp=cp+rp,total=calculateArmyTotal();
    const problems=[];if(!chars.length)problems.push("requires at least one Zoat character");if(!regs.length)problems.push("requires at least one Zoat Warrior regiment");if(cp>rp)problems.push("Zoat character points exceed Zoat regiment points");if(total&&zp>total*.25+0.001)problems.push("Zoat contingent exceeds 25% of the army");
    return {cp,rp,zp,total,problems};
  }
  const oldStatus=renderArmyStatus;
  renderArmyStatus=function(total){
    oldStatus(total);if(!isWE())return;patchData();
    const z=zoatStatus(),panel=document.createElement("div");panel.className=`army-system-panel${z?.problems.length?" warn":""}`;
    panel.innerHTML=`<div class="army-system-copy"><strong>Wood Elf Army Style</strong><span>${style()==="savage"?"Savage list: later forest-spirit and Wild Rider roster; Dryads skirmish and cannot use Aspects.":"Classic list: traditional Wood Elf roster; optional Zoat contingent available."}${z?` Zoats: ${formatPoints(z.zp)} pts${z.problems.length?` — ${z.problems.join("; ")}`:" — legal composition"}.`:""}</span></div><select class="army-system-select" data-we-style><option value="classic" ${style()==="classic"?"selected":""}>Classic Wood Elves</option><option value="savage" ${style()==="savage"?"selected":""}>Savage Wood Elves</option></select>`;
    els.armyStatus.prepend(panel);
    panel.querySelector("[data-we-style]").addEventListener("change",ev=>{
      const next=ev.target.value,previous=style();if(next===previous)return;
      if(state.roster.length&&!confirm("Changing Wood Elf army style will remove choices that are not legal in the new style. Continue?")){ev.target.value=previous;return;}
      opts().woodElfStyle=next;
      state.roster=state.roster.filter(e=>styleAllowed(getUnit(e.sectionKey,e.unitId)));
      if(next==="savage")for(const e of state.roster)if(e.mount==="wood_elf_chariot_mount")e.mount=null;
      renderUnitBrowser();renderArmy();
    });
    const replacementProblems=[];
    if(state.roster.some(e=>e.unitId==="wychwethyl")&&!state.roster.some(e=>e.unitId==="war_dancers"))replacementProblems.push("Wychwethyl requires a War Dancer regiment");
    if(state.roster.some(e=>e.unitId==="drycha")&&!state.roster.some(e=>e.unitId==="dryads"))replacementProblems.push("Drycha replaces a Branch Wraith and requires Dryads");
    if(state.roster.some(e=>e.unitId==="gruarth")&&!state.roster.some(e=>e.unitId==="forest_creatures"))replacementProblems.push("Gruarth requires a Forest Creature pack");
    if(replacementProblems.length){const p=document.createElement("div");p.className="army-system-panel warn";p.innerHTML=`<div class="army-system-copy"><strong>Special Character Requirements</strong><span>${replacementProblems.join("; ")}.</span></div>`;els.armyStatus.append(p);}
  };

  const oldPad=rosterPadRow;
  rosterPadRow=function(entry){let html=oldPad(entry);if(!isWE())return html;const u=getUnit(entry.sectionKey,entry.unitId);if(u?.id==="forest_creatures"){
    const o=entry.optionSelections||{},rows=[["bears","Bears","bear"],["hunting_dogs","Hunting Dogs","hunting_dog"],["wild_cats","Wild Cats","wild_cat"],["wild_hogs","Wild Hogs","wild_hog"],["beastmasters","Wood Elf Beastmasters","wood_elf_beastmaster"]].filter(([id])=>Number(o[id]||0)>0).map(([id,n,p])=>`<tr class="sub-profile-row"><td>${escapeHtml(`${o[id]} ${n}`)}</td>${rosterPadProfileCells(profileById.get(p))}</tr>`).join("");html=html.replace("</tr>",`</tr>${rows}`);}
    if(u?.id==="wood_elf_chariot"&&entry.optionSelections?.elven_commander){const p=profileById.get("elven_commander");if(p)html=html.replace("</tr>",`</tr><tr class="sub-profile-row"><td>Elven Commander</td>${rosterPadProfileCells(p)}</tr>`);}
    return html;
  };
})();
