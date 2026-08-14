// Chaos-specific army variants, devotion/Mark handling, legality and Roster Pad support.
(() => {
  const CHAOS_ARMY_IDS = new Set([
    "chaos_warriors", "chaos_beastmen", "chaos_daemons", "chaos_warband", "chaos_warhost"
  ]);
  const POWERS = ["undivided", "khorne", "tzeentch", "nurgle", "slaanesh"];
  const POWER_NAMES = {
    mixed: "Mixed Powers",
    undivided: "Chaos Undivided",
    khorne: "Khorne",
    tzeentch: "Tzeentch",
    nurgle: "Nurgle",
    slaanesh: "Slaanesh"
  };
  const VARIANT_FACTION = {
    chaos_warriors: "warriors",
    chaos_beastmen: "beastmen",
    chaos_daemons: "daemons"
  };

  state.armyOptions = state.armyOptions || {};
  state.armyOptions.chaosDevotions = state.armyOptions.chaosDevotions || {};

  const isChaos = () => state.data?.faction?.id === "chaos" && CHAOS_ARMY_IDS.has(state.selectedArmyId);
  const variant = () => state.selectedArmyId;
  const isWarband = () => variant() === "chaos_warband";
  const isWarhost = () => variant() === "chaos_warhost";
  const pureFaction = () => VARIANT_FACTION[variant()] || null;

  function defaultDevotion() {
    if (isWarband()) return "undivided";
    if (isWarhost()) return "mixed";
    return "mixed";
  }

  function devotion() {
    if (!isChaos()) return "mixed";
    const key = variant();
    let value = state.armyOptions.chaosDevotions[key];
    if (!value || (isWarband() && value === "mixed")) {
      value = defaultDevotion();
      state.armyOptions.chaosDevotions[key] = value;
    }
    if (isWarhost()) value = "mixed";
    return value;
  }

  function singlePower() {
    const value = devotion();
    return value === "mixed" ? null : value;
  }

  function markChoices(unit) {
    let choices = POWERS.slice();
    if ((unit.tags || []).includes("wizard")) choices = choices.filter(power => power !== "khorne");
    const forced = singlePower();
    if (forced) choices = choices.filter(power => power === forced);
    return choices;
  }

  function entryMark(entry, unit) {
    if (unit?.chaosPower) return unit.chaosPower;
    const forced = singlePower();
    if (forced) return forced;
    return entry?.chaosMark || "undivided";
  }

  function championMark(entry, unit) {
    const forced = singlePower();
    if (forced) return forced;
    return entry?.champion?.chaosMark || "undivided";
  }

  function unitFactionAllowed(unit) {
    if (!unit) return false;
    const faction = pureFaction();
    if (!faction) {
      if (unit.chaosFaction === "mixed_mortal") return true;
      return true;
    }
    if (unit.chaosFaction === "shared") return true;
    if (Array.isArray(unit.chaosFactions) && unit.chaosFactions.includes(faction)) return true;
    if (unit.chaosFaction === "mixed_mortal") return faction === "warriors" || faction === "beastmen";
    return unit.chaosFaction === faction;
  }

  function unitPowerAllowed(unit) {
    const power = singlePower();
    if (!power || !unit?.chaosPower) return true;
    return unit.chaosPower === power;
  }

  function unitAllowed(unit) {
    if (!unitFactionAllowed(unit) || !unitPowerAllowed(unit)) return false;
    if (singlePower() === "khorne" && (unit.tags || []).includes("wizard")) return false;
    return true;
  }

  // Filter the unit browser without mutating the underlying shared Chaos data.
  const oldRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    if (!isChaos()) return oldRenderUnitBrowser();
    const faction = state.data.faction;
    const keys = ["characters", "regiments", "warMachines", "specialCharacters"];
    const originals = Object.fromEntries(keys.map(key => [key, faction[key]]));
    for (const key of keys) faction[key] = (faction[key] || []).filter(unitAllowed);
    try {
      oldRenderUnitBrowser();
    } finally {
      for (const key of keys) faction[key] = originals[key];
    }
  };

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isChaos()) {
      if ((unit.tags || []).includes("mark_eligible")) entry.chaosMark = singlePower() || "undivided";
      if (unit.champion?.tags?.includes("mark_eligible")) entry.champion.chaosMark = singlePower() || "undivided";
    }
    return entry;
  };

  function mountAllowed(mountId, mark) {
    const required = {
      juggernaut: "khorne",
      disc: "tzeentch",
      beast_nurgle: "nurgle",
      steed_slaanesh: "slaanesh"
    }[mountId];
    return !required || required === mark;
  }

  const oldRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    if (!isChaos()) return oldRenderCharacterEditor(entry, unit);

    const view = clone(unit);
    const mark = entryMark(entry, unit);
    if ((view.mountOptions || []).length) {
      view.mountOptions = view.mountOptions.filter(mount => mountAllowed(mount.mountId, mark));
    }

    let html = oldRenderCharacterEditor(entry, view);

    if ((unit.tags || []).includes("mark_eligible")) {
      const choices = markChoices(unit);
      html = `
        <section class="editor-section">
          <h3 class="editor-section-title">Mark of Chaos</h3>
          <div class="dialog-field">
            <label>Allegiance</label>
            <select data-chaos-mark>
              ${choices.map(power => `<option value="${escapeHtml(power)}" ${mark === power ? "selected" : ""}>${escapeHtml(POWER_NAMES[power])}</option>`).join("")}
            </select>
          </div>
        </section>
      ` + html;
    }

    if ((unit.options || []).length) {
      html += `
        <section class="editor-section">
          <h3 class="editor-section-title">Chaos Options</h3>
          ${renderUnitOptions(entry, unit)}
        </section>
      `;
    }

    return html;
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = oldRenderRegimentEditor(entry, unit);
    if (!isChaos() || !entry.champion?.selected || !unit.champion?.tags?.includes("mark_eligible")) return html;
    const mark = championMark(entry, unit);
    const choices = singlePower() ? [singlePower()] : POWERS;
    html += `
      <section class="editor-section">
        <h3 class="editor-section-title">Champion Mark of Chaos</h3>
        <div class="dialog-field">
          <label>Allegiance</label>
          <select data-chaos-champion-mark>
            ${choices.map(power => `<option value="${escapeHtml(power)}" ${mark === power ? "selected" : ""}>${escapeHtml(POWER_NAMES[power])}</option>`).join("")}
          </select>
        </div>
      </section>
    `;
    return html;
  };

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isChaos() || !state.draft) return;

    const mark = els.dialogContent.querySelector("[data-chaos-mark]");
    if (mark) {
      mark.addEventListener("change", () => {
        state.draft.chaosMark = mark.value;
        // A mount dedicated to another god cannot survive a Mark change.
        const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
        if (state.draft.mount && !mountAllowed(state.draft.mount, entryMark(state.draft, unit))) state.draft.mount = null;
        renderEditor();
      });
    }

    const championMarkSelect = els.dialogContent.querySelector("[data-chaos-champion-mark]");
    if (championMarkSelect) {
      championMarkSelect.addEventListener("change", () => {
        state.draft.champion.chaosMark = championMarkSelect.value;
        renderEditor();
      });
    }

    // Chaos Banners are BSB-only, never regiment magic banners.
    const bannerSelect = els.dialogContent.querySelector("[data-magic-banner]");
    if (bannerSelect) {
      for (const option of bannerSelect.options) {
        if (!option.value) continue;
        const item = getMagicItem(option.value);
        if (item?.chaosBanner) {
          option.disabled = true;
          option.hidden = true;
        }
        if (item?.chaosPower && singlePower() && item.chaosPower !== singlePower()) {
          option.disabled = true;
          option.hidden = true;
        }
      }
    }
  };

  const oldGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const choices = oldGetAllowedMagicItems(unit, context);
    if (!isChaos()) return choices;

    const entry = state.draft;
    const mark = context === "champion" ? championMark(entry, unit) : entryMark(entry, unit);
    const isDaemon = unit.chaosFaction === "daemons";
    const isBSB = (unit.tags || []).includes("battle_standard_bearer");
    const isBeast = unit.chaosFaction === "beastmen";
    const isSorcerer = (unit.tags || []).includes("chaos_sorcerer");
    const isBeastShaman = (unit.tags || []).includes("beast_shaman");
    const isChampion = context === "champion" || (!isDaemon && (unit.tags || []).some(tag => tag === "chaos_warriors" || tag === "chaos_beastmen"));

    return choices.filter(item => {
      if (isDaemon) {
        if (!item.daemonReward && !item.chaosBanner) return false;
      } else if (item.daemonReward) return false;

      if (item.chaosReward && !isChampion) return false;
      if (item.beastmenOnly && !isBeast) return false;
      if (item.championOnly && isDaemon) return false;
      if (item.chaosSorcererOnly && !isSorcerer) return false;
      if (item.beastShamanOnly && !isBeastShaman) return false;
      if (item.daemonPrinceOnly && unit.id !== "daemon_prince") return false;

      if (item.chaosPower && item.chaosPower !== mark) return false;

      if (item.chaosBanner) {
        if (!isBSB) return false;
        if (!singlePower()) return false;
        if (item.chaosPower && item.chaosPower !== singlePower()) return false;
      }

      if (item.regimentBanner) return false;
      return true;
    });
  };

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isChaos() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      const mark = entryMark(state.draft, unit);
      if ((unit.tags || []).includes("wizard") && mark === "khorne") {
        window.alert("Chaos Sorcerers cannot bear the Mark of Khorne.");
        return;
      }
      if (unit.id === "daemon_prince" && mark === "khorne" && Number(state.draft.optionSelections?.magic_levels || 0) > 0) {
        window.alert("A Daemon Prince of Khorne cannot buy magic levels.");
        return;
      }
    }
    oldSaveEditor();
  };

  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (isChaos()) {
      const unit = getUnit(sectionKey, unitId);
      if (!unitAllowed(unit)) {
        window.alert(`${unit.name} is not available to this Chaos army configuration.`);
        return;
      }
      const already = state.roster.some(entry => entry.sectionKey === sectionKey && entry.unitId === unitId);
      if (already && ((unit.tags || []).includes("zero_one") || sectionKey === "specialCharacters")) {
        window.alert(`${unit.name} may only be included once.`);
        return;
      }
    }
    return oldAddUnit(sectionKey, unitId);
  };

  // Chaos Armour is heavy armour with a further +1 save, so it starts at 4+.
  const oldCalculatePrintedArmourSave = calculatePrintedArmourSave;
  calculatePrintedArmourSave = function(entry, unit) {
    if (!isChaos()) return oldCalculatePrintedArmourSave(entry, unit);
    if (Number(unit.fixedArmourSave) > 0) return oldCalculatePrintedArmourSave(entry, unit);

    const equipment = getSelectedEquipmentIds(entry, unit);
    if (!equipment.includes("chaos_armour")) return oldCalculatePrintedArmourSave(entry, unit);

    let save = 4;
    if (equipment.includes("shield")) save--;
    const mounted = Boolean(entry.mount) || Boolean(unit.unitMount?.mountId) || unit.unitType === "cavalry" || (unit.tags || []).includes("fast_cavalry");
    if (mounted) save--;
    if (equipment.includes("barding")) save--;

    for (const id of entry.magicItems || []) {
      if (id === "scaly_skin") save--;
      if (id === "iron_hard_skin") save -= 2;
    }
    return `${Math.max(2, save)}+`;
  };

  function applyMarkStats(profile, mark) {
    if (!profile?.stats) return null;
    const original = { ...profile.stats };
    if (mark === "khorne" && Number.isFinite(Number(profile.stats.WS))) profile.stats.WS = Number(profile.stats.WS) + 1;
    if (mark === "nurgle" && Number.isFinite(Number(profile.stats.T))) profile.stats.T = Number(profile.stats.T) + 1;
    if (mark === "undivided" && Number.isFinite(Number(profile.stats.Ld))) profile.stats.Ld = Number(profile.stats.Ld) + 1;
    return original;
  }

  function restoreStats(profile, original) {
    if (profile && original) profile.stats = original;
  }

  const oldRosterPadChampionRow = rosterPadChampionRow;
  rosterPadChampionRow = function(entry, unit) {
    if (!isChaos() || !entry.champion?.selected || !unit.champion?.tags?.includes("mark_eligible")) return oldRosterPadChampionRow(entry, unit);
    const profile = profileById.get(unit.champion.profileId);
    const original = applyMarkStats(profile, championMark(entry, unit));
    try { return oldRosterPadChampionRow(entry, unit); }
    finally { restoreStats(profile, original); }
  };

  function secondaryRows(unit) {
    if (!unit?.additionalProfiles?.length) return "";
    return unit.additionalProfiles.map(component => {
      const profile = profileById.get(component.profileId);
      if (!profile) return "";
      return `
        <tr class="mount-row">
          <td class="unit-cell mount-name">↳ ${escapeHtml(component.label || profile.name)}</td>
          ${rosterPadProfileCells(profile)}
          <td class="save">–</td>
          <td class="notes-cell mount-notes">${rosterPadNotesInline(component.notes || ["Additional profile"])}</td>
          <td class="points-cell"></td>
        </tr>
      `;
    }).join("");
  }

  const oldRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    if (!isChaos()) return oldRosterPadRow(entry);
    const unit = getUnit(entry.sectionKey, entry.unitId);
    let original = null;
    let profile = null;
    if ((unit.tags || []).includes("mark_eligible") && !unit.chaosPower) {
      profile = profileById.get(unit.profileId);
      original = applyMarkStats(profile, entryMark(entry, unit));
    }
    try {
      return oldRosterPadRow(entry) + secondaryRows(unit);
    } finally {
      restoreStats(profile, original);
    }
  };

  function variantTitle() {
    return {
      chaos_warriors: "Chaos Warriors",
      chaos_beastmen: "Beastmen",
      chaos_daemons: "Chaos Daemons",
      chaos_warband: "Chaos Warband",
      chaos_warhost: "Chaos Warhost"
    }[variant()] || "Chaos";
  }

  function invalidExistingEntries() {
    return state.roster.filter(entry => {
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (!unitAllowed(unit)) return true;
      const forced = singlePower();
      if (!forced) return false;
      if ((unit.tags || []).includes("mark_eligible") && entryMark(entry, unit) !== forced) return true;
      return false;
    });
  }

  function warbandWarnings() {
    if (!isWarband() && !isWarhost()) return [];
    const warnings = [];
    const warriorChars = state.roster.filter(entry => entry.sectionKey === "characters").map(entry => getUnit(entry.sectionKey, entry.unitId)).filter(unit => unit?.chaosFaction === "warriors" && !(unit.tags || []).includes("wizard"));
    if (!warriorChars.length) warnings.push("A Warband/Warhost must include a Chaos Warrior character capable of being the general.");

    const hasCore = state.roster.some(entry => entry.sectionKey === "regiments" && (entry.unitId === "chaos_warriors" || entry.unitId === "chaos_knights"));
    if (!hasCore) warnings.push("A Warband/Warhost must include Chaos Warriors or Chaos Knights.");

    const wrongBSB = state.roster.some(entry => {
      if (entry.sectionKey !== "characters") return false;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      return (unit?.tags || []).includes("battle_standard_bearer") && unit.chaosFaction !== "warriors";
    });
    if (wrongBSB) warnings.push("A Warband/Warhost Battle Standard Bearer must come from the Chaos Warriors section.");
    return warnings;
  }

  const oldRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    oldRenderArmyStatus(total);
    if (!isChaos()) return;

    const key = variant();
    const current = devotion();
    const choices = isWarband() ? POWERS : (isWarhost() ? [] : ["mixed", ...POWERS]);
    const selector = choices.length ? `
      <select class="army-system-select" data-chaos-devotion>
        ${choices.map(power => `<option value="${escapeHtml(power)}" ${current === power ? "selected" : ""}>${escapeHtml(POWER_NAMES[power])}</option>`).join("")}
      </select>
    ` : `<strong>${escapeHtml(POWER_NAMES[current])}</strong>`;

    const warnings = warbandWarnings();
    if (isWarhost() && Number(state.pointsLimit || 0) < 2000) warnings.push("Chaos Warhost is only available in armies of at least 2,000 points.");
    if (pureFaction() === "beastmen") warnings.push("Pure Beastmen armies may use the Ambush special rule.");
    if (pureFaction() === "daemons") warnings.push("Pure Daemon armies may mix Chaos Powers without Daemon Animosity; only a Daemon may be the general.");

    const invalid = invalidExistingEntries();
    if (invalid.length) warnings.push(`${invalid.length} existing choice${invalid.length === 1 ? " is" : "s are"} incompatible with the current devotion/army type.`);

    const panel = document.createElement("div");
    panel.className = "army-system-panel" + (warnings.some(w => /must|only available|incompatible/i.test(w)) ? " warn" : "");
    panel.innerHTML = `
      <div class="army-system-copy">
        <strong>${escapeHtml(variantTitle())} — ${isWarband() ? "Chaos Power" : "Army Devotion"}</strong>
        <span>${isWarband() ? "Warbands must serve one Chaos Power." : isWarhost() ? "Warhosts may combine followers of different Chaos Powers." : "Pure faction armies may mix Powers, or dedicate the whole army to one Power to unlock Chaos Banners."}</span>
        ${warnings.length ? `<span style="margin-top:6px;"><strong>Rules:</strong> ${warnings.map(escapeHtml).join(" ")}</span>` : ""}
      </div>
      ${selector}
    `;
    els.armyStatus.appendChild(panel);

    const select = panel.querySelector("[data-chaos-devotion]");
    if (select) {
      select.addEventListener("change", () => {
        state.armyOptions.chaosDevotions[key] = select.value;
        renderUnitBrowser();
        renderArmy();
      });
    }
  };
})();
