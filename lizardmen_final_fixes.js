// Small Lizardmen integration fixes that depend on the core/extensions already being loaded.
(() => {
  const isLiz = () => state.data?.faction?.id === "lizardmen" && state.selectedArmyId === "lizardmen";

  function patchUnitMounts() {
    if (!isLiz()) return;
    const byId = id => (state.data.faction.regiments || []).find(unit => unit.id === id);
    const coldSaurus = byId("saurus_cold_one_riders");
    const coldSkinks = byId("great_crested_cold_one_riders");
    const terradons = byId("terradon_riders");
    if (coldSaurus) coldSaurus.unitMount = {mountId:"cold_one", name:"Cold Ones"};
    if (coldSkinks) coldSkinks.unitMount = {mountId:"cold_one", name:"Cold Ones"};
    if (terradons) terradons.unitMount = {mountId:"terradon", name:"Terradons"};
  }

  const oldSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await oldSelectArmy(armyId);
    if (!isLiz()) return;
    patchUnitMounts();
    renderUnitBrowser();
    renderArmy();
  };

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isLiz() && unit?.mount) entry.mount = unit.mount;
    return entry;
  };

  const oldPrintedSave = calculatePrintedArmourSave;
  calculatePrintedArmourSave = function(entry, unit) {
    const result = oldPrintedSave(entry, unit);
    if (!isLiz() || !entry.optionSelections?.light_armour || result === "–") return result;
    const number = Number(String(result).replace("+", ""));
    return Number.isFinite(number) ? `${Math.max(2, number - 1)}+` : result;
  };
})();
