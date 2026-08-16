// Final construction guards for Ogre Mercenaries.
(() => {
  const isOgre = () => state.data?.faction?.id === "ogre_mercenaries" && state.selectedArmyId === "ogre_mercenaries";
  const tags = unit => unit?.tags || [];
  const isAlly = unit => tags(unit).includes("ogre_ally");
  const isBsb = unit => tags(unit).includes("bsb") || tags(unit).includes("battle_standard_bearer") || /battle standard|\bbsb\b/i.test(unit?.name || "");
  const nativePoints = () => state.roster.reduce((sum, entry) => {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return sum + (unit && !isAlly(unit) ? calculateEntry(entry) : 0);
  }, 0);
  const alliedMachines = () => state.roster.filter(entry => entry.sectionKey === "warMachines" && isAlly(getUnit(entry.sectionKey, entry.unitId))).length;

  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isOgre()) return oldAddUnit(sectionKey, unitId);
    const unit = getUnit(sectionKey, unitId);
    if (!unit) return;

    if (isBsb(unit) && state.roster.some(entry => isBsb(getUnit(entry.sectionKey, entry.unitId)))) {
      alert("An Ogre Mercenaries army may include only one Battle Standard Bearer, and it must be an Ogre.");
      return;
    }

    if (sectionKey === "warMachines" && isAlly(unit)) {
      const allowance = Math.floor(nativePoints() / 1000);
      if (alliedMachines() >= allowance) {
        alert(`You may include one allied war machine or chariot for each full 1,000 points of models in the Ogre army. Current allowance: ${allowance}.`);
        return;
      }
    }

    return oldAddUnit(sectionKey, unitId);
  };
})();
