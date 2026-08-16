// Cross-army consistency fixes for universal WHR builder rules.
(() => {
  function isWizard(unit) {
    const tags = unit?.tags || [];
    return Boolean(unit?.wizard) || tags.includes("wizard") || tags.includes("mage") || tags.includes("sorcerer") || tags.includes("shaman");
  }

  function legacyMagicMaximum(unit, context) {
    if (context === "champion") {
      return Number(
        unit?.champion?.magicItemLimit ??
        unit?.champion?.magicItems?.limit ??
        unit?.champion?.magicItems?.maximum ??
        0
      );
    }
    return Number(
      unit?.magicItemLimit ??
      unit?.magicItems?.limit ??
      unit?.magicItems?.maximum ??
      unit?.magicItems?.additionalMaximum ??
      0
    );
  }

  const previousMagicMaximum = getMagicMaximum;
  getMagicMaximum = function(unit, context) {
    const current = Number(previousMagicMaximum(unit, context) || 0);
    return current > 0 ? current : legacyMagicMaximum(unit, context);
  };

  const previousAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const maximum = getMagicMaximum(unit, context);
    if (maximum <= 0) return [];

    let items = previousAllowedMagicItems(unit, context) || [];
    const wizard = isWizard(unit);

    // Legacy army files used magicItemLimit without a modern magicItems block.
    // Preserve their intended access to the army/common pools while keeping
    // universal wizard-only categories closed to mundane characters.
    const isLegacy = context === "champion"
      ? Boolean(unit?.champion?.magicItemLimit != null && !unit?.champion?.magicItems)
      : Boolean(unit?.magicItemLimit != null && !unit?.magicItems);

    if (!items.length && isLegacy) {
      const categories = new Set(["magic_weapon", "magic_armour", "enchanted_item"]);
      if (wizard) {
        categories.add("arcane_item");
        categories.add("familiar");
      }
      items = [
        ...(state.data?.commonMagicItems || []),
        ...(state.data?.factionMagicItems || [])
      ].filter(item => categories.has(item.category));
    }

    if (!wizard) {
      items = items.filter(item => item.category !== "arcane_item" && item.category !== "familiar");
    }

    return items;
  };

  function unitHasStandardBearer(unit) {
    if (!unit || unit.unitType === "skirmisher" || (unit.tags || []).includes("skirmisher")) return false;
    const command = unit.command || {};
    const definition = getCommandDefinition(unit, "standardBearer") || {};
    if (definition.allowed === false) return false;
    if (command.useGlobalDefaults) return true;
    return Boolean(command.standardBearer);
  }

  const previousRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = previousRegimentEditor(entry, unit);
    if (
      entry?.command?.standardBearer &&
      unitHasStandardBearer(unit) &&
      !String(html).includes("data-magic-banner")
    ) {
      html += renderMagicBannerEditor(entry, unit);
    }
    return html;
  };

  // Expose the invariant helper for the all-army regression workflow.
  window.whrUnitHasStandardBearer = unitHasStandardBearer;
})();
