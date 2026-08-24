// Keep army selection responsive while the heavier army rules bundle loads.
(() => {
  let resolveArmyFeatures;
  let rejectArmyFeatures;

  window.whrArmyFeaturesReady = new Promise((resolve, reject) => {
    resolveArmyFeatures = resolve;
    rejectArmyFeatures = reject;
  });
  window.whrResolveArmyFeatures = resolveArmyFeatures;
  window.whrRejectArmyFeatures = rejectArmyFeatures;

  if (typeof selectArmy === "function") {
    const previousSelectArmy = selectArmy;
    selectArmy = async function(armyId) {
      await window.whrArmyFeaturesReady;
      return previousSelectArmy(armyId);
    };
  }

  if (typeof loadRoster === "function") {
    const previousLoadRoster = loadRoster;
    loadRoster = async function(id) {
      await window.whrArmyFeaturesReady;
      return previousLoadRoster(id);
    };
  }
})();
