// Small Lizardmen integration fixes that depend on the core/extensions already being loaded.
(() => {
  const isLiz = () => state.data?.faction?.id === "lizardmen" && state.selectedArmyId === "lizardmen";
  const tags = unit => unit?.tags || [];

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

  const oldRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    let html = oldRenderCharacterEditor(entry, unit);
    if (!isLiz() || !tags(unit).includes("slann") || !(unit.options || []).some(option => option.id === "battle_standard")) return html;
    html += `<section class="editor-section"><h3 class="editor-section-title">Battle Standard</h3>
      <label class="check-row"><input type="checkbox" data-liz-slann-bsb ${entry.optionSelections?.battle_standard ? "checked" : ""}>
        <span class="check-row-content"><span class="check-row-title"><span>Carry the Battle Standard</span><span>+75 pts</span></span>
        <span class="check-row-sub">Only one Battle Standard Bearer may be included. If selected, one of this Mage Priest's normal magic-item slots may contain a magic banner.</span></span>
      </label></section>`;
    return html;
  };

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isLiz() || !state.draft) return;
    els.dialogContent.querySelector("[data-liz-slann-bsb]")?.addEventListener("change", event => {
      state.draft.optionSelections.battle_standard = event.target.checked;
      if (!event.target.checked) {
        state.draft.magicItems = (state.draft.magicItems || []).filter(id => getMagicItem(id)?.category !== "magic_banner");
      }
      renderEditor();
    });
  };

  const oldPrintedSave = calculatePrintedArmourSave;
  calculatePrintedArmourSave = function(entry, unit) {
    const result = oldPrintedSave(entry, unit);
    if (!isLiz() || !entry.optionSelections?.light_armour || result === "–") return result;
    const number = Number(String(result).replace("+", ""));
    return Number.isFinite(number) ? `${Math.max(2, number - 1)}+` : result;
  };
})();
