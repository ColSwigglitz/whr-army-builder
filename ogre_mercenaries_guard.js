// Final construction and magic-pool guards for Ogre Mercenaries.
(() => {
  const isOgre = () => state.data?.faction?.id === "ogre_mercenaries" && state.selectedArmyId === "ogre_mercenaries";
  const tags = unit => unit?.tags || [];
  const isAlly = unit => tags(unit).includes("ogre_ally");
  const isBsb = unit => tags(unit).includes("bsb") || tags(unit).includes("battle_standard_bearer") || /battle standard|\bbsb\b/i.test(unit?.name || "");
  const isWizard = unit => Boolean(unit?.wizard) || tags(unit).includes("wizard") || tags(unit).includes("shaman") || /wizard|shaman|sorcer/i.test(unit?.name || "") || Number(unit?.wizardLevel || 0) > 0;
  const nativePoints = () => state.roster.reduce((sum, entry) => {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return sum + (unit && !isAlly(unit) ? calculateEntry(entry) : 0);
  }, 0);

  function limitedChoiceCount(tribe, excludeEntryId=null) {
    return state.roster.reduce((count, entry) => {
      if (entry.id === excludeEntryId) return count;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (!unit || unit.ogreAllyTribe !== tribe) return count;
      if (entry.sectionKey === "warMachines" && ["common_goblins","hobgoblins","halflings"].includes(tribe)) return count + 1;
      if (tribe === "common_goblins" && entry.mount === "ogally_orcs_goblins_goblin_wolf_chariot_character") return count + 1;
      return count;
    }, 0);
  }

  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isOgre()) return oldAddUnit(sectionKey, unitId);
    const unit = getUnit(sectionKey, unitId);
    if (!unit) return;

    if (isBsb(unit) && state.roster.some(entry => isBsb(getUnit(entry.sectionKey, entry.unitId)))) {
      alert("An Ogre Mercenaries army may include only one Battle Standard Bearer, and it must be an Ogre.");
      return;
    }

    if (sectionKey === "warMachines" && isAlly(unit) && ["common_goblins","hobgoblins","halflings"].includes(unit.ogreAllyTribe)) {
      const allowance = Math.floor(nativePoints() / 1000);
      if (limitedChoiceCount(unit.ogreAllyTribe) >= allowance) {
        alert(`You may include one ${unit.ogreAllyTribe.replaceAll("_"," ")} war machine or chariot for each full 1,000 points of models in the Ogre army. Current allowance: ${allowance}.`);
        return;
      }
    }

    return oldAddUnit(sectionKey, unitId);
  };

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isOgre() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (unit?.ogreAllyTribe === "common_goblins" && state.draft.mount === "ogally_orcs_goblins_goblin_wolf_chariot_character") {
        const allowance = Math.floor(nativePoints() / 1000);
        if (limitedChoiceCount("common_goblins", state.draft.id) >= allowance) {
          alert(`A Common Goblin Wolf Chariot uses the same allied chariot/war-machine allowance. Current allowance: ${allowance}.`);
          return;
        }
      }
    }
    return oldSaveEditor();
  };

  function sourceBearerAllows(item, unit) {
    if (unit.ogreAllySource !== "orcs_goblins") return true;
    const text = `${item.name || ""} ${item.rules || ""}`.toLowerCase();
    const tribe = unit.ogreAllyTribe;
    if (text.includes("common goblin") && tribe !== "common_goblins") return false;
    if (text.includes("forest goblin") && tribe !== "forest_goblins") return false;
    if (text.includes("night goblin") && tribe !== "night_goblins") return false;
    if (text.includes("common orc") || text.includes("black orc") || text.includes("orc only")) return false;
    if ((text.includes("shaman only") || text.includes("shamans only")) && !isWizard(unit)) return false;
    return true;
  }

  // Imported allied units have namespaced item IDs. The older O&G character data
  // uses magicItemLimit rather than a magicItems object, so support both schemas.
  const oldAllowedMagic = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const base = oldAllowedMagic(unit, context);
    if (!isOgre() || !isAlly(unit)) return base;

    let settings = context === "champion" ? unit.champion?.magicItems : unit.magicItems;
    const legacyLimit = context === "character" && Number(unit.magicItemLimit || 0) > 0;
    if (!settings && legacyLimit) settings = {allowedCategories:["magic_weapon","magic_armour","enchanted_item"]};
    if (!settings) return base;

    const categories = new Set(settings.allowedCategories || ["magic_weapon","magic_armour","enchanted_item","arcane_item","familiar"]);
    if (!isWizard(unit)) { categories.delete("arcane_item"); categories.delete("familiar"); }

    const sourceItems = (state.data.factionMagicItems || []).filter(item =>
      item.ogreAllySource === unit.ogreAllySource && categories.has(item.category) && sourceBearerAllows(item, unit)
    );
    const commonItems = legacyLimit ? (state.data.commonMagicItems || []).filter(item => categories.has(item.category)) : [];

    const byId = new Map(base.filter(item => categories.has(item.category)).map(item => [item.id,item]));
    for (const item of commonItems) byId.set(item.id,item);
    for (const item of sourceItems) byId.set(item.id,item);
    return [...byId.values()].filter(item => !["iron_boot","iron_fist","smuckle_buckle"].includes(item.id));
  };
})();
