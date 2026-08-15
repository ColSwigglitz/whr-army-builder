// Small Dogs of War presentation/equipment fixes kept separate from the main rules layer.
(() => {
  const isDoW = () => state.data?.faction?.id === "dogs_of_war" && state.selectedArmyId === "dogs_of_war";

  const oldSelectedEquipment = getSelectedEquipmentIds;
  getSelectedEquipmentIds = function(entry, unit) {
    const ids = new Set(oldSelectedEquipment(entry, unit));
    if (!isDoW()) return [...ids];
    if (unit?.id === "sea_elf_mercenaries" && entry.optionSelections?.longbow) {
      ids.delete("bow");
      ids.add("longbow");
    }
    return [...ids];
  };

  const oldRenderCommandEditor = renderCommandEditor;
  renderCommandEditor = function(entry, unit) {
    if (!isDoW() || unit?.id !== "human_cavalry_retainers" || entry.optionSelections?.armour !== "heavy_armour") {
      return oldRenderCommandEditor(entry, unit);
    }
    const view = clone(unit);
    view.command = clone(unit.command || {});
    view.command.standardBearer = {...(view.command.standardBearer || {}), cost:0};
    return oldRenderCommandEditor(entry, view);
  };

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isDoW() || !state.draft) return;
    if (state.draft.unitId === "human_cavalry_retainers") {
      const armour = els.dialogContent.querySelector('[data-option-choice="armour"]');
      if (armour) armour.addEventListener("change", () => renderEditor());
    }
  };
})();
