// Final v1.0 release-hardening pass.
// Loaded after every army-specific extension so final runtime units and item
// lists still obey the universal WHR release rules.
(() => {
  const previousAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let items = previousAllowedMagicItems(unit, context) || [];
    if (typeof window.whrMagicItemEligibleForBearer === "function") {
      items = items.filter(item => window.whrMagicItemEligibleForBearer(item, unit, context));
    }

    const selectedIds = context === "champion"
      ? (state.draft?.champion?.magicItems || [])
      : (state.draft?.magicItems || []);
    const selectedArmour = selectedIds.find(id => getMagicItem(id)?.category === "magic_armour");
    if (selectedArmour) {
      items = items.filter(item => item.category !== "magic_armour" || item.id === selectedArmour);
    }

    return [...new Map(items.map(item => [item.id, item])).values()];
  };

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!state.data) return;
    if (typeof window.whrApplyEffectiveRegimentMinimums === "function") {
      window.whrApplyEffectiveRegimentMinimums();
    }
    renderUnitBrowser();
    renderArmy();
  };
})();
