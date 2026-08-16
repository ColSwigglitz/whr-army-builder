// Pure Lizardmen faction behaviour: mixed Skink/Kroxigor units, BSB rules, item restrictions and roster profiles.
(() => {
  const ARMY_ID = "lizardmen";
  const isLiz = () => state.data?.faction?.id === ARMY_ID && state.selectedArmyId === ARMY_ID;
  const tags = unit => unit?.tags || [];
  const hasTag = (unit, tag) => tags(unit).includes(tag);

  function isZeroOne(unit) {
    return hasTag(unit, "zero_one") || Number(unit?.selection?.maximum || 0) === 1;
  }

  function isSkinkBearer(unit) {
    return hasTag(unit, "skink") || ["skink_warriors","chameleon_skinks","great_crested_cold_one_riders","terradon_riders"].includes(unit?.id);
  }

  function isSlann(unit) { return hasTag(unit, "slann"); }
  function isWizard(unit) { return hasTag(unit, "wizard") || Number(unit?.wizardLevel || 0) > 0; }

  function isBsbEntry(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit) return false;
    return hasTag(unit, "bsb") || Boolean(entry.optionSelections?.battle_standard);
  }

  function otherBsbExists(ignoreId = null) {
    return state.roster.some(entry => entry.id !== ignoreId && isBsbEntry(entry));
  }

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (!isLiz()) return entry;
    entry.lizardChampionHornedOne = Boolean(entry.lizardChampionHornedOne);
    return entry;
  };

  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isLiz()) return oldAddUnit(sectionKey, unitId);
    const unit = getUnit(sectionKey, unitId);
    if (!unit) return;
    if (isZeroOne(unit) && state.roster.some(entry => entry.unitId === unitId)) {
      alert(`${unit.name} may only be included once.`);
      return;
    }
    if (hasTag(unit, "bsb") && otherBsbExists()) {
      alert("A Lizardmen army may include only one Battle Standard Bearer.");
      return;
    }
    return oldAddUnit(sectionKey, unitId);
  };

  const oldCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = oldCalculateEntry(entry);
    if (!isLiz()) return total;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit) return total;
    if (entry.champion?.selected && entry.lizardChampionHornedOne && ["saurus_cold_one_riders","great_crested_cold_one_riders"].includes(unit.id)) total += 10;
    return total;
  };

  function bearerAllows(item, unit, context) {
    if (!item) return false;
    if (item.category === "magic_banner") {
      if (context !== "character") return false;
      return hasTag(unit, "bsb") || Boolean(state.draft?.optionSelections?.battle_standard) || hasTag(unit, "bsb");
    }
    if (item.lizardmenBearer === "slann" && !isSlann(unit)) return false;
    if (item.lizardmenBearer === "skink" && !isSkinkBearer(unit)) return false;
    if (item.lizardmenBearer === "skink_on_foot" && (!isSkinkBearer(unit) || Boolean(state.draft?.mount) || hasTag(unit, "cavalry") || hasTag(unit, "terradon_riders"))) return false;
    if (!isWizard(unit) && ["arcane_item","familiar"].includes(item.category)) return false;
    if (isWizard(unit) && item.category === "magic_armour") return false;
    if (hasTag(unit, "mummified_slann") && ["magic_weapon","magic_armour"].includes(item.category)) return false;
    return true;
  }

  const oldGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    if (!isLiz()) return oldGetAllowedMagicItems(unit, context);
    const settings = context === "champion" ? unit.champion?.magicItems : unit.magicItems;
    if (!settings) return [];
    let categories = [...(settings.allowedCategories || ["magic_weapon","magic_armour","enchanted_item","arcane_item","familiar"])];
    if (context === "character" && (hasTag(unit, "bsb") || state.draft?.optionSelections?.battle_standard)) categories.push("magic_banner");
    const items = [...(state.data.commonMagicItems || []), ...(state.data.factionMagicItems || [])];
    return items.filter(item => categories.includes(item.category) && bearerAllows(item, unit, context));
  };

  function bannerAllowed(item, unit) {
    if (!item || item.category !== "magic_banner") return true;
    if (item.id === "skavenpelt_banner") return isSkinkBearer(unit);
    return true;
  }

  const oldRenderMagicBannerEditor = renderMagicBannerEditor;
  renderMagicBannerEditor = function(entry, unit) {
    if (!isLiz()) return oldRenderMagicBannerEditor(entry, unit);
    const original = state.data.factionMagicItems;
    state.data.factionMagicItems = (original || []).filter(item => bannerAllowed(item, unit));
    try { return oldRenderMagicBannerEditor(entry, unit); }
    finally { state.data.factionMagicItems = original; }
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = oldRenderRegimentEditor(entry, unit);
    if (!isLiz()) return html;
    if (unit.id === "skink_warriors") {
      const max = Math.floor(Number(entry.size || 0) / 8);
      html += `<section class="editor-section"><h3 class="editor-section-title">Skink / Kroxigor Formation</h3><div class="field-hint">At this size the regiment may contain up to ${max} Kroxigor${max === 1 ? "" : "s"}. Poisoned missiles require skirmish formation; embedded Kroxigors require rank-and-file, so the two options cannot be combined.</div></section>`;
    }
    if (entry.champion?.selected && ["saurus_cold_one_riders","great_crested_cold_one_riders"].includes(unit.id)) {
      html += `<section class="editor-section"><h3 class="editor-section-title">Champion Mount</h3><label class="check-row"><input type="checkbox" data-liz-champion-horned ${entry.lizardChampionHornedOne ? "checked" : ""}><span class="check-row-content"><span class="check-row-title"><span>Exchange Champion's Cold One for Horned One</span><span>+10 pts</span></span></span></label></section>`;
    }
    return html;
  };

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isLiz() || !state.draft) return;
    els.dialogContent.querySelector("[data-liz-champion-horned]")?.addEventListener("change", event => {
      state.draft.lizardChampionHornedOne = event.target.checked;
      updateDialogTotal();
    });
  };

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isLiz() && state.draft) {
      const entry = state.draft;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (unit?.id === "skink_warriors") {
        const kroxigors = Number(entry.optionSelections?.kroxigors || 0);
        const max = Math.floor(Number(entry.size || 0) / 8);
        if (kroxigors > max) { alert(`This regiment may include at most ${max} Kroxigor${max === 1 ? "" : "s"} at its current Skink size.`); return; }
        if (kroxigors > 0 && entry.optionSelections?.poison_missiles) { alert("Poisoned Skink missile weapons require skirmish formation, while embedded Kroxigors require rank-and-file formation. Choose one or the other."); return; }
      }
      if (!entry.champion?.selected) entry.lizardChampionHornedOne = false;
      if (entry.optionSelections?.battle_standard && otherBsbExists(entry.id)) { alert("A Lizardmen army may include only one Battle Standard Bearer."); return; }
      if (hasTag(unit, "bsb") && otherBsbExists(entry.id)) { alert("A Lizardmen army may include only one Battle Standard Bearer."); return; }
    }
    return oldSaveEditor();
  };

  const oldDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text = oldDescribeEntry(entry);
    if (!isLiz()) return text;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const bits = [];
    if (unit?.id === "skink_warriors" && Number(entry.optionSelections?.kroxigors || 0)) bits.push(`${entry.optionSelections.kroxigors} embedded Kroxigor${Number(entry.optionSelections.kroxigors) === 1 ? "" : "s"}`);
    if (entry.champion?.selected && entry.lizardChampionHornedOne) bits.push("Champion on Horned One");
    if (entry.optionSelections?.battle_standard) bits.push("Battle Standard Bearer");
    return bits.length ? `${text === "Base configuration" ? "" : text + " · "}${bits.join(" · ")}` : text;
  };

  const oldPrintedSave = calculatePrintedArmourSave;
  calculatePrintedArmourSave = function(entry, unit) {
    if (!isLiz()) return oldPrintedSave(entry, unit);
    if (unit.id === "oxayotl") return "5+";
    if (unit.id === "mazdamundi") return "4+";
    const t = tags(unit);
    let save = null;
    if (t.includes("kroxigor") || t.includes("salamander") || t.includes("stegadon")) save = 4;
    else if (t.includes("saurus")) save = 5;
    else if (t.includes("skink")) save = 6;
    if (save == null) return oldPrintedSave(entry, unit);
    const equipment = new Set(getSelectedEquipmentIds(entry, unit));
    if (equipment.has("light_armour")) save -= 1;
    if (equipment.has("shield") || entry.optionSelections?.shield || entry.optionSelections?.shields) save -= 1;
    const mounted = Boolean(entry.mount) || Boolean(unit.unitMount?.mountId) || t.includes("cavalry");
    if (mounted) save -= 1;
    const coldMount = ["cold_one","horned_one"].includes(entry.mount) || unit.unitMount?.mountId === "cold_one";
    if (coldMount) save -= 1;
    return `${Math.max(2, save)}+`;
  };

  function extraProfileRow(label, profileId, notes="") {
    const profile = profileById.get(profileId);
    if (!profile) return "";
    return `<tr class="sub-profile-row"><td class="unit-cell">↳ ${escapeHtml(label)}</td>${rosterPadProfileCells(profile)}<td class="save">–</td><td class="notes-cell">${escapeHtml(notes)}</td><td class="points-cell"></td></tr>`;
  }

  const oldRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    let html = oldRosterPadRow(entry);
    if (!isLiz()) return html;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const rows = [];
    if (unit?.id === "skink_warriors" && Number(entry.optionSelections?.kroxigors || 0)) rows.push(extraProfileRow(`${entry.optionSelections.kroxigors} Kroxigor${Number(entry.optionSelections.kroxigors) === 1 ? "" : "s"}`, "kroxigor", "Embedded in Skink regiment"));
    if (unit?.id === "stegadon") {
      const count = 4 + (entry.optionSelections?.extra_five_crew ? 5 : 0);
      rows.push(extraProfileRow(`${count} Skink Crew`, "skink_warrior", entry.optionSelections?.extra_five_crew ? "Two-tier howdah" : "Howdah crew"));
    }
    if (unit?.id === "salamander") rows.push(extraProfileRow("4 Skink Handlers", "skink_warrior", "Prodders give +1S"));
    if (entry.champion?.selected && entry.lizardChampionHornedOne) rows.push(extraProfileRow("Champion's Horned One", "horned_one", "Fear; Stupidity; +1 rider armour"));
    if (rows.length) html = html.replace("</tr>", `</tr>${rows.join("")}`);
    return html;
  };

  const oldRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    oldRenderArmyStatus(total);
    if (!isLiz()) return;
    const warnings = [];
    const bsbs = state.roster.filter(isBsbEntry);
    if (bsbs.length > 1) warnings.push("Only one Battle Standard Bearer may be included in a Lizardmen army.");
    for (const entry of state.roster.filter(e => e.unitId === "skink_warriors")) {
      const max = Math.floor(Number(entry.size || 0) / 8), krox = Number(entry.optionSelections?.kroxigors || 0);
      if (krox > max) warnings.push(`A Skink Warrior regiment has ${krox} Kroxigors but may include only ${max} at its current size.`);
      if (krox && entry.optionSelections?.poison_missiles) warnings.push("A Skink Warrior regiment cannot combine poisoned missile weapons with embedded Kroxigors.");
    }
    if (warnings.length) els.armyStatus.insertAdjacentHTML("beforeend", `<div class="warning-box">${warnings.map(escapeHtml).join("<br>")}</div>`);
  };
})();
