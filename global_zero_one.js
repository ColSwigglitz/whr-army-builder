// Global WHR 0-1 / unique-unit enforcement.
// Any unit explicitly marked 0-1, maxUnits:1, any Special Character, and any
// flying regiment may only be included once. The Add to Army entry is labelled
// consistently from the same rule.
(() => {
  function hasZeroOneRule(unit) {
    return (unit?.rules || []).some(rule => /^0\s*-\s*1$/i.test(String(rule).trim()));
  }

  function isFlyingRegiment(sectionKey, unit) {
    if (sectionKey !== "regiments" || !unit) return false;

    const tags = (unit.tags || []).map(tag => String(tag).toLowerCase());
    const type = String(unit.unitType || "").toLowerCase();
    const rules = (unit.rules || []).map(rule => String(rule).toLowerCase());

    if (tags.some(tag => ["flying", "flyer", "flying_regiment", "flying regiment"].includes(tag))) return true;
    if (/flying[_\s-]?regiment/.test(type)) return true;

    // Some army books store Fly as a reference rule rather than a tag/type.
    return rules.some(rule =>
      /^fly(?:\s*\([^)]*\))?$/.test(rule.trim()) ||
      /\bflying regiment\b/.test(rule)
    );
  }

  function isUniqueChoice(sectionKey, unit) {
    if (!unit) return false;
    if (sectionKey === "specialCharacters") return true;
    if (Number(unit.maxUnits) === 1) return true;
    if (hasZeroOneRule(unit)) return true;
    if (isFlyingRegiment(sectionKey, unit)) return true;
    return false;
  }

  function markUniqueChoices() {
    if (!state.data?.faction) return;

    for (const section of sectionConfig) {
      for (const unit of state.data.faction[section.key] || []) {
        if (!isUniqueChoice(section.key, unit)) continue;
        unit.maxUnits = 1;
        unit.rules = Array.isArray(unit.rules) ? unit.rules : [];
        if (!hasZeroOneRule(unit)) unit.rules.unshift("0-1");
      }
    }
  }

  function existingCopy(sectionKey, unitId, ignoreEntryId = null) {
    return state.roster.find(entry =>
      entry.id !== ignoreEntryId &&
      entry.sectionKey === sectionKey &&
      entry.unitId === unitId
    ) || null;
  }

  const previousAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    const unit = getUnit(sectionKey, unitId);
    if (isUniqueChoice(sectionKey, unit) && existingCopy(sectionKey, unitId)) {
      window.alert(`${unit.name} is a 0-1 choice. Only one unit may be included in the army.`);
      return;
    }
    return previousAddUnit(sectionKey, unitId);
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (
        isUniqueChoice(state.draft.sectionKey, unit) &&
        existingCopy(state.draft.sectionKey, state.draft.unitId, state.draft.id)
      ) {
        window.alert(`${unit.name} is a 0-1 choice. Only one unit may be included in the army.`);
        return;
      }
    }
    return previousSaveEditor();
  };

  const previousRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    previousRenderUnitBrowser();
    if (!state.data?.faction) return;

    els.unitBrowser.querySelectorAll(".unit-choice").forEach(button => {
      const sectionKey = button.dataset.section;
      const unit = getUnit(sectionKey, button.dataset.unitId);
      if (!isUniqueChoice(sectionKey, unit)) return;

      const meta = button.querySelector(".unit-choice-meta");
      if (meta) meta.textContent = "0-1 choice · Add now, configure in your roster";
      button.dataset.zeroOne = "true";
    });
  };

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!state.data) return;
    markUniqueChoices();
    renderUnitBrowser();
    renderArmy();
  };

  // Expose the rule for regression checks and future army extensions.
  window.whrIsUniqueChoice = isUniqueChoice;
})();
