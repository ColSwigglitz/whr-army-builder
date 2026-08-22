// Targeted Tomb Kings support for the two Tomb Guard champion choices.
(() => {
  const previousSelectArmy = selectArmy;
  const previousCalculateChampionCost = calculateChampionCost;
  const previousDescribeEntry = describeEntry;
  const previousRenderRegimentEditor = renderRegimentEditor;
  const previousWireEditorControls = wireEditorControls;
  const previousRosterPadNotes = rosterPadNotes;
  const previousRosterPadChampionRow = rosterPadChampionRow;

  const TOMB_CHAMPION = {
    id: "tomb_champion",
    name: "Tomb Champion",
    profileId: "tomb_champion",
    cost: { base: 30, add: { type: "unit_model_cost" } },
    magicItems: { maximum: 1, allowedPools: ["common", "undead"] }
  };

  const MUMMY_CHAMPION = {
    id: "mummy_champion",
    name: "Mummy Champion",
    profileId: "mummy_champion",
    cost: { base: 60 },
    equipment: ["light_armour", "double_handed_weapon"],
    magicItems: { maximum: 1, allowedPools: ["common", "undead"] }
  };

  function isTombGuards(unit) {
    return state.data?.faction?.id === "tomb_kings" && unit?.id === "tomb_guards";
  }

  function selectedChampion(entry) {
    return entry?.champion?.type === "mummy_champion" ? MUMMY_CHAMPION : TOMB_CHAMPION;
  }

  function withSelectedChampion(entry, unit, fn) {
    if (!isTombGuards(unit)) return fn();
    const original = unit.champion;
    unit.champion = selectedChampion(entry);
    try {
      return fn();
    } finally {
      unit.champion = original;
    }
  }

  function applyTombGuardChampionFix() {
    if (state.data?.faction?.id !== "tomb_kings") return;
    const tombGuards = state.data.faction.regiments?.find(unit => unit.id === "tomb_guards");
    if (!tombGuards) return;
    tombGuards.champion = { ...TOMB_CHAMPION };
    tombGuards.championChoices = [TOMB_CHAMPION, MUMMY_CHAMPION];
  }

  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    applyTombGuardChampionFix();
    if (state.data?.faction?.id === "tomb_kings") {
      renderUnitBrowser();
      renderArmy();
    }
  };

  calculateChampionCost = function(entry, unit) {
    return withSelectedChampion(entry, unit, () => previousCalculateChampionCost(entry, unit));
  };

  describeEntry = function(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return withSelectedChampion(entry, unit, () => previousDescribeEntry(entry));
  };

  renderRegimentEditor = function(entry, unit) {
    let html = withSelectedChampion(entry, unit, () => previousRenderRegimentEditor(entry, unit));
    if (!isTombGuards(unit)) return html;

    const choice = selectedChampion(entry).id;
    const selector = `
      <div class="dialog-field tomb-guard-champion-choice">
        <label>Champion type</label>
        <select data-tomb-guard-champion-type>
          <option value="tomb_champion" ${choice === "tomb_champion" ? "selected" : ""}>Tomb Champion (30 pts + one Tomb Guard)</option>
          <option value="mummy_champion" ${choice === "mummy_champion" ? "selected" : ""}>Mummy Champion (60 pts)</option>
        </select>
        <div class="field-hint">Choose which champion type to add, then tick the champion checkbox below. The Mummy Champion has light armour and a double handed weapon.</div>
      </div>
    `;

    return html.replace(
      /(<section class="editor-section">\s*<h3 class="editor-section-title">Champion<\/h3>)/,
      `$1${selector}`
    );
  };

  wireEditorControls = function() {
    previousWireEditorControls();
    const selector = els.dialogContent.querySelector("[data-tomb-guard-champion-type]");
    if (!selector || !state.draft) return;
    selector.addEventListener("change", () => {
      state.draft.champion.type = selector.value;
      state.draft.champion.magicItems = [];
      renderEditor();
    });
  };

  rosterPadNotes = function(entry, unit) {
    return withSelectedChampion(entry, unit, () => {
      const notes = previousRosterPadNotes(entry, unit);
      if (isTombGuards(unit) && entry.champion?.selected && entry.champion?.type === "mummy_champion") {
        if (!notes.includes("Light Armour")) notes.push("Light Armour");
        if (!notes.includes("Double Handed Weapon")) notes.push("Double Handed Weapon");
      }
      return notes;
    });
  };

  rosterPadChampionRow = function(entry, unit) {
    return withSelectedChampion(entry, unit, () => previousRosterPadChampionRow(entry, unit));
  };

  window.whrApplyTombGuardChampionFix = applyTombGuardChampionFix;
  window.whrTombGuardChampionForEntry = selectedChampion;
})();