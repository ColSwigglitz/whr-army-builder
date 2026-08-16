// Vampire Counts selectable regimental champions and Vampire Thrall bloodline support.
(() => {
  const ARMY_ID = "vampire_counts";
  const isVC = () => state.data?.faction?.id === ARMY_ID;
  const selectedBloodline = () => state.armyOptions?.bloodline || null;

  const CHAMPION_CHOICES = {
    zombies: [
      { id:"wight", name:"Wight Champion", profileId:"wight_champion", cost:25, magicItems:{maximum:1,allowedPools:["common","undead"]} },
      { id:"vampire_thrall", name:"Vampire Thrall", profileId:"vampire_thrall", cost:60, vampire:true },
      { id:"wraith", name:"Wraith Champion", profileId:"wraith_champion", cost:50, magicItems:{maximum:1,allowedPools:["common","undead"]} }
    ],
    skeleton_warriors: [
      { id:"wight", name:"Wight Champion", profileId:"wight_champion", cost:35, magicItems:{maximum:1,allowedPools:["common","undead"]} },
      { id:"vampire_thrall", name:"Vampire Thrall", profileId:"vampire_thrall", cost:70, vampire:true },
      { id:"wraith", name:"Wraith Champion", profileId:"wraith_champion", cost:60, magicItems:{maximum:1,allowedPools:["common","undead"]} }
    ],
    skeleton_horsemen: [
      { id:"wight", name:"Wight Champion", profileId:"wight_champion", cost:50, magicItems:{maximum:1,allowedPools:["common","undead"]} },
      { id:"vampire_thrall", name:"Mounted Vampire Thrall", profileId:"vampire_thrall", cost:80, vampire:true, mounted:true },
      { id:"wraith", name:"Mounted Wraith Champion", profileId:"wraith_champion", cost:70, magicItems:{maximum:1,allowedPools:["common","undead"]}, mounted:true }
    ],
    wight_guardsmen: [
      { id:"wight", name:"Wight Champion", profileId:"wight_champion", cost:35, magicItems:{maximum:1,allowedPools:["common","undead"]} },
      { id:"vampire_thrall", name:"Vampire Thrall", profileId:"vampire_thrall", cost:70, vampire:true },
      { id:"wraith", name:"Wraith Champion", profileId:"wraith_champion", cost:60, magicItems:{maximum:1,allowedPools:["common","undead"]} }
    ],
    wight_knights: [
      { id:"wight", name:"Wight Champion", profileId:"wight_champion", cost:50, magicItems:{maximum:1,allowedPools:["common","undead"]} },
      { id:"vampire_thrall", name:"Mounted Vampire Thrall", profileId:"vampire_thrall", cost:80, vampire:true, mounted:true },
      { id:"wraith", name:"Mounted Wraith Champion", profileId:"wraith_champion", cost:70, magicItems:{maximum:1,allowedPools:["common","undead"]}, mounted:true }
    ]
  };

  function choicesFor(unit) {
    return isVC() ? (CHAMPION_CHOICES[unit?.id] || null) : null;
  }

  function selectedChoice(entry, unit) {
    const choices = choicesFor(unit);
    if (!choices) return null;
    const id = entry?.champion?.choiceId || choices[0].id;
    return choices.find(choice => choice.id === id) || choices[0];
  }

  function championDefinition(entry, unit) {
    const choice = selectedChoice(entry, unit);
    if (!choice) return unit.champion;
    const magicItems = choice.vampire
      ? { maximum:1, allowedPools:["common","undead"], allowedCategories:["magic_weapon","magic_armour","enchanted_item","arcane_item","familiar"] }
      : choice.magicItems;
    return {
      name: choice.name,
      profileId: choice.profileId,
      cost: { base: choice.cost },
      magicItems,
      vampire: Boolean(choice.vampire),
      mounted: Boolean(choice.mounted)
    };
  }

  function unitWithChampion(entry, unit) {
    if (!choicesFor(unit)) return unit;
    const view = clone(unit);
    view.champion = championDefinition(entry, unit);
    return view;
  }

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isVC() && choicesFor(unit)) {
      entry.champion.choiceId = choicesFor(unit)[0].id;
      entry.champion.bloodlinePowers = [];
    }
    return entry;
  };

  const oldCalculateChampionCost = calculateChampionCost;
  calculateChampionCost = function(entry, unit) {
    if (!isVC() || !choicesFor(unit)) return oldCalculateChampionCost(entry, unit);
    if (!entry.champion?.selected) return 0;
    const choice = selectedChoice(entry, unit);
    let total = Number(choice?.cost || 0);
    total += (entry.champion.magicItems || []).reduce((sum, id) => sum + Number(getMagicItem(id)?.cost || 0), 0);
    const powers = state.data?.faction?.systems?.bloodline?.powers?.[selectedBloodline()] || [];
    for (const id of entry.champion.bloodlinePowers || []) {
      total += Number(powers.find(power => power.id === id)?.cost || 0);
    }
    return total;
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    const choices = choicesFor(unit);
    if (!choices) return oldRenderRegimentEditor(entry, unit);
    const view = unitWithChampion(entry, unit);
    let html = oldRenderRegimentEditor(entry, view);
    if (!entry.champion?.selected) return html;

    const selector = `
      <section class="editor-section">
        <h3 class="editor-section-title">Champion Type</h3>
        <div class="dialog-field">
          <label for="edit-vc-champion-type">Regimental champion</label>
          <select id="edit-vc-champion-type" data-vc-champion-type>
            ${choices.map(choice => `<option value="${escapeHtml(choice.id)}" ${selectedChoice(entry, unit)?.id === choice.id ? "selected" : ""}>${escapeHtml(choice.name)} (+${formatPoints(choice.cost)} pts)</option>`).join("")}
          </select>
        </div>
      </section>`;

    html = selector + html;

    const choice = selectedChoice(entry, unit);
    if (choice?.vampire && selectedBloodline() === "von_carstein") {
      const powers = state.data?.faction?.systems?.bloodline?.powers?.von_carstein || [];
      const chosen = entry.champion.bloodlinePowers || [];
      html += `
        <section class="editor-section">
          <h3 class="editor-section-title">Von Carstein Bloodline Power</h3>
          <div class="field-hint">A Vampire Thrall champion may use its single regimental-character upgrade slot for either one magic item or one Von Carstein bloodline power.</div>
          ${powers.map(power => `<label class="check-row"><input type="checkbox" data-vc-champion-power="${escapeHtml(power.id)}" ${chosen.includes(power.id) ? "checked" : ""}><span class="check-row-content"><span class="check-row-title"><span>${escapeHtml(power.name)}</span><span>${Number(power.cost || 0) ? `+${formatPoints(power.cost)} pts` : "Free"}</span></span><span class="check-row-sub">${escapeHtml(power.rules || "")}</span></span></label>`).join("")}
        </section>`;
    }
    return html;
  };

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isVC() || !state.draft) return;
    const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
    if (!choicesFor(unit)) return;

    els.dialogContent.querySelector("[data-vc-champion-type]")?.addEventListener("change", event => {
      state.draft.champion.choiceId = event.target.value;
      state.draft.champion.magicItems = [];
      state.draft.champion.bloodlinePowers = [];
      renderEditor();
    });

    els.dialogContent.querySelectorAll("[data-vc-champion-power]").forEach(box => {
      box.addEventListener("change", () => {
        const selected = Array.from(els.dialogContent.querySelectorAll("[data-vc-champion-power]:checked")).map(el => el.dataset.vcChampionPower);
        if (selected.length > 1) {
          box.checked = false;
          return;
        }
        if (selected.length && (state.draft.champion.magicItems || []).length) {
          state.draft.champion.magicItems = [];
        }
        state.draft.champion.bloodlinePowers = selected;
        renderEditor();
      });
    });
  };

  const oldGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    if (!isVC() || context !== "champion" || !choicesFor(unit)) return oldGetAllowedMagicItems(unit, context);
    const choice = selectedChoice(state.draft, unit);
    if (!choice?.vampire) return oldGetAllowedMagicItems(unitWithChampion(state.draft, unit), context);
    const pools = [...(state.data.commonMagicItems || []), ...(state.data.factionMagicItems || [])];
    return pools.filter(item => ["magic_weapon","magic_armour","enchanted_item","arcane_item","familiar"].includes(item.category));
  };

  const oldGetMagicMaximum = getMagicMaximum;
  getMagicMaximum = function(unit, context) {
    if (!isVC() || context !== "champion" || !choicesFor(unit)) return oldGetMagicMaximum(unit, context);
    const choice = selectedChoice(state.draft, unit);
    if (choice?.vampire && (state.draft?.champion?.bloodlinePowers || []).length) return 0;
    return 1;
  };

  const oldRosterPadChampionRow = rosterPadChampionRow;
  rosterPadChampionRow = function(entry, unit) {
    if (!isVC() || !choicesFor(unit)) return oldRosterPadChampionRow(entry, unit);
    return oldRosterPadChampionRow(entry, unitWithChampion(entry, unit));
  };

  const oldDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text = oldDescribeEntry(entry);
    if (!isVC()) return text;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!entry.champion?.selected || !choicesFor(unit)) return text;
    const choice = selectedChoice(entry, unit);
    const bits = [choice.name];
    const powers = state.data?.faction?.systems?.bloodline?.powers?.[selectedBloodline()] || [];
    for (const id of entry.champion.bloodlinePowers || []) {
      const power = powers.find(item => item.id === id);
      if (power) bits.push(power.name);
    }
    return `${text === "Base configuration" ? "" : text + " · "}${bits.join(" · ")}`;
  };
})();
