// Focused fixes for Vampire Counts on top of army_extensions.js.
(() => {
  function bloodline() {
    return state.armyOptions?.bloodline || null;
  }

  function vampire(unit) {
    return (unit?.tags || []).includes("vampire");
  }

  // Vampire Counts share magic-item slots with bloodline powers on a Vampire Count.
  const previousGetMagicMaximum = getMagicMaximum;
  getMagicMaximum = function(unit, context) {
    if (context === "character" && vampire(unit)) {
      if (bloodline() === "strigoi") return 0;
      if (unit.combinedMagicAndBloodlineLimit != null) {
        const entry = state.draft?.unitId === unit.id ? state.draft : null;
        return Math.max(0,
          Number(unit.combinedMagicAndBloodlineLimit) - Number(entry?.bloodlinePowers?.length || 0)
        );
      }
    }
    return previousGetMagicMaximum(unit, context);
  };

  // Blood Dragons may exchange their Undead Steed for a living War Horse at the
  // same points cost. The War Horse is injected into the editor by army_extensions.js,
  // so account for that dynamically here as it is not part of the base character JSON.
  const previousCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = previousCalculateEntry(entry);
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (vampire(unit) && bloodline() === "blood_dragon" && entry.mount === "war_horse_vampire") {
      const originalSteed = (unit.mountOptions || []).find(mount => mount.mountId === "undead_steed");
      total += Number(originalSteed?.cost || 0);
    }
    return total;
  };

  // Lahmians have Initiative 11; Strigoi have +1 Attack. Reflect those bloodline
  // changes on the printed roster profile rather than only mentioning them in Notes.
  const previousProfileForUnit = profileForUnit;
  profileForUnit = function(unit) {
    const profile = previousProfileForUnit(unit);
    if (!profile || !vampire(unit)) return profile;
    const adjusted = clone(profile);
    if (bloodline() === "lahmian") adjusted.stats.I = 11;
    if (bloodline() === "strigoi") adjusted.stats.A = Number(adjusted.stats.A || 0) + 1;
    return adjusted;
  };

  // Living War Horse exchange receives free barding just like the replaced Undead Steed.
  const previousRosterPadMountRow = rosterPadMountRow;
  rosterPadMountRow = function(entry, unit) {
    if (vampire(unit) && bloodline() === "blood_dragon" && entry.mount === "war_horse_vampire") {
      const mount = mountById.get(entry.mount);
      const profile = profileById.get(mount?.profileId);
      if (!mount || !profile) return "";
      return `
        <tr class="mount-row">
          <td class="unit-cell mount-name">↳ ${escapeHtml(mount.name)}</td>
          ${rosterPadProfileCells(profile)}
          <td class="save">–</td>
          <td class="notes-cell mount-notes">${rosterPadNotesInline(["Living", "Barding available for free"])}</td>
          <td class="points-cell"></td>
        </tr>
      `;
    }
    return previousRosterPadMountRow(entry, unit);
  };
})();
