// Roster Pad display ordering only.
// General first, then Special Characters, Characters, Regiments and War Machines.
// Within each group, print highest-point entries first. The builder's roster order is unchanged.
(() => {
  if (typeof exportPrintableRoster !== "function") return;

  const previousExportPrintableRoster = exportPrintableRoster;

  function rosterPadSortRank(entry) {
    if (entry?.id === state.generalEntryId) return 0;
    switch (entry?.sectionKey) {
      case "specialCharacters": return 1;
      case "characters": return 2;
      case "regiments": return 3;
      case "warMachines": return 4;
      default: return 5;
    }
  }

  function sortedRosterPadEntries(roster) {
    return roster
      .map((entry, index) => ({ entry, index }))
      .sort((a, b) => {
        const rankDifference = rosterPadSortRank(a.entry) - rosterPadSortRank(b.entry);
        if (rankDifference) return rankDifference;

        const pointsDifference = Number(calculateEntry(b.entry) || 0) - Number(calculateEntry(a.entry) || 0);
        if (pointsDifference) return pointsDifference;

        return a.index - b.index;
      })
      .map(item => item.entry);
  }

  exportPrintableRoster = function() {
    const originalRoster = state.roster;
    const originalCalculateRegimentPoints = calculateRegimentPoints;

    // The existing exporter reads state.roster directly. Swap in a sorted shallow copy
    // only for the duration of printing, then restore the builder's real roster order.
    state.roster = sortedRosterPadEntries(originalRoster);

    // Regiment composition rules can depend on original instance order, so calculate
    // that percentage against the real builder roster even while the print rows are sorted.
    calculateRegimentPoints = function() {
      const currentRoster = state.roster;
      state.roster = originalRoster;
      try {
        return originalCalculateRegimentPoints();
      } finally {
        state.roster = currentRoster;
      }
    };

    try {
      return previousExportPrintableRoster();
    } finally {
      state.roster = originalRoster;
      calculateRegimentPoints = originalCalculateRegimentPoints;
    }
  };

  window.whrSortedRosterPadEntries = sortedRosterPadEntries;
})();
