// Classic Undead selectable regimental champion support.
(() => {
  const previousCalculateChampionCost = calculateChampionCost;
  const previousDescribeEntry = describeEntry;
  const previousRenderRegimentEditor = renderRegimentEditor;
  const previousWireEditorControls = wireEditorControls;
  const previousRosterPadChampionRow = rosterPadChampionRow;

  const CHOICES = {
    zombies: [
      { id: "wight", name: "Wight Champion", profileId: "wight_champion", cost: 25 },
      { id: "vampire_thrall", name: "Von Carstein Vampire Thrall", profileId: "vampire_thrall", cost: 60 },
      { id: "wraith", name: "Wraith Champion", profileId: "wraith_champion", cost: 50 }
    ],
    skeleton_warriors: [
      { id: "wight", name: "Wight Champion", profileId: "wight_champion", cost: 35 },
      { id: "vampire_thrall", name: "Von Carstein Vampire Thrall", profileId: "vampire_thrall", cost: 70 },
      { id: "wraith", name: "Wraith Champion", profileId: "wraith_champion", cost: 60 }
    ],
    skeleton_horsemen: [
      { id: "wight", name: "Wight Champion", profileId: "wight_champion", cost: 50, mounted: true },
      { id: "vampire_thrall", name: "Mounted Von Carstein Vampire Thrall", profileId: "vampire_thrall", cost: 80, mounted: true },
      { id: "wraith", name: "Mounted Wraith Champion", profileId: "wraith_champion", cost: 70, mounted: true }
    ]
  };

  function isClassicUndead() {
    return state.data?.faction?.id === "classic_undead";
  }

  function choicesFor(unit) {
    return isClassicUndead() ? (CHOICES[unit?.id] || null) : null;
  }

  function selectedChoice(entry, unit) {
    const choices = choicesFor(unit);
    if (!choices) return null;
    const id = entry?.champion?.choiceId || choices[0].id;
    return choices.find(choice => choice.id === id) || choices[0];
  }

  function championDefinition(entry, unit) {
    const choice = selectedChoice(entry, unit);
    if (!choice) return unit.champion;
    return {
      name: choice.name,
      profileId: choice.profileId,
      cost: { base: choice.cost },
      magicItems: {
        maximum: 1,
        allowedPools: ["common", "undead"]
      },
      mounted: Boolean(choice.mounted)
    };
  }

  function withSelectedChampion(entry, unit, fn) {
    if (!choicesFor(unit)) return fn();
    const original = unit.champion;
    unit.champion = championDefinition(entry, unit);
    try {
      return fn();
    } finally {
      unit.champion = original;
    }
  }

  calculateChampionCost = function(entry, unit) {
    return withSelectedChampion(entry, unit, () => previousCalculateChampionCost(entry, unit));
  };

  describeEntry = function(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    let text = withSelectedChampion(entry, unit, () => previousDescribeEntry(entry));
    if (!choicesFor(unit) || !entry.champion?.selected) return text;
    const choice = selectedChoice(entry, unit);
    if (!choice) return text;
    if (!text.includes(choice.name)) {
      text = `${text === "Base configuration" ? "" : text + " · "}${choice.name}`;
    }
    return text;
  };

  renderRegimentEditor = function(entry, unit) {
    let html = withSelectedChampion(entry, unit, () => previousRenderRegimentEditor(entry, unit));
    const choices = choicesFor(unit);
    if (!choices) return html;

    const selected = selectedChoice(entry, unit);
    const selector = `
      <div class="dialog-field classic-undead-champion-choice">
        <label>Champion type</label>
        <select data-classic-undead-champion-type>
          ${choices.map(choice => `<option value="${escapeHtml(choice.id)}" ${selected?.id === choice.id ? "selected" : ""}>${escapeHtml(choice.name)} (${formatPoints(choice.cost)} pts)</option>`).join("")}
        </select>
        <div class="field-hint">Choose which champion type to add, then tick the champion checkbox below.</div>
      </div>
    `;

    return html.replace(
      /(<section class="editor-section">\s*<h3 class="editor-section-title">Champion<\/h3>)/,
      `$1${selector}`
    );
  };

  wireEditorControls = function() {
    previousWireEditorControls();
    const selector = els.dialogContent.querySelector("[data-classic-undead-champion-type]");
    if (!selector || !state.draft) return;
    selector.addEventListener("change", () => {
      state.draft.champion.choiceId = selector.value;
      state.draft.champion.magicItems = [];
      renderEditor();
    });
  };

  rosterPadChampionRow = function(entry, unit) {
    return withSelectedChampion(entry, unit, () => previousRosterPadChampionRow(entry, unit));
  };
})();
