// Show Undead Steed stats on the Roster Pad when Vampire Counts Wraiths buy ethereal steeds.
(() => {
  const previousRosterPadRow = rosterPadRow;

  rosterPadRow = function(entry) {
    let html = previousRosterPadRow(entry);
    if (state.data?.faction?.id !== "vampire_counts" || entry?.unitId !== "wraiths") return html;
    if (!entry.optionSelections?.ethereal_undead_steeds) return html;

    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit || String(html).includes("Wraiths' Ethereal Undead Steeds")) return html;

    const mountRow = rosterPadUnitMountRow(entry, {
      ...unit,
      unitMount: {
        mountId: "undead_steed",
        name: "Wraiths' Ethereal Undead Steeds",
        quantity: "per_model",
        equipment: []
      }
    });

    if (!mountRow) return html;
    return html + mountRow;
  };
})();
