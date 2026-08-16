// Global WHR v1.0 release-rule hardening.
// Loaded immediately after app.js so later army-specific extensions wrap these
// corrected generic behaviours rather than having to compensate per faction.
(() => {
  const ARMOUR_EQUIPMENT = new Set(["light_armour", "heavy_armour", "full_plate_armour"]);

  function magicSettings(unit, context) {
    return context === "champion" ? unit?.champion?.magicItems : unit?.magicItems;
  }

  function collectEquipmentIds(value, output = new Set()) {
    if (!value) return output;
    if (typeof value === "string") { output.add(value); return output; }
    if (Array.isArray(value)) { value.forEach(item => collectEquipmentIds(item, output)); return output; }
    if (typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (["cost", "points", "rules", "name", "type", "id"].includes(key)) continue;
        collectEquipmentIds(child, output);
      }
      if (typeof value.id === "string" && /armour|shield|weapon|spear|lance|flail|bow|crossbow|handgun|pistol|halberd/i.test(value.id)) output.add(value.id);
    }
    return output;
  }

  function mundaneEquipmentAccess(unit, context) {
    const ids = new Set();
    collectEquipmentIds(unit?.equipment, ids);
    collectEquipmentIds(unit?.fixedEquipment, ids);
    collectEquipmentIds(unit?.equipmentOptions, ids);
    collectEquipmentIds(unit?.options, ids);
    if (context === "champion") {
      collectEquipmentIds(unit?.champion?.equipment, ids);
      collectEquipmentIds(unit?.champion?.fixedEquipment, ids);
      collectEquipmentIds(unit?.champion?.equipmentOptions, ids);
      collectEquipmentIds(unit?.champion?.options, ids);
    }
    return ids;
  }

  function meetsMagicRequirement(requirement, unit, context) {
    const access = mundaneEquipmentAccess(unit, context);
    const req = String(requirement || "");
    if (req === "bearer_can_wear_armour") return [...ARMOUR_EQUIPMENT].some(id => access.has(id));
    if (req.startsWith("bearer_can_take_")) return access.has(req.slice("bearer_can_take_".length));
    return true;
  }

  function itemEligibleForBearer(item, unit, context) {
    return (item?.requirements || []).every(req => meetsMagicRequirement(req, unit, context));
  }

  getAllowedMagicItems = function(unit, context) {
    const settings = magicSettings(unit, context);
    if (!settings) return [];
    const pools = settings.allowedPools || ["common", "faction"];
    const categories = settings.allowedCategories || ["magic_weapon", "magic_armour", "enchanted_item", "arcane_item", "familiar"];
    const result = [];
    if (pools.includes("common")) result.push(...(state.data?.commonMagicItems || []));
    if (pools.some(pool => pool !== "common")) result.push(...(state.data?.factionMagicItems || []));
    let filtered = result.filter(item => categories.includes(item.category));
    filtered = filtered.filter(item => itemEligibleForBearer(item, unit, context));
    const selectedIds = context === "champion" ? (state.draft?.champion?.magicItems || []) : (state.draft?.magicItems || []);
    const selectedArmour = selectedIds.find(id => getMagicItem(id)?.category === "magic_armour");
    if (selectedArmour) filtered = filtered.filter(item => item.category !== "magic_armour" || item.id === selectedArmour);
    return [...new Map(filtered.map(item => [item.id, item])).values()];
  };

  function effectiveRegimentMinimum(unit) {
    const stated = Math.max(1, Number(unit?.size?.minimum || 1));
    const modelCost = Number(unit?.points?.value || 0);
    const minimumModelPoints = Number(state.data?.globalArmyRules?.minimumRegimentModelPoints || 50);
    if (unit?.points?.type !== "per_model" || modelCost <= 0 || minimumModelPoints <= 0) return stated;
    return Math.max(stated, Math.ceil(minimumModelPoints / modelCost));
  }

  function applyEffectiveRegimentMinimums() {
    for (const unit of state.data?.faction?.regiments || []) {
      unit.size = unit.size || {};
      unit.size.minimum = effectiveRegimentMinimum(unit);
    }
  }

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!state.data) return;
    applyEffectiveRegimentMinimums();
    renderUnitBrowser();
    renderArmy();
  };

  window.whrEffectiveRegimentMinimum = effectiveRegimentMinimum;
  window.whrApplyEffectiveRegimentMinimums = applyEffectiveRegimentMinimums;
  window.whrMagicItemEligibleForBearer = itemEligibleForBearer;
})();
