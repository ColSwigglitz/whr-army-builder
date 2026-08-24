// Show the actual physical model count represented by each per-model regiment entry.
// A champion using add.type = "unit_model_cost" is an additional model, so it increases
// the displayed total by one. This is display-only and does not change any points logic.
(() => {
  function totalModelsForEntry(entry, unit) {
    if (!entry || !unit || unit.points?.type !== "per_model") return null;

    const baseModels = Math.max(0, Number(entry.size || 0));
    const championIsExtraModel = Boolean(
      entry.champion?.selected &&
      unit.champion?.cost?.add?.type === "unit_model_cost"
    );

    return {
      total: baseModels + (championIsExtraModel ? 1 : 0),
      base: baseModels,
      championIsExtraModel
    };
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

  window.whrTotalModelsForEntry = totalModelsForEntry;
})();
