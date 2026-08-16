// Complete Orcs & Goblins shaman character choices and mount options
// from the WHR 2026-27 Armies Compendium.
(() => {
  const previousFetch = window.fetch.bind(window);

  const MAGIC_CATEGORIES = ["magic_weapon", "enchanted_item", "arcane_item", "familiar"];

  function magicSettings(level) {
    return {
      maximum: level,
      allowedPools: ["common", "empire"],
      allowedCategories: MAGIC_CATEGORIES
    };
  }

  function ensureProfile(data, profile) {
    data.profiles = data.profiles || [];
    const index = data.profiles.findIndex(item => item.id === profile.id);
    if (index >= 0) data.profiles[index] = { ...data.profiles[index], ...profile };
    else data.profiles.push(profile);
  }

  function ensureMount(data, mount) {
    data.mounts = data.mounts || [];
    const index = data.mounts.findIndex(item => item.id === mount.id);
    if (index >= 0) data.mounts[index] = { ...data.mounts[index], ...mount };
    else data.mounts.push(mount);
  }

  function upsertCharacter(data, character) {
    data.faction.characters = data.faction.characters || [];
    const index = data.faction.characters.findIndex(item => item.id === character.id);
    if (index >= 0) data.faction.characters[index] = { ...data.faction.characters[index], ...character };
    else data.faction.characters.push(character);
  }

  function orcMounts(level, savage = false) {
    const mounts = [
      { mountId: "war_boar", cost: 0, freeOptions: ["barding"] }
    ];
    if (!savage) mounts.push({ mountId: "orc_boar_chariot_character", cost: 52 });
    if (level === 4) mounts.push({ mountId: "wyvern", cost: 140 });
    return mounts;
  }

  function commonGoblinMounts() {
    return [
      { mountId: "giant_wolf", cost: 0 },
      { mountId: "goblin_wolf_chariot_character", cost: 44 },
      { mountId: "monstrous_spider", cost: 32 }
    ];
  }

  function forestGoblinMounts() {
    return [
      { mountId: "giant_spider", cost: 0 },
      { mountId: "monstrous_spider", cost: 32 }
    ];
  }

  function nightGoblinMounts() {
    return [
      { mountId: "monstrous_spider", cost: 32 }
    ];
  }

  function shaman(id, name, profileId, points, level, mountOptions, extra = {}) {
    return {
      id,
      name,
      profileId,
      points: { type: "fixed", value: points },
      magicItemLimit: level,
      magicItems: magicSettings(level),
      mountOptions,
      rules: [`Wizard level ${level}`, "Waaagh! spells", ...(extra.rules || [])],
      ...(extra.equipment ? { equipment: extra.equipment } : {})
    };
  }

  function patchOrcShamans(data) {
    if (data?.faction?.id !== "orcs_goblins") return data;

    // Chariot profiles are used when a Shaman selects a chariot mount and
    // also allow the Roster Pad to show the vehicle stat line.
    ensureProfile(data, {
      id: "light_chariot",
      name: "Light Chariot",
      stats: { M: null, WS: null, BS: null, S: 4, T: 4, W: 4, I: null, A: null, Ld: null }
    });
    ensureProfile(data, {
      id: "heavy_chariot",
      name: "Heavy Chariot",
      stats: { M: null, WS: null, BS: null, S: 5, T: 5, W: 4, I: null, A: null, Ld: null }
    });

    ensureMount(data, {
      id: "orc_boar_chariot_character",
      name: "Boar Chariot",
      profileId: "heavy_chariot",
      type: "chariot",
      rules: ["Heavy chariot", "Pulled by two War Boars", "Combined armour save 4+"],
      displayProfileOnRoster: true
    });
    ensureMount(data, {
      id: "goblin_wolf_chariot_character",
      name: "Wolf Chariot",
      profileId: "light_chariot",
      type: "chariot",
      rules: ["Light chariot", "Pulled by two Giant Wolves", "Combined armour save 5+"],
      displayProfileOnRoster: true
    });

    const entries = [
      shaman("orc_shaman_lord", "Common Orc Shaman Lord", "orc_shaman_lord", 220, 4, orcMounts(4)),
      shaman("orc_master_shaman", "Common Orc Master Shaman", "orc_master_shaman", 155, 3, orcMounts(3)),
      shaman("orc_shaman_champion", "Common Orc Shaman Champion", "orc_shaman_champion", 100, 2, orcMounts(2)),
      shaman("orc_shaman", "Common Orc Shaman", "orc_shaman", 45, 1, orcMounts(1)),

      shaman("savage_orc_shaman_lord", "Savage Orc Shaman Lord", "orc_shaman_lord", 250, 4, orcMounts(4, true), {
        equipment: ["magical_tattoos"], rules: ["Frenzy", "Magical tattoos"]
      }),
      shaman("savage_orc_master_shaman", "Savage Orc Master Shaman", "orc_master_shaman", 185, 3, orcMounts(3, true), {
        equipment: ["magical_tattoos"], rules: ["Frenzy", "Magical tattoos"]
      }),
      shaman("savage_orc_shaman_champion", "Savage Orc Shaman Champion", "orc_shaman_champion", 130, 2, orcMounts(2, true), {
        equipment: ["magical_tattoos"], rules: ["Frenzy", "Magical tattoos"]
      }),
      shaman("savage_orc_shaman", "Savage Orc Shaman", "orc_shaman", 75, 1, orcMounts(1, true), {
        equipment: ["magical_tattoos"], rules: ["Frenzy", "Magical tattoos"]
      }),

      shaman("common_goblin_shaman_lord", "Common Goblin Shaman Lord", "goblin_shaman_lord", 170, 4, commonGoblinMounts()),
      shaman("common_goblin_master_shaman", "Common Goblin Master Shaman", "goblin_master_shaman", 120, 3, commonGoblinMounts()),
      shaman("common_goblin_shaman_champion", "Common Goblin Shaman Champion", "goblin_shaman_champion", 75, 2, commonGoblinMounts()),
      shaman("common_goblin_shaman", "Common Goblin Shaman", "goblin_shaman", 30, 1, commonGoblinMounts()),

      shaman("forest_goblin_shaman_lord", "Forest Goblin Shaman Lord", "goblin_shaman_lord", 170, 4, forestGoblinMounts(), {
        rules: ["Forester", "Failed Waaagh! test: trance movement replaces the normal Toughness test on a 1-5"]
      }),
      shaman("forest_goblin_master_shaman", "Forest Goblin Master Shaman", "goblin_master_shaman", 120, 3, forestGoblinMounts(), {
        rules: ["Forester", "Failed Waaagh! test: trance movement replaces the normal Toughness test on a 1-5"]
      }),
      shaman("forest_goblin_shaman_champion", "Forest Goblin Shaman Champion", "goblin_shaman_champion", 75, 2, forestGoblinMounts(), {
        rules: ["Forester", "Failed Waaagh! test: trance movement replaces the normal Toughness test on a 1-5"]
      }),
      shaman("forest_goblin_shaman", "Forest Goblin Shaman", "goblin_shaman", 30, 1, forestGoblinMounts(), {
        rules: ["Forester", "Failed Waaagh! test: trance movement replaces the normal Toughness test on a 1-5"]
      }),

      shaman("night_goblin_shaman_lord", "Night Goblin Shaman Lord", "goblin_shaman_lord", 180, 4, nightGoblinMounts(), {
        rules: ["Hates Dwarfs", "Magic mushroom: once per battle gain 1D6 extra magic cards after Winds of Magic are dealt"]
      }),
      shaman("night_goblin_master_shaman", "Night Goblin Master Shaman", "goblin_master_shaman", 130, 3, nightGoblinMounts(), {
        rules: ["Hates Dwarfs", "Magic mushroom: once per battle gain 1D6 extra magic cards after Winds of Magic are dealt"]
      }),
      shaman("night_goblin_shaman_champion", "Night Goblin Shaman Champion", "goblin_shaman_champion", 85, 2, nightGoblinMounts(), {
        rules: ["Hates Dwarfs", "Magic mushroom: once per battle gain 1D6 extra magic cards after Winds of Magic are dealt"]
      }),
      shaman("night_goblin_shaman", "Night Goblin Shaman", "goblin_shaman", 40, 1, nightGoblinMounts(), {
        rules: ["Hates Dwarfs", "Magic mushroom: once per battle gain 1D6 extra magic cards after Winds of Magic are dealt"]
      })
    ];

    for (const entry of entries) upsertCharacter(data, entry);
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
      patchOrcShamans(data);
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Unable to patch Orcs & Goblins shamans", error);
      return response;
    }
  };
})();
