// Show the actual physical model count represented by each per-model regiment entry.
// A champion using add.type = "unit_model_cost" is an additional model, so it increases
// the displayed total by one. This also means that champion counts towards the unit's
// published minimum model count (for example 4 troopers + champion satisfies minimum 5).
(() => {
  function championIsExtraModel(entry, unit) {
    return Boolean(
      entry?.champion?.selected &&
      unit?.champion?.cost?.add?.type === "unit_model_cost"
    );
  }

  function totalModelsForEntry(entry, unit) {
    if (!entry || !unit || unit.points?.type !== "per_model") return null;

    const baseModels = Math.max(0, Number(entry.size || 0));
    const championExtra = championIsExtraModel(entry, unit);

    return {
      total: baseModels + (championExtra ? 1 : 0),
      base: baseModels,
      championIsExtraModel: championExtra
    };
  }

  function publishedMinimum(unit) {
    return Math.max(1, Number(unit?.size?.minimum || 1));
  }

  function minimumTroopersForEntry(entry, unit) {
    const minimum = publishedMinimum(unit);
    return Math.max(1, minimum - (championIsExtraModel(entry, unit) ? 1 : 0));
  }

  function decorateModelCounts() {
    if (!els.roster || !state.data) return;

    els.roster.querySelectorAll("[data-edit]").forEach(editButton => {
      const entry = state.roster.find(item => item.id === editButton.dataset.edit);
      if (!entry) return;

      const unit = getUnit(entry.sectionKey, entry.unitId);
      const count = totalModelsForEntry(entry, unit);
      if (!count) return;

      const card = editButton.closest(".roster-card");
      if (!card || card.querySelector(".unit-model-count")) return;

      const name = card.querySelector(".roster-card-name");
      if (!name) return;

      const badge = document.createElement("span");
      badge.className = "unit-model-count";
      badge.textContent = count.championIsExtraModel
        ? `${count.total} models (${count.base} + Champion)`
        : `${count.total} model${count.total === 1 ? "" : "s"}`;
      badge.title = count.championIsExtraModel
        ? `This unit contains ${count.base} regular models plus one additional champion model.`
        : `This unit contains ${count.total} model${count.total === 1 ? "" : "s"}.`;

      name.appendChild(badge);
    });
  }

  const style = document.createElement("style");
  style.textContent = `
    .unit-model-count {
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
      padding: 2px 7px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--surface-soft);
      color: var(--muted);
      font-size: 10px;
      font-weight: 800;
      line-height: 1.35;
      vertical-align: middle;
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);

  const previousRenderArmy = renderArmy;
  renderArmy = function() {
    previousRenderArmy();
    decorateModelCounts();
  };

  // The core regiment editor historically treated unit.size.minimum as a minimum
  // number of ordinary troopers. In WHR the champion is an additional physical model,
  // so it counts towards that published unit-size minimum. Adjust only the editor's
  // trooper input: the army-list data continues to retain the actual published minimum.
  const previousRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    const minimum = publishedMinimum(unit);
    const minimumTroopers = minimumTroopersForEntry(entry, unit);

    // If a champion has just been removed from a minimum-sized unit, restore enough
    // ordinary models to keep the regiment legal before rendering the editor.
    if (Number(entry.size || 0) < minimumTroopers) entry.size = minimumTroopers;

    let html = previousRenderRegimentEditor(entry, unit);
    html = html.replace(
      /(<input id="edit-size" type="number" min=")\d+(" step="1")/,
      `$1${minimumTroopers}$2`
    );
    html = html.replace(
      /Normal regiments must contain at least ([0-9]+) models and 50 points of models\./,
      `Minimum unit size is ${minimum} models in total; a selected Champion counts as one model. Normal regiments must also contain at least 50 points of models.`
    );
    return html;
  };

  const previousWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    previousWireEditorControls();

    const entry = state.draft;
    if (!entry || entry.sectionKey !== "regiments") return;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const sizeInput = els.dialogContent.querySelector('[data-field="size"]');
    if (!unit || !sizeInput) return;

    sizeInput.min = String(minimumTroopersForEntry(entry, unit));

    // Capture the size change before the legacy handler, which still clamps against
    // unit.size.minimum without accounting for an additional champion model.
    els.dialogContent.addEventListener("change", event => {
      const control = event.target.closest?.('[data-field="size"]');
      if (!control) return;

      const minimumTroopers = minimumTroopersForEntry(entry, unit);
      entry.size = Math.max(
        minimumTroopers,
        Math.floor(Number(control.value || minimumTroopers))
      );
      control.value = entry.size;
      updateDialogTotal();
      event.stopImmediatePropagation();
    }, { capture: true, once: true });
  };

  window.whrTotalModelsForEntry = totalModelsForEntry;
  window.whrMinimumTroopersForEntry = minimumTroopersForEntry;
})();
