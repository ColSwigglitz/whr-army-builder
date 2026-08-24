// Stable Dev runtime overrides.
// All JavaScript dependencies are now assembled by tools/build_dev_bundle.py
// into explicit core/account/campaign bundles. Do not dynamically inject
// application scripts from here.
(() => {
  const previousArmyMonogram = armyMonogram;
  armyMonogram = function(name) {
    const cleaned = String(name || "").replace(/^the\s+/i, "").trim();
    const ampersandMatch = cleaned.match(/^([^\s&]+)\s*&\s*([^\s&]+)/);
    if (ampersandMatch) {
      return `${ampersandMatch[1][0]}&${ampersandMatch[2][0]}`.toUpperCase();
    }
    return previousArmyMonogram(name);
  };
  if (state.armyManifest) renderArmySelection();

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
