// Keeps Chaos devotion state available when shared army extensions reset armyOptions.
(() => {
  let armyOptions = state.armyOptions || {};

  function normalise(value) {
    const options = value && typeof value === "object" ? value : {};
    if (!options.chaosDevotions || typeof options.chaosDevotions !== "object") {
      options.chaosDevotions = {};
    }
    return options;
  }

  armyOptions = normalise(armyOptions);

  Object.defineProperty(state, "armyOptions", {
    configurable: true,
    enumerable: true,
    get() {
      armyOptions = normalise(armyOptions);
      return armyOptions;
    },
    set(value) {
      armyOptions = normalise(value);
    }
  });
})();
