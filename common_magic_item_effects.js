// Shared behaviour for common magic items whose rules affect army construction/points.
(() => {
  const ENDLESS_BANNER_ID = "endless_banner";

  function selectedEquipmentHasMissileWeapon(entry, unit) {
    const ids = typeof getSelectedEquipmentIds === "function"
      ? getSelectedEquipmentIds(entry, unit)
      : [];

    return ids.some(id => {
      const equipment = equipmentById?.get?.(id);
      const type = String(equipment?.type || "").toLowerCase();
      const name = String(equipment?.name || humanise(id) || "").toLowerCase();
      return type.includes("missile") || /\b(bow|longbow|crossbow|handgun|pistol|javelin|sling|throwing weapon|blowpipe)\b/.test(name);
    });
  }

  function endlessBannerEligible(entry, unit) {
    if (!entry || !unit || entry.sectionKey !== "regiments") return false;
    if (Number(entry.size || 0) < 40) return false;
    if (selectedEquipmentHasMissileWeapon(entry, unit)) return false;
    return true;
  }

  function endlessBannerDiscount(total) {
    const cap = Number(state.pointsLimit || 0) >= 3000 ? 100 : 50;
    return Math.min(Number(total || 0) * 0.20, cap);
  }

  // Endless Banner is a regiment-only banner and explicitly cannot be carried by a BSB.
  // Keep it out of character/champion magic-item selectors, but leave it visible in the
  // regiment Magic Banner dropdown so a player can select it after increasing the unit size.
  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    return previousGetAllowedMagicItems(unit, context)
      .filter(item => item.id !== ENDLESS_BANNER_ID);
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (state.draft?.magicBanner === ENDLESS_BANNER_ID) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (!endlessBannerEligible(state.draft, unit)) {
        window.alert("Endless Banner can only be carried by a regiment of at least 40 models with no missile weapons.");
        return;
      }
    }
    return previousSaveEditor();
  };

  // Apply the effect after all ordinary unit, option, champion and banner costs have
  // been calculated, so every screen that calls calculateEntry receives the same total.
  const previousCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    const total = previousCalculateEntry(entry);
    if (entry?.magicBanner !== ENDLESS_BANNER_ID) return total;

    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!endlessBannerEligible(entry, unit)) return total;

    return total - endlessBannerDiscount(total);
  };
})();
