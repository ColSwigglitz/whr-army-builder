// Final Dark Elf source-specific save rules and small roster corrections.
(() => {
  const isDE = () => state.data?.faction?.id === "dark_elves" && state.selectedArmyId === "dark_elves";

  const previousPrintedSave = calculatePrintedArmourSave;
  calculatePrintedArmourSave = function(entry, unit) {
    if (!isDE()) return previousPrintedSave(entry, unit);

    // Explicit fixed saves in the Dark Elf list.
    if (unit?.id === "black_ark_corsairs") return "5+";
    if (unit?.id === "war_hydra") return "5+";
    if (unit?.id === "cold_one_chariot") return "4+";

    let result = previousPrintedSave(entry, unit);

    // A Cold One improves its rider's armour by +2 rather than the normal +1
    // already applied by the generic mounted calculation, so improve once more.
    const ridesColdOne = entry?.mount === "cold_one" || unit?.unitMount?.mountId === "cold_one";
    if (ridesColdOne && result !== "–") {
      const n = Number(String(result).replace("+", ""));
      if (Number.isFinite(n)) result = `${Math.max(2, n - 1)}+`;
    }

    // A character riding the chariot uses its explicit 4+ chariot save unless
    // the character's own equipment/magic armour produces a better result.
    if (entry?.mount === "cold_one_chariot_mount") {
      const n = result === "–" ? 99 : Number(String(result).replace("+", ""));
      return `${Math.min(4, Number.isFinite(n) ? n : 4)}+`;
    }

    return result;
  };
})();
