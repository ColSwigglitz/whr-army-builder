// Development Roster Pad ordering.
// Prints the General first, then Special Characters, Characters, Regiments and War Machines.
// Within each group, entries are ordered from most expensive to cheapest.
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

  function sortedRosterForPad() {
    return state.roster
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
    state.roster = sortedRosterForPad();
    try {
      return previousExportPrintableRoster();
    } finally {
      state.roster = originalRoster;
    }
  };

  window.whrRosterPadSortedRoster = sortedRosterForPad;
})();
