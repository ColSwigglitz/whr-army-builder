// Restores the Regiments of Renown omitted from the compact Dogs of War payload.
// Source: WHR Armies 2026-27, pp. 172-173. Every Regiment of Renown is unique (0-1).
(() => {
  const isDoW = () => state.data?.faction?.id === "dogs_of_war" && state.selectedArmyId === "dogs_of_war";

  const PROFILES = [
    ["ror_marksman","Marksman",4,3,4,3,3,1,3,1,7],
    ["ror_maximillian","Maximillian",4,4,4,4,3,1,4,2,7],
    ["ror_pirate","Dwarf Pirate",4,4,3,3,4,1,2,1,9],
    ["ror_long_drong","Long Drong",4,6,5,4,5,2,4,3,10],
    ["ror_birdman","Birdman",4,4,4,3,3,1,3,1,7],
    ["ror_dadallo","Dadallo",4,4,4,4,3,1,4,2,7],
    ["ror_ruglud_orc","Armoured Orc",4,3,3,3,4,1,2,1,7],
    ["ror_ruglud","Ruglud",4,5,5,4,5,2,5,3,8],
    ["ror_shade","Dark Elf Shade",5,4,4,3,3,1,6,1,8],
    ["ror_mengil","Mengil Manhide",5,5,5,4,3,1,7,2,8],
    ["ror_besieger","Besieger",4,3,4,3,3,1,3,1,7],
    ["ror_braganza","Braganza",4,5,5,4,4,2,5,3,8]
  ].map(([id,name,M,WS,BS,S,T,W,I,A,Ld]) => ({id,name,stats:{M,WS,BS,S,T,W,I,A,Ld}}));

  const UNITS = [
    {
      id:"marksmen_of_miragliano", name:"Marksmen of Miragliano", profileId:"ror_marksman", leader:"Maximillian", leaderProfileId:"ror_maximillian",
      points:130, minimumText:"Nine Marksmen with standard bearer and musician plus Maximillian", extra:11,
      tags:["regiment_of_renown","zero_one","old_world_human"], equipment:["crossbow"],
      rules:["0-1 Regiment of Renown.","Fixed minimum regiment: nine Marksmen with standard bearer and musician plus Maximillian.","All models carry crossbows.","Maximillian may take one magic item."]
    },
    {
      id:"long_drong_slayers_pirates", name:"Long Drong Slayer’s Pirates", profileId:"ror_pirate", leader:"Long Drong", leaderProfileId:"ror_long_drong",
      points:195, minimumText:"Nine Dwarf Pirates with standard bearer and musician plus Long Drong", extra:15,
      tags:["regiment_of_renown","zero_one","dwarf","slayer"], equipment:["pistol","pistol"],
      rules:["0-1 Regiment of Renown.","Fixed minimum regiment: nine Dwarf Pirates with standard bearer and musician plus Long Drong.","Dwarf rules apply. Slayers are unbreakable and always wound on 4+ or better in melee; pistols wound normally.","All models carry two pistols.","Long Drong may take one magic weapon; this may be a Dwarf runic weapon."]
    },
    {
      id:"birdmen_of_catrazza", name:"The Birdmen of Catrazza", profileId:"ror_birdman", leader:"Dadallo", leaderProfileId:"ror_dadallo",
      points:95, minimumText:"Two Birdmen plus Dadallo", extra:25,
      tags:["regiment_of_renown","zero_one","old_world_human","flying","skirmisher"], equipment:["crossbow"], unitType:"monstrous_regiment",
      rules:["0-1 Regiment of Renown.","Fixed minimum regiment: two Birdmen plus Dadallo.","Fly and must skirmish.","May shoot while making a fly move and may shoot at other units flying high, resolved at short range.","All models carry crossbows.","Dadallo may take one magic item."]
    },
    {
      id:"rugluds_armoured_orcs", name:"Ruglud’s Armoured Orcs", profileId:"ror_ruglud_orc", leader:"Ruglud", leaderProfileId:"ror_ruglud",
      points:177, minimumText:"Nine Orcs with standard bearer and musician plus Ruglud", extra:13,
      tags:["regiment_of_renown","zero_one","orc"], equipment:["heavy_armour","halberd","crossbow"],
      rules:["0-1 Regiment of Renown.","Fixed minimum regiment: nine Orcs with standard bearer and musician plus Ruglud.","Subject to Orc animosity.","All models carry heavy armour, halberds and crossbows.","Ruglud may take two magic items, including Orc-only items from the Orcs & Goblins army book."]
    },
    {
      id:"mengil_manhides_dark_elf_company", name:"Mengil Manhide's Dark Elf Company", profileId:"ror_shade", leader:"Mengil Manhide", leaderProfileId:"ror_mengil",
      points:110, minimumText:"Four Dark Elf Shades plus Mengil Manhide", extra:18,
      tags:["regiment_of_renown","zero_one","dark_elf","skirmisher","scout"], equipment:["light_armour","repeating_crossbow","additional_hand_weapon"],
      rules:["0-1 Regiment of Renown.","Fixed minimum regiment: four Dark Elf Shades plus Mengil Manhide.","Hate High Elves; may skirmish and scout.","All models carry light armour, repeating crossbows and an additional hand weapon.","Mengil may take one magic item, including Dark Elf-only items.","High Elves will never fight alongside Mengil and his company."]
    },
    {
      id:"braganzas_besiegers", name:"Braganza’s Besiegers", profileId:"ror_besieger", leader:"Braganza", leaderProfileId:"ror_braganza",
      points:186, minimumText:"Nine Besiegers with standard bearer and musician plus Braganza", extra:14,
      tags:["regiment_of_renown","zero_one","old_world_human"], equipment:["crossbow","heavy_armour"],
      rules:["0-1 Regiment of Renown.","Fixed minimum regiment: nine Besiegers with standard bearer and musician plus Braganza.","All models carry crossbows, heavy armour and pavises.","Pavise gives a 5+ shooting-only save: total 3+ vs shooting and 5+ in melee.","Braganza may take two magic items."]
    }
  ];

  const ROR_IDS = new Set([
    ...UNITS.map(unit => unit.id),
    "vesperos_vendetta", "oglah_khans_wolfboyz", "cursed_company"
  ]);

  function patchData() {
    if (!isDoW() || state.data.__missingRoRRestored) return;
    state.data.__missingRoRRestored = true;

    state.data.profiles = state.data.profiles || [];
    for (const profile of PROFILES) {
      if (!state.data.profiles.some(existing => existing.id === profile.id)) state.data.profiles.push(profile);
    }

    const regiments = state.data.faction.regiments = state.data.faction.regiments || [];
    for (const cfg of UNITS) {
      if (regiments.some(unit => unit.id === cfg.id)) continue;
      regiments.push({
        id:cfg.id,
        name:cfg.name,
        profileId:cfg.profileId,
        points:{type:"fixed",value:cfg.points},
        size:{minimum:1},
        unitType:cfg.unitType || "infantry",
        tags:cfg.tags,
        equipment:cfg.equipment,
        rules:cfg.rules,
        command:{useGlobalDefaults:false,musician:{default:!cfg.tags.includes("skirmisher"),allowed:!cfg.tags.includes("skirmisher")},standardBearer:{default:!cfg.tags.includes("skirmisher"),allowed:!cfg.tags.includes("skirmisher")}},
        champion:{name:cfg.leader,profileId:cfg.leaderProfileId,cost:{value:0}},
        options:[{id:"additional_models",label:"Additional models",type:"quantity",minimum:0,maximum:99,cost:{value:cfg.extra}}],
        rorMinimumText:cfg.minimumText,
        rorExtraCost:cfg.extra
      });
    }

    // Rebuild lookup maps so profiles/units added after the payload load are available everywhere.
    if (typeof buildIndexes === "function") buildIndexes();
  }

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isDoW() && ROR_IDS.has(unit?.id) && unit?.champion) entry.champion.selected = true;
    return entry;
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isDoW() || !UNITS.some(cfg => cfg.id === unit?.id)) return oldRenderRegimentEditor(entry, unit);
    const cfg = UNITS.find(item => item.id === unit.id);
    return `
      <section class="editor-section">
        <h3 class="editor-section-title">Fixed Regiment of Renown</h3>
        <div class="dialog-note">${escapeHtml(cfg.minimumText)} (${formatPoints(cfg.points)} pts). Additional models cost ${formatPoints(cfg.extra)} pts each.</div>
      </section>
      <section class="editor-section">
        <h3 class="editor-section-title">Additional Models</h3>
        ${renderUnitOptions(entry, unit)}
      </section>
      <section class="editor-section">
        <h3 class="editor-section-title">Rules</h3>
        ${(unit.rules || []).map(rule => `<div class="dialog-note">${escapeHtml(rule)}</div>`).join("")}
      </section>`;
  };

  function groupBrowserSection() {
    if (!isDoW() || !els?.unitBrowser) return;
    const buttons = [...els.unitBrowser.querySelectorAll(".unit-choice")].filter(button => ROR_IDS.has(button.dataset.unitId));
    if (!buttons.length) return;
    let section = els.unitBrowser.querySelector('[data-dow-ror-section="1"]');
    if (!section) {
      section = document.createElement("section");
      section.className = "unit-section";
      section.dataset.dowRorSection = "1";
      section.innerHTML = "<h3>Regiments of Renown</h3>";
      const warMachines = [...els.unitBrowser.querySelectorAll(".unit-section")].find(node => node.querySelector("h3")?.textContent.trim() === "War Machines");
      if (warMachines) warMachines.before(section); else els.unitBrowser.appendChild(section);
    }
    for (const button of buttons) section.appendChild(button);
  }

  const oldRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    const result = oldRenderUnitBrowser();
    groupBrowserSection();
    return result;
  };

  const oldSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await oldSelectArmy(armyId);
    patchData();
    if (isDoW()) {
      renderUnitBrowser();
      renderArmy();
    }
  };
})();