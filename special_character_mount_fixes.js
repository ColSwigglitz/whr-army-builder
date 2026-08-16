// Cross-faction special-character mount compatibility and Roster Pad fixes.
// Source: WHR Armies 2026-27.
(() => {
  const MOUNT_PREFIX = "whr_special_";

  function specialById(id) {
    return (state.data?.faction?.specialCharacters || []).find(unit => unit.id === id) || null;
  }

  function installMount(id, name, stats, notes = []) {
    const profileId = `${id}_profile`;
    profileById.set(profileId, { id: profileId, name, stats: { ...stats } });
    mountById.set(id, { id, name, profileId, rules: [...notes] });
    return { id, profileId, name, notes: [...notes] };
  }

  function asUnitMount(installed) {
    return {
      mountId: installed.id,
      profileId: installed.profileId,
      name: installed.name,
      rules: [...installed.notes],
      equipment: []
    };
  }

  function profileRow(name, stats, notes = [], className = "mount-row") {
    const profile = { id: `${MOUNT_PREFIX}${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, name, stats };
    return `
      <tr class="${className}">
        <td class="unit-cell mount-name">↳ ${escapeHtml(name)}</td>
        ${rosterPadProfileCells(profile)}
        <td class="save">–</td>
        <td class="notes-cell mount-notes">${rosterPadNotesInline(notes)}</td>
        <td class="points-cell"></td>
      </tr>
    `;
  }

  function patchCurrentArmy() {
    const army = state.selectedArmyId;

    // High Elf special characters already declare their compulsory mount as
    // defaultMount. createEntry below now honours it, so no faction data rewrite
    // is needed for Tyrion/Malhandir, Imrik/Emperor Dragon or Eltharion/Griffon.

    if (army === "classic_undead") {
      const dieter = specialById("dieter");
      if (dieter) dieter.defaultMount = "manticore";
    }

    if (army === "lizardmen") {
      const maz = specialById("mazdamundi");
      if (maz) {
        const mount = installMount(`${MOUNT_PREFIX}lizardmen_stegadon`, "Stegadon",
          { M: 6, WS: 2, BS: 0, S: 7, T: 6, W: 6, I: 2, A: 5, Ld: 6 },
          ["4+ scaly skin", "Terror", "1D6 impact hits like a chariot"]);
        maz.unitMount = asUnitMount(mount);
      }
    }

    if (army === "slann_empire") {
      const maz = specialById("emperor_mazdamundi");
      if (maz) {
        const mount = installMount(`${MOUNT_PREFIX}slann_stegadon`, "Stegadon",
          { M: 6, WS: 2, BS: 0, S: 7, T: 6, W: 6, I: 2, A: 5, Ld: 6 },
          ["Terror", "1D6 impact hits like a chariot"]);
        maz.unitMount = asUnitMount(mount);
      }
    }

    if (army === "tomb_kings") {
      const arkhan = specialById("arkhan");
      if (arkhan) {
        const mount = installMount(`${MOUNT_PREFIX}arkhan_chariot`, "Arkhan's Flying Heavy Chariot",
          { M: "–", WS: "–", BS: "–", S: 5, T: 5, W: 4, I: "–", A: "–", Ld: "–" },
          ["Heavy Chariot", "Flying", "Scythed wheels"]);
        arkhan.unitMount = asUnitMount(mount);
        arkhan.specialMountComponents = [
          { name: "4 Undead Steeds", stats: { M: 8, WS: 2, BS: 0, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 }, notes: ["Pulling the chariot"] },
          { name: "3 Skeleton crewmen", stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 2, A: 1, Ld: 5 }, notes: ["Chariot crew"] }
        ];
      }
    }

    if (army === "dwarfs") {
      const thorgrim = specialById("thorgrim");
      if (thorgrim) {
        const mount = installMount(`${MOUNT_PREFIX}throne_power`, "Throne of Power",
          { M: "–", WS: "–", BS: "–", S: "–", T: "–", W: "–", I: "–", A: 4, Ld: "–" },
          ["Bearers provide four additional attacks", "Cannot march", "Ignore the first two wounds suffered"]);
        thorgrim.unitMount = asUnitMount(mount);
      }
    }

    if (army === "dark_elves") {
      const malekith = specialById("malekith");
      if (malekith) {
        const mount = installMount(`${MOUNT_PREFIX}malekith_cold_one_chariot`, "Cold One Chariot",
          { M: "–", WS: "–", BS: "–", S: 5, T: 5, W: 4, I: "–", A: "–", Ld: "–" },
          ["Heavy Chariot", "Scythed wheels", "Stupidity"]);
        malekith.mountOptions = malekith.mountOptions || [];
        if (!malekith.mountOptions.some(option => option.mountId === mount.id)) {
          malekith.mountOptions.unshift({ mountId: mount.id, cost: 0 });
        }
        malekith.specialMountComponents = [
          { whenMount: mount.id, name: "2 Cold Ones", stats: { M: 8, WS: 3, BS: 0, S: 4, T: 4, W: 1, I: 1, A: 2, Ld: 3 }, notes: ["Pulling the chariot", "Stupidity"] },
          { whenMount: mount.id, name: "2 Elven Warrior crew", stats: { M: 5, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 6, A: 1, Ld: 8 }, notes: ["Light armour", "Spears", "Shields", "Repeating crossbows"] }
        ];
      }
    }
  }

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!state.data) return;
    patchCurrentArmy();
    renderUnitBrowser();
    renderArmy();
  };

  // Several older special-character datasets declared compulsory rides in a
  // defaultMount or mount field, but core createEntry always started at null.
  const previousCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = previousCreateEntry(sectionKey, unit);
    if (sectionKey === "specialCharacters" && !entry.mount) {
      const fixed = unit.defaultMount || unit.mount || null;
      if (fixed) entry.mount = fixed;
    }
    return entry;
  };

  // Composite rides need their animals/crew as well as the vehicle itself.
  const previousRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    let html = previousRosterPadRow(entry);
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit || entry.sectionKey !== "specialCharacters") return html;
    for (const component of unit.specialMountComponents || []) {
      if (component.whenMount && component.whenMount !== entry.mount) continue;
      html += profileRow(component.name, component.stats, component.notes || []);
    }
    return html;
  };
})();
