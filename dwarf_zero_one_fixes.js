// Dwarf 0-1 unit restrictions for elite regiments and the Goblin Hewer.
(() => {
  const isDwarfArmy = () => state.data?.faction?.id === "dwarfs";
  const restrictedNames = new Set([
    "longbeards",
    "hammerers",
    "ironbreakers",
    "rangers",
    "goblin hewer"
  ]);

  function normaliseName(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function isRestricted(unit) {
    if (!isDwarfArmy() || !unit) return false;
    const name = normaliseName(unit.name);
    return restrictedNames.has(name) || name === "long beards" || name === "goblin hewer war machine";
  }

  function existingCopy(unit, ignoreEntryId = null) {
    if (!isRestricted(unit)) return null;
    return state.roster.find(entry => {
      if (entry.id === ignoreEntryId) return false;
      const existing = getUnit(entry.sectionKey, entry.unitId);
      return existing && normaliseName(existing.name) === normaliseName(unit.name);
    }) || null;
  }

  const previousAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    const unit = getUnit(sectionKey, unitId);
    if (unit && isRestricted(unit) && existingCopy(unit)) {
      window.alert(`${unit.name} is a 0-1 choice. Only one unit may be included in the army.`);
      return;
    }
    return previousAddUnit(sectionKey, unitId);
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isDwarfArmy() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (unit && isRestricted(unit) && existingCopy(unit, state.draft.id)) {
        window.alert(`${unit.name} is a 0-1 choice. Only one unit may be included in the army.`);
        return;
      }
    }
    return previousSaveEditor();
  };

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!isDwarfArmy()) return;

    for (const sectionKey of ["regiments", "warMachines"]) {
      for (const unit of state.data?.faction?.[sectionKey] || []) {
        if (!isRestricted(unit)) continue;
        unit.rules = unit.rules || [];
        if (!unit.rules.some(rule => /^0\s*-\s*1$/i.test(String(rule).trim()))) unit.rules.unshift("0-1");
      }
    }
    renderUnitBrowser();
    renderArmy();
  };
})();
