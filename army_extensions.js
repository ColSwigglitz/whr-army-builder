// Extra army-specific builder behaviour that sits on top of the generic app.js engine.
// Kept separate so faction-specific systems do not make the core builder harder to maintain.
(() => {
  state.armyOptions = state.armyOptions || {};

  const BLOODLINE_TAGS = {
    von_carstein_only: "von_carstein",
    necrarch_only: "necrarch",
    blood_dragon_only: "blood_dragon",
    lahmian_only: "lahmian",
    strigoi_only: "strigoi"
  };

  document.head.insertAdjacentHTML("beforeend", `
    <style>
      .army-system-panel {
        margin: 0 0 12px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        border: 1px solid var(--border);
        border-left: 4px solid var(--accent);
        border-radius: 8px;
        background: #fffaf0;
      }
      .army-system-panel.warn { border-left-color: var(--warning); background: #fff7e8; }
      .army-system-copy strong { display:block; font-family: Georgia, serif; font-size:15px; }
      .army-system-copy span { display:block; margin-top:3px; color:var(--muted); font-size:11px; line-height:1.35; }
      .army-system-select { min-width:190px; padding:8px 9px; border:1px solid var(--border); border-radius:6px; background:#fff; }
      .bloodline-editor { margin-top:18px; }
      .bloodline-power-list { margin-top:8px; }
      .bloodline-counter { padding:4px 8px; border-radius:999px; background:#eee5d6; color:var(--accent-dark); font-size:12px; font-weight:800; }
      .bloodline-rule-note { margin:8px 0 0; padding:8px 10px; border:1px solid var(--border); border-radius:6px; background:var(--surface-soft); color:var(--muted); font-size:12px; }
      @media (max-width:620px) {
        .army-system-panel { align-items:stretch; flex-direction:column; }
        .army-system-select { width:100%; }
      }
    </style>
  `);

  function bloodlineSystem() {
    return state.data?.faction?.systems?.bloodline || null;
  }

  function selectedBloodline() {
    return state.armyOptions?.bloodline || null;
  }

  function bloodlineName(id) {
    return bloodlineSystem()?.choices?.find(choice => choice.id === id)?.name || humanise(id);
  }

  function isVampire(unit) {
    return (unit?.tags || []).includes("vampire");
  }

  function unitBloodlineRequirement(unit) {
    if (unit?.bloodlineOnly) return unit.bloodlineOnly;
    for (const tag of unit?.tags || []) {
      if (BLOODLINE_TAGS[tag]) return BLOODLINE_TAGS[tag];
    }
    return null;
  }

  function unitAllowedForSelectedBloodline(unit) {
    const required = unitBloodlineRequirement(unit);
    return !required || required === selectedBloodline();
  }

  function bloodlinePowersForCurrentArmy() {
    const bloodline = selectedBloodline();
    if (!bloodline) return [];
    return bloodlineSystem()?.powers?.[bloodline] || [];
  }

  function getBloodlinePower(id) {
    return Object.values(bloodlineSystem()?.powers || {})
      .flat()
      .find(power => power.id === id) || null;
  }

  function powerUsedElsewhere(powerId, entryId) {
    return state.roster.some(entry =>
      entry.id !== entryId && (entry.bloodlinePowers || []).includes(powerId)
    );
  }

  function bloodlinePowerLimit(entry, unit) {
    if (!isVampire(unit)) return 0;
    if (unit.bloodlinePowers?.maximum != null) {
      if (selectedBloodline() === "strigoi" && unit.bloodlinePowers.strigoiMaximum != null) {
        return Number(unit.bloodlinePowers.strigoiMaximum);
      }
      return Number(unit.bloodlinePowers.maximum);
    }
    if (unit.combinedMagicAndBloodlineLimit != null) {
      return Math.max(0, Number(unit.combinedMagicAndBloodlineLimit) - (entry.magicItems || []).length);
    }
    return 0;
  }

  function vampireWizardConfig(unit) {
    if (!isVampire(unit) || !unit.wizardUpgrade) return null;
    const bloodline = selectedBloodline();
    if (bloodline === "blood_dragon" || bloodline === "strigoi") return null;
    if (bloodline === "necrarch") {
      return {
        minimumLevels: 1,
        maximumLevels: 4,
        costPerLevel: Number(unit.wizardUpgrade.costPerLevel || 60),
        lores: unit.wizardUpgrade.lores || []
      };
    }
    return {
      minimumLevels: 0,
      maximumLevels: Number(unit.wizardUpgrade.maximumLevels || 0),
      costPerLevel: Number(unit.wizardUpgrade.costPerLevel || 60),
      lores: unit.wizardUpgrade.lores || []
    };
  }

  function normalizeVampireEntry(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!isVampire(unit)) return;
    entry.bloodlinePowers = entry.bloodlinePowers || [];

    const bloodline = selectedBloodline();
    const allowedPowerIds = new Set(bloodlinePowersForCurrentArmy().map(power => power.id));
    entry.bloodlinePowers = entry.bloodlinePowers.filter(id => allowedPowerIds.has(id));

    const wizard = vampireWizardConfig(unit);
    if (!wizard) {
      entry.wizardLevels = 0;
    } else {
      entry.wizardLevels = Math.max(
        wizard.minimumLevels,
        Math.min(wizard.maximumLevels, Number(entry.wizardLevels || wizard.minimumLevels))
      );
    }

    if (bloodline === "strigoi") {
      entry.mount = null;
      entry.equipmentSelections = {};
      entry.extraEquipment = {};
      entry.magicItems = [];
    }

    if (bloodline === "lahmian") {
      entry.equipmentSelections = {};
      entry.extraEquipment = {};
    }
  }

  function bloodlineUnitView(unit, entry) {
    if (!isVampire(unit)) return unit;
    const bloodline = selectedBloodline();
    const view = clone(unit);

    if (view.combinedMagicAndBloodlineLimit != null && bloodline !== "strigoi") {
      const remaining = Math.max(0,
        Number(view.combinedMagicAndBloodlineLimit) - (entry.bloodlinePowers || []).length
      );
      view.magicItems = {
        maximum: remaining,
        allowedPools: ["common", "undead"],
        allowedCategories: ["magic_weapon", "magic_armour", "enchanted_item", "arcane_item", "familiar"]
      };
    }

    if (bloodline === "lahmian") {
      view.equipmentOptions = [];
    }

    if (bloodline === "strigoi") {
      view.equipmentOptions = [];
      view.mountOptions = [];
      view.magicItems = null;
    }

    if (bloodline === "blood_dragon") {
      const armour = (view.equipmentOptions || []).find(group => group.id === "armour");
      if (armour && !(armour.choices || []).includes("full_plate_armour")) {
        armour.choices = [...(armour.choices || []), "full_plate_armour"];
      }
      const undeadSteed = (view.mountOptions || []).find(mount => mount.mountId === "undead_steed");
      if (undeadSteed && !(view.mountOptions || []).some(mount => mount.mountId === "war_horse_vampire")) {
        view.mountOptions.push({
          mountId: "war_horse_vampire",
          cost: undeadSteed.cost,
          freeOptions: undeadSteed.freeOptions || []
        });
      }
    }

    return view;
  }

  function renderBloodlinePowerEditor(entry, unit) {
    if (!isVampire(unit) || !selectedBloodline()) return "";
    const powers = bloodlinePowersForCurrentArmy();
    const selected = entry.bloodlinePowers || [];
    const max = bloodlinePowerLimit(entry, unit);
    if (!powers.length || !max) return "";

    return `
      <section class="editor-section bloodline-editor">
        <div class="magic-header">
          <h3 class="editor-section-title" style="margin:0;">${escapeHtml(bloodlineName(selectedBloodline()))} Bloodline Powers</h3>
          <span class="bloodline-counter">${selected.length} / ${max}</span>
        </div>
        <div class="bloodline-power-list">
          ${powers.map(power => {
            const checked = selected.includes(power.id);
            const used = powerUsedElsewhere(power.id, entry.id);
            return `
              <label class="check-row">
                <input type="checkbox" data-bloodline-power="${escapeHtml(power.id)}"
                  ${checked ? "checked" : ""}
                  ${used && !checked ? "disabled" : ""}>
                <span class="check-row-content">
                  <span class="check-row-title">
                    <span>${escapeHtml(power.name)}</span>
                    <span>${Number(power.cost || 0) ? `+${formatPoints(power.cost)} pts` : "Free"}</span>
                  </span>
                  <span class="check-row-sub">${escapeHtml(power.rules || "")}</span>
                </span>
              </label>
            `;
          }).join("")}
        </div>
        <div class="field-hint">Bloodline powers are unique across the army, in the same way as magic items.</div>
      </section>
    `;
  }

  function renderVampireWizardEditor(entry, unit) {
    const config = vampireWizardConfig(unit);
    if (!config || config.maximumLevels <= 0) return "";
    const value = Math.max(config.minimumLevels, Number(entry.wizardLevels || config.minimumLevels));
    return `
      <section class="editor-section">
        <h3 class="editor-section-title">Magic Levels</h3>
        <div class="dialog-field">
          <label>Additional magic levels</label>
          <select data-vampire-wizard-levels>
            ${Array.from({length: config.maximumLevels - config.minimumLevels + 1}, (_, index) => index + config.minimumLevels)
              .map(level => `<option value="${level}" ${level === value ? "selected" : ""}>${level} level${level === 1 ? "" : "s"} ${level ? `(+${formatPoints(level * config.costPerLevel)} pts)` : ""}</option>`)
              .join("")}
          </select>
          <div class="field-hint">Available lore${config.lores.length === 1 ? "" : "s"}: ${escapeHtml(config.lores.join(", "))}. ${selectedBloodline() === "necrarch" ? "Necrarch Vampires must take at least one magic level and may buy up to four." : ""}</div>
        </div>
      </section>
    `;
  }

  function vampireBloodlineRuleNotes(unit) {
    if (!isVampire(unit) || !selectedBloodline()) return [];
    switch (selectedBloodline()) {
      case "lahmian":
        return ["Lahmian: hand weapon only, no armour, Initiative 11, always strikes first."];
      case "necrarch":
        return ["Necrarch: must buy at least one magic level; may buy up to four magic levels."];
      case "blood_dragon":
        return ["Blood Dragon: cannot become a spellcaster; may use Full Plate Armour and may exchange an Undead Steed for a living War Horse."];
      case "strigoi":
        return ["Strigoi: +1 Attack; cannot carry equipment or magic items and cannot ride a mount."];
      default:
        return [];
    }
  }

  // Generic magic-item pools: every non-common pool means the current faction's item list.
  const baseGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const settings = context === "champion" ? unit.champion?.magicItems : unit.magicItems;
    if (!settings) return [];
    const pools = settings.allowedPools || ["common", "faction"];
    const categories = settings.allowedCategories || ["magic_weapon","magic_armour","enchanted_item","arcane_item","familiar"];
    const result = [];
    if (pools.includes("common")) result.push(...(state.data.commonMagicItems || []));
    if (pools.some(pool => pool !== "common")) result.push(...(state.data.factionMagicItems || []));
    return result.filter(item => categories.includes(item.category));
  };

  const baseCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = baseCreateEntry(sectionKey, unit);
    entry.bloodlinePowers = [];
    entry.wizardLevels = 0;
    if (isVampire(unit)) normalizeVampireEntry(entry);
    return entry;
  };

  const baseCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = baseCalculateEntry(entry);
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit) return total;

    if (unit.wizardUpgrade && Number(entry.wizardLevels || 0) > 0) {
      total += Number(entry.wizardLevels || 0) * Number(unit.wizardUpgrade.costPerLevel || 60);
    }

    for (const powerId of entry.bloodlinePowers || []) {
      total += Number(getBloodlinePower(powerId)?.cost || 0);
    }

    return total;
  };

  const baseRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    if (!state.data?.faction || !bloodlineSystem()) return baseRenderUnitBrowser();
    const faction = state.data.faction;
    const backups = {};
    for (const section of sectionConfig) {
      backups[section.key] = faction[section.key] || [];
      faction[section.key] = backups[section.key].filter(unitAllowedForSelectedBloodline);
    }
    try {
      baseRenderUnitBrowser();
    } finally {
      for (const section of sectionConfig) faction[section.key] = backups[section.key];
    }
  };

  const baseRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    baseRenderArmyStatus(total);
    const system = bloodlineSystem();
    if (!system) return;

    const current = selectedBloodline() || "";
    const hasVampires = state.roster.some(entry => isVampire(getUnit(entry.sectionKey, entry.unitId)));
    const warning = hasVampires && !current;
    const panel = document.createElement("div");
    panel.className = `army-system-panel${warning ? " warn" : ""}`;
    panel.innerHTML = `
      <div class="army-system-copy">
        <strong>Vampire Bloodline</strong>
        <span>${warning ? "This army contains Vampires, so choose one bloodline for every Vampire in the army." : "Choose a bloodline to unlock its powers and exclusive units. Leave blank for an army with no Vampires."}</span>
      </div>
      <select class="army-system-select" data-army-bloodline>
        <option value="">No bloodline selected</option>
        ${(system.choices || []).map(choice => `<option value="${escapeHtml(choice.id)}" ${current === choice.id ? "selected" : ""}>${escapeHtml(choice.name)}</option>`).join("")}
      </select>
    `;
    els.armyStatus.prepend(panel);

    panel.querySelector("[data-army-bloodline]").addEventListener("change", event => {
      const next = event.target.value || null;
      const previous = selectedBloodline();
      if (next === previous) return;

      if (state.roster.length && previous && !window.confirm("Changing bloodline will remove bloodline-exclusive units that are no longer legal and clear existing Vampire powers. Continue?")) {
        event.target.value = previous;
        return;
      }

      state.armyOptions.bloodline = next;
      state.roster = state.roster.filter(entry => unitAllowedForSelectedBloodline(getUnit(entry.sectionKey, entry.unitId)));
      for (const entry of state.roster) {
        const unit = getUnit(entry.sectionKey, entry.unitId);
        if (isVampire(unit)) {
          entry.bloodlinePowers = [];
          normalizeVampireEntry(entry);
        }
      }
      renderUnitBrowser();
      renderArmy();
    });
  };

  const baseRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    normalizeVampireEntry(entry);
    const view = bloodlineUnitView(unit, entry);
    let html = baseRenderCharacterEditor(entry, view);
    html += renderVampireWizardEditor(entry, unit);
    html += renderBloodlinePowerEditor(entry, unit);
    const notes = vampireBloodlineRuleNotes(unit);
    if (notes.length) {
      html += `<section class="editor-section"><h3 class="editor-section-title">Bloodline Rules</h3>${notes.map(note => `<div class="bloodline-rule-note">${escapeHtml(note)}</div>`).join("")}</section>`;
    }
    return html.replace("common and Empire magic-item pools", "common and faction magic-item pools");
  };

  const baseWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    baseWireEditorControls();
    const entry = state.draft;
    const unit = getUnit(entry.sectionKey, entry.unitId);

    const wizardSelect = els.dialogContent.querySelector("[data-vampire-wizard-levels]");
    if (wizardSelect) {
      wizardSelect.addEventListener("change", () => {
        entry.wizardLevels = Number(wizardSelect.value || 0);
        updateDialogTotal();
      });
    }

    els.dialogContent.querySelectorAll("[data-bloodline-power]").forEach(check => {
      check.addEventListener("change", () => {
        entry.bloodlinePowers = entry.bloodlinePowers || [];
        const powerId = check.dataset.bloodlinePower;
        const limit = bloodlinePowerLimit(entry, unit);

        if (check.checked) {
          if (entry.bloodlinePowers.length >= limit) {
            check.checked = false;
            window.alert(`This Vampire may take a maximum of ${limit} bloodline power${limit === 1 ? "" : "s"} with its current magic-item choices.`);
            return;
          }
          if (powerUsedElsewhere(powerId, entry.id)) {
            check.checked = false;
            window.alert("That bloodline power is already being used elsewhere in the army.");
            return;
          }
          entry.bloodlinePowers.push(powerId);
        } else {
          entry.bloodlinePowers = entry.bloodlinePowers.filter(id => id !== powerId);
        }
        renderEditor();
      });
    });
  };

  const baseDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text = baseDescribeEntry(entry);
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const additions = [];
    if (isVampire(unit) && selectedBloodline()) additions.push(bloodlineName(selectedBloodline()));
    if (Number(entry.wizardLevels || 0)) additions.push(`${entry.wizardLevels} magic level${entry.wizardLevels === 1 ? "" : "s"}`);
    if (entry.bloodlinePowers?.length) additions.push(entry.bloodlinePowers.map(id => getBloodlinePower(id)?.name || id).join(", "));
    if (!additions.length) return text;
    return text === "Base configuration" ? additions.join(" · ") : `${text} · ${additions.join(" · ")}`;
  };

  const baseRosterPadNotes = rosterPadNotes;
  rosterPadNotes = function(entry, unit) {
    const notes = baseRosterPadNotes(entry, unit);
    if (isVampire(unit) && selectedBloodline()) notes.push(`${bloodlineName(selectedBloodline())} Vampire`);
    if (Number(entry.wizardLevels || 0)) notes.push(`${entry.wizardLevels} magic level${entry.wizardLevels === 1 ? "" : "s"}`);
    for (const powerId of entry.bloodlinePowers || []) {
      const power = getBloodlinePower(powerId);
      if (power) notes.push(`${power.name} — ${power.rules}`);
    }
    notes.push(...vampireBloodlineRuleNotes(unit));
    return [...new Set(notes)];
  };

  const baseMakeRosterSnapshot = makeRosterSnapshot;
  makeRosterSnapshot = function() {
    const snapshot = baseMakeRosterSnapshot();
    snapshot.armyOptions = clone(state.armyOptions || {});
    snapshot.schemaVersion = 2;
    return snapshot;
  };

  const baseLoadRoster = loadRoster;
  loadRoster = async function(id) {
    const saved = getSavedRosters().find(roster => roster.id === id);
    await baseLoadRoster(id);
    if (state.currentSaveId !== id) return;
    state.armyOptions = clone(saved?.armyOptions || {});
    for (const entry of state.roster) {
      entry.bloodlinePowers = entry.bloodlinePowers || [];
      entry.wizardLevels = Number(entry.wizardLevels || 0);
      normalizeVampireEntry(entry);
    }
    renderUnitBrowser();
    renderArmy();
  };

  const baseNewRoster = newRoster;
  newRoster = function() {
    const before = state.roster.length;
    baseNewRoster();
    if (before && state.roster.length) return;
    state.armyOptions = {};
    renderUnitBrowser();
    renderArmy();
  };

  const baseSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    state.armyOptions = {};
    await baseSelectArmy(armyId);
    if (state.data) {
      renderUnitBrowser();
      renderArmy();
    }
  };
})();
