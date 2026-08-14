// Correct Orcs & Goblins special-character profiles, options and Roster Pad rows
// from the WHR 2026-27 army list.
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

  const STANDARD_MAGIC_CATEGORIES = [
    "magic_weapon", "magic_armour", "enchanted_item", "arcane_item", "familiar"
  ];

  function ensureEquipment(data, equipment) {
    data.equipment = data.equipment || [];
    if (!data.equipment.some(item => item.id === equipment.id)) data.equipment.push(equipment);
  }

  function ensureMount(data, mount) {
    data.mounts = data.mounts || [];
    const index = data.mounts.findIndex(item => item.id === mount.id);
    if (index >= 0) data.mounts[index] = { ...data.mounts[index], ...mount };
    else data.mounts.push(mount);
  }

  function ensureSpecialItem(data, item) {
    data.faction.specialCharacterOnlyItems = data.faction.specialCharacterOnlyItems || [];
    const allItems = [
      ...(data.factionMagicItems || []),
      ...data.faction.specialCharacterOnlyItems
    ];
    const existing = allItems.find(x => x.id === item.id || String(x.name || "").toLowerCase() === item.name.toLowerCase());
    if (existing) return existing.id;
    data.faction.specialCharacterOnlyItems.push(item);
    return item.id;
  }

  function magicSettings(maximum, categories = STANDARD_MAGIC_CATEGORIES) {
    return {
      maximum,
      allowedPools:["common", "empire"],
      allowedCategories:categories
    };
  }

  function commonOrcHeroEquipment() {
    return [
      { id:"armour", choices:["light_armour"], alsoMayTake:["shield"], cost:0 },
      { id:"melee_weapon", choices:["additional_hand_weapon","spear","halberd","double_handed_weapon"], cost:0 },
      { id:"missile_weapon", choices:["bow","crossbow"], cost:10 }
    ];
  }

  function blackOrcWarlordEquipment() {
    return [
      { id:"armour", choices:["light_armour","heavy_armour"], alsoMayTake:["shield"], cost:0 },
      { id:"melee_weapon", choices:["additional_hand_weapon","spear","halberd","double_handed_weapon"], cost:0 }
    ];
  }

  function commonOrcHeroMounts() {
    return [
      { mountId:"war_boar", cost:16, freeOptions:["barding"] },
      { mountId:"orc_boar_chariot_character", cost:52 },
      { mountId:"wyvern", cost:150 }
    ];
  }

  function blackOrcWarlordMounts() {
    return [
      { mountId:"war_boar", cost:33, freeOptions:["barding"] },
      { mountId:"wyvern", cost:167 }
    ];
  }

  function patchOrcSpecialCharacters(data) {
    if (data?.faction?.id !== "orcs_goblins") return data;

    data.profiles = data.profiles || [];
    for (const profile of PROFILE_FIXES) {
      const index = data.profiles.findIndex(p => p.id === profile.id);
      if (index >= 0) data.profiles[index] = profile;
      else data.profiles.push(profile);
    }

    // A War Boar improves its rider's save as if barded. Represent that as
    // equipment for the generic printed armour-save calculator.
    ensureEquipment(data, { id:"barding", name:"Barding", type:"armour" });
    ensureMount(data, {
      id:"orc_boar_chariot_character",
      name:"Boar Chariot",
      profileId:"heavy_chariot",
      type:"chariot",
      rules:["Heavy chariot", "Combined armour save 4+"],
      displayProfileOnRoster:true
    });

    const crownId = ensureSpecialItem(data, {
      id:"crown_of_sorcery",
      name:"Crown of Sorcery",
      category:"enchanted_item",
      cost:0,
      rules:"Makes Azhag a level 3 Dark Magic wizard; he may cast while wearing armour and does not take Waaagh tests. Included in his points."
    });
    const morgorId = ensureSpecialItem(data, {
      id:"morgor_the_mangler",
      name:"Morgor the Mangler",
      category:"magic_weapon",
      cost:0,
      rules:"+1 WS, +1 S, +1 T, always strikes first and allows no armour save. Included in Gorbad's points."
    });

    for (const unit of data.faction?.specialCharacters || []) {
      const profileId = UNIT_PROFILE_MAP[unit.id];
      if (profileId) unit.profileId = profileId;

      if (unit.id === "azhag") {
        unit.fixedEquipment = ["light_armour","shield"];
        unit.fixedMagicItems = [crownId];
        unit.unitMount = { mountId:"wyvern", name:"Wyvern", quantity:"fixed", equipment:[] };
        unit.magicItems = magicSettings(2, ["magic_weapon","magic_armour","enchanted_item","familiar"]);
      }

      if (unit.id === "gorfang") {
        unit.equipmentOptions = commonOrcHeroEquipment();
        unit.mountOptions = commonOrcHeroMounts();
        unit.magicItems = magicSettings(2);
      }

      if (unit.id === "skarsnik") {
        unit.fixedMagicItems = ["skarsniks_prodder"];
        unit.magicItems = magicSettings(2);
        unit.additionalProfiles = [
          { profileId:"gobbla_special", label:"Gobbla", notes:["Giant Cave Squig companion"] }
        ];
      }

      if (unit.id === "oglok") {
        unit.equipmentOptions = commonOrcHeroEquipment();
        unit.mountOptions = commonOrcHeroMounts();
        unit.magicItems = magicSettings(2);
      }

      if (unit.id === "gorbad") {
        unit.fixedEquipment = ["light_armour","shield"];
        unit.fixedMagicItems = [morgorId];
        unit.unitMount = { mountId:"war_boar", name:"War Boar", quantity:"fixed", equipment:["barding"] };
        unit.magicItems = magicSettings(2);
      }

      if (unit.id === "grom") {
        unit.fixedEquipment = ["light_armour","shield"];
        unit.fixedMagicItems = ["axe_of_grom"];
        unit.magicItems = magicSettings(2);
        unit.options = [
          ...(unit.options || []).filter(option => option.id !== "niblit"),
          { id:"niblit", label:"Add Niblit (Common Goblin Battle Standard Bearer)", type:"toggle", cost:{value:60} }
        ];
        unit.additionalProfiles = [
          { profileId:"heavy_chariot", label:"Heavy Wolf Chariot", notes:["Heavy chariot", "Scythed wheels"] },
          { profileId:"giant_wolf", label:"3 Giant Wolves", notes:["Pulling the chariot"] },
          { profileId:"common_goblin", label:"2 Common Goblin crew", notes:["Chariot crew"] }
        ];
      }

      if (unit.id === "morglum") {
        unit.equipmentOptions = blackOrcWarlordEquipment();
        unit.mountOptions = blackOrcWarlordMounts();
        unit.magicItems = magicSettings(3);
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
      const data = await response.clone().json();

      // Orcs & Goblins use the normal common magic-item pool as well as their
      // faction items. The compact Orc data predates that shared-pool wiring.
      if (!data.commonMagicItems?.length) {
        const commonResponse = await previousFetch("./data/whr_empire_v0_1.json", { cache:"no-store" });
        if (commonResponse.ok) {
          const commonData = await commonResponse.json();
          data.commonMagicItems = commonData.commonMagicItems || [];
        }
      }

      patchOrcSpecialCharacters(data);
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

  // The generic character editor does not normally show unit.options for
  // special characters. Grom needs this for optional Niblit.
  const oldRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    let html = oldRenderCharacterEditor(entry, unit);
    if (isOrcArmy() && entry.sectionKey === "specialCharacters" && (unit.options || []).length) {
      html += `
        <section class="editor-section">
          <h3 class="editor-section-title">Special Options</h3>
          ${renderUnitOptions(entry, unit)}
        </section>
      `;
    }
    return html;
  };

  function orcAdditionalProfileRows(entry, unit) {
    if (!unit?.additionalProfiles?.length) return "";

    const rows = unit.additionalProfiles.map(component => {
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

    if (unit.id === "grom" && entry.optionSelections?.niblit) {
      const niblitProfile = profileById.get("goblin_bsb");
      if (niblitProfile) {
        return rows + `
          <tr class="crew-row">
            <td class="unit-cell crew-name">↳ ${escapeHtml("Niblit")}</td>
            ${rosterPadProfileCells(niblitProfile)}
            <td class="save">–</td>
            <td class="notes-cell crew-notes">${rosterPadNotesInline(["Common Goblin Battle Standard Bearer", "Fourth crew member"])}</td>
            <td class="points-cell"></td>
          </tr>
        `;
      }
    }

    return rows;
  }

  const oldRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    const base = oldRosterPadRow(entry);
    if (!isOrcArmy()) return base;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return base + orcAdditionalProfileRows(entry, unit);
  };
})();
