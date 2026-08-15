// Final Wood Elf editor/composition edge cases kept separate from the main faction systems.
(() => {
  const isWE=()=>state.data?.faction?.id==="wood_elves"&&state.selectedArmyId==="wood_elves";

  // Apply model-size details that the generic editor reads from unit.size.
  const oldBrowser=renderUnitBrowser;
  renderUnitBrowser=function(){
    if(isWE()){
      for(const u of state.data.faction.regiments||[]){
        if(["warhawk_riders","tree_kin","zoat_warriors"].includes(u.id))u.size={...(u.size||{}),minimum:3};
      }
    }
    return oldBrowser();
  };

  // Character options (free armour, bows and Orion's hounds) use the same option controls as regiments.
  const oldCharacterEditor=renderCharacterEditor;
  renderCharacterEditor=function(entry,unit){
    let html=oldCharacterEditor(entry,unit);
    if(isWE()&&(unit.options||[]).length){
      html+=`<section class="editor-section"><h3 class="editor-section-title">Options</h3>${renderUnitOptions(entry,unit)}</section>`;
    }
    return html;
  };

  // Start Forest Creature packs at a legal 60-point configuration instead of a single 15-point Bear.
  const oldCreate=createEntry;
  createEntry=function(sectionKey,unit){
    const e=oldCreate(sectionKey,unit);
    if(isWE()&&unit?.id==="forest_creatures")e.optionSelections.bears=4;
    return e;
  };

  // Only the cheapest 60-point value of the first unridden Chariot belongs to Regiments; its upgrades do not.
  const oldRegimentPoints=calculateRegimentPoints;
  calculateRegimentPoints=function(){
    let total=oldRegimentPoints();
    if(!isWE())return total;
    const first=state.roster.find(e=>e.sectionKey==="warMachines"&&e.unitId==="wood_elf_chariot");
    if(first)total-=Math.max(0,calculateEntry(first)-60);
    return total;
  };

  const bowMagic=new Set(["hagbane_arrows","bow_loren","hail_doom","arcane_bodkins"]);
  const oldSave=saveEditor;
  saveEditor=function(){
    if(isWE()&&state.draft){
      const e=state.draft,u=getUnit(e.sectionKey,e.unitId);
      if(u?.id==="forest_creatures"&&calculateEntry(e)<50){alert("A Forest Creature regiment must contain at least 50 points of models.");return;}
      if(["wood_elf_warlord","wood_elf_hero"].includes(u?.id)&&(e.magicItems||[]).some(id=>bowMagic.has(id))&&!e.optionSelections?.bow_or_longbow){
        alert("That magic weapon requires the character to buy a Bow or Wood Elf Longbow.");return;
      }
    }
    return oldSave();
  };
})();
