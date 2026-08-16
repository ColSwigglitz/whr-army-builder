// Final Norse source restrictions and legacy-core compatibility fixes.
(() => {
  const isNorse=()=>state.selectedArmyId==="norse"&&state.data?.faction?.id==="norse";
  function applyDataFixes(){
    if(!isNorse()||state.data.__norseFinalPatched)return;state.data.__norseFinalPatched=true;
    const eagle=state.data.faction.warMachines.find(x=>x.id==="great_eagle");
    if(eagle){eagle.selection={};eagle.tags=(eagle.tags||[]).filter(tag=>tag!=="zero_one");}
    for(const id of ["norse_king","norse_jarl"]){
      const u=state.data.faction.characters.find(x=>x.id===id);if(!u)continue;
      u.equipmentOptions=[
        {id:"armour",type:"choice_group",maximum:1,cost:0,choices:["light_armour"]},
        {id:"shield",type:"choice_group",maximum:1,cost:0,choices:["shield"]},
        {id:"melee_weapon",type:"choice_group",maximum:1,cost:0,choices:["additional_hand_weapon","spear","double_handed_weapon"]},
        {id:"missile_weapon",type:"choice_group",maximum:1,cost:10,choices:["bow","heavy_throwing_spear"]}
      ];
    }
    const bsb=state.data.faction.characters.find(x=>x.id==="norse_bsb");
    if(bsb)bsb.equipmentOptions=[{id:"armour",type:"choice_group",maximum:1,cost:0,choices:["light_armour"]}];
  }
  const oldSelect=selectArmy;
  selectArmy=async function(id){await oldSelect(id);if(isNorse()){applyDataFixes();renderUnitBrowser();renderArmy();}};

  const oldAllowed=getAllowedMagicItems;
  getAllowedMagicItems=function(unit,context){
    let items=oldAllowed(unit,context);if(!isNorse())return items;applyDataFixes();
    const draft=state.draft;
    items=items.filter(item=>{
      if(item.id==="gandstaff")return Boolean(unit?.wizard||unit?.tags?.includes("wizard"));
      if(item.id==="andvares_gift")return ["norse_king","norse_jarl"].includes(unit?.id)&&context==="character"&&!draft?.mount;
      if(item.id==="enchanted_wolf_pelt"){
        if(context==="character")return !draft?.mount;
        if(context==="champion")return unit?.unitType!=="cavalry";
      }
      return true;
    });
    return items;
  };

  const oldSave=saveEditor;
  saveEditor=function(){
    if(isNorse()&&state.draft){
      const e=state.draft,u=getUnit(e.sectionKey,e.unitId),o=e.optionSelections||{};
      if(u?.id==="berserkers"&&o.additional_hand_weapons&&o.double_handed_weapons){alert("Berserkers must choose additional hand weapons or double handed weapons, not both.");return;}
      if(u?.id==="norse_thralls"&&o.shields_throwing_spears&&o.bows){alert("Norse Thralls must choose shields and throwing spears or bows, not both.");return;}
      if(u?.id==="mounted_norse_warriors"){
        if(o.spears&&o.lances){alert("Mounted Norse Warriors must choose spears or lances, not both.");return;}
        if(o.lances&&o.bows){alert("Mounted Norse Warriors may only take bows when they are not using lances.");return;}
      }
      if(u?.id==="norse_dwarf_warriors"){
        if(o.spears&&o.double_handed_weapons){alert("Norse Dwarfs must choose spears or double handed weapons, not both.");return;}
        const other=Boolean(o.shields||o.spears||o.double_handed_weapons);
        if(o.bows&&other){alert("Norse Dwarfs may take bows only if they take no other weapon or armour upgrades.");return;}
        if(o.skis&&!o.bows){alert("Norse Dwarfs may use skis only when equipped with bows.");return;}
      }
    }
    return oldSave();
  };

  const oldArmour=calculatePrintedArmourSave;
  calculatePrintedArmourSave=function(entry,unit){
    if(isNorse()){
      if(unit?.id==="mammoth")return "4+";
      if(unit?.id==="stone_trolls")return "5+";
    }
    return oldArmour(entry,unit);
  };
})();
