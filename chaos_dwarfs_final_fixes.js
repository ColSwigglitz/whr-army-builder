// Final Chaos Dwarf source-resolution fixes layered after the main faction extension.
(() => {
  const isCD = () => state.data?.faction?.id === "chaos_dwarfs" && state.selectedArmyId === "chaos_dwarfs";
  let patchedData = null;

  function patchResolvedEntries() {
    if (!isCD() || patchedData === state.data) return;
    patchedData = state.data;

    // Modern Stuff says the Magma Cannon follows the Dwarf Flame Cannon rules.
    // Reuse the existing WHR builder's 90-point Flame Cannon implementation, but
    // retain Chaos Dwarf crew and do not grant Dwarf engineering runes.
    const magma = state.data.faction.warMachines.find(unit => unit.id === "magma_cannon");
    if (magma) {
      magma.points = { type: "fixed", value: 90 };
      magma.tags = (magma.tags || []).filter(tag => tag !== "needs_resolved_cost");
      magma.rules = [
        "Modern Stuff: follows the rules for the Dwarf Flame Cannon.",
        "May stand and shoot.",
        "Guess range up to 12 inches and add the artillery die. Use the teardrop template: Strength 5; each wound becomes 1D3 wounds; any regiment suffering a casualty takes a panic test."
      ];
      magma.crew = { baseCount: 3, profileId: "chaos_dwarf_warrior", name: "Chaos Dwarf Crew" };
    }

    // The Old School text says Blunderbusses are replaced by crossbows but does
    // not print a separate regiment price. This builder uses Warrior cost (9)
    // plus the standard crossbow value (4) = 13/model and makes that inference
    // explicit in the unit notes rather than presenting it as a quoted book cost.
    const crossbows = state.data.faction.regiments.find(unit => unit.id === "chaos_dwarf_crossbows");
    if (crossbows) {
      crossbows.points = { type: "per_model", value: 13 };
      crossbows.rules = [
        ...(crossbows.rules || []).filter(rule => !String(rule).startsWith("Builder pricing note:")),
        "Builder pricing note: the Old School addendum does not state a separate crossbow regiment price; this uses Chaos Dwarf Warrior cost plus the standard crossbow value (13 pts/model)."
      ];
    }
  }

  const previousRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    patchResolvedEntries();
    return previousRenderUnitBrowser();
  };

  const previousCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    patchResolvedEntries();
    return previousCalculateEntry(entry);
  };

  // Resolve external magic pools by the displayed unit identity rather than relying
  // on faction-internal IDs. This keeps the rule robust if the compact payload uses
  // different IDs for the greenskin heroes or K'daii unit.
  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let result = previousGetAllowedMagicItems(unit, context);
    if (!isCD() || !unit) return result;
    patchResolvedEntries();

    const name = String(unit.name || "");
    const isGreenskinCharacter = /^(Black Orc|Common Orc|Common Goblin) Hero$/i.test(name);
    const isGreenskinChampion = context === "champion" && /(Orc|Black Orc|Common Goblin) Slave Warriors/i.test(name);
    const isKdaaiChampion = context === "champion" && /K['’]?daii Fireborn/i.test(name);

    const additions = [];
    if (isGreenskinCharacter || isGreenskinChampion) {
      additions.push(...(state.data.factionMagicItems || []).filter(item => item.chaosDwarfExternalPool === "orcs_goblins"));
    }
    if (isKdaaiChampion) {
      additions.push(...(state.data.factionMagicItems || []).filter(item => item.chaosDwarfExternalPool === "daemon_reward_all"));
    }

    if (!additions.length) return result;
    const byId = new Map(result.map(item => [item.id, item]));
    for (const item of additions) byId.set(item.id, item);
    return [...byId.values()];
  };
})();
