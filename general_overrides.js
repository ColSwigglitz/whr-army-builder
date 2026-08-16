// WHR General edge-case overrides.
// Loaded after general_system.js so exceptional army/item rules take priority
// over the normal highest-Leadership General selection.
(() => {
  if (!window.whrGeneral) return;

  const original = window.whrGeneral;
  const FORCED_ITEM_NAMES = new Set(["forenrond's sword", "forenrond’s sword"]);
  const PROHIBITED_UNIT_PATTERNS = [/\bkorhil\b/i, /\bassassin\b/i];

  function unitFor(entry) {
    return entry ? getUnit(entry.sectionKey, entry.unitId) : null;
  }

  function selectedMagicItems(entry) {
    return (entry?.magicItems || []).map(getMagicItem).filter(Boolean);
  }

  function selectedChampionMagicItems(entry) {
    return (entry?.champion?.magicItems || []).map(getMagicItem).filter(Boolean);
  }

  function hasForenrondsSword(items) {
    return items.some(item => FORCED_ITEM_NAMES.has(String(item?.name || "").trim().toLowerCase()));
  }

  function forcedGeneralTarget() {
    if (Number(state.pointsLimit || 0) < 2000) return null;

    for (const entry of state.roster) {
      if (hasForenrondsSword(selectedMagicItems(entry))) {
        return { entryId: entry.id, model: "character", reason: "Forenrond’s Sword" };
      }
      if (entry.champion?.selected && hasForenrondsSword(selectedChampionMagicItems(entry))) {
        return { entryId: entry.id, model: "champion", reason: "Forenrond’s Sword" };
      }
    }
    return null;
  }

  function unitCannotBeGeneral(entry) {
    const unit = unitFor(entry);
    if (!unit) return false;
    if (unit.generalEligible === false) return true;
    const text = [unit.id, unit.name, unit.profileId, ...(unit.rules || []), ...(unit.tags || [])]
      .filter(Boolean).join(" ");
    return PROHIBITED_UNIT_PATTERNS.some(pattern => pattern.test(text));
  }

  function targetKey(target) {
    if (!target) return null;
    return target.model === "champion" ? `${target.entryId}::champion` : target.entryId;
  }

  function forcedEntry() {
    const target = forcedGeneralTarget();
    return target ? state.roster.find(entry => entry.id === target.entryId) || null : null;
  }

  const previousEligible = original.entryGeneralEligible;
  function entryGeneralEligible(entry) {
    const forced = forcedGeneralTarget();
    if (forced) return entry.id === forced.entryId;
    if (unitCannotBeGeneral(entry)) return false;
    return previousEligible(entry);
  }

  function permittedGeneralEntries() {
    const forced = forcedEntry();
    if (forced) return [forced];
    return original.permittedGeneralEntries().filter(entry => !unitCannotBeGeneral(entry));
  }

  function setGeneral(entryId) {
    const forced = forcedGeneralTarget();
    if (forced) {
      state.generalEntryId = forced.entryId;
      state.generalModel = forced.model;
      renderArmy();
      return;
    }
    state.generalModel = "character";
    return original.setGeneral(entryId);
  }

  window.whrGeneral = {
    ...original,
    entryGeneralEligible,
    permittedGeneralEntries,
    setGeneral,
    forcedGeneralTarget,
    targetKey
  };

  const previousRenderArmy = renderArmy;
  renderArmy = function() {
    const forced = forcedGeneralTarget();
    if (forced) {
      state.generalEntryId = forced.entryId;
      state.generalModel = forced.model;
    } else if (state.generalModel === "champion") {
      state.generalEntryId = null;
      state.generalModel = "character";
    }
    previousRenderArmy();

    if (forced?.model === "champion") {
      const edit = els.roster?.querySelector(`[data-edit="${forced.entryId}"]`);
      const card = edit?.closest(".roster-card");
      const name = card?.querySelector(".roster-card-name > span:first-child");
      if (name && !name.querySelector(".general-badge")) {
        name.insertAdjacentHTML("beforeend", `<span class="general-badge">General (Champion)</span>`);
      }
    }
  };

  const previousSnapshot = makeRosterSnapshot;
  makeRosterSnapshot = function() {
    const snapshot = previousSnapshot();
    snapshot.generalModel = state.generalModel || "character";
    return snapshot;
  };

  const previousLoadRoster = loadRoster;
  loadRoster = async function(id) {
    const saved = getSavedRosters().find(roster => roster.id === id);
    await previousLoadRoster(id);
    if (saved && state.currentSaveId === id) {
      state.generalModel = saved.generalModel || "character";
      renderArmy();
    }
  };

  const previousPrintableUnitName = printableUnitName;
  printableUnitName = function(entry, unit) {
    let name = previousPrintableUnitName(entry, unit);
    const forced = forcedGeneralTarget();
    if (forced?.entryId === entry.id && forced.model === "champion") {
      name = name.replace(/ \[GENERAL\]$/, "");
      return `${name} [GENERAL: CHAMPION]`;
    }
    return name;
  };
})();
