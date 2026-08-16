// Global rule: every named Special Character is a 0-1 choice.
(() => {
  const oldAddUnit = addUnit;

  addUnit = function(sectionKey, unitId) {
    if (sectionKey === "specialCharacters") {
      const unit = getUnit(sectionKey, unitId);
      if (unit && state.roster.some(entry => entry.sectionKey === "specialCharacters" && entry.unitId === unitId)) {
        alert(`${unit.name} is a Special Character and may only be included once.`);
        return;
      }
    }

    return oldAddUnit(sectionKey, unitId);
  };
})();
