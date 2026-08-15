// Dark Elf faction behaviour: Assassins, Beastmasters, item restrictions and special saves.
(() => {
  const ARMY_ID = "dark_elves";
  const isDE = () => state.data?.faction?.id === ARMY_ID && state.selectedArmyId === ARMY_ID;
  const tags = unit => unit?.tags || [];

  function isZeroOne(unit) {
    return Number(unit?.selection?.maximum || 0) === 1 || tags(unit).includes("zero_one");
  }

  function eligibleAssassinTargets(ignoreEntryId = null) {
    return state.roster.filter(entry => {
      if (entry.id === ignoreEntryId || entry.sectionKey !== "regiments") return false;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      return tags(unit).includes("assassin_hideable") && !tags(unit).includes("cavalry");
    });
  }

  function assassinTargetUsed(targetId, ignoreId = null) {
    return state.roster.some(entry => entry.id !== ignoreId && entry.unitId === "assassin" && entry.hiddenInRegimentId === targetId);
  }

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (!isDE()) return entry;
    if (unit.id === "assassin") entry.hiddenInRegimentId = null;
    if (unit.id === "beastmaster_pack") {
      entry.optionSelections = entry.optionSelections || {};
      entry.optionSelections.hound_type = "chaos_hounds";
      entry.optionSelections.hounds = 3;
      entry.optionSelections.beastmasters = 1;
    }
    if (unit.defaultMount && (unit.mountOptions || []).some(m => m.mountId === unit.defaultMount)) entry.mount = unit.defaultMount;
    return entry;
  };

  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isDE()) return oldAddUnit(sectionKey, unitId);
    const unit = getUnit(sectionKey, unitId);
    if (!unit) return;
    if (isZeroOne(unit) && state.roster.some(entry => entry.unitId === unitId)) {
      alert(`${unit.name} may only be included once.`);
      return;
    }
    return oldAddUnit(sectionKey, unitId);
  };

  const oldCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = oldCalculateEntry(entry);
    if (!isDE()) return total;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit) return total;

    if (unit.id === "beastmaster_pack") {
      const hounds = Math.max(0, Number(entry.optionSelections?.hounds || 0));
      const masters = Math.max(0, Number(entry.optionSelections?.beastmasters || 0));
      const houndCost = entry.optionSelections?.hound_type === "warhounds" ? 4 : 12;
      return hounds * houndCost + masters * 14;
    }

    if (unit.id === "repeating_bolt_thrower" && entry.optionSelections?.crew_light_armour) {
      total += 2 + Number(entry.optionSelections?.extra_crew || 0);
    }
    return total;
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isDE() || unit.id !== "beastmaster_pack") return oldRenderRegimentEditor(entry, unit);
    const type = entry.optionSelections?.hound_type || "chaos_hounds";
    const hounds = Number(entry.optionSelections?.hounds || 0);
    const masters = Number(entry.optionSelections?.beastmasters || 0);
    return `
      <section class="editor-section">
        <h3 class="editor-section-title">Beastmaster Pack</h3>
        <div class="field-hint">One pack per army. Chaos Hounds and Warhounds cannot be mixed.</div>
        <div class="dialog-field"><label>Hound type</label><select data-de-hound-type>
          <option value="chaos_hounds" ${type === "chaos_hounds" ? "selected" : ""}>Chaos Hounds — 12 pts each</option>
          <option value="warhounds" ${type === "warhounds" ? "selected" : ""}>Warhounds — 4 pts each</option>
        </select></div>
        <div class="dialog-field"><label>Hounds</label><input data-de-hound-count type="number" min="1" step="1" value="${hounds}"></div>
        <div class="dialog-field"><label>Dark Elf Beastmasters</label><input data-de-beastmaster-count type="number" min="1" step="1" value="${masters}"><div class="field-hint">14 pts each.</div></div>
      </section>
      <section class="editor-section"><h3 class="editor-section-title">Profiles</h3>
        <div class="field-hint">${type === "warhounds" ? "Warhounds are Fast Cavalry." : "Chaos Hounds"} and Dark Elf Beastmasters use their separate profiles on the Roster Pad.</div>
      </section>`;
  };

  const oldRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    let html = oldRenderCharacterEditor(entry, unit);
    if (!isDE() || unit.id !== "assassin") return html;
    const targets = eligibleAssassinTargets(entry.id);
    html += `<section class="editor-section">
      <h3 class="editor-section-title">Hidden Assassin</h3>
      <div class="field-hint">Choose the rank-and-file Dark Elf infantry regiment in which this Assassin begins the battle. Only one Assassin may hide in each regiment.</div>
      <div class="dialog-field"><label>Hide in regiment</label><select data-de-assassin-target>
        <option value="">Choose regiment</option>
        ${targets.map(target => {
          const targetUnit = getUnit(target.sectionKey, target.unitId);
          const disabled = assassinTargetUsed(target.id, entry.id) && entry.hiddenInRegimentId !== target.id;
          return `<option value="${escapeHtml(target.id)}" ${entry.hiddenInRegimentId === target.id ? "selected" : ""} ${disabled ? "disabled" : ""}>${escapeHtml(targetUnit?.name || "Regiment")}</option>`;
        }).join("")}
      </select></div>
    </section>`;
    return html;
  };

  function bearerCanTake(unit, needle) {
    const direct = new Set(unit.equipment || []);
    if (direct.has(needle)) return true;
    return (unit.equipmentOptions || []).some(group => (group.choices || []).some(choice => (typeof choice === "string" ? choice : choice.id) === needle));
  }

  const oldGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let items = oldGetAllowedMagicItems(unit, context);
    if (!isDE()) return items;
    const bsb = tags(unit).includes("battle_standard_bearer");
    return items.filter(item => {
      if (item.id === "banner_nagarythe") return bsb;
      if (item.category === "magic_banner") return bsb;
      if (item.id === "lifetaker") return bearerCanTake(unit, "repeating_crossbow");
      if (item.id === "heartrender") return bearerCanTake(unit, "lance");
      return true;
    });
  };

  function factionBannerAllowed(item, unit) {
    if (!item || item.category !== "magic_banner") return true;
    if (item.id === "banner_nagarythe") return false;
    if (item.id === "expert_rider_banner") return unit.id === "dark_riders";
    if (item.id === "blood_banner") return unit.id === "cold_one_riders";
    return true;
  }

  const oldRenderMagicBannerEditor = renderMagicBannerEditor;
  renderMagicBannerEditor = function(entry, unit) {
    if (!isDE()) return oldRenderMagicBannerEditor(entry, unit);
    const original = state.data.factionMagicItems;
    state.data.factionMagicItems = (original || []).filter(item => factionBannerAllowed(item, unit));
    try { return oldRenderMagicBannerEditor(entry, unit); }
    finally { state.data.factionMagicItems = original; }
  };

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isDE() || !state.draft) return;
    const entry = state.draft;

    els.dialogContent.querySelector("[data-de-assassin-target]")?.addEventListener("change", event => {
      entry.hiddenInRegimentId = event.target.value || null;
      updateDialogTotal();
    });
    els.dialogContent.querySelector("[data-de-hound-type]")?.addEventListener("change", event => {
      entry.optionSelections.hound_type = event.target.value;
      renderEditor();
    });
    els.dialogContent.querySelector("[data-de-hound-count]")?.addEventListener("input", event => {
      entry.optionSelections.hounds = Math.max(1, Number(event.target.value || 1));
      updateDialogTotal();
    });
    els.dialogContent.querySelector("[data-de-beastmaster-count]")?.addEventListener("input", event => {
      entry.optionSelections.beastmasters = Math.max(1, Number(event.target.value || 1));
      updateDialogTotal();
    });
  };

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isDE() && state.draft) {
      const entry = state.draft;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (unit?.id === "assassin") {
        if (!entry.hiddenInRegimentId) { alert("Choose the regiment in which the Assassin is hiding."); return; }
        if (assassinTargetUsed(entry.hiddenInRegimentId, entry.id)) { alert("Only one Assassin may hide in each regiment."); return; }
      }
      if (unit?.id === "beastmaster_pack") {
        if (Number(entry.optionSelections?.hounds || 0) < 1 || Number(entry.optionSelections?.beastmasters || 0) < 1) {
          alert("A Beastmaster Pack must contain at least one hound and one Dark Elf Beastmaster."); return;
        }
      }
      if (unit?.id === "cold_one_chariot") {
        const extraCrew = Number(entry.optionSelections?.extra_crew || 0);
        const commander = entry.optionSelections?.elven_commander ? 1 : 0;
        if (extraCrew + commander > 2) { alert("The Cold One Chariot may have at most two additional crew, including an Elven Commander."); return; }
      }
    }
    return oldSaveEditor();
  };

  const oldDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text = oldDescribeEntry(entry);
    if (!isDE()) return text;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const bits = [];
    if (unit?.id === "assassin" && entry.hiddenInRegimentId) {
      const target = state.roster.find(x => x.id === entry.hiddenInRegimentId);
      const targetUnit = target && getUnit(target.sectionKey, target.unitId);
      if (targetUnit) bits.push(`Hidden in ${targetUnit.name}`);
    }
    if (unit?.id === "beastmaster_pack") {
      const houndName = entry.optionSelections?.hound_type === "warhounds" ? "Warhounds" : "Chaos Hounds";
      bits.push(`${entry.optionSelections?.hounds || 0} ${houndName}`);
      bits.push(`${entry.optionSelections?.beastmasters || 0} Beastmaster${Number(entry.optionSelections?.beastmasters || 0) === 1 ? "" : "s"}`);
    }
    return bits.length ? `${text === "Base configuration" ? "" : text + " · "}${bits.join(" · ")}` : text;
  };

  // Roster Pad additions for mixed Beastmaster packs and optional chariot commander.
  const oldRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    let html = oldRosterPadRow(entry);
    if (!isDE()) return html;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (unit?.id === "beastmaster_pack") {
      const houndProfile = profileById.get(entry.optionSelections?.hound_type === "warhounds" ? "warhound" : "chaos_hound");
      const masterProfile = profileById.get("beastmaster");
      const rows = [
        houndProfile ? `<tr class="sub-profile-row"><td>${escapeHtml(entry.optionSelections?.hound_type === "warhounds" ? "Warhounds" : "Chaos Hounds")}</td>${rosterPadProfileCells(houndProfile)}</tr>` : "",
        masterProfile ? `<tr class="sub-profile-row"><td>Dark Elf Beastmasters</td>${rosterPadProfileCells(masterProfile)}</tr>` : ""
      ].join("");
      html = html.replace("</tr>", `</tr>${rows}`);
    }
    if (unit?.id === "cold_one_chariot" && entry.optionSelections?.elven_commander) {
      const commander = profileById.get("elven_commander");
      if (commander) html = html.replace("</tr>", `</tr><tr class="sub-profile-row"><td>Elven Commander</td>${rosterPadProfileCells(commander)}</tr>`);
    }
    return html;
  };
})();
