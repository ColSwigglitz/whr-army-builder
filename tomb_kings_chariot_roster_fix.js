// Tomb Kings Skeleton Light Chariots: print their crew and draught steed profiles on the Roster Pad.
(() => {
  const isSkeletonLightChariot = (entry, unit) =>
    state.data?.faction?.id === "tomb_kings" &&
    entry?.sectionKey === "regiments" &&
    unit?.id === "skeleton_light_chariots";

  const previousUnitMountRow = rosterPadUnitMountRow;
  rosterPadUnitMountRow = function(entry, unit) {
    let html = previousUnitMountRow(entry, unit);
    if (!isSkeletonLightChariot(entry, unit)) return html;

    // Each light chariot is pulled by two Undead Steeds.
    const syntheticUnit = {
      ...unit,
      unitMount: {
        mountId: "undead_steed",
        name: "2 Undead Steeds per chariot",
        quantity: 2,
        equipment: []
      }
    };
    html += previousUnitMountRow(entry, syntheticUnit);
    return html;
  };

  const previousCrewRow = rosterPadWarMachineCrewRow;
  rosterPadWarMachineCrewRow = function(entry, unit) {
    const html = previousCrewRow(entry, unit);
    if (!isSkeletonLightChariot(entry, unit)) return html;

    const profile = profileById.get("skeleton");
    if (!profile) return html;

    return html + `
      <tr class="crew-row">
        <td class="unit-cell crew-name">↳ 2 Skeleton Warrior crew per chariot</td>
        ${rosterPadProfileCells(profile)}
        <td class="save">5+</td>
        <td class="notes-cell crew-notes">${rosterPadNotesInline(["Light armour", "Spear", "Shield", "Bow", "Asp Arrows"])}</td>
        <td class="points-cell"></td>
      </tr>
    `;
  };
})();
