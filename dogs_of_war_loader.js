// Dogs of War compact payload plus race-specific borrowed magic-item pools.
(() => {
  const previousFetch = window.fetch.bind(window);
  const clone = value => JSON.parse(JSON.stringify(value));

  // Kislev and Norse are referenced directly by the Dogs of War list but do not
  // yet have populated standalone builder datasets. Keep their WHR magic pools
  // here until those army datasets exist; a future populated army automatically
  // replaces these embedded copies because IDs are de-duplicated below.
  const KISLEV_ITEMS = [
    {id:"shard_blade",name:"Shard Blade",category:"magic_weapon",cost:15,rules:"A living model wounded by the blade cannot heal and is removed as a casualty at the end of the battle."},
    {id:"pistols_prince_boydinov",name:"Pistols of Prince Boydinov",category:"magic_weapon",cost:15,rules:"Two pistols. Hit on 2+. Magical shots."},
    {id:"black_blade",name:"Black Blade",category:"magic_weapon",cost:30,rules:"Monsters and Daemons in base contact lose half their attacks, rounded up."},
    {id:"bloodedge",name:"Bloodedge",category:"magic_weapon",cost:40,rules:"Bearer gains +2 Attacks and +2 Strength in melee; rolls of 1 to hit may strike a random friendly model in base contact."},
    {id:"fearfrost",name:"Fearfrost",category:"magic_weapon",cost:60,rules:"No armour save. Each wound causes 1D6 wounds."},
    {id:"armour_alexandr",name:"Armour of Alexandr",category:"magic_armour",cost:50,rules:"Includes shield. 3+ armour save and 5+ ward save; a magic weapon stopped by the ward loses its magical properties."},
    {id:"crystal_helm",name:"Crystal Helm",category:"enchanted_item",cost:15,rules:"If carried by the General, units within 18 inches may use the General's Leadership.",generalOnly:true},
    {id:"birch_ring",name:"Birch Ring",category:"enchanted_item",cost:15,rules:"Bound Amber spell: transforms bearer into a fear-causing Werebear with 3 Attacks at WS6 S6; bearer cannot cast while transformed."},
    {id:"ice_armour",name:"Ice Armour",category:"arcane_item",cost:15,rules:"Wizard only. 4+ armour and 4+ ward save; shatters if it fails to save the bearer.",wizardOnly:true},
    {id:"banner_ursus",name:"Banner of Ursus",category:"magic_banner",cost:10,rules:"Unit is immune to fear."},
    {id:"kislev_warbanner",name:"Warbanner",category:"magic_banner",cost:40,rules:"+1 combat resolution."},
    {id:"banner_murder",name:"Banner of Murder",category:"magic_banner",cost:50,rules:"Adds 1D6 to charge move; a failed charge uses the normal failed-charge move."}
  ];

  const NORSE_ITEMS = [
    {id:"dainsleif",name:"Dainsleif",category:"magic_weapon",cost:10,rules:"A living model wounded by the blade cannot heal and is removed as a casualty at the end of the battle."},
    {id:"gram",name:"Gram",category:"magic_weapon",cost:10,rules:"Automatically wounds Dragons, Wyverns, Hydras, Cold Ones, Horned Ones, Terradons, Salamanders, Carnosaurs and Stegadons with no armour save."},
    {id:"tyrfing",name:"Tyrfing",category:"magic_weapon",cost:40,rules:"Bearer gains +2 Attacks and +2 Strength in melee; rolls of 1 to hit may strike a random friendly model in base contact."},
    {id:"skraep",name:"Skræp",category:"magic_weapon",cost:40,rules:"Always wounds on 4+ or better and allows no save of any kind."},
    {id:"mjolner",name:"Mjølner",category:"magic_weapon",cost:40,rules:"Thrown magical weapon: range 18 inches, Strength 10, Multiple Wounds 1D3; always returns and cannot be used in melee."},
    {id:"gridarvol",name:"Gridarvol",category:"magic_weapon",cost:50,rules:"Double handed weapon that hits at Strength 10."},
    {id:"gungner",name:"Gungner",category:"magic_weapon",cost:50,rules:"Spear dedicated to one enemy before battle; if that enemy is hit by it in melee, the enemy is slain."},
    {id:"mimings_sword",name:"Miming's Sword",category:"magic_weapon",cost:80,rules:"Always wounds and allows no armour save."},
    {id:"svalin",name:"Svalin, The Sun Shield",category:"magic_armour",cost:15,rules:"Shield; +1 armour save and bearer is immune to negative to-hit modifiers."},
    {id:"enchanted_wolf_pelt",name:"Enchanted Wolf Pelt",category:"magic_armour",cost:20,rules:"Light armour. Models on foot only. Armour saves ignore modifiers; may combine with shield."},
    {id:"belt_giant_strength",name:"Belt of Giant Strength",category:"enchanted_item",cost:20,rules:"+2 Strength; cumulative with Gloves of Giant Strength."},
    {id:"gloves_giant_strength",name:"Gloves of Giant Strength",category:"enchanted_item",cost:20,rules:"+2 Strength; cumulative with Belt of Giant Strength."},
    {id:"gjallahorn",name:"Gjallahorn",category:"enchanted_item",cost:50,rules:"One use. At the beginning of a Norse turn, every regiment may add 1D6 to its charge range."},
    {id:"andvares_gift",name:"Andvare's Gift",category:"enchanted_item",cost:80,rules:"Norse King or Jarl on foot only; permanently transforms the bearer into a Wyvern.",lordOnly:true},
    {id:"gandstaff",name:"Gandstaff",category:"arcane_item",cost:10,rules:"Wizard only. Bearer counts as one magic level higher when casting and dispelling.",wizardOnly:true},
    {id:"raven_banner",name:"Raven Banner",category:"magic_banner",cost:30,rules:"Regiment is immune to psychology."},
    {id:"banner_odin",name:"The Banner of Odin",category:"magic_banner",cost:40,rules:"Provides a 3+ natural dispel."}
  ];

  async function inflate(text) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support DecompressionStream.");
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  function addItems(target, items, sourceId, sourceName) {
    for (const item of items || []) {
      const copy = clone(item);
      copy.originalId = item.id;
      copy.id = `dow_${sourceId}__${item.id}`;
      copy.dowSourceFaction = sourceId;
      copy.dowSourceName = sourceName;
      target.push(copy);
    }
  }

  async function fetchArmy(path) {
    try {
      const response = await previousFetch(`./data/${path}`, {cache:"no-store"});
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.warn("Dogs of War borrowed army data skipped", path, error);
      return null;
    }
  }

  async function prepareDogsOfWar() {
    const payloadResponse = await previousFetch("./data/whr_dogs_of_war_v0_1.payload", {cache:"no-store"});
    if (!payloadResponse.ok) throw new Error("Could not load Dogs of War payload");
    const data = JSON.parse(await inflate(await payloadResponse.text()));

    const empire = await fetchArmy("whr_empire_v0_1.json");
    data.commonMagicItems = clone(empire?.commonMagicItems || []);

    const borrowed = [];
    if (empire) addItems(borrowed, empire.factionMagicItems, "empire", "The Empire");
    addItems(borrowed, KISLEV_ITEMS, "kislev", "Kislev");
    addItems(borrowed, NORSE_ITEMS, "norse", "Norse");

    const sources = [
      ["high_elves", "High Elves", "whr_high_elves_v0_1.json"],
      ["bretonnia", "Bretonnia", "whr_bretonnia_v0_1.json"],
      ["dwarfs", "Dwarfs", "whr_dwarfs_v0_1.json"],
      ["chaos_dwarfs", "Chaos Dwarfs", "whr_chaos_dwarfs_v0_1.json"],
      ["classic_undead", "Undead", "whr_classic_undead_v0_1.json"]
    ];
    for (const [id, name, file] of sources) {
      const source = await fetchArmy(file);
      if (!source) continue;
      addItems(borrowed, source.factionMagicItems, id, name);
      if (id === "dwarfs" && source.faction?.systems?.runes) data.faction.systems.dwarfRunes = clone(source.faction.systems.runes);
    }

    // If these books gain populated builder datasets later, their source data is
    // imported too; de-duplication by prefixed ID below means the live dataset wins.
    try {
      const manifestResponse = await previousFetch("./data/armies.json", {cache:"no-store"});
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        for (const id of ["kislev", "norse", "ogre_mercenaries"]) {
          const army = (manifest.armies || []).find(a => a.id === id && a.available);
          if (!army) continue;
          const source = await fetchArmy(army.dataFile);
          if (source) addItems(borrowed, source.factionMagicItems, id, army.name);
        }
      }
    } catch (error) {
      console.warn("Dogs of War future borrowed pools skipped", error);
    }

    // Later imports should replace embedded fallbacks when the same prefixed ID exists.
    data.factionMagicItems = [...new Map(borrowed.map(item => [item.id, item])).values()];
    data.faction.systems.borrowedItemPools = {
      human:["empire","bretonnia","kislev"],
      high_elves:["high_elves"],
      empire:["empire"],
      dwarfs:["dwarfs"],
      ogre:["ogre_mercenaries"],
      norse:["norse"],
      chaos_dwarfs:["chaos_dwarfs"],
      undead:["classic_undead"]
    };
    return data;
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (url.endsWith("data/whr_dogs_of_war_v0_1.json") || url.endsWith("/whr_dogs_of_war_v0_1.json")) {
      const data = await prepareDogsOfWar();
      return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
    }
    return previousFetch(input, init);
  };
})();