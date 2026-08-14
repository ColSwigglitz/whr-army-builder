// Full WHR Chaos Abomination builder.
(() => {
  const ALLOWED_ARMIES = new Set(["chaos_warriors", "chaos_beastmen"]);
  const BASE_STATS = { M: 6, WS: 4, BS: 0, S: 5, T: 4, W: 4, I: 4, A: 3, Ld: 6 };
  const CHARACTER_UPGRADES = {
    M: { label: "+1 Movement", per: 1, cost: 5 },
    WS: { label: "+1 Weapon Skill", per: 1, cost: 5 },
    S: { label: "+1 Strength", per: 1, cost: 10 },
    T: { label: "+1 Toughness", per: 1, cost: 15 },
    W: { label: "+1 Wound", per: 1, cost: 10 },
    I: { label: "+3 Initiative", per: 3, cost: 5 },
    A: { label: "+1 Attack", per: 1, cost: 15 },
    Ld: { label: "+1 Leadership", per: 1, cost: 5 }
  };
  const SPECIALS = {
    acid_attacks: { label: "Acid Attacks", cost: 20, note: "No armour save allowed." },
    wings: { label: "Wings", cost: 60, note: "Can fly. Final model cost cannot be below 160 pts." },
    breathe_fire: { label: "Breathe Fire", cost: 30, note: "Strength 4, teardrop template." },
    insect_legs: { label: "Insect Legs", cost: 5, note: "May crawl straight over obstacles, rocky difficult terrain, buildings and sheer cliffs without movement reduction." },
    immune_psychology: { label: "Immune to Psychology", cost: 20, note: "Applies when unridden." },
    hard_skin: { label: "Hard Skin", cost: 20, note: "4+ armour save." },
    stupidity: { label: "Stupidity", cost: -35, note: "35 point discount." },
    random_attacks: { label: "Random Attacks", cost: 35, note: "Makes 1D6+2 attacks each combat round regardless of profile." }
  };

  function isChaos() {
    return state.data?.faction?.id === "chaos";
  }

  function devotion() {
    return state.armyOptions?.chaosDevotions?.[state.selectedArmyId] || "mixed";
  }

  function armyAllowsAbomination() {
    return isChaos() && ALLOWED_ARMIES.has(state.selectedArmyId) && devotion() === "undivided";
  }

  function isAbomination(unit) {
    return Boolean(unit && String(unit.name || "").toLowerCase().includes("chaos abomination"));
  }

  function ensureConfig(entry) {
    if (!entry.abomination) {
      entry.abomination = {
        role: "unridden",
        generalEntryId: null,
        characteristics: { M:0, WS:0, S:0, T:0, W:0, I:0, A:0, Ld:0 },
        specialRules: {}
      };
    }
    entry.abomination.characteristics ||= { M:0, WS:0, S:0, T:0, W:0, I:0, A:0, Ld:0 };
    entry.abomination.specialRules ||= {};
    entry.abomination.role ||= "unridden";
    return entry.abomination;
  }

  function currentStats(entry) {
    const cfg = ensureConfig(entry);
    const stats = { ...BASE_STATS };
    for (const [key, def] of Object.entries(CHARACTER_UPGRADES)) {
      stats[key] = Number(stats[key]) + Math.max(0, Math.min(2, Number(cfg.characteristics[key] || 0))) * def.per;
    }
    return stats;
  }

  function rawBuildCost(entry) {
    const cfg = ensureConfig(entry);
    let total = 30;
    for (const [key, def] of Object.entries(CHARACTER_UPGRADES)) {
      total += Math.max(0, Math.min(2, Number(cfg.characteristics[key] || 0))) * def.cost;
    }
    for (const [key, def] of Object.entries(SPECIALS)) {
      if (cfg.specialRules[key]) total += def.cost;
    }
    return total;
  }

  function abominationCost(entry) {
    const cfg = ensureConfig(entry);
    let total = rawBuildCost(entry);
    if (cfg.role === "chaos_hero") total += 28;
    if (cfg.role === "chaos_lord") total += 42;
    if (cfg.role === "unridden") total *= 1.25;
    total = Math.max(100, total);
    if (cfg.specialRules.wings) total = Math.max(160, total);
    return total;
  }

  function specialCount(entry) {
    const cfg = ensureConfig(entry);
    return Object.keys(SPECIALS).filter(key => cfg.specialRules[key]).length;
  }

  function characterMark(entry) {
    return entry?.chaosMark || devotion();
  }

  function isBSB(unit, entry) {
    return (unit?.tags || []).includes("battle_standard_bearer") || Boolean(entry?.optionSelections?.battle_standard);
  }

  function generalCandidates(role = "unridden") {
    if (!armyAllowsAbomination()) return [];
    return state.roster.filter(entry => {
      if (entry.sectionKey !== "characters") return false;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (!unit || isBSB(unit, entry) || characterMark(entry) !== "undivided") return false;
      if (state.selectedArmyId === "chaos_warriors" && unit.chaosFaction !== "warriors") return false;
      if (state.selectedArmyId === "chaos_beastmen" && unit.chaosFaction !== "beastmen") return false;
      if (role === "chaos_lord") return unit.id === "chaos_lord" || unit.name === "Chaos Lord";
      if (role === "chaos_hero") return unit.id === "chaos_hero" || unit.name === "Chaos Hero";
      if (role === "sorcerer_lord") return unit.id === "chaos_sorcerer_lord" || unit.name === "Chaos Sorcerer Lord";
      return true;
    });
  }

  function candidateLd(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const profile = profileById.get(unit?.profileId);
    let ld = Number(profile?.stats?.Ld || 0);
    if (characterMark(entry) === "undivided") ld += 1;
    return ld;
  }

  function validGeneral(entry) {
    const cfg = ensureConfig(entry);
    const candidates = generalCandidates(cfg.role);
    const selected = candidates.find(candidate => candidate.id === cfg.generalEntryId);
    if (!selected) return false;
    const allCandidates = generalCandidates("unridden");
    const highest = Math.max(0, ...allCandidates.map(candidateLd));
    return candidateLd(selected) === highest;
  }

  function generalLabel(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return unit?.name || "Chaos General";
  }

  function roleOptions() {
    const options = [{ id:"unridden", label:"Independent Monster" }];
    if (state.selectedArmyId === "chaos_warriors") {
      options.push(
        { id:"sorcerer_lord", label:"Mount for Chaos Sorcerer Lord" },
        { id:"chaos_hero", label:"Mount for Chaos Hero (+28 pts)" },
        { id:"chaos_lord", label:"Mount for Chaos Lord (+42 pts)" }
      );
    }
    return options;
  }

  function profileHtml(stats) {
    return `
      <div class="dialog-note" style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;text-align:center;">
          <thead><tr>${["M","WS","BS","S","T","W","I","A","Ld"].map(s => `<th style="padding:4px;">${s}</th>`).join("")}</tr></thead>
          <tbody><tr>${["M","WS","BS","S","T","W","I","A","Ld"].map(s => `<td style="padding:4px;font-weight:700;">${escapeHtml(stats[s])}</td>`).join("")}</tr></tbody>
        </table>
      </div>`;
  }

  const previousRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    if (!isChaos()) return previousRenderUnitBrowser();
    const faction = state.data.faction;
    const original = faction.warMachines;
    if (!armyAllowsAbomination()) {
      faction.warMachines = (original || []).filter(unit => !isAbomination(unit));
    }
    try { return previousRenderUnitBrowser(); }
    finally { faction.warMachines = original; }
  };

  const previousCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = previousCreateEntry(sectionKey, unit);
    if (isChaos() && isAbomination(unit)) ensureConfig(entry);
    return entry;
  };

  const previousAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    const unit = getUnit(sectionKey, unitId);
    if (isChaos() && isAbomination(unit)) {
      if (!armyAllowsAbomination()) {
        window.alert("Chaos Abominations are only available to Chaos Warriors or Beastmen armies devoted to Chaos Undivided.");
        return;
      }
      if (state.roster.some(entry => isAbomination(getUnit(entry.sectionKey, entry.unitId)))) {
        window.alert("Only one Chaos Abomination may be included in the army.");
        return;
      }
    }
    return previousAddUnit(sectionKey, unitId);
  };

  const previousRenderWarMachineEditor = renderWarMachineEditor;
  renderWarMachineEditor = function(entry, unit) {
    if (!isChaos() || !isAbomination(unit)) return previousRenderWarMachineEditor(entry, unit);
    const cfg = ensureConfig(entry);
    const stats = currentStats(entry);
    const candidates = generalCandidates(cfg.role);
    const specialRulesSelected = specialCount(entry);
    const isLarge = Number(cfg.characteristics.S || 0) > 0 || Number(cfg.characteristics.T || 0) > 0 || Number(cfg.characteristics.W || 0) > 0;

    return `
      <section class="editor-section">
        <h3 class="editor-section-title">Build-A-Beast Workshop</h3>
        <div class="dialog-note">Base profile 30 pts. Minimum fielded cost 100 pts. Characteristic upgrades may be taken twice each; choose no more than three special-rule upgrades.</div>
        ${profileHtml(stats)}
        <div class="field-hint">${isLarge ? "Large monster · causes Terror" : "Small monster · causes Fear"}</div>
      </section>

      <section class="editor-section">
        <h3 class="editor-section-title">Use As</h3>
        <div class="dialog-field">
          <label>Role</label>
          <select data-abomination-role>
            ${roleOptions().map(option => `<option value="${option.id}" ${cfg.role === option.id ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
          </select>
        </div>
        <div class="dialog-field">
          <label>Undivided army general</label>
          <select data-abomination-general>
            <option value="">Select the army general…</option>
            ${candidates.map(candidate => `<option value="${escapeHtml(candidate.id)}" ${cfg.generalEntryId === candidate.id ? "selected" : ""}>${escapeHtml(generalLabel(candidate))} (Ld ${candidateLd(candidate)})</option>`).join("")}
          </select>
          <div class="field-hint">The selected model must be among the army's highest-Leadership eligible characters. ${state.selectedArmyId === "chaos_beastmen" ? "Beastmen Abominations are fielded as independent monsters." : "When used as a mount, choose the matching Chaos Lord, Hero or Sorcerer Lord."}</div>
        </div>
      </section>

      <section class="editor-section">
        <h3 class="editor-section-title">Characteristic Upgrades</h3>
        ${Object.entries(CHARACTER_UPGRADES).map(([key, def]) => `
          <div class="dialog-field">
            <label>${escapeHtml(def.label)} — +${formatPoints(def.cost)} pts each</label>
            <input type="number" min="0" max="2" step="1" value="${Number(cfg.characteristics[key] || 0)}" data-abomination-stat="${key}">
          </div>
        `).join("")}
      </section>

      <section class="editor-section">
        <h3 class="editor-section-title">Special Rules <span style="font-weight:400;">(${specialRulesSelected} / 3)</span></h3>
        ${Object.entries(SPECIALS).map(([key, def]) => {
          const checked = Boolean(cfg.specialRules[key]);
          const disabled = key === "immune_psychology" && cfg.role !== "unridden";
          const price = def.cost < 0 ? `${formatPoints(Math.abs(def.cost))} pts discount` : `+${formatPoints(def.cost)} pts`;
          return `<label class="check-row">
            <input type="checkbox" data-abomination-special="${key}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
            <span class="check-row-content">
              <span class="check-row-title"><span>${escapeHtml(def.label)}</span><span>${escapeHtml(price)}</span></span>
              <span class="check-row-sub">${escapeHtml(def.note)}</span>
            </span>
          </label>`;
        }).join("")}
      </section>

      <section class="editor-section">
        <h3 class="editor-section-title">Calculated Cost</h3>
        <div class="dialog-note"><strong>${formatPoints(abominationCost(entry))} pts</strong> — build subtotal ${formatPoints(rawBuildCost(entry))} pts before rider/unridden adjustment and minimum-cost rules.</div>
      </section>
    `;
  };

  const previousWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    previousWireEditorControls();
    if (!isChaos() || !state.draft) return;
    const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
    if (!isAbomination(unit)) return;
    const cfg = ensureConfig(state.draft);

    const role = els.dialogContent.querySelector("[data-abomination-role]");
    if (role) role.addEventListener("change", () => {
      cfg.role = role.value;
      if (cfg.role !== "unridden") cfg.specialRules.immune_psychology = false;
      if (!generalCandidates(cfg.role).some(candidate => candidate.id === cfg.generalEntryId)) cfg.generalEntryId = null;
      renderEditor();
    });

    const general = els.dialogContent.querySelector("[data-abomination-general]");
    if (general) general.addEventListener("change", () => {
      cfg.generalEntryId = general.value || null;
      updateDialogTotal();
    });

    els.dialogContent.querySelectorAll("[data-abomination-stat]").forEach(input => {
      input.addEventListener("change", () => {
        const key = input.dataset.abominationStat;
        cfg.characteristics[key] = Math.max(0, Math.min(2, Math.floor(Number(input.value || 0))));
        renderEditor();
      });
    });

    els.dialogContent.querySelectorAll("[data-abomination-special]").forEach(input => {
      input.addEventListener("change", () => {
        const key = input.dataset.abominationSpecial;
        if (input.checked && !cfg.specialRules[key] && specialCount(state.draft) >= 3) {
          input.checked = false;
          window.alert("A Chaos Abomination may take a maximum of three special-rule upgrades.");
          return;
        }
        cfg.specialRules[key] = input.checked;
        renderEditor();
      });
    });
  };

  const previousCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (isChaos() && isAbomination(unit)) return abominationCost(entry);
    return previousCalculateEntry(entry);
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isChaos() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (isAbomination(unit)) {
        const cfg = ensureConfig(state.draft);
        if (!armyAllowsAbomination()) {
          window.alert("Chaos Abominations are only legal in Chaos Warriors or Beastmen armies devoted to Chaos Undivided.");
          return;
        }
        if (specialCount(state.draft) > 3) {
          window.alert("A Chaos Abomination may take a maximum of three special-rule upgrades.");
          return;
        }
        if (!validGeneral(state.draft)) {
          window.alert("Select an eligible Undivided army general with the highest Leadership. For a ridden Abomination, the selected general must also match the chosen rider type.");
          return;
        }
        if (state.selectedArmyId === "chaos_beastmen" && cfg.role !== "unridden") {
          window.alert("A Beastmen Chaos Abomination must be fielded as an independent monster.");
          return;
        }
      }
    }
    return previousSaveEditor();
  };

  function abominationNotes(entry) {
    const cfg = ensureConfig(entry);
    const notes = [];
    notes.push(cfg.role === "unridden" ? "Independent monster" : roleOptions().find(option => option.id === cfg.role)?.label || cfg.role);
    const general = state.roster.find(candidate => candidate.id === cfg.generalEntryId);
    if (general) notes.push(`General: ${generalLabel(general)}`);
    const upgrades = Object.entries(CHARACTER_UPGRADES)
      .filter(([key]) => Number(cfg.characteristics[key] || 0) > 0)
      .map(([key, def]) => `${def.label} ×${Number(cfg.characteristics[key])}`);
    if (upgrades.length) notes.push(upgrades.join(", "));
    for (const [key, def] of Object.entries(SPECIALS)) if (cfg.specialRules[key]) notes.push(`${def.label}: ${def.note}`);
    const large = Number(cfg.characteristics.S || 0) > 0 || Number(cfg.characteristics.T || 0) > 0 || Number(cfg.characteristics.W || 0) > 0;
    notes.push(large ? "Large monster; causes Terror" : "Small monster; causes Fear");
    return notes;
  }

  const previousRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!isChaos() || !isAbomination(unit)) return previousRosterPadRow(entry);
    const profile = { name:"Chaos Abomination", stats: currentStats(entry) };
    const cfg = ensureConfig(entry);
    const save = cfg.specialRules.hard_skin ? "4+" : "–";
    return `
      <tr>
        <td class="unit-cell">Chaos Abomination</td>
        ${rosterPadProfileCells(profile)}
        <td class="save">${save}</td>
        <td class="notes-cell">${rosterPadNotesInline(abominationNotes(entry))}</td>
        <td class="points-cell">${formatPoints(abominationCost(entry))}</td>
      </tr>
    `;
  };

  const previousDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!isChaos() || !isAbomination(unit)) return previousDescribeEntry(entry);
    const stats = currentStats(entry);
    const cfg = ensureConfig(entry);
    const parts = [`${cfg.role === "unridden" ? "Independent" : "Ridden"}`, `M${stats.M} WS${stats.WS} S${stats.S} T${stats.T} W${stats.W} I${stats.I} A${stats.A} Ld${stats.Ld}`];
    const selected = Object.entries(SPECIALS).filter(([key]) => cfg.specialRules[key]).map(([,def]) => def.label);
    if (selected.length) parts.push(selected.join(", "));
    return parts.join(" · ");
  };

  const previousRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    previousRenderArmyStatus(total);
    if (!isChaos()) return;
    const abomination = state.roster.find(entry => isAbomination(getUnit(entry.sectionKey, entry.unitId)));
    if (!abomination) return;
    const issues = [];
    if (!armyAllowsAbomination()) issues.push("Chaos Abomination requires a Chaos Warriors or Beastmen army devoted to Chaos Undivided.");
    if (!validGeneral(abomination)) issues.push("Chaos Abomination requires a selected Undivided general among the army's highest-Leadership eligible characters.");
    if (state.roster.filter(entry => isAbomination(getUnit(entry.sectionKey, entry.unitId))).length > 1) issues.push("Only one Chaos Abomination may be included.");
    if (!issues.length) return;
    els.armyStatus.insertAdjacentHTML("beforeend", `<div class="army-system-panel warn"><div class="army-system-copy"><strong>Chaos Abomination</strong><span>${escapeHtml(issues.join(" "))}</span></div></div>`);
  };
})();
