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

  function normalise(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function restrictedKey(unit) {
    const id = normalise(unit?.id);
    const name = normalise(unit?.name);
    const combined = `${id} ${name}`;

    if (restrictedIds.has(String(unit?.id || "").toLowerCase())) return String(unit.id).toLowerCase();
    if (/\blong\s*beards?\b/.test(combined) || /\blongbeards?\b/.test(combined)) return "longbeards";
    if (/\bhammerers?\b/.test(combined)) return "hammerers";
    if (/\biron\s*breakers?\b/.test(combined) || /\bironbreakers?\b/.test(combined)) return "ironbreakers";
    if (/\brangers?\b/.test(combined)) return "rangers";
    if (/\bminers?\b/.test(combined)) return "miners";
    if (/\bgoblin\s+hewer\b/.test(combined)) return "goblin_hewer";
    return null;
  }

  function isRestricted(unit) {
    return isDwarfArmy() && Boolean(restrictedKey(unit));
  }

  function existingCopy(unit, ignoreEntryId = null) {
    const key = restrictedKey(unit);
    if (!key) return null;
    return state.roster.find(entry => {
      if (entry.id === ignoreEntryId) return false;
      const existing = getUnit(entry.sectionKey, entry.unitId);
      return restrictedKey(existing) === key;
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
