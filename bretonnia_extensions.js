// Bretonnia-specific builder behaviour and Roster Pad support.
(() => {
  // Bretonnia is a standalone data file, so enrich it here with the shared
  // common magic-item pool and a few schema details used by the generic UI.
  const previousFetch = window.fetch.bind(window);

  function enrichCommonMagicArmour(items) {
    const byName = new Map((items || []).map(item => [String(item.name || "").toLowerCase(), item]));
    const base = (name, value) => { const item = byName.get(name); if (item) item.armourSaveBase = value; };
    const modifier = (name, value) => { const item = byName.get(name); if (item) item.armourSaveModifier = value; };
    const fixed = (name, value) => { const item = byName.get(name); if (item) item.fixedArmourSave = value; };

    base("armour of endurance", 5);
    base("armour of resilience", 5); modifier("armour of resilience", 1);
    base("oaken armour", 6);
    base("adamant armour", 5);
    base("dawn armour", 5);
    base("trollhide armour", 6);
    base("emerald armour", 6);
    base("armour of fortune", 5);
    fixed("armour of meteoric iron", 2);
    base("armour of unyielding", 5);
    base("armour of protection", 5);
    base("armour of brilliance", 5);
    modifier("enchanted shield", 1);
  }

  window.fetch = async function(input, init) {
    const response = await previousFetch(input, init);
    const url = typeof input === "string" ? input : input?.url || "";
    if (!response.ok || !(url.endsWith("data/whr_bretonnia_v0_1.json") || url.endsWith("/whr_bretonnia_v0_1.json"))) {
      return response;
    }

    try {
      const data = await response.clone().json();

      if (!data.commonMagicItems?.length) {
        const empireResponse = await previousFetch("./data/whr_empire_v0_1.json", { cache: "no-store" });
        if (empireResponse.ok) {
          const empire = await empireResponse.json();
          data.commonMagicItems = empire.commonMagicItems || [];
        }
      }
      enrichCommonMagicArmour(data.commonMagicItems);

      for (const unit of data.faction?.regiments || []) {
        // WHR permits any regiment with a standard bearer to carry a magic banner.
        unit.magicBanner = unit.magicBanner || { allowed: true };

        // Choice-group entries need to expose the selected equipment to the
        // generic notes/armour code as well as to the points calculator.
        for (const option of unit.options || []) {
          if (option.type !== "choice_group") continue;
          for (const choice of option.choices || []) {
            if (choice && typeof choice === "object" && choice.id && !choice.addsEquipment) {
              choice.addsEquipment = [choice.id];
            }
          }
        }
      }

      // Named magic armour/shields still contribute their mundane armour type.
      const louen = (data.faction?.specialCharacters || []).find(unit => unit.id === "louen");
      if (louen) louen.fixedEquipment = [...new Set([...(louen.fixedEquipment || []), "heavy_armour"])];
      const tancred = (data.faction?.specialCharacters || []).find(unit => unit.id === "tancred");
      if (tancred) tancred.fixedEquipment = [...new Set([...(tancred.fixedEquipment || []), "shield"])];

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Unable to enrich Bretonnia army data", error);
      return response;
    }
  };

  const isBretonnia = () => state.data?.faction?.id === "bretonnia";
  const factionItems = () => state.data?.factionMagicItems || [];
  const itemById = id => factionItems().find(item => item.id === id) || getMagicItem(id);

  function bearerTags(unit, context) {
    return context === "champion" ? (unit.champion?.tags || []) : (unit.tags || []);
  }

  const oldGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const items = oldGetAllowedMagicItems(unit, context);
    if (!isBretonnia()) return items;

    const tags = bearerTags(unit, context);
    const isKnightly = tags.includes("knightly");
    const isWizard = tags.includes("wizard");
    const isCommonerChampion = context === "champion" && tags.includes("commoner");

    return items.filter(item => {
      if (item.knightlyOnly && !isKnightly) return false;
      if (item.wizardOnly && !isWizard) return false;
      if (item.commonerChampionOnly && !isCommonerChampion) return false;
      if (item.isVirtue && !isKnightly) return false;
      return true;
    });
  };

  // Special-character options are normally uncommon, but Bertrand's unit can
  // purchase extra Bowmen of Bergerac. Reuse the generic option editor.
  const oldRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    let html = oldRenderCharacterEditor(entry, unit);
    if (isBretonnia() && entry.sectionKey === "specialCharacters" && (unit.options || []).length) {
      html += `
        <section class="editor-section">
          <h3 class="editor-section-title">Unit Options</h3>
          ${renderUnitOptions(entry, unit)}
        </section>
      `;
    }
    return html;
  };

  // Bretonnian army-book banners are restricted to specific Chevalier units.
  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isBretonnia() || !state.draft) return;

    const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
    const bannerSelect = els.dialogContent.querySelector("[data-magic-banner]");
    if (!bannerSelect) return;

    for (const option of bannerSelect.options) {
      if (!option.value) continue;
      const item = itemById(option.value);
      if (!item?.allowedUnitIds?.length) continue;
      const allowed = item.allowedUnitIds.includes(unit.id);
      option.disabled = !allowed;
      option.hidden = !allowed;
    }
  };

  function virtueCount(ids) {
    return (ids || []).filter(id => itemById(id)?.isVirtue).length;
  }

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isBretonnia() && state.draft) {
      if (virtueCount(state.draft.magicItems) > 1) {
        window.alert("A Bretonnian knight may take only one Knightly Virtue.");
        return;
      }
      if (virtueCount(state.draft.champion?.magicItems) > 1) {
        window.alert("A Bretonnian Knightly Champion may take only one Knightly Virtue.");
        return;
      }

      // Skirmishers cannot retain a standard bearer or magic banner.
      if (state.draft.unitId === "archers" && state.draft.optionSelections?.skirmish) {
        state.draft.command.standardBearer = false;
        state.draft.magicBanner = null;
      }
    }
    oldSaveEditor();
  };

  // Enforce the army-book 0-1 entries and special-character uniqueness at the
  // point they are added, rather than waiting for a manual legality check.
  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (isBretonnia()) {
      const unit = getUnit(sectionKey, unitId);
      const alreadyPresent = state.roster.some(entry => entry.sectionKey === sectionKey && entry.unitId === unitId);
      if (alreadyPresent && ((unit.tags || []).includes("zero_one") || sectionKey === "specialCharacters")) {
        window.alert(`${unit.name} may only be included once in a Bretonnian army.`);
        return;
      }
    }
    return oldAddUnit(sectionKey, unitId);
  };

  function additionalProfileRows(entry, unit) {
    if (!isBretonnia() || !unit.additionalProfiles?.length) return "";

    return unit.additionalProfiles.map(component => {
      const profile = profileById.get(component.profileId);
      if (!profile) return "";

      let label = component.label || profile.name || humanise(component.profileId);
      if (unit.id === "bertrand_bowmen" && component.profileId === "bowman_bergerac") {
        label = `${2 + Number(entry.optionSelections?.extra_bowmen || 0)} Bowmen of Bergerac`;
      }

      return `
        <tr class="mount-row">
          <td class="unit-cell mount-name">↳ ${escapeHtml(label)}</td>
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
    const base = oldRosterPadRow(entry);
    if (!isBretonnia()) return base;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return base + additionalProfileRows(entry, unit);
  };

  // Surface the defining Grand Army requirements in the live legality panel.
  const oldRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    oldRenderArmyStatus(total);
    if (!isBretonnia()) return;

    const hasChevaliers = state.roster.some(entry => {
      if (entry.sectionKey !== "regiments") return false;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      return (unit.tags || []).includes("knightly");
    });
    const hasKnightlyCharacter = state.roster.some(entry => {
      if (entry.sectionKey !== "characters" && entry.sectionKey !== "specialCharacters") return false;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      return (unit.tags || []).includes("knightly");
    });

    if (hasChevaliers && hasKnightlyCharacter) return;
    const messages = [];
    if (!hasChevaliers) messages.push("The Grand Army must include at least one regiment of Chevaliers.");
    if (!hasKnightlyCharacter) messages.push("The general must be a knightly character, not a wizard.");
    els.armyStatus.insertAdjacentHTML("beforeend", `
      <div class="warning-box" style="margin-top:10px;">
        <strong>Bretonnia army requirement:</strong> ${messages.map(escapeHtml).join(" ")}
      </div>
    `);
  };
})();
