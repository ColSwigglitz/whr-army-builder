// Prevent an Abomination rider from simultaneously using another mount.
(() => {
  const isAbominationEntry = entry => {
    if (!entry || state.data?.faction?.id !== "chaos") return false;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return Boolean(unit && String(unit.name || "").toLowerCase().includes("chaos abomination"));
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isAbominationEntry(state.draft) && state.draft.abomination?.role !== "unridden") {
      const general = state.roster.find(entry => entry.id === state.draft.abomination?.generalEntryId);
      if (general?.mount) {
        window.alert("The selected Chaos general already has another mount. Remove that mount before assigning the Chaos Abomination.");
        return;
      }
    }
    return previousSaveEditor();
  };
})();
