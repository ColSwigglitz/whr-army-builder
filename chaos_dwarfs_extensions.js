// Chaos Dwarfs: High Hats / Old School / Modern list construction and faction-specific validation.
(() => {
  const ARMY_ID = "chaos_dwarfs";
  const STYLE_NAMES = { classic:"Classic High Hats", old_school:"Old School", modern:"Modern" };

  const isCD = () => state.data?.faction?.id === ARMY_ID && state.selectedArmyId === ARMY_ID;

  function ensureOptions() {
    state.armyOptions = state.armyOptions || {};
    if (!["classic","old_school","modern"].includes(state.armyOptions.chaosDwarfStyle)) {
      state.armyOptions.chaosDwarfStyle = "classic";
    }
    return state.armyOptions.chaosDwarfStyle;
  }

  function style() { return isCD() ? ensureOptions() : "classic"; }

  function allUnits() {
    if (!isCD()) return [];
    return ["characters","regiments","warMachines","specialCharacters"]
      .flatMap(key => (state.data.faction[key] || []).map(unit => ({ key, unit })));
  }

  function allowedByStyle(unit) {
    const tags = unit?.tags || [];
    const s = style();
    if (s === "classic") return !tags.includes("old_school_only") && !tags.includes("modern_only");
    if (s === "old_school") {
      if (tags.includes("modern_only")) return false;
      if (unit.id === "chaos_dwarf_blunderbusses") return false;
      if (tags.includes("classic_modern_machine")) return false;
      return true;
    }
    if (s === "modern") {
      if (tags.includes("old_school_only") || tags.includes("hide_modern")) return false;
      return true;
    }
    return true;
  }

  function optionAllowed(option) {
    return !Array.isArray(option?.styles) || option.styles.includes(style());
  }

  function patchDataOnce() {
    if (!isCD() || state.data.__chaosDwarfPatched) return;
    state.data.__chaosDwarfPatched = true;

    for (const id of ["chaos_dwarf_lord","chaos_dwarf_hero"]) {
      const unit = state.data.faction.characters.find(u => u.id === id);
      if (unit && !(unit.equipmentOptions || []).some(g => g.id === "armour")) {
        unit.equipmentOptions = [
          ...(unit.equipmentOptions || []),
          { id:"armour", choices:["heavy_armour","chaos_armour"], cost:0, alsoMayTake:["shield"] }
        ];
      }
    }

    const crossbows = state.data.faction.regiments.find(u => u.id === "chaos_dwarf_crossbows");
    if (crossbows) crossbows.rules = [...(crossbows.rules || []), "Old School replacement for Chaos Dwarf Blunderbusses."];

    const restrictions = {
      whip_obedience: { hobgoblinOnly:true, footOnly:true },
      black_hammer_hashut: { chaosDwarfOrBull:true },
      banner_feigned_cowardice: { hobgoblinOnly:true },
      banner_sneakiness: { hobgoblinOnly:true },
      slave_banner: { bsbOnly:true }
    };
    for (const item of state.data.factionMagicItems || []) Object.assign(item, restrictions[item.id] || {});
  }

  const previousRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    if (!isCD()) return previousRenderUnitBrowser();
    patchDataOnce();
    const faction = state.data.faction;
    const keys = ["characters","regiments","warMachines","specialCharacters"];
    const originals = Object.fromEntries(keys.map(k => [k, faction[k]]));
    for (const key of keys) faction[key] = (faction[key] || []).filter(allowedByStyle);
    try { return previousRenderUnitBrowser(); }
    finally { for (const key of keys) faction[key] = originals[key]; }
  };

  function cloneWithStyleOptions(unit) {
    const view = clone(unit);
    view.options = (view.options || []).filter(optionAllowed);
    return view;
  }

  const previousRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    if (!isCD()) return previousRenderCharacterEditor(entry, unit);
    patchDataOnce();
    const view = cloneWithStyleOptions(unit);
    let html = previousRenderCharacterEditor(entry, view);
    if ((view.options || []).length) {
      html += `<section class="editor-section">
        <h3 class="editor-section-title">${style() === "modern" ? "Modern Equipment" : "Options"}</h3>
        ${renderUnitOptions(entry, view)}
      </section>`;
    }
    return html;
  };

  const previousRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isCD()) return previousRenderRegimentEditor(entry, unit);
    return previousRenderRegimentEditor(entry, cloneWithStyleOptions(unit));
  };

  const previousRenderWarMachineEditor = renderWarMachineEditor;
  renderWarMachineEditor = function(entry, unit) {
    if (!isCD()) return previousRenderWarMachineEditor(entry, unit);
    return previousRenderWarMachineEditor(entry, cloneWithStyleOptions(unit));
  };

  function isHobgoblinUnit(unit) {
    return (unit?.tags || []).includes("hobgoblin") || (unit?.tags || []).includes("hobgoblin_character");
  }
  function isGreenskinMagicUser(unit) {
    return ["black_orc_hero","common_orc_hero","common_goblin_hero"].includes(unit?.id);
  }
  function isChaosDwarfOrBull(unit) {
    const tags = unit?.tags || [];
    return tags.includes("chaos_dwarf_character") || tags.includes("bull_centaur") ||
      String(unit?.id || "").startsWith("chaos_dwarf") || unit?.id === "tower_guard";
  }

  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let items = previousGetAllowedMagicItems(unit, context);
    if (!isCD()) return items;

    const draft = state.draft;
    const champion = context === "champion";

    if (champion && draft?.unitId === "kdaii_fireborn") {
      return (state.data.factionMagicItems || []).filter(item => item.chaosDwarfExternalPool === "daemon_reward_all");
    }

    items = items.filter(item => {
      if (item.chaosDwarfExternalPool === "daemon_reward_all") return false;
      if (item.chaosDwarfExternalPool === "orcs_goblins" && !isGreenskinMagicUser(unit) && !(champion && ["orc_slave_warriors","black_orc_slave_warriors","common_goblin_slave_warriors"].includes(unit?.id))) return false;
      if (item.hobgoblinOnly && !isHobgoblinUnit(unit)) return false;
      if (item.footOnly && draft?.mount) return false;
      if (item.chaosDwarfOrBull && !isChaosDwarfOrBull(unit)) return false;
      if (item.bsbOnly && !(unit?.tags || []).includes("battle_standard_bearer")) return false;
      if (item.id === "banner_feigned_cowardice" || item.id === "banner_sneakiness") {
        if ((unit?.tags || []).includes("battle_standard_bearer")) return false;
      }
      return true;
    });
    return items;
  };

  const previousRenderMagicBannerEditor = renderMagicBannerEditor;
  renderMagicBannerEditor = function(entry, unit) {
    if (!isCD()) return previousRenderMagicBannerEditor(entry, unit);
    const original = state.data.factionMagicItems;
    state.data.factionMagicItems = (original || []).filter(item => {
      if (item.chaosDwarfExternalPool) return false;
      if (item.id === "slave_banner") return false;
      if (["banner_feigned_cowardice","banner_sneakiness"].includes(item.id)) return isHobgoblinUnit(unit);
      return true;
    });
    try { return previousRenderMagicBannerEditor(entry, unit); }
    finally { state.data.factionMagicItems = original; }
  };

  function selectedIds(entry, unit) {
    try { return getSelectedEquipmentIds(entry, unit); }
    catch { return [...(unit.fixedEquipment || [])]; }
  }

  function hasOption(entry, id) { return Boolean(entry?.optionSelections?.[id]); }

  function armourSave(entry, unit) {
    if (unit.id === "chaos_siege_giant") return "5+ (3+ shooting)";
    if (unit.id === "iron_daemon") return "3+";
    if (["kdaii_fireborn","kdaii_destroyer"].includes(unit.id)) return "4+";
    if (Number(unit.fixedArmourSave) > 0) return `${Number(unit.fixedArmourSave)}+`;

    const ids = new Set(selectedIds(entry, unit));
    if (hasOption(entry, "chaos_armour")) ids.add("chaos_armour");
    if (hasOption(entry, "heavy_armour")) { ids.delete("light_armour"); ids.add("heavy_armour"); }
    if (hasOption(entry, "light_armour")) ids.add("light_armour");
    if (hasOption(entry, "shields")) ids.add("shield");

    let save = null;
    if (ids.has("chaos_armour")) save = 4;
    else if (ids.has("heavy_armour")) save = 5;
    else if (ids.has("light_armour")) save = 6;
    if (ids.has("shield")) save = save == null ? 6 : save - 1;

    const mounted = Boolean(entry.mount) || unit.id === "hobgoblin_wolf_riders";
    const naturalCentaur = (unit.tags || []).includes("bull_centaur") || unit.id === "bull_centaurs";
    if (mounted && !naturalCentaur) save = save == null ? 6 : save - 1;

    for (const itemId of entry.magicItems || []) {
      if (itemId === "armour_midnight") return "1+";
      if (itemId === "mask_furnace") save = (save == null ? 6 : save - 1);
      if (itemId === "armour_bazrakk") save = Math.min(save ?? 4, 4);
    }
    return save == null ? "–" : `${Math.max(2, save)}+`;
  }

  const previousCalculatePrintedArmourSave = calculatePrintedArmourSave;
  calculatePrintedArmourSave = function(entry, unit) {
    if (!isCD()) return previousCalculatePrintedArmourSave(entry, unit);
    return armourSave(entry, unit);
  };

  const previousCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = previousCalculateEntry(entry);
    if (!isCD()) return total;
    if (entry.unitId === "bull_centaurs" && entry.command?.standardBearer && hasOption(entry, "heavy_armour")) total -= 10;
    return total;
  };

  function hasRegiment(id) { return state.roster.some(e => e.sectionKey === "regiments" && e.unitId === id); }
  function hasHobgoblinRegiment() {
    return state.roster.some(e => e.sectionKey === "regiments" && (getUnit(e.sectionKey,e.unitId)?.tags || []).includes("hobgoblin"));
  }
  function hasSorcerer() {
    return state.roster.some(e => {
      const u = getUnit(e.sectionKey,e.unitId);
      return (u?.tags || []).includes("sorcerer") || ["astragoth","drazhoath"].includes(e.unitId);
    });
  }
  function eligibleGeneralPresent() {
    return state.roster.some(e => {
      if (e.sectionKey !== "characters" && e.sectionKey !== "specialCharacters") return false;
      const u = getUnit(e.sectionKey,e.unitId);
      if ((u?.tags || []).includes("battle_standard_bearer")) return false;
      return (u?.tags || []).includes("chaos_dwarf_character") || ["zhatan_black","astragoth","drazhoath"].includes(e.unitId);
    });
  }
  function hasCoreCDRegiment() {
    return state.roster.some(e => e.sectionKey === "regiments" &&
      ["chaos_dwarf_warriors","tower_guard","chaos_dwarf_blunderbusses","chaos_dwarf_crossbows"].includes(e.unitId));
  }

  function restrictionMessage(unit) {
    if (!unit) return "";
    if ((unit.tags || []).includes("requires_black_orc_regiment") && !hasRegiment("black_orc_slave_warriors")) return "requires a Black Orc Slave Warrior regiment";
    if ((unit.tags || []).includes("requires_common_orc_regiment") && !hasRegiment("orc_slave_warriors")) return "requires an Orc Slave Warrior regiment";
    if ((unit.tags || []).includes("requires_common_goblin_regiment") && !hasRegiment("common_goblin_slave_warriors")) return "requires a Common Goblin Slave Warrior regiment";
    if ((unit.tags || []).includes("requires_hobgoblin_regiment") && !hasHobgoblinRegiment()) return "requires a Hobgoblin regiment";
    if ((unit.tags || []).includes("requires_sorcerer") && !hasSorcerer()) return "requires a Chaos Dwarf Sorcerer";
    return "";
  }

  const previousAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isCD()) return previousAddUnit(sectionKey, unitId);
    patchDataOnce();
    const unit = getUnit(sectionKey, unitId);
    if (!allowedByStyle(unit)) {
      window.alert(`${unit.name} is not available in the ${STYLE_NAMES[style()]} army style.`);
      return;
    }
    if ((unit.tags || []).includes("zero_one") && state.roster.some(e => e.unitId === unitId)) {
      window.alert(`${unit.name} may only be included once.`);
      return;
    }
    if ((unit.tags || []).includes("zero_one_bsb") && state.roster.some(e => (getUnit(e.sectionKey,e.unitId)?.tags || []).includes("zero_one_bsb"))) {
      window.alert("A Chaos Dwarf army may include only one Battle Standard Bearer.");
      return;
    }
    if (sectionKey === "specialCharacters" && state.roster.some(e => e.sectionKey === sectionKey && e.unitId === unitId)) {
      window.alert(`${unit.name} may only be included once.`);
      return;
    }
    return previousAddUnit(sectionKey, unitId);
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isCD() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (state.draft.unitId === "common_goblin_slave_warriors" &&
          state.draft.optionSelections?.weapon === "short_bow" &&
          state.draft.optionSelections?.shields) {
        window.alert("Common Goblin Slave Warriors with short bows cannot take shields.");
        return;
      }
      const issue = restrictionMessage(unit);
      if (issue) {
        window.alert(`${unit.name} ${issue}.`);
        return;
      }
    }
    return previousSaveEditor();
  };

  function warnings() {
    const result = [];
    if (state.roster.length && !eligibleGeneralPresent()) result.push("The army General must be a Chaos Dwarf character.");
    if (state.roster.length && !hasCoreCDRegiment()) result.push("The army must include Chaos Dwarf Warriors, Tower Guard, Blunderbusses, or Old School Chaos Dwarf Crossbows.");

    for (const entry of state.roster) {
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (!unit) continue;
      if (!allowedByStyle(unit)) result.push(`${unit.name} is not legal in the ${STYLE_NAMES[style()]} style.`);
      const issue = restrictionMessage(unit);
      if (issue) result.push(`${unit.name} ${issue}.`);
    }

    const bsbs = state.roster.filter(e => (getUnit(e.sectionKey,e.unitId)?.tags || []).includes("zero_one_bsb"));
    if (bsbs.length > 1) result.push("Only one Battle Standard Bearer may be included.");

    for (const {unit} of allUnits()) {
      if (!(unit.tags || []).includes("zero_one")) continue;
      if (state.roster.filter(e => e.unitId === unit.id).length > 1) result.push(`${unit.name} is 0-1.`);
    }
    return [...new Set(result)];
  }

  const previousRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    previousRenderArmyStatus(total);
    if (!isCD()) return;
    patchDataOnce();
    const list = warnings();
    const s = style();
    const panel = document.createElement("div");
    panel.className = `army-system-panel${list.length ? " warn" : ""}`;
    panel.innerHTML = `
      <div class="army-system-copy">
        <strong>Chaos Dwarf Army Style</strong>
        <span>High Hats are the core list. Old School and Modern additions are mutually exclusive.</span>
        <label style="display:flex;gap:8px;align-items:center;margin-top:8px;">
          <span>Army style</span>
          <select data-chaos-dwarf-style>
            ${Object.entries(STYLE_NAMES).map(([id,label]) => `<option value="${id}" ${id===s?"selected":""}>${label}</option>`).join("")}
          </select>
        </label>
        ${s === "old_school" ? `<span style="margin-top:6px;"><strong>Old School:</strong> Blunderbusses become crossbows and the core artillery is replaced by Weapon Teams and classic contraptions.</span>` : ""}
        ${s === "modern" ? `<span style="margin-top:6px;"><strong>Modern:</strong> Black Orc, Common Orc and Common Goblin choices are unavailable; modern monsters, engines and equipment are enabled.</span>` : ""}
        ${list.length ? `<span style="margin-top:6px;"><strong>Rules:</strong> ${list.map(escapeHtml).join(" • ")}</span>` : ""}
      </div>`;
    els.armyStatus.prepend(panel);

    panel.querySelector("[data-chaos-dwarf-style]")?.addEventListener("change", event => {
      ensureOptions();
      state.armyOptions.chaosDwarfStyle = event.target.value;
      for (const entry of state.roster) {
        const unit = getUnit(entry.sectionKey, entry.unitId);
        for (const option of unit?.options || []) {
          if (Array.isArray(option.styles) && !option.styles.includes(style())) delete entry.optionSelections?.[option.id];
        }
      }
      renderUnitBrowser();
      renderArmy();
    });
  };

  const previousRosterPadNotes = rosterPadNotes;
  rosterPadNotes = function(entry, unit) {
    const notes = previousRosterPadNotes(entry, unit);
    if (!isCD()) return notes;
    if (entry.unitId === "bull_centaurs" && entry.command?.standardBearer && hasOption(entry,"heavy_armour")) notes.push("Heavy armour: standard bearer is free");
    if (entry.optionSelections?.modern_fireglaive) notes.push("Fireglaive");
    if (entry.optionSelections?.naphtha_bombs) notes.push("Naphtha Bombs");
    if (Number(entry.optionSelections?.blood_of_hashut || 0) > 0) notes.push(`Blood of Hashut ×${entry.optionSelections.blood_of_hashut}`);
    if ((unit.tags || []).includes("opponent_permission")) notes.push("Opponent permission required");
    return notes;
  };
})();
