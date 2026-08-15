// Final Halfling edge cases: travelling wizards participate in Liberated Magic correctly.
(() => {
  const isHalfling = () => state.data?.faction?.id === "halflings_moot" && state.selectedArmyId === "halflings_moot";
  const tags = unit => unit?.tags || [];
  const isMootBearer = unit => tags(unit).includes("halfling_character") || tags(unit).includes("halfling_regiment") || tags(unit).includes("human_wizard");
  const isForeign = id => Boolean(getMagicItem(id)?.halflingForeignItem);

  function legalForeign(item) {
    if (!item?.halflingForeignItem) return false;
    if (item.category === "enchanted_item") return true;
    if (item.category === "magic_weapon") {
      const text = `${item.name || ""} ${item.rules || ""}`.toLowerCase();
      return !/(lance|spear|halberd|flail|double handed|double-handed|great weapon|staff|pistol|crossbow|handgun|throwing|bolas)/.test(text);
    }
    if (item.category === "magic_armour") return /light armour/i.test(String(item.rules || ""));
    return false;
  }

  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    if (!isHalfling() || !tags(unit).includes("human_wizard")) return previousGetAllowedMagicItems(unit, context);
    const settings = context === "champion" ? unit.champion?.magicItems : unit.magicItems;
    if (!settings) return [];
    const categories = settings.allowedCategories || ["magic_weapon", "magic_armour", "enchanted_item", "arcane_item", "familiar"];
    const common = (state.data.commonMagicItems || []).filter(item => categories.includes(item.category));
    const liberated = (state.data.factionMagicItems || []).filter(item => legalForeign(item) && categories.includes(item.category));
    return [...common, ...liberated];
  };

  function usedForeignItems(ignoreEntryId = null, draft = null) {
    let total = 0;
    for (const entry of state.roster) {
      if (entry.id === ignoreEntryId) continue;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (!isMootBearer(unit)) continue;
      total += (entry.magicItems || []).filter(isForeign).length;
      total += (entry.champion?.magicItems || []).filter(isForeign).length;
    }
    if (draft) {
      const unit = getUnit(draft.sectionKey, draft.unitId);
      if (isMootBearer(unit)) {
        total += (draft.magicItems || []).filter(isForeign).length;
        total += (draft.champion?.magicItems || []).filter(isForeign).length;
      }
    }
    return total;
  }

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isHalfling() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (tags(unit).includes("human_wizard")) {
        const allowance = Math.max(1, Math.ceil(Number(state.pointsLimit || 0) / 800));
        if (usedForeignItems(state.draft.id, state.draft) > allowance) {
          window.alert(`This ${state.pointsLimit}-point army may include at most ${allowance} liberated magic item${allowance === 1 ? "" : "s"} from other army books.`);
          return;
        }
      }
    }
    return previousSaveEditor();
  };
})();
