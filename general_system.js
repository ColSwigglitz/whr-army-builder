// Global WHR General selection and validation.
(() => {
  state.generalEntryId = state.generalEntryId || null;

  document.head.insertAdjacentHTML("beforeend", `
    <style>
      .general-button {
        min-height: 34px;
        padding: 6px 10px;
        border: 1px solid #b08a3b;
        border-radius: 6px;
        color: #5b4315;
        background: #fff8e8;
        font-size: 12px;
        font-weight: 850;
        white-space: nowrap;
      }
      .general-button:hover { background:#f7e7bd; }
      .general-button.selected {
        color:#fff;
        background:#7b211b;
        border-color:#561713;
      }
      .general-badge {
        display:inline-block;
        margin-left:7px;
        padding:2px 7px;
        border-radius:999px;
        color:#fff;
        background:#7b211b;
        font-size:10px;
        font-weight:900;
        letter-spacing:.05em;
        text-transform:uppercase;
        vertical-align:middle;
      }
      .general-status {
        margin-top:10px;
        padding:10px 12px;
        border:1px solid var(--border);
        border-left:4px solid var(--warning);
        border-radius:7px;
        background:#fff8e8;
        color:var(--text);
        font-size:12px;
        line-height:1.4;
      }
      .general-status.good {
        border-left-color:var(--success);
        background:#f3faf5;
      }
      .general-status strong { color:var(--accent-dark); }
    </style>
  `);

  const GENERAL_SECTIONS = new Set(["characters", "specialCharacters"]);

  function generalRule() {
    return state.data?.globalArmyRules?.general || {};
  }

  function entryUnit(entry) {
    return entry ? getUnit(entry.sectionKey, entry.unitId) : null;
  }

  function entryProfile(entry) {
    const unit = entryUnit(entry);
    return unit ? profileById.get(unit.profileId) || null : null;
  }

  function entryLeadership(entry) {
    const raw = entryProfile(entry)?.stats?.Ld;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  function selectedOptionLooksLikeBsb(entry, unit) {
    for (const option of unit?.options || []) {
      const selected = entry?.optionSelections?.[option.id];
      if (selected == null || selected === false || selected === "" || selected === 0) continue;
      const choice = option.type === "choice_group"
        ? (option.choices || []).find(item => (typeof item === "string" ? item : item.id) === selected)
        : null;
      const text = [
        option.id, option.name, option.label, option.rules,
        typeof choice === "string" ? choice : choice?.id,
        typeof choice === "object" ? choice?.name : null,
        typeof choice === "object" ? choice?.label : null,
        typeof choice === "object" ? choice?.rules : null
      ].filter(Boolean).join(" ").toLowerCase();
      if (/\bbsb\b|battle standard bearer/.test(text)) return true;
    }
    return false;
  }

  function isBattleStandardBearer(entry, unit) {
    const tags = (unit?.tags || []).map(tag => String(tag).toLowerCase());
    const identity = [unit?.id, unit?.name, unit?.profileId, ...(unit?.rules || [])]
      .filter(Boolean).join(" ").toLowerCase();
    return tags.some(tag => tag === "bsb" || tag.includes("battle_standard")) ||
      /\bbsb\b|battle standard bearer/.test(identity) ||
      selectedOptionLooksLikeBsb(entry, unit);
  }

  function armySpecificGeneralEligible(entry, unit) {
    // Bretonnia's Grand Army requires a knightly character, not a wizard.
    if (state.data?.faction?.id === "bretonnia") {
      const tags = unit?.tags || [];
      return tags.includes("knightly") && !tags.includes("wizard");
    }
    return true;
  }

  function entryGeneralEligible(entry) {
    if (!entry || !GENERAL_SECTIONS.has(entry.sectionKey)) return false;
    const unit = entryUnit(entry);
    if (!unit || unit.generalEligible === false) return false;
    if (generalRule().battleStandardBearerEligible === false && isBattleStandardBearer(entry, unit)) return false;
    if (!armySpecificGeneralEligible(entry, unit)) return false;
    return entryLeadership(entry) != null;
  }

  function eligibleEntries() {
    return state.roster.filter(entryGeneralEligible);
  }

  function highestEligibleLeadership() {
    const values = eligibleEntries().map(entryLeadership).filter(value => value != null);
    return values.length ? Math.max(...values) : null;
  }

  function permittedGeneralEntries() {
    const eligible = eligibleEntries();
    if (!generalRule().mustBeAmongHighestLeadership) return eligible;
    const highest = highestEligibleLeadership();
    return eligible.filter(entry => entryLeadership(entry) === highest);
  }

  function selectedGeneralEntry() {
    return state.roster.find(entry => entry.id === state.generalEntryId) || null;
  }

  function normalizeGeneralSelection() {
    if (!state.generalEntryId) return;
    const selected = selectedGeneralEntry();
    const permitted = new Set(permittedGeneralEntries().map(entry => entry.id));
    if (!selected || !permitted.has(selected.id)) state.generalEntryId = null;
  }

  function setGeneral(entryId) {
    const permitted = new Set(permittedGeneralEntries().map(entry => entry.id));
    if (!permitted.has(entryId)) {
      const highest = highestEligibleLeadership();
      window.alert(highest == null
        ? "This army does not currently contain an eligible General."
        : `The General must be chosen from an eligible character with the highest Leadership (${highest}).`);
      return;
    }
    state.generalEntryId = entryId;
    renderArmy();
  }

  function decorateRosterCards() {
    if (!els.roster || !state.roster.length) return;
    const permitted = new Set(permittedGeneralEntries().map(entry => entry.id));

    els.roster.querySelectorAll("[data-edit]").forEach(editButton => {
      const entry = state.roster.find(item => item.id === editButton.dataset.edit);
      if (!entry || !GENERAL_SECTIONS.has(entry.sectionKey)) return;
      const unit = entryUnit(entry);
      const card = editButton.closest(".roster-card");
      const actions = card?.querySelector(".roster-card-actions");
      const name = card?.querySelector(".roster-card-name > span:first-child");
      if (!actions || !name) return;

      if (entry.id === state.generalEntryId) {
        name.insertAdjacentHTML("beforeend", `<span class="general-badge">General</span>`);
      }

      if (permitted.has(entry.id)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `general-button${entry.id === state.generalEntryId ? " selected" : ""}`;
        button.textContent = entry.id === state.generalEntryId ? "General" : "Make General";
        button.addEventListener("click", () => setGeneral(entry.id));
        actions.insertBefore(button, editButton);
      }
    });
  }

  function generalStatusHtml() {
    const eligible = eligibleEntries();
    const permitted = permittedGeneralEntries();
    const selected = selectedGeneralEntry();
    const highest = highestEligibleLeadership();

    if (!eligible.length) {
      return `<div class="general-status"><strong>General required:</strong> add an eligible character to the army.</div>`;
    }

    if (!selected) {
      const names = permitted.map(entry => entryUnit(entry)?.name).filter(Boolean);
      return `<div class="general-status"><strong>Choose a General:</strong> ${
        generalRule().mustBeAmongHighestLeadership && highest != null
          ? `select a highest-Leadership eligible character (Ld ${escapeHtml(highest)}).`
          : "select an eligible character."
      }${names.length ? ` Eligible: ${escapeHtml(names.join(", "))}.` : ""}</div>`;
    }

    const unit = entryUnit(selected);
    return `<div class="general-status good"><strong>General:</strong> ${escapeHtml(unit?.name || "Character")} (Ld ${escapeHtml(entryLeadership(selected))}).</div>`;
  }

  const previousRenderArmy = renderArmy;
  renderArmy = function() {
    normalizeGeneralSelection();
    previousRenderArmy();
    decorateRosterCards();
  };

  const previousRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    previousRenderArmyStatus(total);
    els.armyStatus.insertAdjacentHTML("beforeend", generalStatusHtml());
  };

  const previousMakeRosterSnapshot = makeRosterSnapshot;
  makeRosterSnapshot = function() {
    const snapshot = previousMakeRosterSnapshot();
    snapshot.generalEntryId = state.generalEntryId || null;
    snapshot.schemaVersion = Math.max(2, Number(snapshot.schemaVersion || 1));
    return snapshot;
  };

  const previousLoadRoster = loadRoster;
  loadRoster = async function(id) {
    const saved = getSavedRosters().find(roster => roster.id === id);
    await previousLoadRoster(id);
    if (!saved || state.currentSaveId !== id) return;
    state.generalEntryId = saved.generalEntryId || null;
    normalizeGeneralSelection();
    renderArmy();
  };

  const previousNewRoster = newRoster;
  newRoster = function() {
    const before = state.currentSaveId;
    previousNewRoster();
    if (!state.roster.length && state.currentSaveId !== before) state.generalEntryId = null;
    if (!state.roster.length) state.generalEntryId = null;
  };

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    state.generalEntryId = null;
    return previousSelectArmy(armyId);
  };

  const previousShowArmySelection = showArmySelection;
  showArmySelection = function() {
    const rosterBefore = state.roster;
    previousShowArmySelection();
    if (state.roster !== rosterBefore || !state.data) state.generalEntryId = null;
  };

  // Put the General designation directly onto the printed Roster Pad row.
  const previousPrintableUnitName = printableUnitName;
  printableUnitName = function(entry, unit) {
    const name = previousPrintableUnitName(entry, unit);
    return entry.id === state.generalEntryId ? `${name} [GENERAL]` : name;
  };

  window.whrGeneral = {
    entryGeneralEligible,
    highestEligibleLeadership,
    permittedGeneralEntries,
    setGeneral
  };
})();
