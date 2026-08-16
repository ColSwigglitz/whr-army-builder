// Cross-army consistency fixes for universal WHR builder rules.
(() => {
  function isWizard(unit) {
    const tags = unit?.tags || [];
    return Boolean(unit?.wizard) || tags.includes("wizard") || tags.includes("mage") || tags.includes("sorcerer") || tags.includes("shaman");
  }

  function legacyMagicMaximum(unit, context) {
    if (context === "champion") {
      return Number(
        unit?.champion?.magicItemLimit ??
        unit?.champion?.magicItems?.limit ??
        unit?.champion?.magicItems?.maximum ??
        0
      );
    }
    return Number(
      unit?.magicItemLimit ??
      unit?.magicItems?.limit ??
      unit?.magicItems?.maximum ??
      unit?.magicItems?.additionalMaximum ??
      0
    );
  }

  const previousMagicMaximum = getMagicMaximum;
  getMagicMaximum = function(unit, context) {
    const current = Number(previousMagicMaximum(unit, context) || 0);
    return current > 0 ? current : legacyMagicMaximum(unit, context);
  };

  const previousAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const maximum = getMagicMaximum(unit, context);
    if (maximum <= 0) return [];

    let items = previousAllowedMagicItems(unit, context) || [];
    const wizard = isWizard(unit);

    // Legacy army files used magicItemLimit without a modern magicItems block.
    // Preserve their intended access to the army/common pools while keeping
    // universal wizard-only categories closed to mundane characters.
    const isLegacy = context === "champion"
      ? Boolean(unit?.champion?.magicItemLimit != null && !unit?.champion?.magicItems)
      : Boolean(unit?.magicItemLimit != null && !unit?.magicItems);

    if (!items.length && isLegacy) {
      const categories = new Set(["magic_weapon", "magic_armour", "enchanted_item"]);
      if (wizard) {
        categories.add("arcane_item");
        categories.add("familiar");
      }
      items = [
        ...(state.data?.commonMagicItems || []),
        ...(state.data?.factionMagicItems || [])
      ].filter(item => categories.has(item.category));
    }

    if (!wizard) {
      items = items.filter(item => item.category !== "arcane_item" && item.category !== "familiar");
    }

    return items;
  };

  function unitHasStandardBearer(unit) {
    if (!unit || unit.unitType === "skirmisher" || (unit.tags || []).includes("skirmisher")) return false;
    if (unit.magicBanner?.allowed) return true;
    const command = unit.command || {};
    const definition = getCommandDefinition(unit, "standardBearer") || {};
    if (definition.allowed === false) return false;
    if (command.useGlobalDefaults) return true;
    return Boolean(command.standardBearer);
  }

  const previousRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = previousRegimentEditor(entry, unit);
    if (
      entry?.command?.standardBearer &&
      unitHasStandardBearer(unit) &&
      !String(html).includes("data-magic-banner")
    ) {
      html += renderMagicBannerEditor(entry, unit);
    }
    return html;
  };

  function patchRosterProfileGaps() {
    if (!state.data?.faction) return false;
    let changed = false;

    // WHR Empire p.22: one Warrior Priest may ride a large chariot drawn by
    // two barded warhorses. The option existed in the original dataset but
    // the corresponding mount/profile did not, so Roster Pad could not show it.
    if (state.data.faction.id === "empire") {
      state.data.profiles = state.data.profiles || [];
      state.data.mounts = state.data.mounts || [];
      if (!state.data.profiles.some(p => p.id === "warrior_priest_chariot_profile")) {
        state.data.profiles.push({
          id: "warrior_priest_chariot_profile",
          name: "Large Chariot",
          stats: { M:"–", WS:"–", BS:"–", S:5, T:5, W:4, I:"–", A:"–", Ld:"–" }
        });
        changed = true;
      }
      if (!state.data.mounts.some(m => m.id === "warrior_priest_chariot")) {
        state.data.mounts.push({
          id: "warrior_priest_chariot",
          name: "Large Chariot (2 Barded Warhorses)",
          profileId: "warrior_priest_chariot_profile",
          rules: ["heavy_chariot", "two_barded_warhorses"]
        });
        changed = true;
      }
    }

    // Modern Chaos Dwarf Magma Cannons inherit the Dwarf Flame Cannon rules.
    // Some payload versions referenced a crew profile id that was not present;
    // alias that id to the existing Chaos Dwarf Warrior/Crewman statline.
    if (state.data.faction.id === "chaos_dwarfs") {
      const magma = (state.data.faction.warMachines || []).find(u => /magma cannon/i.test(u.name || ""));
      if (magma) {
        const entry = createEntry("warMachines", magma);
        const crew = resolveWarMachineCrew(entry, magma);
        if (crew?.profileId && !profileById.get(crew.profileId)) {
          const source = (state.data.profiles || []).find(p => /chaos dwarf (warrior|crew)/i.test(p.name || ""));
          if (source) {
            state.data.profiles.push({...clone(source), id:crew.profileId, name:"Chaos Dwarf Crewman"});
            changed = true;
          }
        }
      }
    }

    return changed;
  }

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!state.data) return;
    if (patchRosterProfileGaps()) buildIndexes();
    renderUnitBrowser();
    renderArmy();
  };

  // The Warrior Priest's large chariot is drawn by two barded warhorses.
  // Print their profile as well as the chariot body profile.
  const previousRosterPadMountRow = rosterPadMountRow;
  rosterPadMountRow = function(entry, unit) {
    let html = previousRosterPadMountRow(entry, unit);
    if (state.data?.faction?.id === "empire" && entry?.mount === "warrior_priest_chariot") {
      html += rosterPadUnitMountRow(entry, {
        ...unit,
        unitMount: { mountId:"warhorse", name:"2 Barded Warhorses", equipment:["barding"] }
      });
    }
    return html;
  };

  // Expose invariant helpers for the all-army regression workflow.
  window.whrUnitHasStandardBearer = unitHasStandardBearer;
})();
