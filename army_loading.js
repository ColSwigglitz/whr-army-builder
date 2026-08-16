// Give immediate feedback while larger army books are fetched, inflated and indexed.
(() => {
  if (typeof selectArmy !== 'function') return;

  const overlay = document.createElement('div');
  overlay.className = 'army-loading-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('aria-busy', 'true');
  overlay.innerHTML = `
    <div class="army-loading-card">
      <div class="army-loading-mark" aria-hidden="true">WHR</div>
      <div class="army-loading-spinner" aria-hidden="true"></div>
      <h2 id="armyLoadingTitle">Loading army…</h2>
      <p>Preparing units, equipment, magic items and special rules.</p>
      <p class="army-loading-detail">Larger army books can take a moment.</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const title = overlay.querySelector('#armyLoadingTitle');
  const originalSelectArmy = selectArmy;
  let activeLoad = null;

  function armyName(armyId) {
    return state?.armyManifest?.armies?.find(a => a.id === armyId)?.name || 'army';
  }

  function showLoading(armyId) {
    title.textContent = `Loading ${armyName(armyId)}…`;
    overlay.hidden = false;
    document.body.classList.add('army-is-loading');
    document.querySelectorAll('[data-army-id]').forEach(card => {
      card.setAttribute('aria-disabled', 'true');
    });
  }

  function hideLoading() {
    overlay.hidden = true;
    document.body.classList.remove('army-is-loading');
    document.querySelectorAll('[data-army-id]').forEach(card => {
      card.removeAttribute('aria-disabled');
    });
  }

  function letOverlayPaint() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  selectArmy = async function(armyId) {
    if (activeLoad) return activeLoad;

    showLoading(armyId);
    activeLoad = (async () => {
      try {
        await letOverlayPaint();
        return await originalSelectArmy(armyId);
      } finally {
        hideLoading();
        activeLoad = null;
      }
    })();

    return activeLoad;
  };
})();

// Vampire Counts units with alternative regimental champions should show the
// champion type immediately. Previously the selector only appeared after the
// default Wight Champion checkbox was enabled, making the alternatives hidden.
(() => {
  const CHAMPION_CHOICES = {
    zombies: [["wight","Wight Champion",25],["vampire_thrall","Vampire Thrall",60],["wraith","Wraith Champion",50]],
    skeleton_warriors: [["wight","Wight Champion",35],["vampire_thrall","Vampire Thrall",70],["wraith","Wraith Champion",60]],
    skeleton_horsemen: [["wight","Wight Champion",50],["vampire_thrall","Mounted Vampire Thrall",80],["wraith","Mounted Wraith Champion",70]],
    wight_guardsmen: [["wight","Wight Champion",35],["vampire_thrall","Vampire Thrall",70],["wraith","Wraith Champion",60]],
    wight_knights: [["wight","Wight Champion",50],["vampire_thrall","Mounted Vampire Thrall",80],["wraith","Mounted Wraith Champion",70]]
  };

  const previousRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = previousRenderRegimentEditor(entry, unit);
    if (state.data?.faction?.id !== "vampire_counts" || entry.champion?.selected) return html;

    const choices = CHAMPION_CHOICES[unit?.id];
    if (!choices || String(html).includes("data-vc-champion-type")) return html;

    const selected = entry.champion?.choiceId || choices[0][0];
    const selector = `
      <section class="editor-section">
        <h3 class="editor-section-title">Champion Type</h3>
        <div class="dialog-field">
          <label for="edit-vc-champion-type">Regimental champion</label>
          <select id="edit-vc-champion-type" data-vc-champion-type>
            ${choices.map(([id, name, cost]) => `<option value="${escapeHtml(id)}" ${selected === id ? "selected" : ""}>${escapeHtml(name)} (+${formatPoints(cost)} pts)</option>`).join("")}
          </select>
          <div class="field-hint">Choose the champion type, then enable the champion below.</div>
        </div>
      </section>`;

    return selector + html;
  };
})();

// Tomb Kings Skeleton Light Chariots are regiment entries, so their crew and
// draught animals are not picked up by the generic war-machine/mount renderers.
(() => {
  const isSkeletonLightChariot = (entry, unit) =>
    state.data?.faction?.id === "tomb_kings" &&
    entry?.sectionKey === "regiments" &&
    unit?.id === "skeleton_light_chariots";

  const previousUnitMountRow = rosterPadUnitMountRow;
  rosterPadUnitMountRow = function(entry, unit) {
    let html = previousUnitMountRow(entry, unit);
    if (!isSkeletonLightChariot(entry, unit)) return html;

    html += previousUnitMountRow(entry, {
      ...unit,
      unitMount: {
        mountId: "undead_steed",
        name: "2 Undead Steeds per chariot",
        quantity: 2,
        equipment: []
      }
    });
    return html;
  };

  const previousCrewRow = rosterPadWarMachineCrewRow;
  rosterPadWarMachineCrewRow = function(entry, unit) {
    const html = previousCrewRow(entry, unit);
    if (!isSkeletonLightChariot(entry, unit)) return html;

    const profile = profileById.get("skeleton");
    if (!profile) return html;

    return html + `
      <tr class="crew-row">
        <td class="unit-cell crew-name">↳ 2 Skeleton Warrior crew per chariot</td>
        ${rosterPadProfileCells(profile)}
        <td class="save">5+</td>
        <td class="notes-cell crew-notes">${rosterPadNotesInline(["Light armour", "Spear", "Shield", "Bow", "Asp Arrows"])}</td>
        <td class="points-cell"></td>
      </tr>
    `;
  };
})();

// Final Dwarf 0-1 guard and army-book labels. This runs last so the displayed
// entries and duplicate checks use the final inflated Dwarf data.
(() => {
  const isDwarfArmy = () => state.data?.faction?.id === "dwarfs";

  function normalise(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function restrictedKey(unit) {
    const combined = `${normalise(unit?.id)} ${normalise(unit?.name)}`;
    if (/\blong\s*beards?\b/.test(combined) || /\blongbeards?\b/.test(combined)) return "longbeards";
    if (/\bhammerers?\b/.test(combined)) return "hammerers";
    if (/\biron\s*breakers?\b/.test(combined) || /\bironbreakers?\b/.test(combined)) return "ironbreakers";
    if (/\brangers?\b/.test(combined)) return "rangers";
    if (/\bminers?\b/.test(combined)) return "miners";
    if (/\bgoblin\s+hewer\b/.test(combined)) return "goblin_hewer";
    return null;
  }

  function markRestrictedUnits() {
    if (!isDwarfArmy()) return;
    for (const sectionKey of ["regiments", "warMachines"]) {
      for (const unit of state.data?.faction?.[sectionKey] || []) {
        if (!restrictedKey(unit)) continue;
        unit.rules = Array.isArray(unit.rules) ? unit.rules : [];
        if (!unit.rules.some(rule => /^0\s*-\s*1$/i.test(String(rule).trim()))) unit.rules.unshift("0-1");
        unit.maxUnits = 1;
      }
    }
  }

  function existingCopy(unit, ignoreEntryId = null) {
    const key = restrictedKey(unit);
    if (!key) return null;
    return state.roster.find(entry => {
      if (entry.id === ignoreEntryId) return false;
      const existing = getUnit(entry.sectionKey, entry.unitId);
      return restrictedKey(existing) === key;
    }) || null;
  }

  const previousAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    const unit = getUnit(sectionKey, unitId);
    if (isDwarfArmy() && restrictedKey(unit) && existingCopy(unit)) {
      window.alert(`${unit.name} is a 0-1 choice. Only one unit may be included in the army.`);
      return;
    }
    return previousAddUnit(sectionKey, unitId);
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isDwarfArmy() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (restrictedKey(unit) && existingCopy(unit, state.draft.id)) {
        window.alert(`${unit.name} is a 0-1 choice. Only one unit may be included in the army.`);
        return;
      }
    }
    return previousSaveEditor();
  };

  const previousRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    previousRenderUnitBrowser();
    if (!isDwarfArmy()) return;

    els.unitBrowser.querySelectorAll(".unit-choice").forEach(button => {
      const unit = getUnit(button.dataset.section, button.dataset.unitId);
      if (!restrictedKey(unit)) return;
      const meta = button.querySelector(".unit-choice-meta");
      if (meta) meta.textContent = "0-1 choice · Add now, configure in your roster";
      button.dataset.zeroOne = "true";
    });
  };

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!isDwarfArmy()) return;
    markRestrictedUnits();
    renderUnitBrowser();
    renderArmy();
  };
})();
