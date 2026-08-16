// Cross-faction special-character magic item corrections.
// Source: WHR Armies 2026-27. Special characters only receive extra items
// where their own entry explicitly permits them.
(() => {
  const fullMagicCategories = ["magic_weapon", "magic_armour", "enchanted_item", "arcane_item", "familiar"];
  const martialMagicCategories = ["magic_weapon", "magic_armour", "enchanted_item"];

  function specialById(id) {
    return (state.data?.faction?.specialCharacters || []).find(unit => unit.id === id) || null;
  }

  function giveMagicItems(id, maximum, { wizard = false, banner = false, combinedBloodline = false } = {}) {
    const unit = specialById(id);
    if (!unit) return;
    const categories = wizard ? [...fullMagicCategories] : [...martialMagicCategories];
    if (banner) categories.push("magic_banner");
    unit.magicItems = {
      maximum: Number(maximum),
      allowedPools: ["common", "faction"],
      allowedCategories: categories
    };
    if (combinedBloodline) unit.combinedMagicAndBloodlineLimit = Number(maximum);
  }

  function markVonCarsteinVampire(unit) {
    if (!unit) return;
    unit.tags = [...new Set([...(unit.tags || []), "vampire", "von_carstein_only"])];
    unit.bloodlineOnly = "von_carstein";
  }

  function patchSpecialCharacterAllowances() {
    const army = state.selectedArmyId;

    if (army === "vampire_counts") {
      const vlad = specialById("vlad_isabella");
      const mannfred = specialById("mannfred_von_carstein");
      const konrad = specialById("konrad_von_carstein");
      [vlad, mannfred, konrad].forEach(markVonCarsteinVampire);

      // WHR p.78. Vlad has one extra item AND one extra bloodline power.
      if (vlad) {
        giveMagicItems("vlad_isabella", 1, { wizard: true });
        vlad.bloodlinePowers = { ...(vlad.bloodlinePowers || {}), maximum: 1 };
      }

      // WHR p.78. These are shared pools: items + bloodline powers may not
      // exceed the stated total in any combination.
      giveMagicItems("mannfred_von_carstein", 4, { wizard: true, combinedBloodline: true });
      giveMagicItems("konrad_von_carstein", 2, { combinedBloodline: true });
    }

    if (army === "tomb_kings") {
      // WHR p.85.
      giveMagicItems("khalida", 3);
      giveMagicItems("arkhan", 4, { wizard: true });
    }

    if (army === "classic_undead") {
      // WHR p.89.
      giveMagicItems("krell", 1);
      giveMagicItems("dieter", 3, { wizard: true });
      giveMagicItems("heinrich", 3, { wizard: true });
    }

    if (army === "lizardmen") {
      // Mazdamundi is the BSB and WHR explicitly permits one of his four
      // additional items to be a magic banner.
      const maz = specialById("mazdamundi");
      if (maz?.magicItems) {
        const categories = new Set(maz.magicItems.allowedCategories || fullMagicCategories);
        categories.add("magic_banner");
        maz.magicItems.allowedCategories = [...categories];
      }
    }
  }

  function resolveFixedMagicItem(itemId) {
    return getMagicItem(itemId) ||
      (state.data?.faction?.specialCharacterOnlyItems || []).find(item => item.id === itemId) ||
      null;
  }

  function renderIncludedMagicItems(unit) {
    if (!(unit?.fixedMagicItems || []).length) return "";
    const items = unit.fixedMagicItems
      .map(resolveFixedMagicItem)
      .filter(Boolean);
    if (!items.length) return "";

    return `
      <section class="editor-section included-magic-items">
        <h3 class="editor-section-title">Included Magic Items</h3>
        ${items.map(item => `
          <div class="dialog-note included-magic-item" data-fixed-magic-item="${escapeHtml(item.id)}">
            <strong>${escapeHtml(item.name)}</strong>${item.rules ? ` — ${escapeHtml(item.rules)}` : ""}
          </div>
        `).join("")}
      </section>
    `;
  }

  // Patch after every faction's loaders/extensions have completed their own
  // selectArmy work, then rebuild indexes so altered magic settings are live.
  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!state.data) return;
    patchSpecialCharacterAllowances();
    buildIndexes();
    renderUnitBrowser();
    renderArmy();
  };

  // The Roster Pad already prints fixedMagicItems with rules. Mirror that
  // information in the edit dialog so included items are never unexplained.
  const previousRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    return previousRenderCharacterEditor(entry, unit) + renderIncludedMagicItems(unit);
  };

  window.whrResolveFixedSpecialMagicItem = resolveFixedMagicItem;
})();
