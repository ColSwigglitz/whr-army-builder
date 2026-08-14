// Final Dwarf validation and Roster Pad integration.
(() => {
  const isDwarfArmy = () => state.data?.faction?.id === "dwarfs";
  const runeCategories = () => state.data?.faction?.systems?.runes?.categories || {};
  const runeById = id => Object.values(runeCategories()).flat().find(r => r.id === id);
  const emptyRunes = () => ({weapon:[], armour:[], talisman:[], protection:[], engineering:[]});

  function ensureRuneShape(entry) {
    entry.runes = entry.runes || emptyRunes();
    entry.champion = entry.champion || {selected:false, magicItems:[]};
    entry.champion.runes = entry.champion.runes || emptyRunes();
    return entry;
  }

  function runeSignature(ids) {
    const clean = (ids || []).filter(Boolean);
    return clean.length ? [...clean].sort().join("|") : null;
  }

  function collectRunicItems(entry, unit) {
    ensureRuneShape(entry);
    const result = [];
    const labels = {
      weapon:"Runic Weapon",
      armour:"Runic Armour",
      talisman:"Runic Talisman",
      protection:"Runic Standard",
      engineering:"Engineering Runes"
    };

    for (const [category, ids] of Object.entries(entry.runes)) {
      const sig = runeSignature(ids);
      if (sig) result.push({signature:sig, label:labels[category] || humanise(category), ids});
    }

    if (entry.champion?.selected) {
      for (const [category, ids] of Object.entries(entry.champion.runes || {})) {
        const sig = runeSignature(ids);
        if (sig) result.push({signature:sig, label:`${unit.champion?.name || "Champion"} ${labels[category] || humanise(category)}`, ids});
      }
    }

    return result;
  }

  function duplicateRuneCombinationMessage(draft) {
    const draftUnit = getUnit(draft.sectionKey, draft.unitId);
    const seen = new Map();

    for (const entry of state.roster) {
      if (entry.id === draft.id) continue;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      for (const item of collectRunicItems(entry, unit)) {
        seen.set(item.signature, `${unit.name}: ${item.label}`);
      }
    }

    for (const item of collectRunicItems(draft, draftUnit)) {
      if (seen.has(item.signature)) {
        return `This rune combination is already used by ${seen.get(item.signature)}. No two runic items may bear the same combination of runes.`;
      }
      if (seen.has(`draft:${item.signature}`)) {
        return "Two runic items in this entry use the same rune combination. Each runic item in the army must have a unique combination.";
      }
      seen.set(`draft:${item.signature}`, item.label);
    }

    return null;
  }

  function hasAnvil(entry) {
    const selected = entry?.optionSelections || {};
    return Boolean(selected.anvil_of_doom || selected.anvil || selected.take_anvil_of_doom);
  }

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isDwarfArmy() && state.draft) {
      const duplicateMessage = duplicateRuneCombinationMessage(state.draft);
      if (duplicateMessage) {
        window.alert(duplicateMessage);
        return;
      }

      if (hasAnvil(state.draft)) {
        const anotherAnvil = state.roster.some(entry => entry.id !== state.draft.id && hasAnvil(entry));
        if (anotherAnvil) {
          window.alert("Only one Runesmith in the army may take an Anvil of Doom.");
          return;
        }
      }
    }
    oldSaveEditor();
  };

  function runeNotes(entry, unit, champion=false) {
    ensureRuneShape(entry);
    const source = champion ? entry.champion.runes : entry.runes;
    const labels = {
      weapon:"Runic Weapon",
      armour:"Runic Armour",
      talisman:"Runic Talisman",
      protection:"Runic Standard",
      engineering:"Engineering Runes"
    };
    const notes = [];
    for (const [category, ids] of Object.entries(source || {})) {
      if (!ids?.length) continue;
      const names = ids.map(id => runeById(id)?.name || humanise(id));
      notes.push(`${labels[category] || humanise(category)}: ${names.join(", ")}`);
    }
    return notes;
  }

  const oldRosterPadNotes = rosterPadNotes;
  rosterPadNotes = function(entry, unit) {
    const notes = oldRosterPadNotes(entry, unit);
    if (!isDwarfArmy()) return notes;
    return [...notes, ...runeNotes(entry, unit, false)].filter((value, index, array) =>
      value && array.findIndex(x => String(x).toLowerCase() === String(value).toLowerCase()) === index
    );
  };

  const oldRosterPadChampionRow = rosterPadChampionRow;
  rosterPadChampionRow = function(entry, unit) {
    if (!isDwarfArmy() || !entry.champion?.selected || !unit.champion?.profileId) {
      return oldRosterPadChampionRow(entry, unit);
    }
    const profile = profileById.get(unit.champion.profileId);
    if (!profile) return "";
    const notes = ["Unit Champion"];
    for (const itemId of entry.champion.magicItems || []) {
      const item = getMagicItem(itemId);
      if (item) notes.push(`${item.name}${item.rules ? ` — ${item.rules}` : ""}`);
    }
    notes.push(...runeNotes(entry, unit, true));
    return `
      <tr class="champion-row">
        <td class="unit-cell champion-name">↳ ${escapeHtml(unit.champion.name)}</td>
        ${rosterPadProfileCells(profile)}
        <td class="save">${escapeHtml(calculatePrintedArmourSave(entry, unit))}</td>
        <td class="notes-cell champion-notes">${rosterPadNotesInline(notes)}</td>
        <td class="points-cell"></td>
      </tr>
    `;
  };

  const oldPrintableUnitName = printableUnitName;
  printableUnitName = function(entry, unit) {
    if (isDwarfArmy() && unit.points?.type === "tiered") return `${entry.size} ${unit.name}`;
    return oldPrintableUnitName(entry, unit);
  };

  function additionalProfileRows(unit) {
    if (!isDwarfArmy() || !unit.additionalProfiles?.length) return "";
    return unit.additionalProfiles.map(profileId => {
      const profile = profileById.get(profileId);
      if (!profile) return "";
      return `
        <tr class="champion-row">
          <td class="unit-cell champion-name">↳ ${escapeHtml(profile.name || humanise(profileId))}</td>
          ${rosterPadProfileCells(profile)}
          <td class="save">–</td>
          <td class="notes-cell champion-notes">${rosterPadNotesInline(["Additional profile"] )}</td>
          <td class="points-cell"></td>
        </tr>
      `;
    }).join("");
  }

  const oldRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    const base = oldRosterPadRow(entry);
    if (!isDwarfArmy()) return base;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return base + additionalProfileRows(unit);
  };
})();
