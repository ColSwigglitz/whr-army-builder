// Norse army-wide uniqueness guards for Heroic Individuals and Dwarf runes.
(() => {
  const isNorse=()=>state.selectedArmyId==="norse"&&state.data?.faction?.id==="norse";
  const runeCategories=()=>state.data?.faction?.systems?.dwarfRunes?.categories||{};
  const runeById=id=>Object.values(runeCategories()).flat().find(r=>r.id===id);

  function entryMagicSelections(entry){
    const ids=[];
    for(const id of entry.magicItems||[])if(id)ids.push(id);
    for(const id of entry.champion?.magicItems||[])if(id)ids.push(id);
    if(entry.magicBanner)ids.push(entry.magicBanner);
    for(const id of entry.norseHeroics?.champions||[])if(id)ids.push(id);
    for(const id of entry.norseHeroics?.shieldmaidens||[])if(id)ids.push(id);
    for(const gs of entry.norseGiantSlayers||[])if(gs?.magic)ids.push(gs.magic);
    return ids;
  }

  function runeItems(entry){
    const items=[];
    const r=entry.norseDwarfRunes;
    if(r){
      for(const key of ["weapon","armour","talisman"])if(r.champion?.[key]?.length)items.push(r.champion[key]);
      if(r.standard?.length)items.push(r.standard);
    }
    for(const gs of entry.norseGiantSlayers||[])if(gs?.runes?.length)items.push(gs.runes);
    return items;
  }

  function validateMagicUniqueness(draft){
    const own=entryMagicSelections(draft);
    const seen=new Set();
    for(const id of own){if(seen.has(id))return `The magic item ${getMagicItem(id)?.name||humanise(id)} is selected more than once in this regiment.`;seen.add(id);}
    const elsewhere=new Set();
    for(const e of state.roster){if(e.id===draft.id)continue;for(const id of entryMagicSelections(e))elsewhere.add(id);}
    for(const id of own)if(elsewhere.has(id))return `${getMagicItem(id)?.name||humanise(id)} is already used elsewhere in the army.`;
    return null;
  }

  function validateRunes(draft){
    const entries=state.roster.filter(e=>e.id!==draft.id).concat([draft]);
    const masterCounts=new Map();let spellbreaking=0;
    for(const e of entries){
      for(const item of runeItems(e)){
        const masters=item.filter(id=>runeById(id)?.master);
        if(masters.length>1)return "A runic item may contain only one Master Rune.";
        for(const id of masters)masterCounts.set(id,(masterCounts.get(id)||0)+1);
        spellbreaking+=item.filter(id=>id==="r_spellbreaking").length;
      }
    }
    for(const [id,count] of masterCounts)if(count>1)return `${runeById(id)?.name||humanise(id)} is a Master Rune and may only be used once in the army.`;
    if(spellbreaking>2)return "No more than two Runes of Spellbreaking may be included in the army.";
    return null;
  }

  const oldSave=saveEditor;
  saveEditor=function(){
    if(isNorse()&&state.draft){
      const magicError=validateMagicUniqueness(state.draft);if(magicError){alert(magicError);return;}
      const runeError=validateRunes(state.draft);if(runeError){alert(runeError);return;}
    }
    return oldSave();
  };
})();
