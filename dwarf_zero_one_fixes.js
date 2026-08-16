// Dwarf 0-1 unit restrictions for elite regiments, Miners and the Goblin Hewer.
(() => {
  const isDwarfArmy = () => state.data?.faction?.id === "dwarfs";

  const restrictedIds = new Set([
    "longbeards",
    "hammerers",
    "ironbreakers",
    "rangers",
    "miners",
    "goblin_hewer"
  ]);

  const restrictedNames = new Set([
    "longbeards",
    "long beards",
    "hammerers",
    "ironbreakers",
    "rangers",
    "miners",
    "dwarf miners",
    "goblin hewer",
    "goblin hewer war machine"
  ]);

  function normaliseName(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function isRestricted(unit) {
    if (!isDwarfArmy() || !unit) return false;
    return restrictedIds.has(String(unit.id || "").toLowerCase()) || restrictedNames.has(normaliseName(unit.name));
  }

  function sameRestrictedChoice(a, b) {
    if (!a || !b) return false;
    const aId = String(a.id || "").toLowerCase();
    const bId = String(b.id || "").toLowerCase();
    if (aId && bId) return aId === bId;
    return normaliseName(a.name) === normaliseName(b.name);
  }

  function existingCopy(unit, ignoreEntryId = null) {
    if (!isRestricted(unit)) return null;
    return state.roster.find(entry => {
      if (entry.id === ignoreEntryId) return false;
      const existing = getUnit(entry.sectionKey, entry.unitId);
      return existing && isRestricted(existing) && sameRestrictedChoice(existing, unit);
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
        unit.maxUnits = 1;
      }
    }

    renderUnitBrowser();
    renderArmy();
  };
})();
