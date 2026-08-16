// Kislev-specific construction, editor, magic-item and Roster Pad behaviour.
(() => {
  const ARMY_ID = "kislev";
  const isKislev = () => state.selectedArmyId === ARMY_ID && state.data?.faction?.id === ARMY_ID;
  const hasTag = (unit, tag) => (unit?.tags || []).includes(tag);
  const specialTriad = new Set(["tzarina_katarin", "boris_ursus", "igor_terrible"]);
  const forcedItems = {
    tzarina_katarin: "fearfrost",
    boris_ursus: "shard_blade",
    tzar_saltan: "black_blade",
    ilja_murova: "wyrmslayer_sword",
    igor_terrible: "bloodedge"
  };

  // A few named characters have a steed included in their listed points and may
  // swap it for another mount. Expose the included steed as a free editor option
  // so editing the character cannot accidentally drop the compulsory base mount.
  function ensureIncludedSpecialMounts() {
    if (!isKislev()) return;
    for (const unit of state.data.faction.specialCharacters || []) {
      if (!unit.mount || !(unit.mountOptions || []).length) continue;
      if (!unit.mountOptions.some(option => option.mountId === unit.mount)) {
        unit.mountOptions.unshift({ mountId: unit.mount, cost: 0, includedMount: true });
      }
    }
  }

  const oldSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await oldSelectArmy(armyId);
    if (!isKislev()) return;
    ensureIncludedSpecialMounts();
    renderUnitBrowser();
    renderArmy();
  };

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (!isKislev()) return entry;
    if (sectionKey === "specialCharacters" && unit?.mount) entry.mount = unit.mount;
    if (unit?.id === "beasts_beastmasters") {
      entry.optionSelections = entry.optionSelections || {};
      entry.optionSelections.beastmasters = 1;
      entry.optionSelections.beastType = "bears";
      entry.optionSelections.beasts = 3;
    }
    return entry;
  };

  function maxOne(unit) {
    return Number(unit?.selection?.maximum || 0) === 1 || hasTag(unit, "zero_one");
  }

  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isKislev()) return oldAddUnit(sectionKey, unitId);
    const unit = getUnit(sectionKey, unitId);
    if (!unit) return;
    if (maxOne(unit) && state.roster.some(e => e.unitId === unitId)) {
      alert(`${unit.name} may only be included once.`);
      return;
    }
    if (specialTriad.has(unitId) && state.roster.some(e => specialTriad.has(e.unitId))) {
      alert("Tzarina Katarin, Boris Ursus and Igor the Terrible may not be fielded together.");
      return;
    }
    if (unitId === "prince_radinov" && !state.roster.some(e => e.unitId === "gryphon_legion")) {
      alert("Prince Ivan Radinov may only be fielded if the army includes Gryphon Legion.");
      return;
    }
    return oldAddUnit(sectionKey, unitId);
  };

  const oldCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = oldCalculateEntry(entry);
    if (!isKislev()) return total;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit) return total;
    if (unit.id === "beasts_beastmasters") {
      const masters = Math.max(1, Number(entry.optionSelections?.beastmasters || 1));
      const beasts = Math.max(1, Number(entry.optionSelections?.beasts || 1));
      const beastCost = entry.optionSelections?.beastType === "wolves" ? 10 : 15;
      return masters * 12 + beasts * beastCost;
    }
    return total;
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isKislev() || unit.id !== "beasts_beastmasters") return oldRenderRegimentEditor(entry, unit);
    const type = entry.optionSelections?.beastType || "bears";
    return `<section class="editor-section"><h3 class="editor-section-title">Beasts and Beastmasters</h3>
      <div class="dialog-note">0–1 regiment. Choose Bears or Giant Wolves, led by unarmoured Beastmasters. No musician, standard bearer or champion.</div>
      <div class="dialog-field"><label>Beastmasters (12 pts each)</label><input type="number" min="1" step="1" value="${Number(entry.optionSelections?.beastmasters || 1)}" data-kislev-beastmasters></div>
      <div class="dialog-field"><label>Beast type</label><select data-kislev-beast-type><option value="bears" ${type === "bears" ? "selected" : ""}>Bears (15 pts each)</option><option value="wolves" ${type === "wolves" ? "selected" : ""}>Giant Wolves (10 pts each)</option></select></div>
      <div class="dialog-field"><label>Beasts</label><input type="number" min="1" step="1" value="${Number(entry.optionSelections?.beasts || 3)}" data-kislev-beasts></div>
    </section>`;
  };

  const oldWire = wireEditorControls;
  wireEditorControls = function() {
    oldWire();
    if (!isKislev() || !state.draft) return;
    const set = (key, value) => { state.draft.optionSelections = state.draft.optionSelections || {}; state.draft.optionSelections[key] = value; updateDialogTotal(); };
    els.dialogContent.querySelector("[data-kislev-beastmasters]")?.addEventListener("input", e => set("beastmasters", Math.max(1, Number(e.target.value || 1))));
    els.dialogContent.querySelector("[data-kislev-beasts]")?.addEventListener("input", e => set("beasts", Math.max(1, Number(e.target.value || 1))));
    els.dialogContent.querySelector("[data-kislev-beast-type]")?.addEventListener("change", e => set("beastType", e.target.value));
  };

  const oldAllowedMagic = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let items = oldAllowedMagic(unit, context);
    if (!isKislev()) return items;
    if (!hasTag(unit, "ice_witch") && unit.id !== "miska" && unit.id !== "baba_yaga") items = items.filter(i => i.id !== "ice_armour");
    const ownForced = forcedItems[unit.id];
    if (ownForced) items = items.filter(i => i.id !== ownForced);
    const carried = new Set(state.roster.map(e => forcedItems[e.unitId]).filter(Boolean));
    items = items.filter(i => !carried.has(i.id));
    return items;
  };

  const oldStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    oldStatus(total);
    if (!isKislev()) return;
    const warnings = [];
    if (state.roster.some(e => e.unitId === "prince_radinov") && !state.roster.some(e => e.unitId === "gryphon_legion")) warnings.push("Prince Ivan Radinov requires a Gryphon Legion regiment.");
    if (state.roster.filter(e => specialTriad.has(e.unitId)).length > 1) warnings.push("Katarin, Boris and Igor cannot be fielded together.");
    if (warnings.length) els.armyStatus.insertAdjacentHTML("beforeend", `<div class="warning-box" style="margin-top:10px"><strong>Kislev restrictions</strong><div style="margin-top:6px">${warnings.map(escapeHtml).join("<br>")}</div></div>`);
  };

  function profileRow(label, profileId, notes = "") {
    const p = profileById.get(profileId);
    if (!p) return "";
    return `<tr class="sub-profile-row"><td class="unit-cell">↳ ${escapeHtml(label)}</td>${rosterPadProfileCells(p)}<td class="save">–</td><td class="notes-cell">${escapeHtml(notes)}</td><td class="points-cell"></td></tr>`;
  }

  const oldPad = rosterPadRow;
  rosterPadRow = function(entry) {
    let html = oldPad(entry);
    if (!isKislev()) return html;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const rows = [];
    if (unit?.id === "beasts_beastmasters") {
      const beasts = Math.max(1, Number(entry.optionSelections?.beasts || 1));
      const wolves = entry.optionSelections?.beastType === "wolves";
      rows.push(profileRow(`${beasts} ${wolves ? "Giant Wolf" : "Bear"}${beasts === 1 ? "" : wolves ? "ves" : "s"}`, wolves ? "giant_wolf" : "bear", "Beasts and Beastmasters"));
    }
    if (unit?.crew?.profileId) rows.push(profileRow(`${Number(unit.crew.base || 0) + Number(entry.optionSelections?.extra_crew || 0)} Crew`, unit.crew.profileId, unit.name));
    return rows.length ? html.replace("</tr>", `</tr>${rows.join("")}`) : html;
  };
})();
