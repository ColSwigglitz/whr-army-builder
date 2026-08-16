// Normalise swarm unit sizing across all WHR army books.
// All swarms are multi-model units with a minimum size of 3 models.
(() => {
  const SWARM_MINIMUM = 3;
  const SECTIONS = ["regiments", "warMachines"];

  function isSwarm(unit) {
    if (!unit) return false;
    const tags = unit.tags || [];
    return tags.includes("swarm") || /swarm/i.test(`${unit.id || ""} ${unit.name || ""}`);
  }

  function normaliseSwarm(unit) {
    if (!isSwarm(unit)) return false;

    unit.tags = Array.from(new Set([...(unit.tags || []), "swarm"]));
    unit.points = { ...(unit.points || {}), type: "per_model" };
    unit.size = { ...(unit.size || {}), minimum: SWARM_MINIMUM };
    return true;
  }

  function normaliseCurrentArmy() {
    if (!state.data?.faction) return false;
    let changed = false;

    for (const section of SECTIONS) {
      for (const unit of state.data.faction[section] || []) {
        changed = normaliseSwarm(unit) || changed;
      }
    }

    return changed;
  }

  // Patch every army after all faction-specific loaders have finished.
  const oldSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    const result = await oldSelectArmy(armyId);
    if (normaliseCurrentArmy()) {
      buildIndexes();
      renderUnitBrowser();
      renderArmy();
    }
    return result;
  };

  // Swarms do not use the normal 50-point regiment minimum when choosing
  // their starting size; they always begin at their rules minimum of 3.
  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isSwarm(unit)) entry.size = Math.max(SWARM_MINIMUM, Number(unit.size?.minimum || 0));
    return entry;
  };

  // Several swarm choices live in War Machines / Monsters rather than the
  // Regiments section. The generic war-machine editor does not normally show
  // a model-count field, so add one specifically for swarms.
  const oldRenderWarMachineEditor = renderWarMachineEditor;
  renderWarMachineEditor = function(entry, unit) {
    let html = oldRenderWarMachineEditor(entry, unit);
    if (!isSwarm(unit)) return html;

    const sizeEditor = `
      <section class="editor-section">
        <h3 class="editor-section-title">Unit Size</h3>
        <div class="dialog-field">
          <label for="edit-size">Number of models</label>
          <input id="edit-size" type="number" min="${SWARM_MINIMUM}" step="1"
            value="${Math.max(SWARM_MINIMUM, Number(entry.size || SWARM_MINIMUM))}" data-field="size">
          <div class="field-hint">
            Base cost: ${formatPoints(unit.points?.value || 0)} pts per model. Swarms must contain at least ${SWARM_MINIMUM} models.
          </div>
        </div>
      </section>
    `;

    return sizeEditor + html;
  };

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (isSwarm(unit)) {
        const size = Number(state.draft.size || 0);
        if (!Number.isInteger(size) || size < SWARM_MINIMUM) {
          alert(`Swarms must contain at least ${SWARM_MINIMUM} models.`);
          return;
        }
      }
    }
    return oldSaveEditor();
  };
})();
