// Chaos Daemon regiment-specific magic items from the WHR army list.
// These are bought by the regiment itself (not a character/champion) and only
// one regiment in the army may take each item.
(() => {
  const CHAOS_IDS = new Set(["chaos_daemons", "chaos_warband", "chaos_warhost"]);

  const ITEMS = [
    { names:["Bloodletters of Khorne"], option:{ id:"the_bloodhorn", label:"The Bloodhorn", type:"toggle", cost:{value:20}, rules:"One regiment only. Bloodletters on foot carrying the Bloodhorn may always march." } },
    { names:["Pink Horrors of Tzeentch"], option:{ id:"the_drum_of_change", label:"The Drum of Change", type:"toggle", cost:{value:30}, rules:"One regiment only. Draw one Tzeentch spell for every full five models in the regiment; the stored spells may be cast from the drum as bound spells, one per magic phase, and are discarded after successful use." } },
    { names:["Plaguebearers of Nurgle"], option:{ id:"the_gong_of_despair", label:"The Gong of Despair", type:"toggle", cost:{value:30}, rules:"One regiment only. Plaguebearers on foot carrying the Gong always count as outnumbering an enemy they beat in melee combat." } },
    { names:["Daemonettes of Slaanesh"], option:{ id:"the_siren_flute", label:"The Siren Flute", type:"toggle", cost:{value:10}, rules:"One regiment only. Enemies may not Stand and Shoot as a charge reaction against Daemonettes on foot carrying the Siren Flute." } }
  ];

  const normalise = value => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  function isRelevantChaosArmy(){ return state.data?.faction?.id === "chaos" && CHAOS_IDS.has(state.selectedArmyId); }
  function patchRegiments(){
    if (!isRelevantChaosArmy()) return;
    const regiments = state.data?.faction?.regiments || [];
    for (const config of ITEMS) {
      const wanted = new Set(config.names.map(normalise));
      const unit = regiments.find(candidate => wanted.has(normalise(candidate.name)));
      if (!unit) continue;
      unit.options = unit.options || [];
      if (!unit.options.some(option => option.id === config.option.id)) unit.options.push({ ...config.option });
    }
  }

  // New armies pass through selectArmy(), but cloud/local saved-army loading can
  // replace state.data directly and then call buildIndexes(). Patch at that common
  // point as well so daemon regiment items are restored regardless of load path.
  const previousBuildIndexes = buildIndexes;
  buildIndexes = function(){
    previousBuildIndexes();
    patchRegiments();
  };

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId){ await previousSelectArmy(armyId); patchRegiments(); if (isRelevantChaosArmy()){ renderUnitBrowser(); renderArmy(); } };

  const previousRenderUnitOptions = renderUnitOptions;
  renderUnitOptions = function(entry, unit){
    let html = previousRenderUnitOptions(entry, unit);
    if (!isRelevantChaosArmy()) return html;
    for (const {option} of ITEMS) {
      if (!(unit.options || []).some(candidate => candidate.id === option.id)) continue;
      html = html.replaceAll(`>${escapeHtml(humanise(option.id))}<`, `>${escapeHtml(option.label)}<`);
    }
    return html;
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function(){
    if (isRelevantChaosArmy() && state.draft?.sectionKey === "regiments") {
      for (const {option} of ITEMS) {
        if (!state.draft.optionSelections?.[option.id]) continue;
        const alreadyUsed = state.roster.some(entry => entry.id !== state.draft.id && Boolean(entry.optionSelections?.[option.id]));
        if (alreadyUsed) { window.alert(`${option.label} may only be taken by one regiment in the army.`); return; }
      }
    }
    previousSaveEditor();
  };
})();
