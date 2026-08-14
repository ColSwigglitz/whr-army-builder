// Correct Orcs & Goblins special-character profiles from the WHR 2026-27 army list.
(() => {
  const previousFetch = window.fetch.bind(window);

  const PROFILE_FIXES = [
    { id:"azhag_special", name:"Azhag the Slaughterer", stats:{M:4,WS:6,BS:6,S:4,T:5,W:3,I:5,A:4,Ld:10} },
    { id:"gorfang_special", name:"Gorfang Rotgut", stats:{M:4,WS:5,BS:5,S:5,T:5,W:3,I:4,A:3,Ld:8} },
    { id:"gorbad_special", name:"Gorbad Ironclaw", stats:{M:4,WS:6,BS:6,S:4,T:5,W:3,I:5,A:4,Ld:10} },
    { id:"grom_special", name:"Grom the Paunch of Misty Mountain", stats:{M:4,WS:5,BS:6,S:4,T:4,W:3,I:5,A:4,Ld:9} },
    { id:"morglum_special", name:"Morglum Necksnapper", stats:{M:4,WS:7,BS:6,S:5,T:5,W:3,I:5,A:4,Ld:10} },
    { id:"oglok_special", name:"Oglok the 'Orrible", stats:{M:4,WS:6,BS:5,S:4,T:5,W:2,I:4,A:4,Ld:9} },
    { id:"skarsnik_special", name:"Skarsnik, Warlord of the Eight Peaks", stats:{M:4,WS:5,BS:6,S:4,T:4,W:3,I:6,A:4,Ld:9} },
    { id:"gobbla_special", name:"Gobbla", stats:{M:null,WS:6,BS:0,S:6,T:4,W:3,I:6,A:4,Ld:2} }
  ];

  const UNIT_PROFILE_MAP = {
    azhag: "azhag_special",
    gorfang: "gorfang_special",
    gorbad: "gorbad_special",
    grom: "grom_special",
    morglum: "morglum_special",
    oglok: "oglok_special",
    skarsnik: "skarsnik_special"
  };

  function patchOrcSpecialCharacters(data) {
    if (data?.faction?.id !== "orcs_goblins") return data;

    data.profiles = data.profiles || [];
    for (const profile of PROFILE_FIXES) {
      const index = data.profiles.findIndex(p => p.id === profile.id);
      if (index >= 0) data.profiles[index] = profile;
      else data.profiles.push(profile);
    }

    for (const unit of data.faction?.specialCharacters || []) {
      const profileId = UNIT_PROFILE_MAP[unit.id];
      if (profileId) unit.profileId = profileId;

      if (unit.id === "skarsnik") {
        unit.additionalProfiles = [
          { profileId:"gobbla_special", label:"Gobbla", notes:["Companion"] }
        ];
      }

      if (unit.id === "grom") {
        unit.additionalProfiles = [
          { profileId:"heavy_chariot", label:"Heavy Wolf Chariot", notes:["Heavy chariot", "Scythed wheels"] },
          { profileId:"giant_wolf", label:"3 Giant Wolves", notes:["Pulling the chariot"] }
        ];
      }
    }

    return data;
  }

  window.fetch = async function(input, init) {
    const response = await previousFetch(input, init);
    const url = typeof input === "string" ? input : input?.url || "";

    if (!response.ok || !(url.endsWith("data/whr_orcs_goblins_v0_1.json") || url.endsWith("/whr_orcs_goblins_v0_1.json"))) {
      return response;
    }

    try {
      const data = patchOrcSpecialCharacters(await response.clone().json());
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {"Content-Type":"application/json"}
      });
    } catch (error) {
      console.error("Unable to patch Orcs & Goblins special-character profiles", error);
      return response;
    }
  };

  function isOrcArmy() {
    return state.data?.faction?.id === "orcs_goblins";
  }

  function orcAdditionalProfileRows(unit) {
    if (!unit?.additionalProfiles?.length) return "";

    return unit.additionalProfiles.map(component => {
      const profileId = typeof component === "string" ? component : component.profileId;
      const profile = profileById.get(profileId);
      if (!profile) return "";

      const label = typeof component === "string"
        ? (profile.name || humanise(profileId))
        : (component.label || profile.name || humanise(profileId));
      const notes = typeof component === "string" ? [] : (component.notes || []);

      return `
        <tr class="mount-row">
          <td class="unit-cell mount-name">↳ ${escapeHtml(label)}</td>
          ${rosterPadProfileCells(profile)}
          <td class="save">–</td>
          <td class="notes-cell mount-notes">${rosterPadNotesInline(notes)}</td>
          <td class="points-cell"></td>
        </tr>
      `;
    }).join("");
  }

  const oldRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    const base = oldRosterPadRow(entry);
    if (!isOrcArmy()) return base;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return base + orcAdditionalProfileRows(unit);
  };
})();
