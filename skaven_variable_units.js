// Variable-size Skaven choices that live in the war-machine section.
(() => {
  const oldRenderWarMachineEditor = renderWarMachineEditor;
  renderWarMachineEditor = function(entry, unit) {
    let html = oldRenderWarMachineEditor(entry, unit);
    if (state.data?.faction?.id !== "skaven" || unit.points?.type !== "per_model") return html;

    const min = Number(unit.size?.minimum || 1);
    const max = unit.size?.maximum != null ? Number(unit.size.maximum) : null;
    const sizeEditor = `
      <section class="editor-section">
        <h3 class="editor-section-title">Unit Size</h3>
        <div class="dialog-field">
          <label for="edit-war-machine-size">Number of ${unit.id === "rat_swarm" ? "swarm bases" : "teams"}</label>
          <input id="edit-war-machine-size" type="number" min="${min}" ${max ? `max="${max}"` : ""} step="1"
            value="${Number(entry.size || min)}" data-field="size">
          <div class="field-hint">${formatPoints(unit.points.value)} pts each${max ? ` · maximum ${max}` : ""}.</div>
        </div>
      </section>
    `;
    return sizeEditor + html;
  };
})();
