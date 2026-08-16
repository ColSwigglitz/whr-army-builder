// Show composition restrictions directly on the Add to Army entries.
(() => {
  const previousRenderUnitBrowser = renderUnitBrowser;

  function isZeroOne(unit) {
    if (!unit) return false;
    if (Number(unit.maxUnits) === 1) return true;
    return (unit.rules || []).some(rule => /^0\s*-\s*1$/i.test(String(rule).trim()));
  }

  renderUnitBrowser = function() {
    previousRenderUnitBrowser();

    els.unitBrowser.querySelectorAll(".unit-choice").forEach(button => {
      const unit = getUnit(button.dataset.section, button.dataset.unitId);
      if (!isZeroOne(unit)) return;

      const meta = button.querySelector(".unit-choice-meta");
      if (meta) meta.textContent = "0-1 choice · Add now, configure in your roster";
      button.dataset.zeroOne = "true";
    });
  };
})();
