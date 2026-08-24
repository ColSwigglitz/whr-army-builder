// GENERATED FILE - DO NOT EDIT DIRECTLY.
// Built by tools/build_dev_bundle.py as dev_army_bundle.js.

/* ===== BEGIN bootstrap.js ===== */
// Loads compact faction data used by armies that reuse shared data.
(() => {
  const nativeFetch = window.fetch.bind(window);

  async function inflateBase64Gzip(text) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support DecompressionStream.");
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  async function loadCommonMagicItems() {
    const empireResponse = await nativeFetch("./data/whr_empire_v0_1.json", { cache: "no-store" });
    if (!empireResponse.ok) throw new Error("Could not load common magic items.");
    const empire = await empireResponse.json();
    return empire.commonMagicItems || [];
  }

  async function loadCompactFactionPayload(payloadFile) {
    const payloadResponse = await nativeFetch(`./data/${payloadFile}`, { cache:"no-store" });
    if (!payloadResponse.ok) throw new Error(`Could not load ${payloadFile} (${payloadResponse.status})`);
    const data = JSON.parse(await inflateBase64Gzip(await payloadResponse.text()));
    if (!data.commonMagicItems?.length) data.commonMagicItems = await loadCommonMagicItems();
    return data;
  }

  function addProfile(data, profile) {
    data.profiles = data.profiles || [];
    if (!data.profiles.some(p => p.id === profile.id)) data.profiles.push(profile);
  }

  function addRules(unit, rules) {
    if (!unit) return;
    unit.rules = [...new Set([...(unit.rules || []), ...rules])];
  }

  function allFactionUnits(data) {
    const faction = data.faction || {};
    return ["characters", "regiments", "warMachines", "specialCharacters"].flatMap(key => faction[key] || []);
  }

  function findUnit(data, names) {
    const wanted = (Array.isArray(names) ? names : [names]).map(name => name.toLowerCase());
    return allFactionUnits(data).find(unit => wanted.includes(String(unit.name || "").toLowerCase()));
  }

  function patchOrcsAndGoblins(data) {
    addProfile(data, { id:"giant", name:"Giant", stats:{M:6,WS:3,BS:3,S:7,T:6,W:6,I:3,A:"special",Ld:6} });
    addProfile(data, { id:"light_chariot", name:"Light Chariot", stats:{M:null,WS:null,BS:null,S:4,T:4,W:4,I:null,A:null,Ld:null} });
    addProfile(data, { id:"heavy_chariot", name:"Heavy Chariot", stats:{M:null,WS:null,BS:null,S:5,T:5,W:4,I:null,A:null,Ld:null} });
    addProfile(data, { id:"war_machine", name:"War Machine", stats:{M:null,WS:null,BS:null,S:null,T:7,W:3,I:null,A:null,Ld:null} });
    addProfile(data, { id:"spider_swarm", name:"Spider Swarm", stats:{M:4,WS:2,BS:0,S:3,T:2,W:5,I:1,A:5,Ld:10} });
    addProfile(data, { id:"gargantuan_spider", name:"Gargantuan Spider", stats:{M:7,WS:4,BS:0,S:5,T:5,W:8,I:4,A:8,Ld:6} });

    const giant = findUnit(data,["Giant","Giants"]);
    if (giant) { giant.profileId="giant"; addRules(giant,["Large","Terror","Not immune to psychology","Uses the Giant special attack rules from the Warhammer Renaissance main rulebook.","Falls over when slain and may also fall over in circumstances described by the Giant rules."]); }
    const wolfChariot=findUnit(data,["Goblin Wolf Chariot","Goblin Wolf Chariots"]);
    if(wolfChariot){wolfChariot.profileId="light_chariot";wolfChariot.crew=wolfChariot.crew||{baseCount:2,profileId:"common_goblin",name:"Common Goblins"};addRules(wolfChariot,["Light Chariot","Combined armour save 5+."]);}
    const boarChariot=findUnit(data,["Orc Boar Chariot","Orc Boar Chariots"]);
    if(boarChariot){boarChariot.profileId="heavy_chariot";boarChariot.crew=boarChariot.crew||{baseCount:2,profileId:"common_orc",name:"Common Orcs"};addRules(boarChariot,["Heavy Chariot","Combined armour save 4+."]);}
    const spiderSwarm=findUnit(data,["Spider Swarm","Spider Swarms"]); if(spiderSwarm){spiderSwarm.profileId="spider_swarm";addRules(spiderSwarm,["Swarm"]);}
    const monstrousSpider=findUnit(data,["Monstrous Spider","Monstrous Spiders"]); if(monstrousSpider){monstrousSpider.profileId="monstrous_spider";addRules(monstrousSpider,["Small monster"]);}
    const gargantuanSpider=findUnit(data,["Gargantuan Spider"]); if(gargantuanSpider){gargantuanSpider.profileId="gargantuan_spider";addRules(gargantuanSpider,["Large monster","Terror","4+ armour save","Immune to psychology","Poisonous attacks: +1 Strength against living models.","Too large to be a forester or to scale buildings like regular spiders.","Base size 50x100mm."]);}
    for(const unit of data.faction?.warMachines||[]){if(!unit.profileId&&/bolt|lobber|diver|catapult|thrower|war machine/i.test(unit.name||"")) unit.profileId="war_machine";}
    return data;
  }

  async function mergeSharedFactionData(data) {
    const sharedFile = data?.meta?.sharedDataFile;
    if (!sharedFile) return data;
    const sharedResponse = await nativeFetch(`./data/${sharedFile}`, { cache:"no-store" });
    if (!sharedResponse.ok) throw new Error(`Could not load shared faction data: ${sharedFile}`);
    const shared = await sharedResponse.json();
    data.equipment = [...(shared.equipment||[]), ...(data.equipment||[])];
    data.profiles = [...(shared.profiles||[]), ...(data.profiles||[])];
    data.mounts = [...(shared.mounts||[]), ...(data.mounts||[])];
    data.faction.armyWideRules = [...(shared.armyWideRules||[]), ...(data.faction.armyWideRules||[])];
    if (!data.commonMagicItems?.length) data.commonMagicItems = await loadCommonMagicItems();
    return data;
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";

    if (url.endsWith("data/whr_high_elves_v0_1.json") || url.endsWith("/whr_high_elves_v0_1.json")) {
      const highElves = await loadCompactFactionPayload("whr_high_elves_v0_1.payload");
      return new Response(JSON.stringify(highElves), {status:200,headers:{"Content-Type":"application/json"}});
    }

    if (url.endsWith("data/whr_chaos_v0_1.json") || url.endsWith("/whr_chaos_v0_1.json")) {
      const chaos = await loadCompactFactionPayload("whr_chaos_v0_1.payload");
      return new Response(JSON.stringify(chaos), {status:200,headers:{"Content-Type":"application/json"}});
    }

    if (url.endsWith("data/whr_orcs_goblins_v0_1.json") || url.endsWith("/whr_orcs_goblins_v0_1.json")) {
      const response = await nativeFetch(input, init); if(!response.ok) return response;
      const data = patchOrcsAndGoblins(await response.json());
      return new Response(JSON.stringify(data), {status:200,headers:{"Content-Type":"application/json"}});
    }

    const response = await nativeFetch(input, init);
    if (!response.ok || !url.endsWith(".json")) return response;
    try {
      const data = await response.clone().json();
      if (!data?.meta?.sharedDataFile) return response;
      await mergeSharedFactionData(data);
      return new Response(JSON.stringify(data), {status:200,headers:{"Content-Type":"application/json"}});
    } catch (error) {
      console.error("Unable to merge shared faction data", error);
      return response;
    }
  };
})();

// Development-only Mighty Empires campaign prototype.
(() => {
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "campaign.css?v=1";
  document.head.appendChild(css);

  const script = document.createElement("script");
  script.src = "campaign.js?v=1";
  script.defer = true;
  document.head.appendChild(script);
})();
;
/* ===== END bootstrap.js ===== */

/* ===== BEGIN chaos_dwarfs_payload_loader.js ===== */
// Loads the compact Chaos Dwarfs payload and supplements its magic-item pools.
(() => {
  const previousFetch = window.fetch.bind(window);

  async function inflateBase64Gzip(text) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support DecompressionStream.");
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  function cloneItem(item) {
    return JSON.parse(JSON.stringify(item));
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.endsWith("data/whr_chaos_dwarfs_v0_1.json") && !url.endsWith("/whr_chaos_dwarfs_v0_1.json")) {
      return previousFetch(input, init);
    }

    const payloadResponse = await previousFetch("./data/whr_chaos_dwarfs_v0_1.payload", { cache: "no-store" });
    if (!payloadResponse.ok) throw new Error(`Could not load Chaos Dwarfs payload (${payloadResponse.status})`);
    const data = JSON.parse(await inflateBase64Gzip(await payloadResponse.text()));

    // Common magic items are shared by every army.
    const empireResponse = await previousFetch("./data/whr_empire_v0_1.json", { cache: "no-store" });
    if (empireResponse.ok) {
      const empire = await empireResponse.json();
      data.commonMagicItems = empire.commonMagicItems || [];
    }

    // Greenskin characters/champions in the Chaos Dwarf list are explicitly allowed
    // to select items from the Orcs & Goblins army book. Prefix IDs to avoid clashes.
    const orcResponse = await previousFetch("./data/whr_orcs_goblins_v0_1.json", { cache: "no-store" });
    if (orcResponse.ok) {
      const orcs = await orcResponse.json();
      for (const item of orcs.factionMagicItems || []) {
        const copy = cloneItem(item);
        copy.id = `og_${item.id}`;
        copy.chaosDwarfExternalPool = "orcs_goblins";
        data.factionMagicItems.push(copy);
      }
    }

    // A K'daii Manburner may take one Daemonic Reward from the Chaos "All" list.
    const chaosResponse = await previousFetch("./data/whr_chaos_v0_1.json", { cache: "no-store" });
    if (chaosResponse.ok) {
      const chaos = await chaosResponse.json();
      for (const item of chaos.factionMagicItems || []) {
        if (!item.daemonReward || item.chaosPower) continue;
        const copy = cloneItem(item);
        copy.id = `cd_daemon_${item.id}`;
        copy.category = "daemon_reward";
        copy.chaosDwarfExternalPool = "daemon_reward_all";
        data.factionMagicItems.push(copy);
      }
    }

    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  };
})();
;
/* ===== END chaos_dwarfs_payload_loader.js ===== */

/* ===== BEGIN wood_elves_loader.js ===== */
// Wood Elves compact payload loader and common-item enrichment.
(() => {
  const previousFetch = window.fetch.bind(window);
  async function inflate(text) {
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }
  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  function patch(data) {
    const byId = id => [...(data.faction.characters||[]),...(data.faction.regiments||[]),...(data.faction.warMachines||[]),...(data.faction.specialCharacters||[])].find(u=>u.id===id);
    // Fixed weapons are important for armour/missile legality and print output.
    const fixed = {
      wood_elf_archers:["wood_elf_longbow"], wood_elf_warriors:["shield"],
      way_watchers:["wood_elf_longbow"], wood_elf_scouts:["wood_elf_longbow"],
      glade_riders:["light_armour","spear","bow"], wood_elf_lords:["light_armour","shield","lance"],
      eternal_guard:["spear","light_armour","shield"], rangers:["light_armour","double_handed_weapon"],
      wild_riders:["spear"], sisters_thorn:["spear"], falconers:[], war_dancers:["shield"]
    };
    for (const [id,eq] of Object.entries(fixed)) { const u=byId(id); if(u)u.fixedEquipment=eq; }
    for (const id of ["wood_elf_warlord","wood_elf_hero"]) {
      const u=byId(id); if(!u)continue;
      u.options=[...(u.options||[]),
        {id:"shield",name:"Shield",type:"toggle",cost:{type:"fixed",value:0}},
        {id:"light_armour",name:"Light Armour",type:"toggle",cost:{type:"fixed",value:0}}];
      const steed=(u.mountOptions||[]).find(m=>m.mountId==="elven_steed");
      if(steed)u.mountOptions.push({mountId:"barded_elven_steed",cost:steed.cost});
    }
    const bsb=byId("wood_elf_bsb");
    if(bsb){bsb.options=[{id:"light_armour",name:"Light Armour",type:"toggle",cost:{type:"fixed",value:0}}];bsb.mountOptions.push({mountId:"barded_elven_steed",cost:13});}
    for (const id of ["mage_lord","master_mage","mage_champion","mage"]) {
      const u=byId(id), steed=u&&(u.mountOptions||[]).find(m=>m.mountId==="elven_steed");
      if(steed)u.mountOptions.push({mountId:"barded_elven_steed",cost:steed.cost});
    }
    const orion=byId("orion"); if(orion)orion.options=[{id:"hunting_dogs",name:"Hunting Dogs",type:"quantity",minimum:0,cost:{type:"fixed",value:10}}];
    return data;
  }
  async function prepare() {
    const p=await previousFetch("./data/whr_wood_elves_v0_1.payload",{cache:"no-store"});
    if(!p.ok)throw new Error("Could not load Wood Elf payload");
    const data=patch(JSON.parse(await inflate(await p.text())));
    const e=await previousFetch("./data/whr_empire_v0_1.json",{cache:"no-store"});
    if(e.ok)data.commonMagicItems=clone((await e.json()).commonMagicItems||[]);
    return data;
  }
  window.fetch=async function(input,init){
    const url=typeof input==="string"?input:input?.url||"";
    if(url.endsWith("data/whr_wood_elves_v0_1.json")||url.endsWith("/whr_wood_elves_v0_1.json")){
      try{return new Response(JSON.stringify(await prepare()),{status:200,headers:{"Content-Type":"application/json"}});}
      catch(error){console.error("Unable to prepare Wood Elf data",error);return new Response(JSON.stringify({error:String(error)}),{status:500,headers:{"Content-Type":"application/json"}});}
    }
    return previousFetch(input,init);
  };
})();
;
/* ===== END wood_elves_loader.js ===== */

/* ===== BEGIN dwarf_payload_loader.js ===== */
// Inflates the populated Dwarf army payload while keeping the manifest JSON compact.
(() => {
  const previousFetch = window.fetch.bind(window);

  function normalise(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function zeroOneKey(unit) {
    const id = normalise(unit?.id);
    const name = normalise(unit?.name);
    const combined = `${id} ${name}`;

    if (/\blong\s*beards?\b/.test(combined) || /\blongbeards?\b/.test(combined)) return "longbeards";
    if (/\bhammerers?\b/.test(combined)) return "hammerers";
    if (/\biron\s*breakers?\b/.test(combined) || /\bironbreakers?\b/.test(combined)) return "ironbreakers";
    if (/\brangers?\b/.test(combined)) return "rangers";
    if (/\bminers?\b/.test(combined)) return "miners";
    if (/\bgoblin\s+hewer\b/.test(combined)) return "goblin_hewer";
    return null;
  }

  function markZeroOneChoices(data) {
    for (const sectionKey of ["regiments", "warMachines"]) {
      for (const unit of data?.faction?.[sectionKey] || []) {
        if (!zeroOneKey(unit)) continue;
        unit.rules = Array.isArray(unit.rules) ? unit.rules : [];
        if (!unit.rules.some(rule => /^0\s*-\s*1$/i.test(String(rule).trim()))) unit.rules.unshift("0-1");
        unit.maxUnits = 1;
      }
    }
    return data;
  }

  async function inflateBase64Gzip(text) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support DecompressionStream.");
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    const response = await previousFetch(input, init);
    if (!response.ok || !(url.endsWith("data/whr_dwarfs_v0_1.json") || url.endsWith("/whr_dwarfs_v0_1.json"))) return response;

    try {
      const stub = await response.clone().json();
      const payloadFile = stub?.meta?.payloadFile;
      if (!payloadFile) return response;
      const payloadResponse = await previousFetch(`./data/${payloadFile}`, {cache:"no-store"});
      if (!payloadResponse.ok) throw new Error(`Could not load ${payloadFile}`);
      const data = markZeroOneChoices(JSON.parse(await inflateBase64Gzip(await payloadResponse.text())));
      return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
    } catch (error) {
      console.error("Unable to load populated Dwarf army data", error);
      return response;
    }
  };
})();
;
/* ===== END dwarf_payload_loader.js ===== */

/* ===== BEGIN dogs_of_war_loader.js ===== */
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
;
/* ===== END dogs_of_war_loader.js ===== */

/* ===== BEGIN lizardmen_loader.js ===== */
// Inflates the pure Lizardmen army payload and loads the shared common magic-item pool.
(() => {
  const previousFetch = window.fetch.bind(window);

  async function inflate(text) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support DecompressionStream.");
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  function patchData(data) {
    const regiment = id => (data.faction?.regiments || []).find(unit => unit.id === id);
    const character = id => (data.faction?.characters || []).find(unit => unit.id === id);

    const saurusRiders = regiment("saurus_cold_one_riders");
    const skinkRiders = regiment("great_crested_cold_one_riders");
    const terradons = regiment("terradon_riders");
    if (saurusRiders) saurusRiders.unitMount = {mountId:"cold_one", name:"Cold Ones"};
    if (skinkRiders) skinkRiders.unitMount = {mountId:"cold_one", name:"Cold Ones"};
    if (terradons) terradons.unitMount = {mountId:"terradon", name:"Terradons"};

    // Character equipment groups use one common cost for each choice.
    const skinkHero = character("skink_hero");
    const missiles = skinkHero?.equipmentOptions?.find(group => group.id === "missile_weapon");
    if (missiles) {
      missiles.choices = ["poisoned_javelins","poisoned_short_bow","poisoned_blowpipe"];
      missiles.cost = 10;
    }
    return data;
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    const response = await previousFetch(input, init);
    if (!response.ok || !(url.endsWith("data/whr_lizardmen_v0_1.json") || url.endsWith("/whr_lizardmen_v0_1.json"))) return response;

    try {
      const stub = await response.clone().json();
      const payloadFile = stub?.meta?.payloadFile;
      if (!payloadFile) return response;
      const payloadResponse = await previousFetch(`./data/${payloadFile}`, {cache:"no-store"});
      if (!payloadResponse.ok) throw new Error(`Could not load ${payloadFile}`);
      const data = patchData(JSON.parse(await inflate(await payloadResponse.text())));

      const commonResponse = await previousFetch("./data/whr_empire_v0_1.json", {cache:"no-store"});
      if (commonResponse.ok) data.commonMagicItems = (await commonResponse.json()).commonMagicItems || [];

      return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
    } catch (error) {
      console.error("Unable to load populated Lizardmen army data", error);
      return response;
    }
  };
})();
;
/* ===== END lizardmen_loader.js ===== */

/* ===== BEGIN kislev_loader.js ===== */
// Loads the compact Kislev payload and supplies the shared common magic-item pool.
(() => {
  const previousFetch = window.fetch.bind(window);

  async function inflateBase64Gzip(text) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support DecompressionStream.");
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  function correctMonsterMounts(data) {
    const profile = (id, stats) => {
      const item = (data.profiles || []).find(p => p.id === id);
      if (item) item.stats = { ...stats };
    };
    const rules = (id, mountRules) => {
      const item = (data.mounts || []).find(m => m.id === id);
      if (item) item.rules = [...mountRules];
    };

    profile("wyvern", { M:6, WS:5, BS:0, S:5, T:6, W:4, I:4, A:3, Ld:5 });
    profile("griffon", { M:6, WS:5, BS:0, S:6, T:5, W:5, I:7, A:4, Ld:8 });
    profile("manticore", { M:6, WS:6, BS:0, S:7, T:7, W:5, I:4, A:4, Ld:8 });
    profile("chimera", { M:6, WS:4, BS:0, S:7, T:6, W:6, I:4, A:6, Ld:8 });

    rules("wyvern", ["Large flying monster", "Causes terror", "4+ armour save from scaly skin"]);
    rules("griffon", ["Large flying monster", "Causes terror"]);
    rules("manticore", ["Large flying monster", "Causes terror"]);
    rules("chimera", ["Large flying monster", "Causes terror", "Three-headed Chimera: one Strength 4 flaming breath attack"]);
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.endsWith("data/whr_kislev_v0_1.json") && !url.endsWith("/whr_kislev_v0_1.json")) {
      return previousFetch(input, init);
    }

    const stubResponse = await previousFetch(input, init);
    if (!stubResponse.ok) return stubResponse;
    const stub = await stubResponse.clone().json();
    if (!stub?.meta?.payloadFile) return stubResponse;

    const payloadResponse = await previousFetch(`./data/${stub.meta.payloadFile}`, { cache: "no-store" });
    if (!payloadResponse.ok) throw new Error(`Could not load Kislev payload (${payloadResponse.status})`);
    const data = JSON.parse(await inflateBase64Gzip(await payloadResponse.text()));
    correctMonsterMounts(data);

    const empireResponse = await previousFetch("./data/whr_empire_v0_1.json", { cache: "no-store" });
    if (empireResponse.ok) {
      const empire = await empireResponse.json();
      data.commonMagicItems = empire.commonMagicItems || [];
    }

    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  };
})();
;
/* ===== END kislev_loader.js ===== */

/* ===== BEGIN norse_loader.js ===== */
// Loads the compact Norse payload, common items and Dwarf rune definitions.
(() => {
  const previousFetch = window.fetch.bind(window);
  const clone = v => JSON.parse(JSON.stringify(v));
  async function inflate(text) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support DecompressionStream.");
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }
  async function fetchJson(path) {
    const response = await previousFetch(path, {cache:"no-store"});
    return response.ok ? response.json() : null;
  }
  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.endsWith("data/whr_norse_v0_1.json") && !url.endsWith("/whr_norse_v0_1.json")) return previousFetch(input, init);
    const stubResponse = await previousFetch(input, init);
    if (!stubResponse.ok) return stubResponse;
    const stub = await stubResponse.clone().json();
    if (!stub?.meta?.payloadFile) return stubResponse;
    const payloadResponse = await previousFetch(`./data/${stub.meta.payloadFile}`, {cache:"no-store"});
    if (!payloadResponse.ok) throw new Error(`Could not load Norse payload (${payloadResponse.status})`);
    const data = JSON.parse(await inflate(await payloadResponse.text()));
    const empire = await fetchJson("./data/whr_empire_v0_1.json");
    if (empire) data.commonMagicItems = clone(empire.commonMagicItems || []);
    const dwarfs = await fetchJson("./data/whr_dwarfs_v0_1.json");
    if (dwarfs?.faction?.systems?.runes) data.faction.systems.dwarfRunes = clone(dwarfs.faction.systems.runes);
    return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
  };
})();
;
/* ===== END norse_loader.js ===== */

/* ===== BEGIN slann_empire_loader.js ===== */
// Inflates The Slann Empire payload and supplies the shared Common magic-item pool.
(() => {
  const previousFetch = window.fetch.bind(window);

  async function inflate(text) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support DecompressionStream.");
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    const response = await previousFetch(input, init);
    if (!response.ok || !(url.endsWith("data/whr_slann_empire_v0_1.json") || url.endsWith("/whr_slann_empire_v0_1.json"))) return response;

    try {
      const stub = await response.clone().json();
      if (!stub?.meta?.payloadFile) return response;
      const payloadResponse = await previousFetch(`./data/${stub.meta.payloadFile}`, {cache:"no-store"});
      if (!payloadResponse.ok) throw new Error(`Could not load ${stub.meta.payloadFile}`);
      const data = JSON.parse(await inflate(await payloadResponse.text()));
      const empireResponse = await previousFetch("./data/whr_empire_v0_1.json", {cache:"no-store"});
      if (empireResponse.ok) data.commonMagicItems = (await empireResponse.json()).commonMagicItems || [];
      return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
    } catch (error) {
      console.error("Unable to load populated Slann Empire army data", error);
      return response;
    }
  };
})();
;
/* ===== END slann_empire_loader.js ===== */

/* ===== BEGIN global_release_rules.js ===== */
// Global WHR v1.0 release-rule hardening.
// Loaded immediately after app.js so later army-specific extensions wrap these
// corrected generic behaviours rather than having to compensate per faction.
(() => {
  const ARMOUR_EQUIPMENT = new Set(["light_armour", "heavy_armour", "full_plate_armour"]);

  function magicSettings(unit, context) {
    return context === "champion" ? unit?.champion?.magicItems : unit?.magicItems;
  }

  function collectEquipmentIds(value, output = new Set()) {
    if (!value) return output;
    if (typeof value === "string") { output.add(value); return output; }
    if (Array.isArray(value)) { value.forEach(item => collectEquipmentIds(item, output)); return output; }
    if (typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (["cost", "points", "rules", "name", "type", "id"].includes(key)) continue;
        collectEquipmentIds(child, output);
      }
      if (typeof value.id === "string" && /armour|shield|weapon|spear|lance|flail|bow|crossbow|handgun|pistol|halberd/i.test(value.id)) output.add(value.id);
    }
    return output;
  }

  function mundaneEquipmentAccess(unit, context) {
    const ids = new Set();
    collectEquipmentIds(unit?.equipment, ids);
    collectEquipmentIds(unit?.fixedEquipment, ids);
    collectEquipmentIds(unit?.equipmentOptions, ids);
    collectEquipmentIds(unit?.options, ids);
    if (context === "champion") {
      collectEquipmentIds(unit?.champion?.equipment, ids);
      collectEquipmentIds(unit?.champion?.fixedEquipment, ids);
      collectEquipmentIds(unit?.champion?.equipmentOptions, ids);
      collectEquipmentIds(unit?.champion?.options, ids);
    }
    return ids;
  }

  function meetsMagicRequirement(requirement, unit, context) {
    const access = mundaneEquipmentAccess(unit, context);
    const req = String(requirement || "");
    if (req === "bearer_can_wear_armour") return [...ARMOUR_EQUIPMENT].some(id => access.has(id));
    if (req.startsWith("bearer_can_take_")) return access.has(req.slice("bearer_can_take_".length));
    return true;
  }

  function itemEligibleForBearer(item, unit, context) {
    return (item?.requirements || []).every(req => meetsMagicRequirement(req, unit, context));
  }

  getAllowedMagicItems = function(unit, context) {
    const settings = magicSettings(unit, context);
    if (!settings) return [];
    const pools = settings.allowedPools || ["common", "faction"];
    const categories = settings.allowedCategories || ["magic_weapon", "magic_armour", "enchanted_item", "arcane_item", "familiar"];
    const result = [];
    if (pools.includes("common")) result.push(...(state.data?.commonMagicItems || []));
    if (pools.some(pool => pool !== "common")) result.push(...(state.data?.factionMagicItems || []));
    let filtered = result.filter(item => categories.includes(item.category));
    filtered = filtered.filter(item => itemEligibleForBearer(item, unit, context));
    const selectedIds = context === "champion" ? (state.draft?.champion?.magicItems || []) : (state.draft?.magicItems || []);
    const selectedArmour = selectedIds.find(id => getMagicItem(id)?.category === "magic_armour");
    if (selectedArmour) filtered = filtered.filter(item => item.category !== "magic_armour" || item.id === selectedArmour);
    return [...new Map(filtered.map(item => [item.id, item])).values()];
  };

  function effectiveRegimentMinimum(unit) {
    const stated = Math.max(1, Number(unit?.size?.minimum || 1));
    const modelCost = Number(unit?.points?.value || 0);
    const minimumModelPoints = Number(state.data?.globalArmyRules?.minimumRegimentModelPoints || 50);
    if (unit?.points?.type !== "per_model" || modelCost <= 0 || minimumModelPoints <= 0) return stated;
    return Math.max(stated, Math.ceil(minimumModelPoints / modelCost));
  }

  function applyEffectiveRegimentMinimums() {
    for (const unit of state.data?.faction?.regiments || []) {
      unit.size = unit.size || {};
      unit.size.minimum = effectiveRegimentMinimum(unit);
    }
  }

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!state.data) return;
    applyEffectiveRegimentMinimums();
    renderUnitBrowser();
    renderArmy();
  };

  window.whrEffectiveRegimentMinimum = effectiveRegimentMinimum;
  window.whrApplyEffectiveRegimentMinimums = applyEffectiveRegimentMinimums;
  window.whrMagicItemEligibleForBearer = itemEligibleForBearer;
})();
;
/* ===== END global_release_rules.js ===== */

/* ===== BEGIN army_extensions.js ===== */
// Extra army-specific builder behaviour that sits on top of the generic app.js engine.
// Kept separate so faction-specific systems do not make the core builder harder to maintain.
(() => {
  state.armyOptions = state.armyOptions || {};

  const BLOODLINE_TAGS = {
    von_carstein_only: "von_carstein",
    necrarch_only: "necrarch",
    blood_dragon_only: "blood_dragon",
    lahmian_only: "lahmian",
    strigoi_only: "strigoi"
  };

  document.head.insertAdjacentHTML("beforeend", `
    <style>
      .army-system-panel {
        margin: 0 0 12px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        border: 1px solid var(--border);
        border-left: 4px solid var(--accent);
        border-radius: 8px;
        background: #fffaf0;
      }
      .army-system-panel.warn { border-left-color: var(--warning); background: #fff7e8; }
      .army-system-copy strong { display:block; font-family: Georgia, serif; font-size:15px; }
      .army-system-copy span { display:block; margin-top:3px; color:var(--muted); font-size:11px; line-height:1.35; }
      .army-system-select { min-width:190px; padding:8px 9px; border:1px solid var(--border); border-radius:6px; background:#fff; }
      .bloodline-editor { margin-top:18px; }
      .bloodline-power-list { margin-top:8px; }
      .bloodline-counter { padding:4px 8px; border-radius:999px; background:#eee5d6; color:var(--accent-dark); font-size:12px; font-weight:800; }
      .bloodline-rule-note { margin:8px 0 0; padding:8px 10px; border:1px solid var(--border); border-radius:6px; background:var(--surface-soft); color:var(--muted); font-size:12px; }
      @media (max-width:620px) {
        .army-system-panel { align-items:stretch; flex-direction:column; }
        .army-system-select { width:100%; }
      }
    </style>
  `);

  function bloodlineSystem() {
    return state.data?.faction?.systems?.bloodline || null;
  }

  function selectedBloodline() {
    return state.armyOptions?.bloodline || null;
  }

  function bloodlineName(id) {
    return bloodlineSystem()?.choices?.find(choice => choice.id === id)?.name || humanise(id);
  }

  function isVampire(unit) {
    return (unit?.tags || []).includes("vampire");
  }

  function unitBloodlineRequirement(unit) {
    if (unit?.bloodlineOnly) return unit.bloodlineOnly;
    for (const tag of unit?.tags || []) {
      if (BLOODLINE_TAGS[tag]) return BLOODLINE_TAGS[tag];
    }
    return null;
  }

  function unitAllowedForSelectedBloodline(unit) {
    const required = unitBloodlineRequirement(unit);
    return !required || required === selectedBloodline();
  }

  function bloodlinePowersForCurrentArmy() {
    const bloodline = selectedBloodline();
    if (!bloodline) return [];
    return bloodlineSystem()?.powers?.[bloodline] || [];
  }

  function getBloodlinePower(id) {
    return Object.values(bloodlineSystem()?.powers || {})
      .flat()
      .find(power => power.id === id) || null;
  }

  function powerUsedElsewhere(powerId, entryId) {
    return state.roster.some(entry =>
      entry.id !== entryId && (entry.bloodlinePowers || []).includes(powerId)
    );
  }

  function bloodlinePowerLimit(entry, unit) {
    if (!isVampire(unit)) return 0;
    if (unit.bloodlinePowers?.maximum != null) {
      if (selectedBloodline() === "strigoi" && unit.bloodlinePowers.strigoiMaximum != null) {
        return Number(unit.bloodlinePowers.strigoiMaximum);
      }
      return Number(unit.bloodlinePowers.maximum);
    }
    if (unit.combinedMagicAndBloodlineLimit != null) {
      return Math.max(0, Number(unit.combinedMagicAndBloodlineLimit) - (entry.magicItems || []).length);
    }
    return 0;
  }

  function vampireWizardConfig(unit) {
    if (!isVampire(unit) || !unit.wizardUpgrade) return null;
    const bloodline = selectedBloodline();
    if (bloodline === "blood_dragon" || bloodline === "strigoi") return null;
    if (bloodline === "necrarch") {
      return {
        minimumLevels: 1,
        maximumLevels: 4,
        costPerLevel: Number(unit.wizardUpgrade.costPerLevel || 60),
        lores: unit.wizardUpgrade.lores || []
      };
    }
    return {
      minimumLevels: 0,
      maximumLevels: Number(unit.wizardUpgrade.maximumLevels || 0),
      costPerLevel: Number(unit.wizardUpgrade.costPerLevel || 60),
      lores: unit.wizardUpgrade.lores || []
    };
  }

  function normalizeVampireEntry(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!isVampire(unit)) return;
    entry.bloodlinePowers = entry.bloodlinePowers || [];

    const bloodline = selectedBloodline();
    const allowedPowerIds = new Set(bloodlinePowersForCurrentArmy().map(power => power.id));
    entry.bloodlinePowers = entry.bloodlinePowers.filter(id => allowedPowerIds.has(id));

    const wizard = vampireWizardConfig(unit);
    if (!wizard) {
      entry.wizardLevels = 0;
    } else {
      entry.wizardLevels = Math.max(
        wizard.minimumLevels,
        Math.min(wizard.maximumLevels, Number(entry.wizardLevels || wizard.minimumLevels))
      );
    }

    if (bloodline === "strigoi") {
      entry.mount = null;
      entry.equipmentSelections = {};
      entry.extraEquipment = {};
      entry.magicItems = [];
    }

    if (bloodline === "lahmian") {
      entry.equipmentSelections = {};
      entry.extraEquipment = {};
    }
  }

  function bloodlineUnitView(unit, entry) {
    if (!isVampire(unit)) return unit;
    const bloodline = selectedBloodline();
    const view = clone(unit);

    if (view.combinedMagicAndBloodlineLimit != null && bloodline !== "strigoi") {
      const remaining = Math.max(0,
        Number(view.combinedMagicAndBloodlineLimit) - (entry.bloodlinePowers || []).length
      );
      view.magicItems = {
        maximum: remaining,
        allowedPools: ["common", "undead"],
        allowedCategories: ["magic_weapon", "magic_armour", "enchanted_item", "arcane_item", "familiar"]
      };
    }

    if (bloodline === "lahmian") {
      view.equipmentOptions = [];
    }

    if (bloodline === "strigoi") {
      view.equipmentOptions = [];
      view.mountOptions = [];
      view.magicItems = null;
    }

    if (bloodline === "blood_dragon") {
      const armour = (view.equipmentOptions || []).find(group => group.id === "armour");
      if (armour && !(armour.choices || []).includes("full_plate_armour")) {
        armour.choices = [...(armour.choices || []), "full_plate_armour"];
      }
      const undeadSteed = (view.mountOptions || []).find(mount => mount.mountId === "undead_steed");
      if (undeadSteed && !(view.mountOptions || []).some(mount => mount.mountId === "war_horse_vampire")) {
        view.mountOptions.push({
          mountId: "war_horse_vampire",
          cost: undeadSteed.cost,
          freeOptions: undeadSteed.freeOptions || []
        });
      }
    }

    return view;
  }

  function renderBloodlinePowerEditor(entry, unit) {
    if (!isVampire(unit) || !selectedBloodline()) return "";
    const powers = bloodlinePowersForCurrentArmy();
    const selected = entry.bloodlinePowers || [];
    const max = bloodlinePowerLimit(entry, unit);
    if (!powers.length || !max) return "";

    return `
      <section class="editor-section bloodline-editor">
        <div class="magic-header">
          <h3 class="editor-section-title" style="margin:0;">${escapeHtml(bloodlineName(selectedBloodline()))} Bloodline Powers</h3>
          <span class="bloodline-counter">${selected.length} / ${max}</span>
        </div>
        <div class="bloodline-power-list">
          ${powers.map(power => {
            const checked = selected.includes(power.id);
            const used = powerUsedElsewhere(power.id, entry.id);
            return `
              <label class="check-row">
                <input type="checkbox" data-bloodline-power="${escapeHtml(power.id)}"
                  ${checked ? "checked" : ""}
                  ${used && !checked ? "disabled" : ""}>
                <span class="check-row-content">
                  <span class="check-row-title">
                    <span>${escapeHtml(power.name)}</span>
                    <span>${Number(power.cost || 0) ? `+${formatPoints(power.cost)} pts` : "Free"}</span>
                  </span>
                  <span class="check-row-sub">${escapeHtml(power.rules || "")}</span>
                </span>
              </label>
            `;
          }).join("")}
        </div>
        <div class="field-hint">Bloodline powers are unique across the army, in the same way as magic items.</div>
      </section>
    `;
  }

  function renderVampireWizardEditor(entry, unit) {
    const config = vampireWizardConfig(unit);
    if (!config || config.maximumLevels <= 0) return "";
    const value = Math.max(config.minimumLevels, Number(entry.wizardLevels || config.minimumLevels));
    return `
      <section class="editor-section">
        <h3 class="editor-section-title">Magic Levels</h3>
        <div class="dialog-field">
          <label>Additional magic levels</label>
          <select data-vampire-wizard-levels>
            ${Array.from({length: config.maximumLevels - config.minimumLevels + 1}, (_, index) => index + config.minimumLevels)
              .map(level => `<option value="${level}" ${level === value ? "selected" : ""}>${level} level${level === 1 ? "" : "s"} ${level ? `(+${formatPoints(level * config.costPerLevel)} pts)` : ""}</option>`)
              .join("")}
          </select>
          <div class="field-hint">Available lore${config.lores.length === 1 ? "" : "s"}: ${escapeHtml(config.lores.join(", "))}. ${selectedBloodline() === "necrarch" ? "Necrarch Vampires must take at least one magic level and may buy up to four." : ""}</div>
        </div>
      </section>
    `;
  }

  function vampireBloodlineRuleNotes(unit) {
    if (!isVampire(unit) || !selectedBloodline()) return [];
    switch (selectedBloodline()) {
      case "lahmian":
        return ["Lahmian: hand weapon only, no armour, Initiative 11, always strikes first."];
      case "necrarch":
        return ["Necrarch: must buy at least one magic level; may buy up to four magic levels."];
      case "blood_dragon":
        return ["Blood Dragon: cannot become a spellcaster; may use Full Plate Armour and may exchange an Undead Steed for a living War Horse."];
      case "strigoi":
        return ["Strigoi: +1 Attack; cannot carry equipment or magic items and cannot ride a mount."];
      default:
        return [];
    }
  }

  // Generic magic-item pools: every non-common pool means the current faction's item list.
  const baseGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const settings = context === "champion" ? unit.champion?.magicItems : unit.magicItems;
    if (!settings) return [];
    const pools = settings.allowedPools || ["common", "faction"];
    const categories = settings.allowedCategories || ["magic_weapon","magic_armour","enchanted_item","arcane_item","familiar"];
    const result = [];
    if (pools.includes("common")) result.push(...(state.data.commonMagicItems || []));
    if (pools.some(pool => pool !== "common")) result.push(...(state.data.factionMagicItems || []));
    return result.filter(item => categories.includes(item.category));
  };

  const baseCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = baseCreateEntry(sectionKey, unit);
    entry.bloodlinePowers = [];
    entry.wizardLevels = 0;
    if (isVampire(unit)) normalizeVampireEntry(entry);
    return entry;
  };

  const baseCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = baseCalculateEntry(entry);
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit) return total;

    if (unit.wizardUpgrade && Number(entry.wizardLevels || 0) > 0) {
      total += Number(entry.wizardLevels || 0) * Number(unit.wizardUpgrade.costPerLevel || 60);
    }

    for (const powerId of entry.bloodlinePowers || []) {
      total += Number(getBloodlinePower(powerId)?.cost || 0);
    }

    return total;
  };

  const baseRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    if (!state.data?.faction || !bloodlineSystem()) return baseRenderUnitBrowser();
    const faction = state.data.faction;
    const backups = {};
    for (const section of sectionConfig) {
      backups[section.key] = faction[section.key] || [];
      faction[section.key] = backups[section.key].filter(unitAllowedForSelectedBloodline);
    }
    try {
      baseRenderUnitBrowser();
    } finally {
      for (const section of sectionConfig) faction[section.key] = backups[section.key];
    }
  };

  const baseRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    baseRenderArmyStatus(total);
    const system = bloodlineSystem();
    if (!system) return;

    const current = selectedBloodline() || "";
    const hasVampires = state.roster.some(entry => isVampire(getUnit(entry.sectionKey, entry.unitId)));
    const warning = hasVampires && !current;
    const panel = document.createElement("div");
    panel.className = `army-system-panel${warning ? " warn" : ""}`;
    panel.innerHTML = `
      <div class="army-system-copy">
        <strong>Vampire Bloodline</strong>
        <span>${warning ? "This army contains Vampires, so choose one bloodline for every Vampire in the army." : "Choose a bloodline to unlock its powers and exclusive units. Leave blank for an army with no Vampires."}</span>
      </div>
      <select class="army-system-select" data-army-bloodline>
        <option value="">No bloodline selected</option>
        ${(system.choices || []).map(choice => `<option value="${escapeHtml(choice.id)}" ${current === choice.id ? "selected" : ""}>${escapeHtml(choice.name)}</option>`).join("")}
      </select>
    `;
    els.armyStatus.prepend(panel);

    panel.querySelector("[data-army-bloodline]").addEventListener("change", event => {
      const next = event.target.value || null;
      const previous = selectedBloodline();
      if (next === previous) return;

      if (state.roster.length && previous && !window.confirm("Changing bloodline will remove bloodline-exclusive units that are no longer legal and clear existing Vampire powers. Continue?")) {
        event.target.value = previous;
        return;
      }

      state.armyOptions.bloodline = next;
      state.roster = state.roster.filter(entry => unitAllowedForSelectedBloodline(getUnit(entry.sectionKey, entry.unitId)));
      for (const entry of state.roster) {
        const unit = getUnit(entry.sectionKey, entry.unitId);
        if (isVampire(unit)) {
          entry.bloodlinePowers = [];
          normalizeVampireEntry(entry);
        }
      }
      renderUnitBrowser();
      renderArmy();
    });
  };

  const baseRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    normalizeVampireEntry(entry);
    const view = bloodlineUnitView(unit, entry);
    let html = baseRenderCharacterEditor(entry, view);
    html += renderVampireWizardEditor(entry, unit);
    html += renderBloodlinePowerEditor(entry, unit);
    const notes = vampireBloodlineRuleNotes(unit);
    if (notes.length) {
      html += `<section class="editor-section"><h3 class="editor-section-title">Bloodline Rules</h3>${notes.map(note => `<div class="bloodline-rule-note">${escapeHtml(note)}</div>`).join("")}</section>`;
    }
    return html.replace("common and Empire magic-item pools", "common and faction magic-item pools");
  };

  const baseWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    baseWireEditorControls();
    const entry = state.draft;
    const unit = getUnit(entry.sectionKey, entry.unitId);

    const wizardSelect = els.dialogContent.querySelector("[data-vampire-wizard-levels]");
    if (wizardSelect) {
      wizardSelect.addEventListener("change", () => {
        entry.wizardLevels = Number(wizardSelect.value || 0);
        updateDialogTotal();
      });
    }

    els.dialogContent.querySelectorAll("[data-bloodline-power]").forEach(check => {
      check.addEventListener("change", () => {
        entry.bloodlinePowers = entry.bloodlinePowers || [];
        const powerId = check.dataset.bloodlinePower;
        const limit = bloodlinePowerLimit(entry, unit);

        if (check.checked) {
          if (entry.bloodlinePowers.length >= limit) {
            check.checked = false;
            window.alert(`This Vampire may take a maximum of ${limit} bloodline power${limit === 1 ? "" : "s"} with its current magic-item choices.`);
            return;
          }
          if (powerUsedElsewhere(powerId, entry.id)) {
            check.checked = false;
            window.alert("That bloodline power is already being used elsewhere in the army.");
            return;
          }
          entry.bloodlinePowers.push(powerId);
        } else {
          entry.bloodlinePowers = entry.bloodlinePowers.filter(id => id !== powerId);
        }
        renderEditor();
      });
    });
  };

  const baseDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text = baseDescribeEntry(entry);
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const additions = [];
    if (isVampire(unit) && selectedBloodline()) additions.push(bloodlineName(selectedBloodline()));
    if (Number(entry.wizardLevels || 0)) additions.push(`${entry.wizardLevels} magic level${entry.wizardLevels === 1 ? "" : "s"}`);
    if (entry.bloodlinePowers?.length) additions.push(entry.bloodlinePowers.map(id => getBloodlinePower(id)?.name || id).join(", "));
    if (!additions.length) return text;
    return text === "Base configuration" ? additions.join(" · ") : `${text} · ${additions.join(" · ")}`;
  };

  const baseRosterPadNotes = rosterPadNotes;
  rosterPadNotes = function(entry, unit) {
    const notes = baseRosterPadNotes(entry, unit);
    if (isVampire(unit) && selectedBloodline()) notes.push(`${bloodlineName(selectedBloodline())} Vampire`);
    if (Number(entry.wizardLevels || 0)) notes.push(`${entry.wizardLevels} magic level${entry.wizardLevels === 1 ? "" : "s"}`);
    for (const powerId of entry.bloodlinePowers || []) {
      const power = getBloodlinePower(powerId);
      if (power) notes.push(`${power.name} — ${power.rules}`);
    }
    notes.push(...vampireBloodlineRuleNotes(unit));
    return [...new Set(notes)];
  };

  const baseMakeRosterSnapshot = makeRosterSnapshot;
  makeRosterSnapshot = function() {
    const snapshot = baseMakeRosterSnapshot();
    snapshot.armyOptions = clone(state.armyOptions || {});
    snapshot.schemaVersion = 2;
    return snapshot;
  };

  const baseLoadRoster = loadRoster;
  loadRoster = async function(id) {
    const saved = getSavedRosters().find(roster => roster.id === id);
    await baseLoadRoster(id);
    if (state.currentSaveId !== id) return;
    state.armyOptions = clone(saved?.armyOptions || {});
    for (const entry of state.roster) {
      entry.bloodlinePowers = entry.bloodlinePowers || [];
      entry.wizardLevels = Number(entry.wizardLevels || 0);
      normalizeVampireEntry(entry);
    }
    renderUnitBrowser();
    renderArmy();
  };

  const baseNewRoster = newRoster;
  newRoster = function() {
    const before = state.roster.length;
    baseNewRoster();
    if (before && state.roster.length) return;
    state.armyOptions = {};
    renderUnitBrowser();
    renderArmy();
  };

  const baseSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    state.armyOptions = {};
    await baseSelectArmy(armyId);
    if (state.data) {
      renderUnitBrowser();
      renderArmy();
    }
  };
})();
;
/* ===== END army_extensions.js ===== */

/* ===== BEGIN army_extensions_vampire_fix.js ===== */
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
;
/* ===== END army_extensions_vampire_fix.js ===== */

/* ===== BEGIN vampire_champion_fixes.js ===== */
// Vampire Counts selectable regimental champions and Vampire Thrall bloodline support.
(() => {
  const ARMY_ID = "vampire_counts";
  const isVC = () => state.data?.faction?.id === ARMY_ID;
  const selectedBloodline = () => state.armyOptions?.bloodline || null;

  const CHAMPION_CHOICES = {
    zombies: [
      { id:"wight", name:"Wight Champion", profileId:"wight_champion", cost:25, magicItems:{maximum:1,allowedPools:["common","undead"]} },
      { id:"vampire_thrall", name:"Vampire Thrall", profileId:"vampire_thrall", cost:60, vampire:true },
      { id:"wraith", name:"Wraith Champion", profileId:"wraith_champion", cost:50, magicItems:{maximum:1,allowedPools:["common","undead"]} }
    ],
    skeleton_warriors: [
      { id:"wight", name:"Wight Champion", profileId:"wight_champion", cost:35, magicItems:{maximum:1,allowedPools:["common","undead"]} },
      { id:"vampire_thrall", name:"Vampire Thrall", profileId:"vampire_thrall", cost:70, vampire:true },
      { id:"wraith", name:"Wraith Champion", profileId:"wraith_champion", cost:60, magicItems:{maximum:1,allowedPools:["common","undead"]} }
    ],
    skeleton_horsemen: [
      { id:"wight", name:"Wight Champion", profileId:"wight_champion", cost:50, magicItems:{maximum:1,allowedPools:["common","undead"]} },
      { id:"vampire_thrall", name:"Mounted Vampire Thrall", profileId:"vampire_thrall", cost:80, vampire:true, mounted:true },
      { id:"wraith", name:"Mounted Wraith Champion", profileId:"wraith_champion", cost:70, magicItems:{maximum:1,allowedPools:["common","undead"]}, mounted:true }
    ],
    wight_guardsmen: [
      { id:"wight", name:"Wight Champion", profileId:"wight_champion", cost:35, magicItems:{maximum:1,allowedPools:["common","undead"]} },
      { id:"vampire_thrall", name:"Vampire Thrall", profileId:"vampire_thrall", cost:70, vampire:true },
      { id:"wraith", name:"Wraith Champion", profileId:"wraith_champion", cost:60, magicItems:{maximum:1,allowedPools:["common","undead"]} }
    ],
    wight_knights: [
      { id:"wight", name:"Wight Champion", profileId:"wight_champion", cost:50, magicItems:{maximum:1,allowedPools:["common","undead"]} },
      { id:"vampire_thrall", name:"Mounted Vampire Thrall", profileId:"vampire_thrall", cost:80, vampire:true, mounted:true },
      { id:"wraith", name:"Mounted Wraith Champion", profileId:"wraith_champion", cost:70, magicItems:{maximum:1,allowedPools:["common","undead"]}, mounted:true }
    ]
  };

  function choicesFor(unit) {
    return isVC() ? (CHAMPION_CHOICES[unit?.id] || null) : null;
  }

  function selectedChoice(entry, unit) {
    const choices = choicesFor(unit);
    if (!choices) return null;
    const id = entry?.champion?.choiceId || choices[0].id;
    return choices.find(choice => choice.id === id) || choices[0];
  }

  function championDefinition(entry, unit) {
    const choice = selectedChoice(entry, unit);
    if (!choice) return unit.champion;
    const magicItems = choice.vampire
      ? { maximum:1, allowedPools:["common","undead"], allowedCategories:["magic_weapon","magic_armour","enchanted_item","arcane_item","familiar"] }
      : choice.magicItems;
    return {
      name: choice.name,
      profileId: choice.profileId,
      cost: { base: choice.cost },
      magicItems,
      vampire: Boolean(choice.vampire),
      mounted: Boolean(choice.mounted)
    };
  }

  function unitWithChampion(entry, unit) {
    if (!choicesFor(unit)) return unit;
    const view = clone(unit);
    view.champion = championDefinition(entry, unit);
    return view;
  }

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isVC() && choicesFor(unit)) {
      entry.champion.choiceId = choicesFor(unit)[0].id;
      entry.champion.bloodlinePowers = [];
    }
    return entry;
  };

  const oldCalculateChampionCost = calculateChampionCost;
  calculateChampionCost = function(entry, unit) {
    if (!isVC() || !choicesFor(unit)) return oldCalculateChampionCost(entry, unit);
    if (!entry.champion?.selected) return 0;
    const choice = selectedChoice(entry, unit);
    let total = Number(choice?.cost || 0);
    total += (entry.champion.magicItems || []).reduce((sum, id) => sum + Number(getMagicItem(id)?.cost || 0), 0);
    const powers = state.data?.faction?.systems?.bloodline?.powers?.[selectedBloodline()] || [];
    for (const id of entry.champion.bloodlinePowers || []) {
      total += Number(powers.find(power => power.id === id)?.cost || 0);
    }
    return total;
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    const choices = choicesFor(unit);
    if (!choices) return oldRenderRegimentEditor(entry, unit);
    const view = unitWithChampion(entry, unit);
    let html = oldRenderRegimentEditor(entry, view);
    if (!entry.champion?.selected) return html;

    const selector = `
      <section class="editor-section">
        <h3 class="editor-section-title">Champion Type</h3>
        <div class="dialog-field">
          <label for="edit-vc-champion-type">Regimental champion</label>
          <select id="edit-vc-champion-type" data-vc-champion-type>
            ${choices.map(choice => `<option value="${escapeHtml(choice.id)}" ${selectedChoice(entry, unit)?.id === choice.id ? "selected" : ""}>${escapeHtml(choice.name)} (+${formatPoints(choice.cost)} pts)</option>`).join("")}
          </select>
        </div>
      </section>`;

    html = selector + html;

    const choice = selectedChoice(entry, unit);
    if (choice?.vampire && selectedBloodline() === "von_carstein") {
      const powers = state.data?.faction?.systems?.bloodline?.powers?.von_carstein || [];
      const chosen = entry.champion.bloodlinePowers || [];
      html += `
        <section class="editor-section">
          <h3 class="editor-section-title">Von Carstein Bloodline Power</h3>
          <div class="field-hint">A Vampire Thrall champion may use its single regimental-character upgrade slot for either one magic item or one Von Carstein bloodline power.</div>
          ${powers.map(power => `<label class="check-row"><input type="checkbox" data-vc-champion-power="${escapeHtml(power.id)}" ${chosen.includes(power.id) ? "checked" : ""}><span class="check-row-content"><span class="check-row-title"><span>${escapeHtml(power.name)}</span><span>${Number(power.cost || 0) ? `+${formatPoints(power.cost)} pts` : "Free"}</span></span><span class="check-row-sub">${escapeHtml(power.rules || "")}</span></span></label>`).join("")}
        </section>`;
    }
    return html;
  };

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isVC() || !state.draft) return;
    const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
    if (!choicesFor(unit)) return;

    els.dialogContent.querySelector("[data-vc-champion-type]")?.addEventListener("change", event => {
      state.draft.champion.choiceId = event.target.value;
      state.draft.champion.magicItems = [];
      state.draft.champion.bloodlinePowers = [];
      renderEditor();
    });

    els.dialogContent.querySelectorAll("[data-vc-champion-power]").forEach(box => {
      box.addEventListener("change", () => {
        const selected = Array.from(els.dialogContent.querySelectorAll("[data-vc-champion-power]:checked")).map(el => el.dataset.vcChampionPower);
        if (selected.length > 1) {
          box.checked = false;
          return;
        }
        if (selected.length && (state.draft.champion.magicItems || []).length) {
          state.draft.champion.magicItems = [];
        }
        state.draft.champion.bloodlinePowers = selected;
        renderEditor();
      });
    });
  };

  const oldGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    if (!isVC() || context !== "champion" || !choicesFor(unit)) return oldGetAllowedMagicItems(unit, context);
    const choice = selectedChoice(state.draft, unit);
    if (!choice?.vampire) return oldGetAllowedMagicItems(unitWithChampion(state.draft, unit), context);
    const pools = [...(state.data.commonMagicItems || []), ...(state.data.factionMagicItems || [])];
    return pools.filter(item => ["magic_weapon","magic_armour","enchanted_item","arcane_item","familiar"].includes(item.category));
  };

  const oldGetMagicMaximum = getMagicMaximum;
  getMagicMaximum = function(unit, context) {
    if (!isVC() || context !== "champion" || !choicesFor(unit)) return oldGetMagicMaximum(unit, context);
    const choice = selectedChoice(state.draft, unit);
    if (choice?.vampire && (state.draft?.champion?.bloodlinePowers || []).length) return 0;
    return 1;
  };

  const oldRosterPadChampionRow = rosterPadChampionRow;
  rosterPadChampionRow = function(entry, unit) {
    if (!isVC() || !choicesFor(unit)) return oldRosterPadChampionRow(entry, unit);
    return oldRosterPadChampionRow(entry, unitWithChampion(entry, unit));
  };

  const oldDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text = oldDescribeEntry(entry);
    if (!isVC()) return text;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!entry.champion?.selected || !choicesFor(unit)) return text;
    const choice = selectedChoice(entry, unit);
    const bits = [choice.name];
    const powers = state.data?.faction?.systems?.bloodline?.powers?.[selectedBloodline()] || [];
    for (const id of entry.champion.bloodlinePowers || []) {
      const power = powers.find(item => item.id === id);
      if (power) bits.push(power.name);
    }
    return `${text === "Base configuration" ? "" : text + " · "}${bits.join(" · ")}`;
  };
})();
;
/* ===== END vampire_champion_fixes.js ===== */

/* ===== BEGIN chaos_state_guard.js ===== */
// Keeps Chaos devotion state available when shared army extensions reset armyOptions.
(() => {
  let armyOptions = state.armyOptions || {};

  function normalise(value) {
    const options = value && typeof value === "object" ? value : {};
    if (!options.chaosDevotions || typeof options.chaosDevotions !== "object") {
      options.chaosDevotions = {};
    }
    return options;
  }

  armyOptions = normalise(armyOptions);

  Object.defineProperty(state, "armyOptions", {
    configurable: true,
    enumerable: true,
    get() {
      armyOptions = normalise(armyOptions);
      return armyOptions;
    },
    set(value) {
      armyOptions = normalise(value);
    }
  });
})();
;
/* ===== END chaos_state_guard.js ===== */

/* ===== BEGIN dwarf_extensions.js ===== */
// Dwarf-specific roster support: rune construction, tiered Miners, and shared magic-item loading.
(() => {
  const previousFetch = window.fetch.bind(window);

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    const response = await previousFetch(input, init);
    if (!response.ok || !(url.endsWith("data/whr_dwarfs_v0_1.json") || url.endsWith("/whr_dwarfs_v0_1.json"))) return response;
    try {
      const data = await response.clone().json();
      if (!data.commonMagicItems?.length) {
        const commonResponse = await previousFetch("./data/whr_empire_v0_1.json", { cache: "no-store" });
        if (commonResponse.ok) data.commonMagicItems = (await commonResponse.json()).commonMagicItems || [];
      }
      return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
    } catch (error) {
      console.error("Unable to prepare Dwarf data", error);
      return response;
    }
  };

  const isDwarfArmy = () => state.data?.faction?.id === "dwarfs";
  const emptyRuneSet = () => ({weapon:[], armour:[], talisman:[], protection:[], engineering:[]});
  const runeCategories = () => state.data?.faction?.systems?.runes?.categories || {};
  const runeById = id => Object.values(runeCategories()).flat().find(r => r.id === id);

  function ensureRunes(entry) {
    if (!entry.runes) entry.runes = emptyRuneSet();
    for (const key of Object.keys(emptyRuneSet())) if (!Array.isArray(entry.runes[key])) entry.runes[key] = [];
    entry.champion = entry.champion || {selected:false, magicItems:[]};
    if (!entry.champion.runes) entry.champion.runes = emptyRuneSet();
    return entry;
  }

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isDwarfArmy()) ensureRunes(entry);
    return entry;
  };

  const oldGetDefaultSize = getDefaultSize;
  getDefaultSize = unit => isDwarfArmy() && unit.points?.type === "tiered"
    ? Number(unit.points.firstModels || unit.size?.minimum || 5)
    : oldGetDefaultSize(unit);

  const oldGetBaseCostLabel = getBaseCostLabel;
  getBaseCostLabel = function(unit) {
    if (isDwarfArmy() && unit.points?.type === "tiered") {
      return `${formatPoints(unit.points.firstCost)} pts / first ${unit.points.firstModels}, +${formatPoints(unit.points.additionalModelCost)} / extra model`;
    }
    return oldGetBaseCostLabel(unit);
  };

  function selectedRuneIds(entry, category, champion=false) {
    ensureRunes(entry);
    return (champion ? entry.champion.runes : entry.runes)[category] || [];
  }

  function runeCost(id, unit) {
    const rune = runeById(id);
    if (!rune) return 0;
    let cost = Number(rune.cost || 0);
    if (unit?.id === "gyrocopter" && (id === "eng_penetrating" || id === "eng_disguise")) cost *= 2;
    return cost;
  }

  function totalRuneCost(entry, unit) {
    ensureRunes(entry);
    let total = 0;
    for (const ids of Object.values(entry.runes)) for (const id of ids) total += runeCost(id, unit);
    if (entry.champion?.selected) for (const ids of Object.values(entry.champion.runes || {})) for (const id of ids) total += runeCost(id, unit);
    return total;
  }

  const oldCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    let total = oldCalculateEntry(entry);
    if (!isDwarfArmy() || !unit) return total;
    ensureRunes(entry);

    if (unit.points?.type === "tiered") {
      total += Number(unit.points.firstCost || 0) + Math.max(0, Number(entry.size || 0) - Number(unit.points.firstModels || 0)) * Number(unit.points.additionalModelCost || 0);
      if (entry.champion?.selected && unit.champion?.cost?.add?.type === "unit_model_cost") total += Number(unit.points.additionalModelCost || 0);
    }

    if (entry.sectionKey === "warMachines") {
      const extra = Number(entry.optionSelections?.extra_crew || 0);
      if (entry.optionSelections?.crew_armour === "light_armour") total += extra;
      if (entry.optionSelections?.crew_armour === "heavy_armour") total += extra * 2;
    }
    return total + totalRuneCost(entry, unit);
  };

  function runeItemCount(entry, champion=false) {
    ensureRunes(entry);
    const src = champion ? entry.champion.runes : entry.runes;
    return ["weapon","armour","talisman","protection"].filter(k => (src[k] || []).length).length;
  }

  const oldGetMagicMaximum = getMagicMaximum;
  getMagicMaximum = function(unit, context) {
    const base = oldGetMagicMaximum(unit, context);
    if (!isDwarfArmy() || !state.draft) return base;
    return Math.max(0, base - runeItemCount(state.draft, context === "champion"));
  };

  const oldGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    if (!isDwarfArmy()) return oldGetAllowedMagicItems(unit, context);
    const settings = context === "champion" ? unit.champion?.magicItems : unit.magicItems;
    if (!settings) return [];
    const categories = settings.allowedCategories || ["magic_weapon","magic_armour","enchanted_item","familiar"];
    const result = [];
    if ((settings.allowedPools || []).includes("common")) result.push(...(state.data.commonMagicItems || []));
    if ((settings.allowedPools || []).some(p => p === "faction" || p === "dwarfs")) result.push(...(state.data.factionMagicItems || []));
    const conflicts = new Set();
    if (state.draft) {
      ensureRunes(state.draft);
      const src = context === "champion" ? state.draft.champion.runes : state.draft.runes;
      if (src.weapon?.length) conflicts.add("magic_weapon");
      if (src.armour?.length) conflicts.add("magic_armour");
      if (src.talisman?.length) conflicts.add("enchanted_item");
      if (src.protection?.length) conflicts.add("magic_banner");
    }
    return result.filter(item => categories.includes(item.category) && item.category !== "arcane_item" && !conflicts.has(item.category) && !/\bbound\b/i.test(String(item.rules || "")));
  };

  const oldRenderMagicItemEditor = renderMagicItemEditor;
  renderMagicItemEditor = function(entry, unit, context) {
    const html = oldRenderMagicItemEditor(entry, unit, context);
    if (!isDwarfArmy()) return html;
    return html.replace("The list is taken from the common and Empire magic-item pools allowed by this character.", "The list is taken from the common and Dwarf magic-item pools. Bound spells and arcane items are excluded.");
  };

  function availableRunes(category, unit, champion, includeMasters) {
    const tags = unit.tags || [];
    return (runeCategories()[category] || []).filter(r => {
      if (r.master && !includeMasters) return false;
      if (r.allowedUnits && !r.allowedUnits.includes(unit.id)) return false;
      if (r.onlyRunesmith && !tags.includes("runesmith")) return false;
      return true;
    });
  }

  function renderRuneItem(entry, unit, category, title, champion=false, includeMasters=true) {
    const ids = selectedRuneIds(entry, category, champion);
    const options = availableRunes(category, unit, champion, includeMasters);
    if (!options.length) return "";
    return `<section class="editor-section dwarf-rune-section">
      <div class="magic-header"><h3 class="editor-section-title" style="margin:0;">${escapeHtml(title)}</h3><span class="magic-counter">${ids.length} / 3 runes</span></div>
      <div class="field-hint">These runes form one runic item. A runic item uses one magic-item slot where applicable.</div>
      ${[0,1,2].map(slot => `<div class="dialog-field"><label>Rune ${slot+1}</label><select data-dwarf-rune="${category}" data-rune-slot="${slot}" data-rune-context="${champion ? "champion" : "model"}"><option value="">None</option>${options.map(r => `<option value="${escapeHtml(r.id)}" ${ids[slot] === r.id ? "selected" : ""}>${escapeHtml(r.name)} (${formatPoints(runeCost(r.id, unit))} pts)</option>`).join("")}</select></div>`).join("")}
    </section>`;
  }

  function renderRuneAccess(entry, unit, champion=false) {
    const access = champion ? (unit.champion?.runeAccess || []) : (unit.runeAccess || []);
    const labels = {weapon:"Runic Weapon",armour:"Runic Armour",talisman:"Runic Talisman",protection:"Runic Battle Standard"};
    return access.map(cat => renderRuneItem(entry, unit, cat, labels[cat] || humanise(cat), champion, true)).join("");
  }

  const oldRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    let html = oldRenderCharacterEditor(entry, unit);
    if (!isDwarfArmy()) return html;
    ensureRunes(entry);
    if ((unit.options || []).length) html += `<section class="editor-section"><h3 class="editor-section-title">Options</h3>${renderUnitOptions(entry, unit)}</section>`;
    return html + renderRuneAccess(entry, unit, false);
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = oldRenderRegimentEditor(entry, unit);
    if (!isDwarfArmy()) return html;
    ensureRunes(entry);
    if (unit.points?.type === "tiered") html = html.replace(/Base cost: 0 pts per model\./, `Base cost: ${formatPoints(unit.points.firstCost)} pts for the first ${unit.points.firstModels} models, +${formatPoints(unit.points.additionalModelCost)} pts per additional model.`);
    if (entry.champion?.selected && unit.champion?.runeAccess?.length) html += renderRuneAccess(entry, unit, true);
    if (entry.command?.standardBearer && unit.runicBanner) html += renderRuneItem(entry, unit, "protection", "Runic Standard", false, false);
    return html;
  };

  const oldRenderWarMachineEditor = renderWarMachineEditor;
  renderWarMachineEditor = function(entry, unit) {
    let html = oldRenderWarMachineEditor(entry, unit);
    if (!isDwarfArmy() || !unit.engineeringRunes) return html;
    ensureRunes(entry);
    return html + renderRuneItem(entry, unit, "engineering", "Engineering Runes", false, true);
  };

  const oldDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text = oldDescribeEntry(entry);
    if (!isDwarfArmy()) return text;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    ensureRunes(entry);
    const labels = {weapon:"Runic Weapon",armour:"Runic Armour",talisman:"Runic Talisman",protection:"Runic Standard",engineering:"Engineering Runes"};
    const parts = [];
    for (const [cat,ids] of Object.entries(entry.runes)) if (ids.length) parts.push(`${labels[cat]}: ${ids.map(id => runeById(id)?.name || id).join(", ")}`);
    if (entry.champion?.selected) for (const [cat,ids] of Object.entries(entry.champion.runes || {})) if (ids.length) parts.push(`${unit.champion?.name || "Champion"} ${labels[cat] || humanise(cat)}: ${ids.map(id => runeById(id)?.name || id).join(", ")}`);
    return parts.length ? `${text === "Base configuration" ? "" : text + " · "}${parts.join(" · ")}` : text;
  };

  function runeCountElsewhere(id, ignoreId) {
    let count = 0;
    for (const e of state.roster) {
      if (e.id === ignoreId) continue;
      ensureRunes(e);
      for (const ids of Object.values(e.runes)) count += ids.filter(x => x === id).length;
      for (const ids of Object.values(e.champion?.runes || {})) count += ids.filter(x => x === id).length;
    }
    return count;
  }

  function validateRune(entry, unit, category, slot, id, champion) {
    if (!id) return {ok:true};
    const rune = runeById(id);
    const src = champion ? entry.champion.runes : entry.runes;
    const next = [...(src[category] || [])]; while (next.length < 3) next.push(""); next[slot] = id;
    const chosen = next.filter(Boolean), details = chosen.map(runeById);
    if (details.filter(r => r?.master).length > 1) return {ok:false,msg:"A runic item may contain only one Master Rune."};
    if (rune.master && runeCountElsewhere(id, entry.id)) return {ok:false,msg:"That Master Rune is already used elsewhere in the army."};
    const times = chosen.filter(x => x === id).length;
    if (!rune.repeatable && times > 1) return {ok:false,msg:"That rune cannot be repeated on the same item."};
    if (rune.maxRepeats && times > Number(rune.maxRepeats)) return {ok:false,msg:`${rune.name} may be taken at most ${rune.maxRepeats} times.`};
    if (id === "r_spellbreaking" && runeCountElsewhere(id, entry.id) + times > 2) return {ok:false,msg:"No more than two Runes of Spellbreaking may be included in the army."};
    if (!champion && entry.sectionKey === "regiments" && category === "protection" && entry.magicBanner) return {ok:false,msg:"Remove the conventional magic banner before creating a runic standard."};
    const catMagic = {weapon:"magic_weapon",armour:"magic_armour",talisman:"enchanted_item",protection:"magic_banner"}[category];
    const normalItems = champion ? entry.champion.magicItems : entry.magicItems;
    if (catMagic && normalItems.some(x => getMagicItem(x)?.category === catMagic)) return {ok:false,msg:"Runes cannot be inscribed on an existing magic item. Remove the conventional item in this category first."};
    if (category !== "engineering" && !(entry.sectionKey === "regiments" && !champion && category === "protection")) {
      const maximum = Number((champion ? unit.champion?.magicItems : unit.magicItems)?.maximum || 0);
      const old = src[category]; src[category] = chosen;
      const used = runeItemCount(entry, champion) + normalItems.length;
      src[category] = old;
      if (used > maximum) return {ok:false,msg:`This model may take a maximum of ${maximum} magic item${maximum === 1 ? "" : "s"}, including runic items.`};
    }
    return {ok:true,chosen};
  }

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isDwarfArmy() || !state.draft) return;
    const entry = state.draft, unit = getUnit(entry.sectionKey, entry.unitId); ensureRunes(entry);
    els.dialogContent.querySelectorAll("[data-dwarf-rune]").forEach(select => select.addEventListener("change", () => {
      const cat = select.dataset.dwarfRune, slot = Number(select.dataset.runeSlot), champion = select.dataset.runeContext === "champion";
      const check = validateRune(entry, unit, cat, slot, select.value, champion);
      if (!check.ok) { window.alert(check.msg); renderEditor(); return; }
      const src = champion ? entry.champion.runes : entry.runes;
      const next = [...(src[cat] || [])]; while (next.length < 3) next.push(""); next[slot] = select.value || ""; src[cat] = next.filter(Boolean);
      renderEditor();
    }));
  };
})();
;
/* ===== END dwarf_extensions.js ===== */

/* ===== BEGIN dwarf_validation_patch.js ===== */
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
;
/* ===== END dwarf_validation_patch.js ===== */

/* ===== BEGIN armour_save_fixes.js ===== */
// Generic armour-save fixes plus High Elf exceptional armour rules.
(() => {
  const previousFetch = window.fetch.bind(window);

  function allFactionUnits(data) {
    const faction = data?.faction || {};
    return ["characters", "regiments", "warMachines", "specialCharacters"]
      .flatMap(key => faction[key] || []);
  }

  function patchHighElfArmourData(data) {
    if (data?.faction?.id !== "high_elves") return data;

    for (const unit of allFactionUnits(data)) {
      const name = String(unit.name || "").toLowerCase();

      // These saves are explicitly defined by their special rules/items and
      // should not be reconstructed from mundane equipment.
      if (name.includes("tyrion")) unit.fixedArmourSave = 1;
      if (name.includes("korhil")) unit.fixedArmourSave = 3;
    }

    const highElfItems = [
      ...(data.factionMagicItems || []),
      ...(data.faction?.specialCharacterOnlyItems || [])
    ];

    for (const item of highElfItems) {
      const name = String(item.name || "").toLowerCase();
      if (name === "armour of caledor") {
        // Dragon Armour with an additional +1 save: 4+ before shield/mount bonuses.
        item.armourSaveBase = 4;
      }
    }

    return data;
  }

  window.fetch = async function(input, init) {
    const response = await previousFetch(input, init);
    const url = typeof input === "string" ? input : input?.url || "";
    if (!response.ok || !(url.endsWith("data/whr_high_elves_v0_1.json") || url.endsWith("/whr_high_elves_v0_1.json"))) {
      return response;
    }

    try {
      const data = patchHighElfArmourData(await response.clone().json());
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Unable to patch High Elf armour data", error);
      return response;
    }
  };

  const oldGetSelectedEquipmentIds = getSelectedEquipmentIds;
  getSelectedEquipmentIds = function(entry, unit) {
    const ids = new Set(oldGetSelectedEquipmentIds(entry, unit));

    // Special characters keep their fixed equipment, and cavalry regiments
    // inherit equipment carried by their unit mount (notably barding).
    for (const id of unit.fixedEquipment || []) ids.add(id);
    for (const id of unit.unitMount?.equipment || []) ids.add(id);

    // Character mount options can grant equipment such as barding.
    // Only apply equipment from the currently selected mount option.
    if (entry.mount) {
      const selectedMount = (unit.mountOptions || []).find(m => m.mountId === entry.mount);
      for (const id of selectedMount?.freeOptions || []) ids.add(id);
      for (const id of selectedMount?.addsEquipment || []) ids.add(id);
    }

    return [...ids];
  };

  function equipmentNames(ids) {
    return ids.map(id => String(equipmentById.get(id)?.name || humanise(id)).toLowerCase());
  }

  function selectedMagicArmourEffects(entry, unit) {
    // Do not include champion items here: this function calculates the parent
    // unit/character save. Champion rows are deliberately kept separate.
    const ids = [
      ...(entry.magicItems || []),
      ...(unit.fixedMagicItems || [])
    ];

    const items = ids.map(id => getMagicItem(id) ||
      (state.data?.faction?.specialCharacterOnlyItems || []).find(item => item.id === id)
    ).filter(Boolean);

    return {
      fixed: items.find(item => Number(item.fixedArmourSave) > 0)?.fixedArmourSave ?? null,
      bases: items.map(item => Number(item.armourSaveBase)).filter(Number.isFinite),
      modifier: items.reduce((sum, item) => sum + Number(item.armourSaveModifier || 0), 0)
    };
  }

  calculatePrintedArmourSave = function(entry, unit) {
    if (Number(unit.fixedArmourSave) > 0) return `${Number(unit.fixedArmourSave)}+`;

    const equipment = getSelectedEquipmentIds(entry, unit);
    const names = equipmentNames(equipment);
    const hasName = pattern => names.some(name => pattern.test(name));

    let save = null;

    if (equipment.includes("full_plate_armour") || hasName(/full plate/)) save = 4;
    else if (equipment.includes("heavy_armour") || hasName(/heavy armour|dragon armour/)) save = 5;
    else if (equipment.includes("light_armour") || hasName(/light armour/)) save = 6;

    const magic = selectedMagicArmourEffects(entry, unit);
    if (magic.fixed) return `${Number(magic.fixed)}+`;
    for (const base of magic.bases) save = save == null ? base : Math.min(save, base);

    if (equipment.includes("shield") || hasName(/^shield$|\bshield\b/)) {
      save = save == null ? 6 : Math.max(2, save - 1);
    }

    const isMounted = Boolean(entry.mount) || Boolean(unit.unitMount?.mountId) ||
      unit.unitType === "cavalry" || (unit.tags || []).includes("fast_cavalry");

    if (isMounted) {
      save = save == null ? 6 : Math.max(2, save - 1);
    }

    if (equipment.includes("barding") || hasName(/barding/)) {
      save = save == null ? 6 : Math.max(2, save - 1);
    }

    if (save != null && magic.modifier) {
      save = Math.max(2, save - magic.modifier);
    }

    return save == null ? "–" : `${save}+`;
  };
})();
;
/* ===== END armour_save_fixes.js ===== */

/* ===== BEGIN orc_special_character_fixes.js ===== */
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
;
/* ===== END orc_special_character_fixes.js ===== */

/* ===== BEGIN orc_shaman_fixes.js ===== */
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
;
/* ===== END orc_shaman_fixes.js ===== */

/* ===== BEGIN orc_magic_item_filter.js ===== */
// Restrict Orcs & Goblins special-character faction items to valid bearers.
(() => {
  const oldGetAllowedMagicItems = getAllowedMagicItems;

  function orcBearerType(unit) {
    switch (unit?.id) {
      case "azhag":
      case "gorfang":
      case "oglok":
      case "gorbad":
        return "common_orc";
      case "grom":
        return "common_goblin";
      case "skarsnik":
        return "night_goblin";
      case "morglum":
        return "black_orc";
      default:
        return null;
    }
  }

  getAllowedMagicItems = function(unit, context) {
    const items = oldGetAllowedMagicItems(unit, context);
    if (state.data?.faction?.id !== "orcs_goblins" || context === "champion") return items;

    const bearer = orcBearerType(unit);
    if (!bearer) return items;

    return items.filter(item => {
      const text = `${item.name || ""} ${item.rules || ""}`.toLowerCase();

      if (text.includes("common goblin") && bearer !== "common_goblin") return false;
      if (text.includes("common orc") && bearer !== "common_orc") return false;
      if (text.includes("forest goblin") && bearer !== "forest_goblin") return false;
      if (text.includes("night goblin") && bearer !== "night_goblin") return false;
      if ((text.includes("shaman only") || text.includes("shamans only")) && unit.id !== "azhag") return false;

      return true;
    });
  };
})();
;
/* ===== END orc_magic_item_filter.js ===== */

/* ===== BEGIN bretonnia_extensions.js ===== */
// Bretonnia-specific builder behaviour and Roster Pad support.
(() => {
  // Bretonnia is a standalone data file, so enrich it here with the shared
  // common magic-item pool and a few schema details used by the generic UI.
  const previousFetch = window.fetch.bind(window);

  function enrichCommonMagicArmour(items) {
    const byName = new Map((items || []).map(item => [String(item.name || "").toLowerCase(), item]));
    const base = (name, value) => { const item = byName.get(name); if (item) item.armourSaveBase = value; };
    const modifier = (name, value) => { const item = byName.get(name); if (item) item.armourSaveModifier = value; };
    const fixed = (name, value) => { const item = byName.get(name); if (item) item.fixedArmourSave = value; };

    base("armour of endurance", 5);
    base("armour of resilience", 5); modifier("armour of resilience", 1);
    base("oaken armour", 6);
    base("adamant armour", 5);
    base("dawn armour", 5);
    base("trollhide armour", 6);
    base("emerald armour", 6);
    base("armour of fortune", 5);
    fixed("armour of meteoric iron", 2);
    base("armour of unyielding", 5);
    base("armour of protection", 5);
    base("armour of brilliance", 5);
    modifier("enchanted shield", 1);
  }

  window.fetch = async function(input, init) {
    const response = await previousFetch(input, init);
    const url = typeof input === "string" ? input : input?.url || "";
    if (!response.ok || !(url.endsWith("data/whr_bretonnia_v0_1.json") || url.endsWith("/whr_bretonnia_v0_1.json"))) {
      return response;
    }

    try {
      const data = await response.clone().json();

      if (!data.commonMagicItems?.length) {
        const empireResponse = await previousFetch("./data/whr_empire_v0_1.json", { cache: "no-store" });
        if (empireResponse.ok) {
          const empire = await empireResponse.json();
          data.commonMagicItems = empire.commonMagicItems || [];
        }
      }
      enrichCommonMagicArmour(data.commonMagicItems);

      for (const unit of data.faction?.regiments || []) {
        // WHR permits any regiment with a standard bearer to carry a magic banner.
        unit.magicBanner = unit.magicBanner || { allowed: true };

        // Choice-group entries need to expose the selected equipment to the
        // generic notes/armour code as well as to the points calculator.
        for (const option of unit.options || []) {
          if (option.type !== "choice_group") continue;
          for (const choice of option.choices || []) {
            if (choice && typeof choice === "object" && choice.id && !choice.addsEquipment) {
              choice.addsEquipment = [choice.id];
            }
          }
        }
      }

      // Named magic armour/shields still contribute their mundane armour type.
      const louen = (data.faction?.specialCharacters || []).find(unit => unit.id === "louen");
      if (louen) louen.fixedEquipment = [...new Set([...(louen.fixedEquipment || []), "heavy_armour"])];
      const tancred = (data.faction?.specialCharacters || []).find(unit => unit.id === "tancred");
      if (tancred) tancred.fixedEquipment = [...new Set([...(tancred.fixedEquipment || []), "shield"])];

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Unable to enrich Bretonnia army data", error);
      return response;
    }
  };

  const isBretonnia = () => state.data?.faction?.id === "bretonnia";
  const factionItems = () => state.data?.factionMagicItems || [];
  const itemById = id => factionItems().find(item => item.id === id) || getMagicItem(id);

  function bearerTags(unit, context) {
    return context === "champion" ? (unit.champion?.tags || []) : (unit.tags || []);
  }

  const oldGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const items = oldGetAllowedMagicItems(unit, context);
    if (!isBretonnia()) return items;

    const tags = bearerTags(unit, context);
    const isKnightly = tags.includes("knightly");
    const isWizard = tags.includes("wizard");
    const isCommonerChampion = context === "champion" && tags.includes("commoner");

    return items.filter(item => {
      if (item.knightlyOnly && !isKnightly) return false;
      if (item.wizardOnly && !isWizard) return false;
      if (item.commonerChampionOnly && !isCommonerChampion) return false;
      if (item.isVirtue && !isKnightly) return false;
      return true;
    });
  };

  // Special-character options are normally uncommon, but Bertrand's unit can
  // purchase extra Bowmen of Bergerac. Reuse the generic option editor.
  const oldRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    let html = oldRenderCharacterEditor(entry, unit);
    if (isBretonnia() && entry.sectionKey === "specialCharacters" && (unit.options || []).length) {
      html += `
        <section class="editor-section">
          <h3 class="editor-section-title">Unit Options</h3>
          ${renderUnitOptions(entry, unit)}
        </section>
      `;
    }
    return html;
  };

  // Bretonnian army-book banners are restricted to specific Chevalier units.
  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isBretonnia() || !state.draft) return;

    const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
    const bannerSelect = els.dialogContent.querySelector("[data-magic-banner]");
    if (!bannerSelect) return;

    for (const option of bannerSelect.options) {
      if (!option.value) continue;
      const item = itemById(option.value);
      if (!item?.allowedUnitIds?.length) continue;
      const allowed = item.allowedUnitIds.includes(unit.id);
      option.disabled = !allowed;
      option.hidden = !allowed;
    }
  };

  function virtueCount(ids) {
    return (ids || []).filter(id => itemById(id)?.isVirtue).length;
  }

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isBretonnia() && state.draft) {
      if (virtueCount(state.draft.magicItems) > 1) {
        window.alert("A Bretonnian knight may take only one Knightly Virtue.");
        return;
      }
      if (virtueCount(state.draft.champion?.magicItems) > 1) {
        window.alert("A Bretonnian Knightly Champion may take only one Knightly Virtue.");
        return;
      }

      // Skirmishers cannot retain a standard bearer or magic banner.
      if (state.draft.unitId === "archers" && state.draft.optionSelections?.skirmish) {
        state.draft.command.standardBearer = false;
        state.draft.magicBanner = null;
      }
    }
    oldSaveEditor();
  };

  // Enforce the army-book 0-1 entries and special-character uniqueness at the
  // point they are added, rather than waiting for a manual legality check.
  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (isBretonnia()) {
      const unit = getUnit(sectionKey, unitId);
      const alreadyPresent = state.roster.some(entry => entry.sectionKey === sectionKey && entry.unitId === unitId);
      if (alreadyPresent && ((unit.tags || []).includes("zero_one") || sectionKey === "specialCharacters")) {
        window.alert(`${unit.name} may only be included once in a Bretonnian army.`);
        return;
      }
    }
    return oldAddUnit(sectionKey, unitId);
  };

  function additionalProfileRows(entry, unit) {
    if (!isBretonnia() || !unit.additionalProfiles?.length) return "";

    return unit.additionalProfiles.map(component => {
      const profile = profileById.get(component.profileId);
      if (!profile) return "";

      let label = component.label || profile.name || humanise(component.profileId);
      if (unit.id === "bertrand_bowmen" && component.profileId === "bowman_bergerac") {
        label = `${2 + Number(entry.optionSelections?.extra_bowmen || 0)} Bowmen of Bergerac`;
      }

      return `
        <tr class="mount-row">
          <td class="unit-cell mount-name">↳ ${escapeHtml(label)}</td>
          ${rosterPadProfileCells(profile)}
          <td class="save">–</td>
          <td class="notes-cell mount-notes">${rosterPadNotesInline(component.notes || ["Additional profile"])}</td>
          <td class="points-cell"></td>
        </tr>
      `;
    }).join("");
  }

  const oldRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    const base = oldRosterPadRow(entry);
    if (!isBretonnia()) return base;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return base + additionalProfileRows(entry, unit);
  };

  // Surface the defining Grand Army requirements in the live legality panel.
  const oldRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    oldRenderArmyStatus(total);
    if (!isBretonnia()) return;

    const hasChevaliers = state.roster.some(entry => {
      if (entry.sectionKey !== "regiments") return false;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      return (unit.tags || []).includes("knightly");
    });
    const hasKnightlyCharacter = state.roster.some(entry => {
      if (entry.sectionKey !== "characters" && entry.sectionKey !== "specialCharacters") return false;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      return (unit.tags || []).includes("knightly");
    });

    if (hasChevaliers && hasKnightlyCharacter) return;
    const messages = [];
    if (!hasChevaliers) messages.push("The Grand Army must include at least one regiment of Chevaliers.");
    if (!hasKnightlyCharacter) messages.push("The general must be a knightly character, not a wizard.");
    els.armyStatus.insertAdjacentHTML("beforeend", `
      <div class="warning-box" style="margin-top:10px;">
        <strong>Bretonnia army requirement:</strong> ${messages.map(escapeHtml).join(" ")}
      </div>
    `);
  };
})();
;
/* ===== END bretonnia_extensions.js ===== */

/* ===== BEGIN skaven_extensions.js ===== */
// Skaven-specific builder behaviour, mainstay validation and Roster Pad support.
(() => {
  const previousFetch = window.fetch.bind(window);

  // The compact Skaven data keeps the common pool empty. Load the shared common
  // magic items from the Empire data in the same way as the other standalone armies.
  window.fetch = async function(input, init) {
    const response = await previousFetch(input, init);
    const url = typeof input === "string" ? input : input?.url || "";
    if (!response.ok || !(url.endsWith("data/whr_skaven_v0_1.json") || url.endsWith("/whr_skaven_v0_1.json"))) {
      return response;
    }

    try {
      const data = await response.clone().json();
      if (!data.commonMagicItems?.length) {
        const commonResponse = await previousFetch("./data/whr_empire_v0_1.json", { cache:"no-store" });
        if (commonResponse.ok) {
          const commonData = await commonResponse.json();
          data.commonMagicItems = commonData.commonMagicItems || [];
        }
      }
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type":"application/json" }
      });
    } catch (error) {
      console.error("Unable to enrich Skaven army data", error);
      return response;
    }
  };

  const isSkaven = () => state.data?.faction?.id === "skaven";
  const countUnit = unitId => state.roster.filter(entry => entry.unitId === unitId).length;
  const hasSkrolk = () => state.roster.some(entry => entry.sectionKey === "specialCharacters" && entry.unitId === "skrolk");

  state.armyOptions = state.armyOptions || {};

  function mainstayUnitId() {
    if (hasSkrolk() && state.armyOptions.skavenSkrolkGeneral) return "plague_monks";
    return "clanrat_warriors";
  }

  function mainstayName() {
    return mainstayUnitId() === "plague_monks" ? "Plague Monks" : "Clanrat Warriors";
  }

  function mainstayCount() {
    return countUnit(mainstayUnitId());
  }

  function mainstayViolations() {
    if (!isSkaven()) return [];
    const cap = mainstayCount();
    const mainstayId = mainstayUnitId();
    const counts = new Map();

    for (const entry of state.roster) {
      if (entry.sectionKey !== "regiments" && entry.sectionKey !== "warMachines") continue;
      if (entry.unitId === mainstayId) continue;
      counts.set(entry.unitId, (counts.get(entry.unitId) || 0) + 1);
    }

    const violations = [];
    for (const [unitId, count] of counts.entries()) {
      if (count <= cap) continue;
      const entry = state.roster.find(x => x.unitId === unitId);
      const unit = entry ? getUnit(entry.sectionKey, entry.unitId) : null;
      violations.push(`${unit?.name || humanise(unitId)}: ${count} choice${count === 1 ? "" : "s"}, maximum ${cap}`);
    }
    return violations;
  }

  function regimentModelPoints(entry, unit) {
    if (entry.sectionKey !== "regiments") return null;
    let total = Number(unit.points?.value || 0) * Number(entry.size || 0);
    for (const option of unit.options || []) {
      const selected = entry.optionSelections?.[option.id];
      if (!selected) continue;
      if (option.cost?.type === "per_model") {
        total += Number(option.cost.value || 0) * Number(entry.size || 0);
      } else if (option.type === "quantity") {
        total += Number(selected || 0) * Number(option.cost?.value || option.cost || 0);
      }
    }
    return total;
  }

  function undersizedRegiments() {
    if (!isSkaven()) return [];
    return state.roster.flatMap(entry => {
      if (entry.sectionKey !== "regiments") return [];
      const unit = getUnit(entry.sectionKey, entry.unitId);
      const points = regimentModelPoints(entry, unit);
      return points < 50 ? [`${unit.name}: ${formatPoints(points)} pts of regiment models`] : [];
    });
  }

  // BSB is explicitly 0-1; special characters are unique globally.
  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (isSkaven()) {
      const unit = getUnit(sectionKey, unitId);
      const alreadyPresent = state.roster.some(entry => entry.sectionKey === sectionKey && entry.unitId === unitId);
      if (alreadyPresent && ((unit?.tags || []).includes("zero_one") || sectionKey === "specialCharacters")) {
        window.alert(`${unit.name} may only be included once in a Skaven army.`);
        return;
      }
    }
    return oldAddUnit(sectionKey, unitId);
  };

  // Jezzails form units of one to five teams. The generic size input only has a
  // minimum, so enforce the source maximum on save.
  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isSkaven() && state.draft) {
      if (state.draft.unitId === "warplock_jezzail_team" && Number(state.draft.size || 0) > 5) {
        window.alert("A Warplock Jezzail unit may contain no more than five teams.");
        return;
      }
      if ((state.draft.unitId === "giant_rat_pack" || state.draft.unitId === "rat_ogre_pack") &&
          Number(state.draft.optionSelections?.packmasters || 0) < 1) {
        window.alert("A Giant Rat or Rat Ogre pack must include at least one Packmaster.");
        return;
      }
    }
    oldSaveEditor();
  };

  function secondaryRow(profileId, label, notes = [], css = "mount") {
    const profile = profileById.get(profileId);
    if (!profile) return "";
    return `
      <tr class="${css}-row">
        <td class="unit-cell ${css}-name">↳ ${escapeHtml(label || profile.name || humanise(profileId))}</td>
        ${rosterPadProfileCells(profile)}
        <td class="save">–</td>
        <td class="notes-cell ${css}-notes">${rosterPadNotesInline(notes)}</td>
        <td class="points-cell"></td>
      </tr>
    `;
  }

  function skavenAdditionalRows(entry, unit) {
    if (!isSkaven()) return "";
    let rows = "";

    for (const component of unit.additionalProfiles || []) {
      rows += secondaryRow(component.profileId, component.label, component.notes || ["Additional profile"]);
    }

    if (unit.id === "giant_rat_pack" || unit.id === "rat_ogre_pack") {
      const count = Number(entry.optionSelections?.packmasters || 0);
      if (count > 0) rows += secondaryRow("packmaster", `${count} Packmaster${count === 1 ? "" : "s"}`, ["Beastmasters"], "crew");
    }

    return rows;
  }

  const oldRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    const base = oldRosterPadRow(entry);
    if (!isSkaven()) return base;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return base + skavenAdditionalRows(entry, unit);
  };

  const oldRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    oldRenderArmyStatus(total);
    if (!isSkaven()) return;

    const violations = mainstayViolations();
    const undersized = undersizedRegiments();
    const skrolk = hasSkrolk();

    const panel = document.createElement("div");
    panel.className = "warning-box";
    panel.style.marginTop = "10px";

    const selector = skrolk ? `
      <label style="display:flex;align-items:center;gap:7px;margin-top:7px;">
        <input type="checkbox" data-skaven-skrolk-general ${state.armyOptions.skavenSkrolkGeneral ? "checked" : ""}>
        <span>Lord Skrolk is the General — use Plague Monks as mainstay instead of Clanrat Warriors</span>
      </label>
    ` : "";

    const mainstayText = `<strong>Skaven mainstay:</strong> ${escapeHtml(mainstayName())} × ${mainstayCount()}.`;
    const violationText = violations.length
      ? `<div style="margin-top:5px;"><strong>Mainstay limit exceeded:</strong> ${violations.map(escapeHtml).join("; ")}</div>`
      : `<div style="margin-top:5px;">All regiment and war-machine choice counts are within the current mainstay limit.</div>`;
    const sizeText = undersized.length
      ? `<div style="margin-top:5px;"><strong>Regiments below 50 points of models:</strong> ${undersized.map(escapeHtml).join("; ")}</div>`
      : "";

    panel.innerHTML = `${mainstayText}${violationText}${sizeText}${selector}`;
    els.armyStatus.appendChild(panel);

    const toggle = panel.querySelector("[data-skaven-skrolk-general]");
    if (toggle) {
      toggle.addEventListener("change", () => {
        state.armyOptions.skavenSkrolkGeneral = toggle.checked;
        renderArmy();
      });
    }
  };
})();
;
/* ===== END skaven_extensions.js ===== */

/* ===== BEGIN skaven_variable_units.js ===== */
// Variable-size Skaven choices that live in the war-machine section.
(() => {
  const oldRenderWarMachineEditor = renderWarMachineEditor;
  renderWarMachineEditor = function(entry, unit) {
    let html = oldRenderWarMachineEditor(entry, unit);
    if (state.data?.faction?.id !== "skaven" || unit.points?.type !== "per_model") return html;

    const min = Number(unit.size?.minimum || 1);
    const max = unit.size?.maximum != null ? Number(unit.size.maximum) : null;
    const sizeEditor = `
      <section class="editor-section">
        <h3 class="editor-section-title">Unit Size</h3>
        <div class="dialog-field">
          <label for="edit-war-machine-size">Number of ${unit.id === "rat_swarm" ? "swarm bases" : "teams"}</label>
          <input id="edit-war-machine-size" type="number" min="${min}" ${max ? `max="${max}"` : ""} step="1"
            value="${Number(entry.size || min)}" data-field="size">
          <div class="field-hint">${formatPoints(unit.points.value)} pts each${max ? ` · maximum ${max}` : ""}.</div>
        </div>
      </section>
    `;
    return sizeEditor + html;
  };
})();
;
/* ===== END skaven_variable_units.js ===== */

/* ===== BEGIN chaos_extensions.js ===== */
// Chaos-specific army variants, devotion/Mark handling, legality and Roster Pad support.
(() => {
  const CHAOS_ARMY_IDS = new Set([
    "chaos_warriors", "chaos_beastmen", "chaos_daemons", "chaos_warband", "chaos_warhost"
  ]);
  const POWERS = ["undivided", "khorne", "tzeentch", "nurgle", "slaanesh"];
  const POWER_NAMES = {
    mixed: "Mixed Powers",
    undivided: "Chaos Undivided",
    khorne: "Khorne",
    tzeentch: "Tzeentch",
    nurgle: "Nurgle",
    slaanesh: "Slaanesh"
  };
  const VARIANT_FACTION = {
    chaos_warriors: "warriors",
    chaos_beastmen: "beastmen",
    chaos_daemons: "daemons"
  };

  state.armyOptions = state.armyOptions || {};
  state.armyOptions.chaosDevotions = state.armyOptions.chaosDevotions || {};

  const isChaos = () => state.data?.faction?.id === "chaos" && CHAOS_ARMY_IDS.has(state.selectedArmyId);
  const variant = () => state.selectedArmyId;
  const isWarband = () => variant() === "chaos_warband";
  const isWarhost = () => variant() === "chaos_warhost";
  const pureFaction = () => VARIANT_FACTION[variant()] || null;

  function defaultDevotion() {
    if (isWarband()) return "undivided";
    if (isWarhost()) return "mixed";
    return "mixed";
  }

  function devotion() {
    if (!isChaos()) return "mixed";
    const key = variant();
    let value = state.armyOptions.chaosDevotions[key];
    if (!value || (isWarband() && value === "mixed")) {
      value = defaultDevotion();
      state.armyOptions.chaosDevotions[key] = value;
    }
    if (isWarhost()) value = "mixed";
    return value;
  }

  function singlePower() {
    const value = devotion();
    return value === "mixed" ? null : value;
  }

  function markChoices(unit) {
    let choices = POWERS.slice();
    if ((unit.tags || []).includes("wizard")) choices = choices.filter(power => power !== "khorne");
    const forced = singlePower();
    if (forced) choices = choices.filter(power => power === forced);
    return choices;
  }

  function entryMark(entry, unit) {
    if (unit?.chaosPower) return unit.chaosPower;
    const forced = singlePower();
    if (forced) return forced;
    return entry?.chaosMark || "undivided";
  }

  function championMark(entry, unit) {
    const forced = singlePower();
    if (forced) return forced;
    return entry?.champion?.chaosMark || "undivided";
  }

  function unitFactionAllowed(unit) {
    if (!unit) return false;
    const faction = pureFaction();
    if (!faction) {
      if (unit.chaosFaction === "mixed_mortal") return true;
      return true;
    }
    if (unit.chaosFaction === "shared") return true;
    if (Array.isArray(unit.chaosFactions) && unit.chaosFactions.includes(faction)) return true;
    if (unit.chaosFaction === "mixed_mortal") return faction === "warriors" || faction === "beastmen";
    return unit.chaosFaction === faction;
  }

  function unitPowerAllowed(unit) {
    const power = singlePower();
    if (!power || !unit?.chaosPower) return true;
    return unit.chaosPower === power;
  }

  function unitAllowed(unit) {
    if (!unitFactionAllowed(unit) || !unitPowerAllowed(unit)) return false;
    if (singlePower() === "khorne" && (unit.tags || []).includes("wizard")) return false;
    return true;
  }

  // Filter the unit browser without mutating the underlying shared Chaos data.
  const oldRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    if (!isChaos()) return oldRenderUnitBrowser();
    const faction = state.data.faction;
    const keys = ["characters", "regiments", "warMachines", "specialCharacters"];
    const originals = Object.fromEntries(keys.map(key => [key, faction[key]]));
    for (const key of keys) faction[key] = (faction[key] || []).filter(unitAllowed);
    try {
      oldRenderUnitBrowser();
    } finally {
      for (const key of keys) faction[key] = originals[key];
    }
  };

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isChaos()) {
      if ((unit.tags || []).includes("mark_eligible")) entry.chaosMark = singlePower() || "undivided";
      if (unit.champion?.tags?.includes("mark_eligible")) entry.champion.chaosMark = singlePower() || "undivided";
    }
    return entry;
  };

  function mountAllowed(mountId, mark) {
    const required = {
      juggernaut: "khorne",
      disc: "tzeentch",
      beast_nurgle: "nurgle",
      steed_slaanesh: "slaanesh"
    }[mountId];
    return !required || required === mark;
  }

  const oldRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    if (!isChaos()) return oldRenderCharacterEditor(entry, unit);

    const view = clone(unit);
    const mark = entryMark(entry, unit);
    if ((view.mountOptions || []).length) {
      view.mountOptions = view.mountOptions.filter(mount => mountAllowed(mount.mountId, mark));
    }

    let html = oldRenderCharacterEditor(entry, view);

    if ((unit.tags || []).includes("mark_eligible")) {
      const choices = markChoices(unit);
      html = `
        <section class="editor-section">
          <h3 class="editor-section-title">Mark of Chaos</h3>
          <div class="dialog-field">
            <label>Allegiance</label>
            <select data-chaos-mark>
              ${choices.map(power => `<option value="${escapeHtml(power)}" ${mark === power ? "selected" : ""}>${escapeHtml(POWER_NAMES[power])}</option>`).join("")}
            </select>
          </div>
        </section>
      ` + html;
    }

    if ((unit.options || []).length) {
      html += `
        <section class="editor-section">
          <h3 class="editor-section-title">Chaos Options</h3>
          ${renderUnitOptions(entry, unit)}
        </section>
      `;
    }

    return html;
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = oldRenderRegimentEditor(entry, unit);
    if (!isChaos() || !entry.champion?.selected || !unit.champion?.tags?.includes("mark_eligible")) return html;
    const mark = championMark(entry, unit);
    const choices = singlePower() ? [singlePower()] : POWERS;
    html += `
      <section class="editor-section">
        <h3 class="editor-section-title">Champion Mark of Chaos</h3>
        <div class="dialog-field">
          <label>Allegiance</label>
          <select data-chaos-champion-mark>
            ${choices.map(power => `<option value="${escapeHtml(power)}" ${mark === power ? "selected" : ""}>${escapeHtml(POWER_NAMES[power])}</option>`).join("")}
          </select>
        </div>
      </section>
    `;
    return html;
  };

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isChaos() || !state.draft) return;

    const mark = els.dialogContent.querySelector("[data-chaos-mark]");
    if (mark) {
      mark.addEventListener("change", () => {
        state.draft.chaosMark = mark.value;
        // A mount dedicated to another god cannot survive a Mark change.
        const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
        if (state.draft.mount && !mountAllowed(state.draft.mount, entryMark(state.draft, unit))) state.draft.mount = null;
        renderEditor();
      });
    }

    const championMarkSelect = els.dialogContent.querySelector("[data-chaos-champion-mark]");
    if (championMarkSelect) {
      championMarkSelect.addEventListener("change", () => {
        state.draft.champion.chaosMark = championMarkSelect.value;
        renderEditor();
      });
    }

    // Chaos Banners are BSB-only, never regiment magic banners.
    const bannerSelect = els.dialogContent.querySelector("[data-magic-banner]");
    if (bannerSelect) {
      for (const option of bannerSelect.options) {
        if (!option.value) continue;
        const item = getMagicItem(option.value);
        if (item?.chaosBanner) {
          option.disabled = true;
          option.hidden = true;
        }
        if (item?.chaosPower && singlePower() && item.chaosPower !== singlePower()) {
          option.disabled = true;
          option.hidden = true;
        }
      }
    }
  };

  const oldGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const choices = oldGetAllowedMagicItems(unit, context);
    if (!isChaos()) return choices;

    const entry = state.draft;
    const mark = context === "champion" ? championMark(entry, unit) : entryMark(entry, unit);
    const isDaemon = unit.chaosFaction === "daemons";
    const isBSB = (unit.tags || []).includes("battle_standard_bearer");
    const isBeast = unit.chaosFaction === "beastmen";
    const isSorcerer = (unit.tags || []).includes("chaos_sorcerer");
    const isBeastShaman = (unit.tags || []).includes("beast_shaman");
    const isChampion = context === "champion" || (!isDaemon && (unit.tags || []).some(tag => tag === "chaos_warriors" || tag === "chaos_beastmen"));

    return choices.filter(item => {
      if (isDaemon) {
        if (!item.daemonReward && !item.chaosBanner) return false;
      } else if (item.daemonReward) return false;

      if (item.chaosReward && !isChampion) return false;
      if (item.beastmenOnly && !isBeast) return false;
      if (item.championOnly && isDaemon) return false;
      if (item.chaosSorcererOnly && !isSorcerer) return false;
      if (item.beastShamanOnly && !isBeastShaman) return false;
      if (item.daemonPrinceOnly && unit.id !== "daemon_prince") return false;

      if (item.chaosPower && item.chaosPower !== mark) return false;

      if (item.chaosBanner) {
        if (!isBSB) return false;
        if (!singlePower()) return false;
        if (item.chaosPower && item.chaosPower !== singlePower()) return false;
      }

      if (item.regimentBanner) return false;
      return true;
    });
  };

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isChaos() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      const mark = entryMark(state.draft, unit);
      if ((unit.tags || []).includes("wizard") && mark === "khorne") {
        window.alert("Chaos Sorcerers cannot bear the Mark of Khorne.");
        return;
      }
      if (unit.id === "daemon_prince" && mark === "khorne" && Number(state.draft.optionSelections?.magic_levels || 0) > 0) {
        window.alert("A Daemon Prince of Khorne cannot buy magic levels.");
        return;
      }
    }
    oldSaveEditor();
  };

  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (isChaos()) {
      const unit = getUnit(sectionKey, unitId);
      if (!unitAllowed(unit)) {
        window.alert(`${unit.name} is not available to this Chaos army configuration.`);
        return;
      }
      const already = state.roster.some(entry => entry.sectionKey === sectionKey && entry.unitId === unitId);
      if (already && ((unit.tags || []).includes("zero_one") || sectionKey === "specialCharacters")) {
        window.alert(`${unit.name} may only be included once.`);
        return;
      }
    }
    return oldAddUnit(sectionKey, unitId);
  };

  // Chaos Armour is heavy armour with a further +1 save, so it starts at 4+.
  const oldCalculatePrintedArmourSave = calculatePrintedArmourSave;
  calculatePrintedArmourSave = function(entry, unit) {
    if (!isChaos()) return oldCalculatePrintedArmourSave(entry, unit);
    if (Number(unit.fixedArmourSave) > 0) return oldCalculatePrintedArmourSave(entry, unit);

    const equipment = getSelectedEquipmentIds(entry, unit);
    if (!equipment.includes("chaos_armour")) return oldCalculatePrintedArmourSave(entry, unit);

    let save = 4;
    if (equipment.includes("shield")) save--;
    const mounted = Boolean(entry.mount) || Boolean(unit.unitMount?.mountId) || unit.unitType === "cavalry" || (unit.tags || []).includes("fast_cavalry");
    if (mounted) save--;
    if (equipment.includes("barding")) save--;

    for (const id of entry.magicItems || []) {
      if (id === "scaly_skin") save--;
      if (id === "iron_hard_skin") save -= 2;
    }
    return `${Math.max(2, save)}+`;
  };

  function applyMarkStats(profile, mark) {
    if (!profile?.stats) return null;
    const original = { ...profile.stats };
    if (mark === "khorne" && Number.isFinite(Number(profile.stats.WS))) profile.stats.WS = Number(profile.stats.WS) + 1;
    if (mark === "nurgle" && Number.isFinite(Number(profile.stats.T))) profile.stats.T = Number(profile.stats.T) + 1;
    if (mark === "undivided" && Number.isFinite(Number(profile.stats.Ld))) profile.stats.Ld = Number(profile.stats.Ld) + 1;
    return original;
  }

  function restoreStats(profile, original) {
    if (profile && original) profile.stats = original;
  }

  const oldRosterPadChampionRow = rosterPadChampionRow;
  rosterPadChampionRow = function(entry, unit) {
    if (!isChaos() || !entry.champion?.selected || !unit.champion?.tags?.includes("mark_eligible")) return oldRosterPadChampionRow(entry, unit);
    const profile = profileById.get(unit.champion.profileId);
    const original = applyMarkStats(profile, championMark(entry, unit));
    try { return oldRosterPadChampionRow(entry, unit); }
    finally { restoreStats(profile, original); }
  };

  function secondaryRows(unit) {
    if (!unit?.additionalProfiles?.length) return "";
    return unit.additionalProfiles.map(component => {
      const profile = profileById.get(component.profileId);
      if (!profile) return "";
      return `
        <tr class="mount-row">
          <td class="unit-cell mount-name">↳ ${escapeHtml(component.label || profile.name)}</td>
          ${rosterPadProfileCells(profile)}
          <td class="save">–</td>
          <td class="notes-cell mount-notes">${rosterPadNotesInline(component.notes || ["Additional profile"])}</td>
          <td class="points-cell"></td>
        </tr>
      `;
    }).join("");
  }

  const oldRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    if (!isChaos()) return oldRosterPadRow(entry);
    const unit = getUnit(entry.sectionKey, entry.unitId);
    let original = null;
    let profile = null;
    if ((unit.tags || []).includes("mark_eligible") && !unit.chaosPower) {
      profile = profileById.get(unit.profileId);
      original = applyMarkStats(profile, entryMark(entry, unit));
    }
    try {
      return oldRosterPadRow(entry) + secondaryRows(unit);
    } finally {
      restoreStats(profile, original);
    }
  };

  function variantTitle() {
    return {
      chaos_warriors: "Chaos Warriors",
      chaos_beastmen: "Beastmen",
      chaos_daemons: "Chaos Daemons",
      chaos_warband: "Chaos Warband",
      chaos_warhost: "Chaos Warhost"
    }[variant()] || "Chaos";
  }

  function invalidExistingEntries() {
    return state.roster.filter(entry => {
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (!unitAllowed(unit)) return true;
      const forced = singlePower();
      if (!forced) return false;
      if ((unit.tags || []).includes("mark_eligible") && entryMark(entry, unit) !== forced) return true;
      return false;
    });
  }

  function warbandWarnings() {
    if (!isWarband() && !isWarhost()) return [];
    const warnings = [];
    const warriorChars = state.roster.filter(entry => entry.sectionKey === "characters").map(entry => getUnit(entry.sectionKey, entry.unitId)).filter(unit => unit?.chaosFaction === "warriors" && !(unit.tags || []).includes("wizard"));
    if (!warriorChars.length) warnings.push("A Warband/Warhost must include a Chaos Warrior character capable of being the general.");

    const hasCore = state.roster.some(entry => entry.sectionKey === "regiments" && (entry.unitId === "chaos_warriors" || entry.unitId === "chaos_knights"));
    if (!hasCore) warnings.push("A Warband/Warhost must include Chaos Warriors or Chaos Knights.");

    const wrongBSB = state.roster.some(entry => {
      if (entry.sectionKey !== "characters") return false;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      return (unit?.tags || []).includes("battle_standard_bearer") && unit.chaosFaction !== "warriors";
    });
    if (wrongBSB) warnings.push("A Warband/Warhost Battle Standard Bearer must come from the Chaos Warriors section.");
    return warnings;
  }

  const oldRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    oldRenderArmyStatus(total);
    if (!isChaos()) return;

    const key = variant();
    const current = devotion();
    const choices = isWarband() ? POWERS : (isWarhost() ? [] : ["mixed", ...POWERS]);
    const selector = choices.length ? `
      <select class="army-system-select" data-chaos-devotion>
        ${choices.map(power => `<option value="${escapeHtml(power)}" ${current === power ? "selected" : ""}>${escapeHtml(POWER_NAMES[power])}</option>`).join("")}
      </select>
    ` : `<strong>${escapeHtml(POWER_NAMES[current])}</strong>`;

    const warnings = warbandWarnings();
    if (isWarhost() && Number(state.pointsLimit || 0) < 2000) warnings.push("Chaos Warhost is only available in armies of at least 2,000 points.");
    if (pureFaction() === "beastmen") warnings.push("Pure Beastmen armies may use the Ambush special rule.");
    if (pureFaction() === "daemons") warnings.push("Pure Daemon armies may mix Chaos Powers without Daemon Animosity; only a Daemon may be the general.");

    const invalid = invalidExistingEntries();
    if (invalid.length) warnings.push(`${invalid.length} existing choice${invalid.length === 1 ? " is" : "s are"} incompatible with the current devotion/army type.`);

    const panel = document.createElement("div");
    panel.className = "army-system-panel" + (warnings.some(w => /must|only available|incompatible/i.test(w)) ? " warn" : "");
    panel.innerHTML = `
      <div class="army-system-copy">
        <strong>${escapeHtml(variantTitle())} — ${isWarband() ? "Chaos Power" : "Army Devotion"}</strong>
        <span>${isWarband() ? "Warbands must serve one Chaos Power." : isWarhost() ? "Warhosts may combine followers of different Chaos Powers." : "Pure faction armies may mix Powers, or dedicate the whole army to one Power to unlock Chaos Banners."}</span>
        ${warnings.length ? `<span style="margin-top:6px;"><strong>Rules:</strong> ${warnings.map(escapeHtml).join(" ")}</span>` : ""}
      </div>
      ${selector}
    `;
    els.armyStatus.appendChild(panel);

    const select = panel.querySelector("[data-chaos-devotion]");
    if (select) {
      select.addEventListener("change", () => {
        state.armyOptions.chaosDevotions[key] = select.value;
        renderUnitBrowser();
        renderArmy();
      });
    }
  };
})();
;
/* ===== END chaos_extensions.js ===== */

/* ===== BEGIN chaos_final_fixes.js ===== */
// Final Chaos construction edge cases layered after chaos_extensions.js.
(() => {
  const CHAOS_IDS = new Set(["chaos_warriors","chaos_beastmen","chaos_daemons","chaos_warband","chaos_warhost"]);
  const isChaos = () => state.data?.faction?.id === "chaos" && CHAOS_IDS.has(state.selectedArmyId);

  function singlePower() {
    if (!isChaos() || state.selectedArmyId === "chaos_warhost") return null;
    const stored = state.armyOptions?.chaosDevotions?.[state.selectedArmyId];
    if (state.selectedArmyId === "chaos_warband") return stored && stored !== "mixed" ? stored : "undivided";
    return stored && stored !== "mixed" ? stored : null;
  }

  function daemonPrinceIsBSB(entry = state.draft) {
    return Boolean(entry?.unitId === "daemon_prince" && entry.optionSelections?.battle_standard);
  }

  // In mixed Chaos forces the source reserves Ungor bows and Centaur missile
  // weapons for pure Beastmen armies.
  const previousRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isChaos() || state.selectedArmyId === "chaos_beastmen") {
      return previousRenderRegimentEditor(entry, unit);
    }

    if (unit.id !== "ungors" && unit.id !== "centaurs") {
      return previousRenderRegimentEditor(entry, unit);
    }

    const view = clone(unit);
    if (view.id === "ungors") {
      view.options = (view.options || []).filter(option => option.id !== "short_bows");
    }
    if (view.id === "centaurs") {
      view.options = (view.options || []).map(option => {
        if (option.type !== "choice_group") return option;
        return {
          ...option,
          choices: (option.choices || []).filter(choice => {
            const id = typeof choice === "string" ? choice : choice.id;
            return id !== "bow" && id !== "throwing_spear";
          })
        };
      }).filter(option => option.type !== "choice_group" || (option.choices || []).length);
    }
    return previousRenderRegimentEditor(entry, view);
  };

  // A Daemon Prince using the Small reward may carry the battle standard.
  // In a single-Power army it may additionally carry a Chaos Banner without
  // reducing its normal Daemonic Reward allowance.
  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const result = previousGetAllowedMagicItems(unit, context);
    if (!isChaos() || context === "champion" || unit.id !== "daemon_prince" || !daemonPrinceIsBSB()) return result;

    const power = singlePower();
    if (!power) return result;

    const banners = (state.data.factionMagicItems || []).filter(item =>
      item.chaosBanner && (!item.chaosPower || item.chaosPower === power)
    );
    const byId = new Map(result.map(item => [item.id, item]));
    for (const banner of banners) byId.set(banner.id, banner);
    return [...byId.values()];
  };

  const previousGetMagicMaximum = getMagicMaximum;
  getMagicMaximum = function(unit, context) {
    const normal = previousGetMagicMaximum(unit, context);
    if (isChaos() && context !== "champion" && unit.id === "daemon_prince" && daemonPrinceIsBSB()) {
      return normal + 1;
    }
    return normal;
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isChaos() && state.draft?.unitId === "daemon_prince" && state.draft.optionSelections?.battle_standard) {
      if (!(state.draft.magicItems || []).includes("small")) {
        window.alert("A Daemon Prince may carry the battle standard only when it has the Small Daemonic Reward.");
        return;
      }
      if (state.draft.optionSelections?.wings) {
        window.alert("A Small Daemon Prince carrying the battle standard cannot have wings.");
        return;
      }
      const chosenBanner = (state.draft.magicItems || []).some(id => getMagicItem(id)?.chaosBanner);
      if (!singlePower() && chosenBanner) {
        window.alert("A Daemonic Battle Standard Bearer may carry a Chaos Banner only when the whole army is devoted to one Chaos Power.");
        return;
      }
    }
    previousSaveEditor();
  };

  // The source says the Warband general must be a character from the Chaos
  // Warrior section; this includes Chaos Sorcerers. Remove the earlier warning
  // when such a legal character is present, while retaining the BSB/core checks.
  const previousRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    previousRenderArmyStatus(total);
    if (!isChaos()) return;

    if (state.selectedArmyId === "chaos_warband" || state.selectedArmyId === "chaos_warhost") {
      const hasWarriorGeneralCandidate = state.roster.some(entry => {
        if (entry.sectionKey !== "characters") return false;
        const unit = getUnit(entry.sectionKey, entry.unitId);
        return unit?.chaosFaction === "warriors" && !(unit.tags || []).includes("battle_standard_bearer");
      });

      if (hasWarriorGeneralCandidate) {
        for (const span of els.armyStatus.querySelectorAll(".army-system-panel span")) {
          if (span.innerHTML.includes("A Warband/Warhost must include a Chaos Warrior character capable of being the general.")) {
            span.innerHTML = span.innerHTML.replace("A Warband/Warhost must include a Chaos Warrior character capable of being the general.", "").replace(/\s{2,}/g, " ");
          }
        }
      }

      const illegalDaemonBSB = state.roster.some(entry => entry.unitId === "daemon_prince" && entry.optionSelections?.battle_standard);
      if (illegalDaemonBSB) {
        const panel = els.armyStatus.querySelector(".army-system-panel:last-of-type");
        const copy = panel?.querySelector(".army-system-copy");
        if (copy) copy.insertAdjacentHTML("beforeend", `<span style="margin-top:6px;"><strong>Rules:</strong> A Warband/Warhost Battle Standard Bearer must come from the Chaos Warriors section.</span>`);
        if (panel) panel.classList.add("warn");
      }
    }
  };
})();
;
/* ===== END chaos_final_fixes.js ===== */

/* ===== BEGIN common_magic_item_effects.js ===== */
// Shared behaviour for common magic items whose rules affect army construction/points.
(() => {
  const ENDLESS_BANNER_ID = "endless_banner";

  function selectedEquipmentHasMissileWeapon(entry, unit) {
    const ids = typeof getSelectedEquipmentIds === "function"
      ? getSelectedEquipmentIds(entry, unit)
      : [];

    return ids.some(id => {
      const equipment = equipmentById?.get?.(id);
      const type = String(equipment?.type || "").toLowerCase();
      const name = String(equipment?.name || humanise(id) || "").toLowerCase();
      return type.includes("missile") || /\b(bow|longbow|crossbow|handgun|pistol|javelin|sling|throwing weapon|blowpipe)\b/.test(name);
    });
  }

  function endlessBannerEligible(entry, unit) {
    if (!entry || !unit || entry.sectionKey !== "regiments") return false;
    if (Number(entry.size || 0) < 40) return false;
    if (selectedEquipmentHasMissileWeapon(entry, unit)) return false;
    return true;
  }

  function endlessBannerDiscount(total) {
    const cap = Number(state.pointsLimit || 0) >= 3000 ? 100 : 50;
    return Math.min(Number(total || 0) * 0.20, cap);
  }

  // Endless Banner is a regiment-only banner and explicitly cannot be carried by a BSB.
  // Keep it out of character/champion magic-item selectors, but leave it visible in the
  // regiment Magic Banner dropdown so a player can select it after increasing the unit size.
  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    return previousGetAllowedMagicItems(unit, context)
      .filter(item => item.id !== ENDLESS_BANNER_ID);
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (state.draft?.magicBanner === ENDLESS_BANNER_ID) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (!endlessBannerEligible(state.draft, unit)) {
        window.alert("Endless Banner can only be carried by a regiment of at least 40 models with no missile weapons.");
        return;
      }
    }
    return previousSaveEditor();
  };

  // Apply the effect after all ordinary unit, option, champion and banner costs have
  // been calculated, so every screen that calls calculateEntry receives the same total.
  const previousCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    const total = previousCalculateEntry(entry);
    if (entry?.magicBanner !== ENDLESS_BANNER_ID) return total;

    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!endlessBannerEligible(entry, unit)) return total;

    return total - endlessBannerDiscount(total);
  };
})();
;
/* ===== END common_magic_item_effects.js ===== */

/* ===== BEGIN undead_magic_banners.js ===== */
// Shared magic-banner support for Vampire Counts, Tomb Kings and Classic Undead.
(() => {
  const UNDEAD_ARMIES = new Set(["vampire_counts", "tomb_kings", "classic_undead"]);

  const UNDEAD_BANNERS = [
    {id:"banner_swift_shooting",name:"Banner of Swift Shooting",category:"magic_banner",cost:10,rules:"Once per game, the unit may either fire its missile weapons twice at the same target in one Shooting phase, or make a Stand and Shoot reaction, in either case without penalties to hit."},
    {id:"banner_swift_charging",name:"Banner of Swift Charging",category:"magic_banner",cost:10,rules:"One use only. On its first charge, the unit adds +2 inches to its charge range."},
    {id:"standard_hellish_vigour",name:"Standard of Hellish Vigour",category:"magic_banner",cost:10,rules:"Undead regiments only. Initiative 10."},
    {id:"ghost_rider_banner",name:"Ghost Rider Banner",category:"magic_banner",cost:10,rules:"Skeleton Horsemen only. The unit may move through terrain in the same way as ethereal models."},
    {id:"icon_rakaph",name:"Icon of Rakaph",category:"magic_banner",cost:25,rules:"Tomb Guards only. Once per battle, the unit may make a free complete reform before charges are declared."},
    {id:"doom_rider_banner",name:"Doom Rider Banner",category:"magic_banner",cost:25,rules:"Skeleton Horsemen only. Riders hit automatically on the charge; does not affect steeds or accompanying characters."},
    {id:"banner_hidden_death",name:"Banner of Hidden Death",category:"magic_banner",cost:25,rules:"Battle Standard Bearer only. Monstrous Scorpions and Scorpion Swarms may deploy up to 12 inches from the enemy after scouts but before vanguard moves."},
    {id:"standard_desert",name:"Standard of the Desert",category:"magic_banner",cost:25,rules:"Regiments from the Tomb Kings army only. The regiment may march even outside 12 inches of the general and with enemies within 8 inches at the start of the turn."},
    {id:"banner_blood_keep",name:"Banner of Blood Keep",category:"magic_banner",cost:100,rules:"All Vampires in the regiment become subject to frenzy. Vampires leaving the unit lose the frenzy at the beginning of the next player turn."},
    {id:"banner_binding",name:"Banner of Binding",category:"magic_banner",cost:100,rules:"Skeletons only, but not Tomb Guard."}
  ];

  function isUndeadArmy() {
    return UNDEAD_ARMIES.has(state.selectedArmyId) && UNDEAD_ARMIES.has(state.data?.faction?.id);
  }

  function hasStandardBearer(unit) {
    if (!unit || (unit.tags || []).includes("skirmisher")) return false;
    const definition = getCommandDefinition(unit, "standardBearer");
    return definition?.allowed !== false;
  }

  function isSkeletonHorsemen(unit) {
    return /skeleton.*(light|heavy)?.*horse/i.test(String(unit?.name || ""));
  }

  function isTombGuard(unit) {
    return unit?.id === "tomb_guards" || /tomb guard/i.test(String(unit?.name || ""));
  }

  function isSkeletonRegiment(unit) {
    return /skeleton/i.test(String(unit?.name || "")) && !isTombGuard(unit);
  }

  function bannerAllowedForRegiment(item, unit) {
    if (!item || item.category !== "magic_banner") return true;
    switch (item.id) {
      case "standard_hellish_vigour": return (unit.tags || []).includes("undead");
      case "ghost_rider_banner":
      case "doom_rider_banner": return isSkeletonHorsemen(unit);
      case "icon_rakaph": return isTombGuard(unit);
      case "banner_hidden_death": return false;
      case "standard_desert": return state.selectedArmyId === "tomb_kings";
      case "banner_binding": return isSkeletonRegiment(unit);
      default: return true;
    }
  }

  function bannerAllowedForBsb(item) {
    if (!item || item.category !== "magic_banner") return false;
    switch (item.id) {
      case "ghost_rider_banner":
      case "doom_rider_banner":
      case "icon_rakaph":
      case "standard_desert":
      case "banner_binding":
        return false;
      default:
        return true;
    }
  }

  function patchUndeadData() {
    if (!isUndeadArmy() || state.data.__undeadMagicBannersPatched) return;
    state.data.__undeadMagicBannersPatched = true;

    state.data.factionMagicItems = state.data.factionMagicItems || [];
    for (const banner of UNDEAD_BANNERS) {
      if (!state.data.factionMagicItems.some(item => item.id === banner.id)) {
        state.data.factionMagicItems.push({...banner});
      }
    }

    for (const unit of state.data.faction?.regiments || []) {
      if (hasStandardBearer(unit)) {
        unit.magicBanner = {...(unit.magicBanner || {}), allowed:true};
      }
    }
  }

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!isUndeadArmy()) return;
    patchUndeadData();
    buildIndexes();
    renderUnitBrowser();
    renderArmy();
  };

  const previousRenderMagicBannerEditor = renderMagicBannerEditor;
  renderMagicBannerEditor = function(entry, unit) {
    if (!isUndeadArmy()) return previousRenderMagicBannerEditor(entry, unit);
    patchUndeadData();
    const original = state.data.factionMagicItems;
    state.data.factionMagicItems = (original || []).filter(item => bannerAllowedForRegiment(item, unit));
    try {
      return previousRenderMagicBannerEditor(entry, unit);
    } finally {
      state.data.factionMagicItems = original;
    }
  };

  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let items = previousGetAllowedMagicItems(unit, context);
    if (!isUndeadArmy() || context !== "character" || !(unit?.tags || []).some(tag => tag === "bsb" || tag === "battle_standard_bearer")) {
      return items;
    }
    patchUndeadData();
    const banners = (state.data.factionMagicItems || []).filter(bannerAllowedForBsb);
    const seen = new Set(items.map(item => item.id));
    for (const banner of banners) if (!seen.has(banner.id)) items.push(banner);
    return items;
  };
})();
;
/* ===== END undead_magic_banners.js ===== */

/* ===== BEGIN chaos_abomination.js ===== */
// Full WHR Chaos Abomination builder.
(() => {
  const ALLOWED_ARMIES = new Set(["chaos_warriors", "chaos_beastmen"]);
  const BASE_STATS = { M: 6, WS: 4, BS: 0, S: 5, T: 4, W: 4, I: 4, A: 3, Ld: 6 };
  const CHARACTER_UPGRADES = {
    M: { label: "+1 Movement", per: 1, cost: 5 },
    WS: { label: "+1 Weapon Skill", per: 1, cost: 5 },
    S: { label: "+1 Strength", per: 1, cost: 10 },
    T: { label: "+1 Toughness", per: 1, cost: 15 },
    W: { label: "+1 Wound", per: 1, cost: 10 },
    I: { label: "+3 Initiative", per: 3, cost: 5 },
    A: { label: "+1 Attack", per: 1, cost: 15 },
    Ld: { label: "+1 Leadership", per: 1, cost: 5 }
  };
  const SPECIALS = {
    acid_attacks: { label: "Acid Attacks", cost: 20, note: "No armour save allowed." },
    wings: { label: "Wings", cost: 60, note: "Can fly. Final model cost cannot be below 160 pts." },
    breathe_fire: { label: "Breathe Fire", cost: 30, note: "Strength 4, teardrop template." },
    insect_legs: { label: "Insect Legs", cost: 5, note: "May crawl straight over obstacles, rocky difficult terrain, buildings and sheer cliffs without movement reduction." },
    immune_psychology: { label: "Immune to Psychology", cost: 20, note: "Applies when unridden." },
    hard_skin: { label: "Hard Skin", cost: 20, note: "4+ armour save." },
    stupidity: { label: "Stupidity", cost: -35, note: "35 point discount." },
    random_attacks: { label: "Random Attacks", cost: 35, note: "Makes 1D6+2 attacks each combat round regardless of profile." }
  };

  function isChaos() {
    return state.data?.faction?.id === "chaos";
  }

  function devotion() {
    return state.armyOptions?.chaosDevotions?.[state.selectedArmyId] || "mixed";
  }

  function armyAllowsAbomination() {
    return isChaos() && ALLOWED_ARMIES.has(state.selectedArmyId) && devotion() === "undivided";
  }

  function isAbomination(unit) {
    return Boolean(unit && String(unit.name || "").toLowerCase().includes("chaos abomination"));
  }

  function ensureConfig(entry) {
    if (!entry.abomination) {
      entry.abomination = {
        role: "unridden",
        generalEntryId: null,
        characteristics: { M:0, WS:0, S:0, T:0, W:0, I:0, A:0, Ld:0 },
        specialRules: {}
      };
    }
    entry.abomination.characteristics ||= { M:0, WS:0, S:0, T:0, W:0, I:0, A:0, Ld:0 };
    entry.abomination.specialRules ||= {};
    entry.abomination.role ||= "unridden";
    return entry.abomination;
  }

  function currentStats(entry) {
    const cfg = ensureConfig(entry);
    const stats = { ...BASE_STATS };
    for (const [key, def] of Object.entries(CHARACTER_UPGRADES)) {
      stats[key] = Number(stats[key]) + Math.max(0, Math.min(2, Number(cfg.characteristics[key] || 0))) * def.per;
    }
    return stats;
  }

  function rawBuildCost(entry) {
    const cfg = ensureConfig(entry);
    let total = 30;
    for (const [key, def] of Object.entries(CHARACTER_UPGRADES)) {
      total += Math.max(0, Math.min(2, Number(cfg.characteristics[key] || 0))) * def.cost;
    }
    for (const [key, def] of Object.entries(SPECIALS)) {
      if (cfg.specialRules[key]) total += def.cost;
    }
    return total;
  }

  function abominationCost(entry) {
    const cfg = ensureConfig(entry);
    let total = rawBuildCost(entry);
    if (cfg.role === "chaos_hero") total += 28;
    if (cfg.role === "chaos_lord") total += 42;
    if (cfg.role === "unridden") total *= 1.25;
    total = Math.max(100, total);
    if (cfg.specialRules.wings) total = Math.max(160, total);
    return total;
  }

  function specialCount(entry) {
    const cfg = ensureConfig(entry);
    return Object.keys(SPECIALS).filter(key => cfg.specialRules[key]).length;
  }

  function characterMark(entry) {
    return entry?.chaosMark || devotion();
  }

  function isBSB(unit, entry) {
    return (unit?.tags || []).includes("battle_standard_bearer") || Boolean(entry?.optionSelections?.battle_standard);
  }

  function generalCandidates(role = "unridden") {
    if (!armyAllowsAbomination()) return [];
    return state.roster.filter(entry => {
      if (entry.sectionKey !== "characters") return false;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (!unit || isBSB(unit, entry) || characterMark(entry) !== "undivided") return false;
      if (state.selectedArmyId === "chaos_warriors" && unit.chaosFaction !== "warriors") return false;
      if (state.selectedArmyId === "chaos_beastmen" && unit.chaosFaction !== "beastmen") return false;
      if (role === "chaos_lord") return unit.id === "chaos_lord" || unit.name === "Chaos Lord";
      if (role === "chaos_hero") return unit.id === "chaos_hero" || unit.name === "Chaos Hero";
      if (role === "sorcerer_lord") return unit.id === "chaos_sorcerer_lord" || unit.name === "Chaos Sorcerer Lord";
      return true;
    });
  }

  function candidateLd(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const profile = profileById.get(unit?.profileId);
    let ld = Number(profile?.stats?.Ld || 0);
    if (characterMark(entry) === "undivided") ld += 1;
    return ld;
  }

  function validGeneral(entry) {
    const cfg = ensureConfig(entry);
    const candidates = generalCandidates(cfg.role);
    const selected = candidates.find(candidate => candidate.id === cfg.generalEntryId);
    if (!selected) return false;
    const allCandidates = generalCandidates("unridden");
    const highest = Math.max(0, ...allCandidates.map(candidateLd));
    return candidateLd(selected) === highest;
  }

  function generalLabel(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return unit?.name || "Chaos General";
  }

  function roleOptions() {
    const options = [{ id:"unridden", label:"Independent Monster" }];
    if (state.selectedArmyId === "chaos_warriors") {
      options.push(
        { id:"sorcerer_lord", label:"Mount for Chaos Sorcerer Lord" },
        { id:"chaos_hero", label:"Mount for Chaos Hero (+28 pts)" },
        { id:"chaos_lord", label:"Mount for Chaos Lord (+42 pts)" }
      );
    }
    return options;
  }

  function profileHtml(stats) {
    return `
      <div class="dialog-note" style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;text-align:center;">
          <thead><tr>${["M","WS","BS","S","T","W","I","A","Ld"].map(s => `<th style="padding:4px;">${s}</th>`).join("")}</tr></thead>
          <tbody><tr>${["M","WS","BS","S","T","W","I","A","Ld"].map(s => `<td style="padding:4px;font-weight:700;">${escapeHtml(stats[s])}</td>`).join("")}</tr></tbody>
        </table>
      </div>`;
  }

  const previousRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    if (!isChaos()) return previousRenderUnitBrowser();
    const faction = state.data.faction;
    const original = faction.warMachines;
    if (!armyAllowsAbomination()) {
      faction.warMachines = (original || []).filter(unit => !isAbomination(unit));
    }
    try { return previousRenderUnitBrowser(); }
    finally { faction.warMachines = original; }
  };

  const previousCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = previousCreateEntry(sectionKey, unit);
    if (isChaos() && isAbomination(unit)) ensureConfig(entry);
    return entry;
  };

  const previousAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    const unit = getUnit(sectionKey, unitId);
    if (isChaos() && isAbomination(unit)) {
      if (!armyAllowsAbomination()) {
        window.alert("Chaos Abominations are only available to Chaos Warriors or Beastmen armies devoted to Chaos Undivided.");
        return;
      }
      if (state.roster.some(entry => isAbomination(getUnit(entry.sectionKey, entry.unitId)))) {
        window.alert("Only one Chaos Abomination may be included in the army.");
        return;
      }
    }
    return previousAddUnit(sectionKey, unitId);
  };

  const previousRenderWarMachineEditor = renderWarMachineEditor;
  renderWarMachineEditor = function(entry, unit) {
    if (!isChaos() || !isAbomination(unit)) return previousRenderWarMachineEditor(entry, unit);
    const cfg = ensureConfig(entry);
    const stats = currentStats(entry);
    const candidates = generalCandidates(cfg.role);
    const specialRulesSelected = specialCount(entry);
    const isLarge = Number(cfg.characteristics.S || 0) > 0 || Number(cfg.characteristics.T || 0) > 0 || Number(cfg.characteristics.W || 0) > 0;

    return `
      <section class="editor-section">
        <h3 class="editor-section-title">Build-A-Beast Workshop</h3>
        <div class="dialog-note">Base profile 30 pts. Minimum fielded cost 100 pts. Characteristic upgrades may be taken twice each; choose no more than three special-rule upgrades.</div>
        ${profileHtml(stats)}
        <div class="field-hint">${isLarge ? "Large monster · causes Terror" : "Small monster · causes Fear"}</div>
      </section>

      <section class="editor-section">
        <h3 class="editor-section-title">Use As</h3>
        <div class="dialog-field">
          <label>Role</label>
          <select data-abomination-role>
            ${roleOptions().map(option => `<option value="${option.id}" ${cfg.role === option.id ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
          </select>
        </div>
        <div class="dialog-field">
          <label>Undivided army general</label>
          <select data-abomination-general>
            <option value="">Select the army general…</option>
            ${candidates.map(candidate => `<option value="${escapeHtml(candidate.id)}" ${cfg.generalEntryId === candidate.id ? "selected" : ""}>${escapeHtml(generalLabel(candidate))} (Ld ${candidateLd(candidate)})</option>`).join("")}
          </select>
          <div class="field-hint">The selected model must be among the army's highest-Leadership eligible characters. ${state.selectedArmyId === "chaos_beastmen" ? "Beastmen Abominations are fielded as independent monsters." : "When used as a mount, choose the matching Chaos Lord, Hero or Sorcerer Lord."}</div>
        </div>
      </section>

      <section class="editor-section">
        <h3 class="editor-section-title">Characteristic Upgrades</h3>
        ${Object.entries(CHARACTER_UPGRADES).map(([key, def]) => `
          <div class="dialog-field">
            <label>${escapeHtml(def.label)} — +${formatPoints(def.cost)} pts each</label>
            <input type="number" min="0" max="2" step="1" value="${Number(cfg.characteristics[key] || 0)}" data-abomination-stat="${key}">
          </div>
        `).join("")}
      </section>

      <section class="editor-section">
        <h3 class="editor-section-title">Special Rules <span style="font-weight:400;">(${specialRulesSelected} / 3)</span></h3>
        ${Object.entries(SPECIALS).map(([key, def]) => {
          const checked = Boolean(cfg.specialRules[key]);
          const disabled = key === "immune_psychology" && cfg.role !== "unridden";
          const price = def.cost < 0 ? `${formatPoints(Math.abs(def.cost))} pts discount` : `+${formatPoints(def.cost)} pts`;
          return `<label class="check-row">
            <input type="checkbox" data-abomination-special="${key}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
            <span class="check-row-content">
              <span class="check-row-title"><span>${escapeHtml(def.label)}</span><span>${escapeHtml(price)}</span></span>
              <span class="check-row-sub">${escapeHtml(def.note)}</span>
            </span>
          </label>`;
        }).join("")}
      </section>

      <section class="editor-section">
        <h3 class="editor-section-title">Calculated Cost</h3>
        <div class="dialog-note"><strong>${formatPoints(abominationCost(entry))} pts</strong> — build subtotal ${formatPoints(rawBuildCost(entry))} pts before rider/unridden adjustment and minimum-cost rules.</div>
      </section>
    `;
  };

  const previousWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    previousWireEditorControls();
    if (!isChaos() || !state.draft) return;
    const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
    if (!isAbomination(unit)) return;
    const cfg = ensureConfig(state.draft);

    const role = els.dialogContent.querySelector("[data-abomination-role]");
    if (role) role.addEventListener("change", () => {
      cfg.role = role.value;
      if (cfg.role !== "unridden") cfg.specialRules.immune_psychology = false;
      if (!generalCandidates(cfg.role).some(candidate => candidate.id === cfg.generalEntryId)) cfg.generalEntryId = null;
      renderEditor();
    });

    const general = els.dialogContent.querySelector("[data-abomination-general]");
    if (general) general.addEventListener("change", () => {
      cfg.generalEntryId = general.value || null;
      updateDialogTotal();
    });

    els.dialogContent.querySelectorAll("[data-abomination-stat]").forEach(input => {
      input.addEventListener("change", () => {
        const key = input.dataset.abominationStat;
        cfg.characteristics[key] = Math.max(0, Math.min(2, Math.floor(Number(input.value || 0))));
        renderEditor();
      });
    });

    els.dialogContent.querySelectorAll("[data-abomination-special]").forEach(input => {
      input.addEventListener("change", () => {
        const key = input.dataset.abominationSpecial;
        if (input.checked && !cfg.specialRules[key] && specialCount(state.draft) >= 3) {
          input.checked = false;
          window.alert("A Chaos Abomination may take a maximum of three special-rule upgrades.");
          return;
        }
        cfg.specialRules[key] = input.checked;
        renderEditor();
      });
    });
  };

  const previousCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (isChaos() && isAbomination(unit)) return abominationCost(entry);
    return previousCalculateEntry(entry);
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isChaos() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (isAbomination(unit)) {
        const cfg = ensureConfig(state.draft);
        if (!armyAllowsAbomination()) {
          window.alert("Chaos Abominations are only legal in Chaos Warriors or Beastmen armies devoted to Chaos Undivided.");
          return;
        }
        if (specialCount(state.draft) > 3) {
          window.alert("A Chaos Abomination may take a maximum of three special-rule upgrades.");
          return;
        }
        if (!validGeneral(state.draft)) {
          window.alert("Select an eligible Undivided army general with the highest Leadership. For a ridden Abomination, the selected general must also match the chosen rider type.");
          return;
        }
        if (state.selectedArmyId === "chaos_beastmen" && cfg.role !== "unridden") {
          window.alert("A Beastmen Chaos Abomination must be fielded as an independent monster.");
          return;
        }
      }
    }
    return previousSaveEditor();
  };

  function abominationNotes(entry) {
    const cfg = ensureConfig(entry);
    const notes = [];
    notes.push(cfg.role === "unridden" ? "Independent monster" : roleOptions().find(option => option.id === cfg.role)?.label || cfg.role);
    const general = state.roster.find(candidate => candidate.id === cfg.generalEntryId);
    if (general) notes.push(`General: ${generalLabel(general)}`);
    const upgrades = Object.entries(CHARACTER_UPGRADES)
      .filter(([key]) => Number(cfg.characteristics[key] || 0) > 0)
      .map(([key, def]) => `${def.label} ×${Number(cfg.characteristics[key])}`);
    if (upgrades.length) notes.push(upgrades.join(", "));
    for (const [key, def] of Object.entries(SPECIALS)) if (cfg.specialRules[key]) notes.push(`${def.label}: ${def.note}`);
    const large = Number(cfg.characteristics.S || 0) > 0 || Number(cfg.characteristics.T || 0) > 0 || Number(cfg.characteristics.W || 0) > 0;
    notes.push(large ? "Large monster; causes Terror" : "Small monster; causes Fear");
    return notes;
  }

  const previousRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!isChaos() || !isAbomination(unit)) return previousRosterPadRow(entry);
    const profile = { name:"Chaos Abomination", stats: currentStats(entry) };
    const cfg = ensureConfig(entry);
    const save = cfg.specialRules.hard_skin ? "4+" : "–";
    return `
      <tr>
        <td class="unit-cell">Chaos Abomination</td>
        ${rosterPadProfileCells(profile)}
        <td class="save">${save}</td>
        <td class="notes-cell">${rosterPadNotesInline(abominationNotes(entry))}</td>
        <td class="points-cell">${formatPoints(abominationCost(entry))}</td>
      </tr>
    `;
  };

  const previousDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!isChaos() || !isAbomination(unit)) return previousDescribeEntry(entry);
    const stats = currentStats(entry);
    const cfg = ensureConfig(entry);
    const parts = [`${cfg.role === "unridden" ? "Independent" : "Ridden"}`, `M${stats.M} WS${stats.WS} S${stats.S} T${stats.T} W${stats.W} I${stats.I} A${stats.A} Ld${stats.Ld}`];
    const selected = Object.entries(SPECIALS).filter(([key]) => cfg.specialRules[key]).map(([,def]) => def.label);
    if (selected.length) parts.push(selected.join(", "));
    return parts.join(" · ");
  };

  const previousRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    previousRenderArmyStatus(total);
    if (!isChaos()) return;
    const abomination = state.roster.find(entry => isAbomination(getUnit(entry.sectionKey, entry.unitId)));
    if (!abomination) return;
    const issues = [];
    if (!armyAllowsAbomination()) issues.push("Chaos Abomination requires a Chaos Warriors or Beastmen army devoted to Chaos Undivided.");
    if (!validGeneral(abomination)) issues.push("Chaos Abomination requires a selected Undivided general among the army's highest-Leadership eligible characters.");
    if (state.roster.filter(entry => isAbomination(getUnit(entry.sectionKey, entry.unitId))).length > 1) issues.push("Only one Chaos Abomination may be included.");
    if (!issues.length) return;
    els.armyStatus.insertAdjacentHTML("beforeend", `<div class="army-system-panel warn"><div class="army-system-copy"><strong>Chaos Abomination</strong><span>${escapeHtml(issues.join(" "))}</span></div></div>`);
  };
})();
;
/* ===== END chaos_abomination.js ===== */

/* ===== BEGIN chaos_abomination_mount_guard.js ===== */
// Prevent an Abomination rider from simultaneously using another mount.
(() => {
  const isAbominationEntry = entry => {
    if (!entry || state.data?.faction?.id !== "chaos") return false;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return Boolean(unit && String(unit.name || "").toLowerCase().includes("chaos abomination"));
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isAbominationEntry(state.draft) && state.draft.abomination?.role !== "unridden") {
      const general = state.roster.find(entry => entry.id === state.draft.abomination?.generalEntryId);
      if (general?.mount) {
        window.alert("The selected Chaos general already has another mount. Remove that mount before assigning the Chaos Abomination.");
        return;
      }
    }
    return previousSaveEditor();
  };
})();
;
/* ===== END chaos_abomination_mount_guard.js ===== */

/* ===== BEGIN chaos_dwarfs_extensions.js ===== */
// Chaos Dwarfs: High Hats / Old School / Modern list construction and faction-specific validation.
(() => {
  const ARMY_ID = "chaos_dwarfs";
  const STYLE_NAMES = { classic:"Classic High Hats", old_school:"Old School", modern:"Modern" };

  const isCD = () => state.data?.faction?.id === ARMY_ID && state.selectedArmyId === ARMY_ID;

  function ensureOptions() {
    state.armyOptions = state.armyOptions || {};
    if (!["classic","old_school","modern"].includes(state.armyOptions.chaosDwarfStyle)) {
      state.armyOptions.chaosDwarfStyle = "classic";
    }
    return state.armyOptions.chaosDwarfStyle;
  }

  function style() { return isCD() ? ensureOptions() : "classic"; }

  function allUnits() {
    if (!isCD()) return [];
    return ["characters","regiments","warMachines","specialCharacters"]
      .flatMap(key => (state.data.faction[key] || []).map(unit => ({ key, unit })));
  }

  function allowedByStyle(unit) {
    const tags = unit?.tags || [];
    const s = style();
    if (s === "classic") return !tags.includes("old_school_only") && !tags.includes("modern_only");
    if (s === "old_school") {
      if (tags.includes("modern_only")) return false;
      if (unit.id === "chaos_dwarf_blunderbusses") return false;
      if (tags.includes("classic_modern_machine")) return false;
      return true;
    }
    if (s === "modern") {
      if (tags.includes("old_school_only") || tags.includes("hide_modern")) return false;
      return true;
    }
    return true;
  }

  function optionAllowed(option) {
    return !Array.isArray(option?.styles) || option.styles.includes(style());
  }

  function patchDataOnce() {
    if (!isCD() || state.data.__chaosDwarfPatched) return;
    state.data.__chaosDwarfPatched = true;

    for (const id of ["chaos_dwarf_lord","chaos_dwarf_hero"]) {
      const unit = state.data.faction.characters.find(u => u.id === id);
      if (unit && !(unit.equipmentOptions || []).some(g => g.id === "armour")) {
        unit.equipmentOptions = [
          ...(unit.equipmentOptions || []),
          { id:"armour", choices:["heavy_armour","chaos_armour"], cost:0, alsoMayTake:["shield"] }
        ];
      }
    }

    const crossbows = state.data.faction.regiments.find(u => u.id === "chaos_dwarf_crossbows");
    if (crossbows) crossbows.rules = [...(crossbows.rules || []), "Old School replacement for Chaos Dwarf Blunderbusses."];

    const restrictions = {
      whip_obedience: { hobgoblinOnly:true, footOnly:true },
      black_hammer_hashut: { chaosDwarfOrBull:true },
      banner_feigned_cowardice: { hobgoblinOnly:true },
      banner_sneakiness: { hobgoblinOnly:true },
      slave_banner: { bsbOnly:true }
    };
    for (const item of state.data.factionMagicItems || []) Object.assign(item, restrictions[item.id] || {});
  }

  const previousRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    if (!isCD()) return previousRenderUnitBrowser();
    patchDataOnce();
    const faction = state.data.faction;
    const keys = ["characters","regiments","warMachines","specialCharacters"];
    const originals = Object.fromEntries(keys.map(k => [k, faction[k]]));
    for (const key of keys) faction[key] = (faction[key] || []).filter(allowedByStyle);
    try { return previousRenderUnitBrowser(); }
    finally { for (const key of keys) faction[key] = originals[key]; }
  };

  function cloneWithStyleOptions(unit) {
    const view = clone(unit);
    view.options = (view.options || []).filter(optionAllowed);
    return view;
  }

  const previousRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    if (!isCD()) return previousRenderCharacterEditor(entry, unit);
    patchDataOnce();
    const view = cloneWithStyleOptions(unit);
    let html = previousRenderCharacterEditor(entry, view);
    if ((view.options || []).length) {
      html += `<section class="editor-section">
        <h3 class="editor-section-title">${style() === "modern" ? "Modern Equipment" : "Options"}</h3>
        ${renderUnitOptions(entry, view)}
      </section>`;
    }
    return html;
  };

  const previousRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isCD()) return previousRenderRegimentEditor(entry, unit);
    return previousRenderRegimentEditor(entry, cloneWithStyleOptions(unit));
  };

  const previousRenderWarMachineEditor = renderWarMachineEditor;
  renderWarMachineEditor = function(entry, unit) {
    if (!isCD()) return previousRenderWarMachineEditor(entry, unit);
    return previousRenderWarMachineEditor(entry, cloneWithStyleOptions(unit));
  };

  function isHobgoblinUnit(unit) {
    return (unit?.tags || []).includes("hobgoblin") || (unit?.tags || []).includes("hobgoblin_character");
  }
  function isGreenskinMagicUser(unit) {
    return ["black_orc_hero","common_orc_hero","common_goblin_hero"].includes(unit?.id);
  }
  function isChaosDwarfOrBull(unit) {
    const tags = unit?.tags || [];
    return tags.includes("chaos_dwarf_character") || tags.includes("bull_centaur") ||
      String(unit?.id || "").startsWith("chaos_dwarf") || unit?.id === "tower_guard";
  }

  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let items = previousGetAllowedMagicItems(unit, context);
    if (!isCD()) return items;

    const draft = state.draft;
    const champion = context === "champion";

    if (champion && draft?.unitId === "kdaii_fireborn") {
      return (state.data.factionMagicItems || []).filter(item => item.chaosDwarfExternalPool === "daemon_reward_all");
    }

    items = items.filter(item => {
      if (item.chaosDwarfExternalPool === "daemon_reward_all") return false;
      if (item.chaosDwarfExternalPool === "orcs_goblins" && !isGreenskinMagicUser(unit) && !(champion && ["orc_slave_warriors","black_orc_slave_warriors","common_goblin_slave_warriors"].includes(unit?.id))) return false;
      if (item.hobgoblinOnly && !isHobgoblinUnit(unit)) return false;
      if (item.footOnly && draft?.mount) return false;
      if (item.chaosDwarfOrBull && !isChaosDwarfOrBull(unit)) return false;
      if (item.bsbOnly && !(unit?.tags || []).includes("battle_standard_bearer")) return false;
      if (item.id === "banner_feigned_cowardice" || item.id === "banner_sneakiness") {
        if ((unit?.tags || []).includes("battle_standard_bearer")) return false;
      }
      return true;
    });
    return items;
  };

  const previousRenderMagicBannerEditor = renderMagicBannerEditor;
  renderMagicBannerEditor = function(entry, unit) {
    if (!isCD()) return previousRenderMagicBannerEditor(entry, unit);
    const original = state.data.factionMagicItems;
    state.data.factionMagicItems = (original || []).filter(item => {
      if (item.chaosDwarfExternalPool) return false;
      if (item.id === "slave_banner") return false;
      if (["banner_feigned_cowardice","banner_sneakiness"].includes(item.id)) return isHobgoblinUnit(unit);
      return true;
    });
    try { return previousRenderMagicBannerEditor(entry, unit); }
    finally { state.data.factionMagicItems = original; }
  };

  function selectedIds(entry, unit) {
    try { return getSelectedEquipmentIds(entry, unit); }
    catch { return [...(unit.fixedEquipment || [])]; }
  }

  function hasOption(entry, id) { return Boolean(entry?.optionSelections?.[id]); }

  function armourSave(entry, unit) {
    if (unit.id === "chaos_siege_giant") return "5+ (3+ shooting)";
    if (unit.id === "iron_daemon") return "3+";
    if (["kdaii_fireborn","kdaii_destroyer"].includes(unit.id)) return "4+";
    if (Number(unit.fixedArmourSave) > 0) return `${Number(unit.fixedArmourSave)}+`;

    const ids = new Set(selectedIds(entry, unit));
    if (hasOption(entry, "chaos_armour")) ids.add("chaos_armour");
    if (hasOption(entry, "heavy_armour")) { ids.delete("light_armour"); ids.add("heavy_armour"); }
    if (hasOption(entry, "light_armour")) ids.add("light_armour");
    if (hasOption(entry, "shields")) ids.add("shield");

    let save = null;
    if (ids.has("chaos_armour")) save = 4;
    else if (ids.has("heavy_armour")) save = 5;
    else if (ids.has("light_armour")) save = 6;
    if (ids.has("shield")) save = save == null ? 6 : save - 1;

    const mounted = Boolean(entry.mount) || unit.id === "hobgoblin_wolf_riders";
    const naturalCentaur = (unit.tags || []).includes("bull_centaur") || unit.id === "bull_centaurs";
    if (mounted && !naturalCentaur) save = save == null ? 6 : save - 1;

    for (const itemId of entry.magicItems || []) {
      if (itemId === "armour_midnight") return "1+";
      if (itemId === "mask_furnace") save = (save == null ? 6 : save - 1);
      if (itemId === "armour_bazrakk") save = Math.min(save ?? 4, 4);
    }
    return save == null ? "–" : `${Math.max(2, save)}+`;
  }

  const previousCalculatePrintedArmourSave = calculatePrintedArmourSave;
  calculatePrintedArmourSave = function(entry, unit) {
    if (!isCD()) return previousCalculatePrintedArmourSave(entry, unit);
    return armourSave(entry, unit);
  };

  const previousCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = previousCalculateEntry(entry);
    if (!isCD()) return total;
    if (entry.unitId === "bull_centaurs" && entry.command?.standardBearer && hasOption(entry, "heavy_armour")) total -= 10;
    return total;
  };

  function hasRegiment(id) { return state.roster.some(e => e.sectionKey === "regiments" && e.unitId === id); }
  function hasHobgoblinRegiment() {
    return state.roster.some(e => e.sectionKey === "regiments" && (getUnit(e.sectionKey,e.unitId)?.tags || []).includes("hobgoblin"));
  }
  function hasSorcerer() {
    return state.roster.some(e => {
      const u = getUnit(e.sectionKey,e.unitId);
      return (u?.tags || []).includes("sorcerer") || ["astragoth","drazhoath"].includes(e.unitId);
    });
  }
  function eligibleGeneralPresent() {
    return state.roster.some(e => {
      if (e.sectionKey !== "characters" && e.sectionKey !== "specialCharacters") return false;
      const u = getUnit(e.sectionKey,e.unitId);
      if ((u?.tags || []).includes("battle_standard_bearer")) return false;
      return (u?.tags || []).includes("chaos_dwarf_character") || ["zhatan_black","astragoth","drazhoath"].includes(e.unitId);
    });
  }
  function hasCoreCDRegiment() {
    return state.roster.some(e => e.sectionKey === "regiments" &&
      ["chaos_dwarf_warriors","tower_guard","chaos_dwarf_blunderbusses","chaos_dwarf_crossbows"].includes(e.unitId));
  }

  function restrictionMessage(unit) {
    if (!unit) return "";
    if ((unit.tags || []).includes("requires_black_orc_regiment") && !hasRegiment("black_orc_slave_warriors")) return "requires a Black Orc Slave Warrior regiment";
    if ((unit.tags || []).includes("requires_common_orc_regiment") && !hasRegiment("orc_slave_warriors")) return "requires an Orc Slave Warrior regiment";
    if ((unit.tags || []).includes("requires_common_goblin_regiment") && !hasRegiment("common_goblin_slave_warriors")) return "requires a Common Goblin Slave Warrior regiment";
    if ((unit.tags || []).includes("requires_hobgoblin_regiment") && !hasHobgoblinRegiment()) return "requires a Hobgoblin regiment";
    if ((unit.tags || []).includes("requires_sorcerer") && !hasSorcerer()) return "requires a Chaos Dwarf Sorcerer";
    return "";
  }

  const previousAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isCD()) return previousAddUnit(sectionKey, unitId);
    patchDataOnce();
    const unit = getUnit(sectionKey, unitId);
    if (!allowedByStyle(unit)) {
      window.alert(`${unit.name} is not available in the ${STYLE_NAMES[style()]} army style.`);
      return;
    }
    if ((unit.tags || []).includes("zero_one") && state.roster.some(e => e.unitId === unitId)) {
      window.alert(`${unit.name} may only be included once.`);
      return;
    }
    if ((unit.tags || []).includes("zero_one_bsb") && state.roster.some(e => (getUnit(e.sectionKey,e.unitId)?.tags || []).includes("zero_one_bsb"))) {
      window.alert("A Chaos Dwarf army may include only one Battle Standard Bearer.");
      return;
    }
    if (sectionKey === "specialCharacters" && state.roster.some(e => e.sectionKey === sectionKey && e.unitId === unitId)) {
      window.alert(`${unit.name} may only be included once.`);
      return;
    }
    return previousAddUnit(sectionKey, unitId);
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isCD() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (state.draft.unitId === "common_goblin_slave_warriors" &&
          state.draft.optionSelections?.weapon === "short_bow" &&
          state.draft.optionSelections?.shields) {
        window.alert("Common Goblin Slave Warriors with short bows cannot take shields.");
        return;
      }
      const issue = restrictionMessage(unit);
      if (issue) {
        window.alert(`${unit.name} ${issue}.`);
        return;
      }
    }
    return previousSaveEditor();
  };

  function warnings() {
    const result = [];
    if (state.roster.length && !eligibleGeneralPresent()) result.push("The army General must be a Chaos Dwarf character.");
    if (state.roster.length && !hasCoreCDRegiment()) result.push("The army must include Chaos Dwarf Warriors, Tower Guard, Blunderbusses, or Old School Chaos Dwarf Crossbows.");

    for (const entry of state.roster) {
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (!unit) continue;
      if (!allowedByStyle(unit)) result.push(`${unit.name} is not legal in the ${STYLE_NAMES[style()]} style.`);
      const issue = restrictionMessage(unit);
      if (issue) result.push(`${unit.name} ${issue}.`);
    }

    const bsbs = state.roster.filter(e => (getUnit(e.sectionKey,e.unitId)?.tags || []).includes("zero_one_bsb"));
    if (bsbs.length > 1) result.push("Only one Battle Standard Bearer may be included.");

    for (const {unit} of allUnits()) {
      if (!(unit.tags || []).includes("zero_one")) continue;
      if (state.roster.filter(e => e.unitId === unit.id).length > 1) result.push(`${unit.name} is 0-1.`);
    }
    return [...new Set(result)];
  }

  const previousRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    previousRenderArmyStatus(total);
    if (!isCD()) return;
    patchDataOnce();
    const list = warnings();
    const s = style();
    const panel = document.createElement("div");
    panel.className = `army-system-panel${list.length ? " warn" : ""}`;
    panel.innerHTML = `
      <div class="army-system-copy">
        <strong>Chaos Dwarf Army Style</strong>
        <span>High Hats are the core list. Old School and Modern additions are mutually exclusive.</span>
        <label style="display:flex;gap:8px;align-items:center;margin-top:8px;">
          <span>Army style</span>
          <select data-chaos-dwarf-style>
            ${Object.entries(STYLE_NAMES).map(([id,label]) => `<option value="${id}" ${id===s?"selected":""}>${label}</option>`).join("")}
          </select>
        </label>
        ${s === "old_school" ? `<span style="margin-top:6px;"><strong>Old School:</strong> Blunderbusses become crossbows and the core artillery is replaced by Weapon Teams and classic contraptions.</span>` : ""}
        ${s === "modern" ? `<span style="margin-top:6px;"><strong>Modern:</strong> Black Orc, Common Orc and Common Goblin choices are unavailable; modern monsters, engines and equipment are enabled.</span>` : ""}
        ${list.length ? `<span style="margin-top:6px;"><strong>Rules:</strong> ${list.map(escapeHtml).join(" • ")}</span>` : ""}
      </div>`;
    els.armyStatus.prepend(panel);

    panel.querySelector("[data-chaos-dwarf-style]")?.addEventListener("change", event => {
      ensureOptions();
      state.armyOptions.chaosDwarfStyle = event.target.value;
      for (const entry of state.roster) {
        const unit = getUnit(entry.sectionKey, entry.unitId);
        for (const option of unit?.options || []) {
          if (Array.isArray(option.styles) && !option.styles.includes(style())) delete entry.optionSelections?.[option.id];
        }
      }
      renderUnitBrowser();
      renderArmy();
    });
  };

  const previousRosterPadNotes = rosterPadNotes;
  rosterPadNotes = function(entry, unit) {
    const notes = previousRosterPadNotes(entry, unit);
    if (!isCD()) return notes;
    if (entry.unitId === "bull_centaurs" && entry.command?.standardBearer && hasOption(entry,"heavy_armour")) notes.push("Heavy armour: standard bearer is free");
    if (entry.optionSelections?.modern_fireglaive) notes.push("Fireglaive");
    if (entry.optionSelections?.naphtha_bombs) notes.push("Naphtha Bombs");
    if (Number(entry.optionSelections?.blood_of_hashut || 0) > 0) notes.push(`Blood of Hashut ×${entry.optionSelections.blood_of_hashut}`);
    if ((unit.tags || []).includes("opponent_permission")) notes.push("Opponent permission required");
    return notes;
  };
})();
;
/* ===== END chaos_dwarfs_extensions.js ===== */

/* ===== BEGIN chaos_dwarfs_final_fixes.js ===== */
// Final Chaos Dwarf source-resolution fixes layered after the main faction extension.
(() => {
  const isCD = () => state.data?.faction?.id === "chaos_dwarfs" && state.selectedArmyId === "chaos_dwarfs";
  let patchedData = null;

  function patchResolvedEntries() {
    if (!isCD() || patchedData === state.data) return;
    patchedData = state.data;

    // Modern Stuff says the Magma Cannon follows the Dwarf Flame Cannon rules.
    // Reuse the existing WHR builder's 90-point Flame Cannon implementation, but
    // retain Chaos Dwarf crew and do not grant Dwarf engineering runes.
    const magma = state.data.faction.warMachines.find(unit => unit.id === "magma_cannon");
    if (magma) {
      magma.points = { type: "fixed", value: 90 };
      magma.tags = (magma.tags || []).filter(tag => tag !== "needs_resolved_cost");
      magma.rules = [
        "Modern Stuff: follows the rules for the Dwarf Flame Cannon.",
        "May stand and shoot.",
        "Guess range up to 12 inches and add the artillery die. Use the teardrop template: Strength 5; each wound becomes 1D3 wounds; any regiment suffering a casualty takes a panic test."
      ];
      magma.crew = { baseCount: 3, profileId: "chaos_dwarf_warrior", name: "Chaos Dwarf Crew" };
    }

    // The Old School text says Blunderbusses are replaced by crossbows but does
    // not print a separate regiment price. This builder uses Warrior cost (9)
    // plus the standard crossbow value (4) = 13/model and makes that inference
    // explicit in the unit notes rather than presenting it as a quoted book cost.
    const crossbows = state.data.faction.regiments.find(unit => unit.id === "chaos_dwarf_crossbows");
    if (crossbows) {
      crossbows.points = { type: "per_model", value: 13 };
      crossbows.rules = [
        ...(crossbows.rules || []).filter(rule => !String(rule).startsWith("Builder pricing note:")),
        "Builder pricing note: the Old School addendum does not state a separate crossbow regiment price; this uses Chaos Dwarf Warrior cost plus the standard crossbow value (13 pts/model)."
      ];
    }
  }

  const previousRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    patchResolvedEntries();
    return previousRenderUnitBrowser();
  };

  const previousCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    patchResolvedEntries();
    return previousCalculateEntry(entry);
  };

  // Resolve external magic pools by the displayed unit identity rather than relying
  // on faction-internal IDs. This keeps the rule robust if the compact payload uses
  // different IDs for the greenskin heroes or K'daii unit.
  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let result = previousGetAllowedMagicItems(unit, context);
    if (!isCD() || !unit) return result;
    patchResolvedEntries();

    const name = String(unit.name || "");
    const isGreenskinCharacter = /^(Black Orc|Common Orc|Common Goblin) Hero$/i.test(name);
    const isGreenskinChampion = context === "champion" && /(Orc|Black Orc|Common Goblin) Slave Warriors/i.test(name);
    const isKdaaiChampion = context === "champion" && /K['’]?daii Fireborn/i.test(name);

    const additions = [];
    if (isGreenskinCharacter || isGreenskinChampion) {
      additions.push(...(state.data.factionMagicItems || []).filter(item => item.chaosDwarfExternalPool === "orcs_goblins"));
    }
    if (isKdaaiChampion) {
      additions.push(...(state.data.factionMagicItems || []).filter(item => item.chaosDwarfExternalPool === "daemon_reward_all"));
    }

    if (!additions.length) return result;
    const byId = new Map(result.map(item => [item.id, item]));
    for (const item of additions) byId.set(item.id, item);
    return [...byId.values()];
  };
})();
;
/* ===== END chaos_dwarfs_final_fixes.js ===== */

/* ===== BEGIN halflings_loader.js ===== */
// Halflings of the Moot compact payload plus borrowed army-book data.
(() => {
  const previousFetch = window.fetch.bind(window);
  async function inflate(text) {
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }
  const dedupe = (arr, key="id") => [...new Map((arr||[]).map(x => [x?.[key], x])).values()];
  const clone = x => JSON.parse(JSON.stringify(x));
  function addExternalItems(target, source, sourceId, sourceName) {
    for (const item of source || []) {
      const copy = clone(item);
      copy.originalId = item.id;
      copy.id = `lib_${sourceId}__${item.id}`;
      copy.halflingSourceFaction = sourceId;
      copy.halflingSourceName = sourceName;
      copy.halflingForeignItem = true;
      target.push(copy);
    }
  }
  const woodElfItems = [
    {id:"hagbane_arrows",name:"Hagbane Arrows",category:"magic_weapon",cost:10,rules:"Requires bow/longbow. Magical arrow always wounds on 4+ or better; each wound becomes 1D3 wounds."},
    {id:"flail_claws",name:"Flail of Claws",category:"magic_weapon",cost:10,rules:"Light flail. +1S first combat round, always strikes first; a hit removes one attack from the victim that round."},
    {id:"binding_bolas",name:"The Binding Bolas",category:"magic_weapon",cost:20,rules:"Missile weapon, range 12 inches; a hit prevents a man-sized infantry/cavalry model moving next turn."},
    {id:"bow_loren",name:"Bow of Loren",category:"magic_weapon",cost:20,rules:"Wood Elf Longbow. May shoot as many shots as bearer has Attacks, using bearer Strength."},
    {id:"hail_doom",name:"Hail of Doom Arrow",category:"magic_weapon",cost:25,rules:"One use. Requires bow/longbow; fires 3D6 magical S4 arrows."},
    {id:"spirit_sword",name:"The Spirit Sword",category:"magic_weapon",cost:30,rules:"No armour save; wounded enemy tests basic LD or dies instantly."},
    {id:"blades_loec",name:"Blades of Loec",category:"magic_weapon",cost:30,rules:"Two hand weapons. Re-roll to hit and to wound."},
    {id:"arcane_bodkins",name:"Arcane Bodkins",category:"magic_weapon",cost:50,rules:"Requires bow/longbow. One magical volley with no armour saves; one use."},
    {id:"helm_hunt",name:"Helm of the Hunt",category:"magic_armour",cost:30,rules:"+1 armour save; on charge +1 WS, +1 A, +1 S."},
    {id:"moonstone",name:"Moonstone",category:"enchanted_item",cost:10,rules:"One use. Teleport bearer and unit from one wood to another at end of movement."},
    {id:"magic_war_paint",name:"Magic War Paint",category:"enchanted_item",cost:30,rules:"5+ ward in melee; 3+ ward against missile attacks."},
    {id:"antler_totem",name:"Antler Totem",category:"arcane_item",cost:15,rules:"Amber or Jade wizard may choose spells."},
    {id:"banner_springtide",name:"Banner of Springtide",category:"magic_banner",cost:10,rules:"May always Stand & Shoot with two ranks."},
    {id:"banner_lynx",name:"Banner of the Lynx",category:"magic_banner",cost:10,rules:"+1 to flee, pursue and overrun moves."},
    {id:"midwinter_standard",name:"Midwinter Standard",category:"magic_banner",cost:20,rules:"One use. Automatically passes first failed break test."},
    {id:"hawkeye_banner",name:"Hawkeye Banner",category:"magic_banner",cost:40,rules:"+1 BS."},
    {id:"banner_surprising_swiftness",name:"Banner of Surprising Swiftness",category:"magic_banner",cost:60,rules:"Once per game in a magic phase, unit moves 1D6 inches directly forward; counts as charge if contacting enemy."}
  ];
  async function prepareHalflings() {
    const p = await previousFetch("./data/whr_halflings_moot_v0_1.payload", {cache:"no-store"});
    if (!p.ok) throw new Error("Could not load Halfling payload");
    const data = JSON.parse(await inflate(await p.text()));
    const empireResponse = await previousFetch("./data/whr_empire_v0_1.json", {cache:"no-store"});
    if (!empireResponse.ok) throw new Error("Could not load Empire allies");
    const empire = await empireResponse.json();
    data.commonMagicItems = clone(empire.commonMagicItems || []);
    data.equipment = dedupe([...(data.equipment||[]), ...(empire.equipment||[])]);
    data.profiles = dedupe([...(data.profiles||[]), ...(empire.profiles||[])]);
    data.mounts = dedupe([...(data.mounts||[]), ...(empire.mounts||[])]);
    const allies = (empire.faction?.regiments || []).filter(u => !(u.tags||[]).includes("auxiliary")).map(u => {
      const x=clone(u); x.id=`ally_empire_${u.id}`; x.name=`${u.name} (Empire Allies)`; x.tags=[...(x.tags||[]),"allied_empire"]; return x;
    });
    data.faction.regiments.push(...allies);
    const external=[];
    addExternalItems(external, empire.factionMagicItems || [], "empire", "The Empire");
    addExternalItems(external, woodElfItems, "wood_elves", "Wood Elves");
    try {
      const manifest = await (await previousFetch("./data/armies.json",{cache:"no-store"})).json();
      const seen = new Set(["whr_empire_v0_1.json","whr_halflings_moot_v0_1.json"]);
      for (const army of (manifest.armies||[]).filter(a=>a.available)) {
        if (seen.has(army.dataFile)) continue; seen.add(army.dataFile);
        try {
          const r=await previousFetch(`./data/${army.dataFile}`,{cache:"no-store"}); if(!r.ok) continue;
          const d=await r.json(); addExternalItems(external,d.factionMagicItems||[],army.id,army.name);
          if (army.id==="dwarfs" && d.faction?.systems?.runes) data.faction.systems.dwarfRunes=clone(d.faction.systems.runes);
        } catch(e) { console.warn("Halfling borrowed data skipped",army.name,e); }
      }
    } catch(e) { console.warn("Halfling manifest enrichment skipped",e); }
    data.factionMagicItems = dedupe(external);
    return data;
  }
  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (url.endsWith("data/whr_halflings_moot_v0_1.json") || url.endsWith("/whr_halflings_moot_v0_1.json")) {
      const data=await prepareHalflings();
      return new Response(JSON.stringify(data),{status:200,headers:{"Content-Type":"application/json"}});
    }
    return previousFetch(input,init);
  };
})();
;
/* ===== END halflings_loader.js ===== */

/* ===== BEGIN ogre_mercenaries_loader.js ===== */
// Loads the compact Ogre Mercenaries dataset and attaches the five legal WHR allied-tribe pools.
(() => {
  const previousFetch = window.fetch.bind(window);

  async function inflate(text) {
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  const lower = value => String(value || "").toLowerCase();
  const tags = unit => (unit?.tags || []).map(lower);
  const tagged = (unit, needle) => tags(unit).some(tag => tag === needle || tag.includes(needle));

  function belongsToTribe(unit, tribe) {
    const name = lower(unit?.name);
    if (tribe === "forest_goblins") return name.includes("forest goblin") || tagged(unit, "forest_goblin");
    if (tribe === "night_goblins") return name.includes("night goblin") || tagged(unit, "night_goblin");
    if (tribe === "common_goblins") {
      const goblin = name.includes("goblin") || tagged(unit, "goblin");
      return goblin && !name.includes("night goblin") && !name.includes("forest goblin") && !name.includes("hobgoblin") && !tagged(unit, "night_goblin") && !tagged(unit, "forest_goblin");
    }
    if (tribe === "hobgoblins") return name.includes("hobgoblin") || tagged(unit, "hobgoblin");
    if (tribe === "halflings") return (name.includes("halfling") || tagged(unit, "halfling")) && !name.includes("wizard");
    return false;
  }

  function isBsb(unit) {
    const name = lower(unit?.name);
    return name.includes("battle standard") || name.includes(" bsb") || tagged(unit, "battle_standard_bearer") || tagged(unit, "bsb");
  }

  function isAllowedWarMachine(unit, tribe) {
    const name = lower(unit?.name);
    if (tribe === "common_goblins") return belongsToTribe(unit, tribe) || (name.includes("goblin") && (name.includes("chariot") || name.includes("bolt thrower") || name.includes("rock lobber")) && !name.includes("night") && !name.includes("forest"));
    if (tribe === "hobgoblins") return name.includes("hobgoblin") && name.includes("bolt thrower");
    if (tribe === "halflings") return (name.includes("halfling") || tagged(unit, "halfling")) && !name.includes("treeman") && !name.includes("wood elf") && !name.includes("empire");
    return false;
  }

  function prefixSource(source, sourceKey, tribe, selectors) {
    const prefix = `ogally_${sourceKey}_`;
    const profileIds = new Set((source.profiles || []).map(x => x.id));
    const mountIds = new Set((source.mounts || []).map(x => x.id));
    const equipmentIds = new Set((source.equipment || []).map(x => x.id));
    const itemIds = new Set([...(source.factionMagicItems || []), ...(source.faction?.specialCharacterOnlyItems || [])].map(x => x.id));
    const remapString = value => {
      if (profileIds.has(value) || mountIds.has(value) || equipmentIds.has(value) || itemIds.has(value)) return prefix + value;
      return value;
    };
    const deep = value => {
      if (Array.isArray(value)) return value.map(deep);
      if (value && typeof value === "object") {
        const out = {};
        for (const [k,v] of Object.entries(value)) out[k] = deep(v);
        return out;
      }
      return typeof value === "string" ? remapString(value) : value;
    };
    const cloneUnit = unit => {
      const out = deep(unit);
      out.id = prefix + unit.id;
      out.name = `${unit.name} — Allied`;
      out.tags = [...(out.tags || []), "ogre_ally", `ogre_ally_${tribe}`, `ogre_ally_source_${sourceKey}`];
      out.ogreAllyTribe = tribe;
      out.ogreAllySource = sourceKey;

      // The Ogre army has two explicit exceptions to the Forest Goblin list.
      if (tribe === "forest_goblins") {
        out.options = (out.options || []).filter(option => !lower(JSON.stringify(option)).includes("poison"));
        out.equipmentOptions = (out.equipmentOptions || []).map(group => ({
          ...group,
          choices: (group.choices || []).filter(choice => !lower(JSON.stringify(choice)).includes("poison"))
        }));
      }
      if (tribe === "common_goblins") {
        out.rules = [...(out.rules || []), "Ogre ally: Common Goblins do not receive the higher-Leadership-without-Orcs benefit."];
      }
      if (["common_goblins","hobgoblins","halflings"].includes(tribe) && (out.tags || []).some(t => ["chariot","war_machine","classic_modern_machine"].includes(t))) {
        out.ogreAllyLimitedChoice = true;
      }
      return out;
    };
    return {
      profiles:(source.profiles || []).map(p => ({...deep(p), id:prefix+p.id})),
      mounts:(source.mounts || []).map(m => ({...deep(m), id:prefix+m.id})),
      equipment:(source.equipment || []).map(e => ({...deep(e), id:prefix+e.id})),
      items:(source.factionMagicItems || []).map(i => ({...deep(i), id:prefix+i.id, ogreAllySource:sourceKey})),
      characters:(source.faction?.characters || []).filter(u => selectors.character(u) && !isBsb(u)).map(cloneUnit),
      regiments:(source.faction?.regiments || []).filter(u => selectors.regiment(u) && !(tribe === "forest_goblins" && lower(u.name).includes("gargantuan spider"))).map(cloneUnit),
      warMachines:(source.faction?.warMachines || []).filter(selectors.warMachine).map(cloneUnit)
    };
  }

  async function sourceJson(path) {
    const response = await previousFetch(path, {cache:"no-store"});
    return response.ok ? response.json() : null;
  }

  function pushUnique(target, additions) {
    const seen = new Set(target.map(x => x.id));
    for (const item of additions || []) if (item?.id && !seen.has(item.id)) { target.push(item); seen.add(item.id); }
  }

  function installGoblinShamans(data) {
    const prefix = "ogally_orcs_goblins_";
    const levels = [
      { key:"shaman_lord", title:"Shaman Lord", level:4, common:170, forest:170, night:180, profile:"goblin_shaman_lord" },
      { key:"master_shaman", title:"Master Shaman", level:3, common:120, forest:120, night:130, profile:"goblin_master_shaman" },
      { key:"shaman_champion", title:"Shaman Champion", level:2, common:75, forest:75, night:85, profile:"goblin_shaman_champion" },
      { key:"shaman", title:"Shaman", level:1, common:30, forest:30, night:40, profile:"goblin_shaman" }
    ];
    const configs = {
      common_goblins: {
        label:"Common Goblin", costKey:"common",
        mounts:[
          {mountId:`${prefix}giant_wolf`,cost:0},
          {mountId:`${prefix}goblin_wolf_chariot_character`,cost:44,ogreAllyLimitedChoice:true},
          {mountId:`${prefix}monstrous_spider`,cost:32}
        ],
        rules:["Waaagh! Shaman; uses Waaagh! spells.","Ogre ally: Common Goblins do not receive the higher-Leadership-without-Orcs benefit."]
      },
      forest_goblins: {
        label:"Forest Goblin", costKey:"forest",
        mounts:[{mountId:`${prefix}giant_spider`,cost:0},{mountId:`${prefix}monstrous_spider`,cost:32}],
        rules:["Waaagh! Shaman; uses Waaagh! spells.","Forester.","On the specified failed Waaagh! result the Shaman enters a trance instead of taking the normal Toughness test, and moves 1D6 inches randomly as described in the army book."]
      },
      night_goblins: {
        label:"Night Goblin", costKey:"night",
        mounts:[{mountId:`${prefix}monstrous_spider`,cost:32}],
        rules:["Waaagh! Shaman; uses Waaagh! spells.","Hates Dwarfs (not Chaos Dwarfs).","Carries one magic mushroom: after Winds of Magic are dealt it may be consumed for 1D6 extra magic cards usable only by this Shaman, with the army-book risk on a subsequent failed Waaagh! test."]
      }
    };
    for (const [tribe,cfg] of Object.entries(configs)) {
      for (const row of levels) {
        const id = `${prefix}${tribe.replace(/s$/,"")}_${row.key}`;
        if (data.faction.characters.some(u => u.id === id)) continue;
        data.faction.characters.push({
          id,
          name:`${cfg.label} ${row.title} — Allied`,
          profileId:`${prefix}${row.profile}`,
          points:{type:"fixed",value:row[cfg.costKey]},
          tags:["wizard","shaman",`${tribe.replace(/s$/,"")}`,"ogre_ally",`ogre_ally_${tribe}`,"ogre_ally_source_orcs_goblins"],
          wizard:{level:row.level,lore:"Waaagh!"},
          magicItems:{maximum:row.level,allowedPools:["common","faction"],allowedCategories:["magic_weapon","enchanted_item","arcane_item","familiar"]},
          mountOptions:cfg.mounts.map(x=>({...x})),
          rules:[...cfg.rules],
          ogreAllyTribe:tribe,
          ogreAllySource:"orcs_goblins",
          ogreAllyRequiresRegiment:true
        });
      }
    }
  }

  function installGoblinChariotMount(data) {
    const id="ogally_orcs_goblins_goblin_wolf_chariot_character";
    if (!data.mounts.some(m=>m.id===id)) {
      data.mounts.push({
        id,
        name:"Goblin Wolf Chariot",
        profileId:"ogally_orcs_goblins_light_chariot",
        type:"chariot",
        rules:["Light Chariot","Pulled by two Giant Wolves and normally crewed by two Common Goblins.","Combined armour save 5+."],
        displayProfileOnRoster:true,
        ogreAllyLimitedChoice:true
      });
    }
    // The home O&G entries permit Common Goblin Warlords and Heroes to ride a
    // Wolf Chariot for the price of the chariot. Preserve that option as allies.
    for (const unit of data.faction.characters.filter(u=>u.ogreAllyTribe==="common_goblins" && /warlord|hero/i.test(u.name))) {
      unit.mountOptions=unit.mountOptions||[];
      if(!unit.mountOptions.some(m=>m.mountId===id))unit.mountOptions.push({mountId:id,cost:44,ogreAllyLimitedChoice:true});
      unit.ogreAllyRequiresRegiment=true;
    }
  }

  function installCommonGoblinArtillery(data) {
    const commonTags=["ogre_ally","ogre_ally_common_goblins","ogre_ally_source_orcs_goblins","war_machine"];
    const crew={baseCount:3,profileId:"ogally_orcs_goblins_common_goblin",name:"Common Goblins",extraCrewOptionId:"extra_crew"};
    const extraCrew={id:"extra_crew",label:"Extra Common Goblin crew",type:"quantity",minimum:0,maximum:2,cost:{value:2.5}};
    const machines=[
      {id:"ogally_orcs_goblins_goblin_spear_chukka",name:"Spear Chukka, Goblins — Allied",cost:42.5,rules:["Bolt Thrower with three Common Goblin crewmen."],extra:true},
      {id:"ogally_orcs_goblins_goblin_small_rock_lobber",name:"Small Rock Lobber, Goblins — Allied",cost:72.5,rules:["Small Stone Thrower with three Common Goblin crewmen."],extra:true},
      {id:"ogally_orcs_goblins_goblin_large_rock_lobber",name:"Large Rock Lobber, Goblins — Allied",cost:87.5,rules:["Large Stone Thrower with three Common Goblin crewmen."],extra:true},
      {id:"ogally_orcs_goblins_goblin_doom_diver",name:"Goblin Doom Diver — Allied",cost:67.5,rules:["Uses an endless supply of Common Goblins, counting as three crewmen.","Shoots using the WHR Doom Diver rules: large-stone-thrower style attack with a 2-inch template, steerable scatter and its own misfire rules."],extra:false}
    ];
    for(const m of machines){
      if(data.faction.warMachines.some(u=>u.id===m.id))continue;
      data.faction.warMachines.push({
        id:m.id,name:m.name,profileId:"ogally_orcs_goblins_war_machine",points:{type:"fixed",value:m.cost},
        options:m.extra?[{...extraCrew}]:[],crew:{...crew,...(!m.extra?{extraCrewOptionId:null}:{})},rules:m.rules,
        tags:[...commonTags],ogreAllyTribe:"common_goblins",ogreAllySource:"orcs_goblins",ogreAllyLimitedChoice:true,ogreAllyRequiresRegiment:true
      });
    }
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    const response = await previousFetch(input, init);
    if (!response.ok || !(url.endsWith("data/whr_ogre_mercenaries_v0_1.json") || url.endsWith("/whr_ogre_mercenaries_v0_1.json"))) return response;
    try {
      const stub = await response.clone().json();
      if (!stub?.meta?.payloadFile) return response;
      const payload = await previousFetch(`./data/${stub.meta.payloadFile}`, {cache:"no-store"});
      if (!payload.ok) throw new Error(`Could not load ${stub.meta.payloadFile}`);
      const data = JSON.parse(await inflate(await payload.text()));
      const empire = await sourceJson("./data/whr_empire_v0_1.json");
      if (empire) data.commonMagicItems = empire.commonMagicItems || [];

      const [og, cd, hf] = await Promise.all([
        sourceJson("./data/whr_orcs_goblins_v0_1.json"),
        sourceJson("./data/whr_chaos_dwarfs_v0_1.json"),
        sourceJson("./data/whr_halflings_moot_v0_1.json")
      ]);
      const pools=[];
      for (const tribe of ["common_goblins","forest_goblins","night_goblins"]) if (og) pools.push(prefixSource(og,"orcs_goblins",tribe,{character:u=>belongsToTribe(u,tribe),regiment:u=>belongsToTribe(u,tribe),warMachine:u=>tribe==="common_goblins"&&isAllowedWarMachine(u,tribe)}));
      if (cd) pools.push(prefixSource(cd,"chaos_dwarfs","hobgoblins",{character:u=>belongsToTribe(u,"hobgoblins"),regiment:u=>belongsToTribe(u,"hobgoblins"),warMachine:u=>isAllowedWarMachine(u,"hobgoblins")}));
      if (hf) pools.push(prefixSource(hf,"halflings_moot","halflings",{character:u=>belongsToTribe(u,"halflings"),regiment:u=>belongsToTribe(u,"halflings")&&!lower(u.name).includes("wood elf")&&!lower(u.name).includes("empire")&&!lower(u.name).includes("treeman"),warMachine:u=>isAllowedWarMachine(u,"halflings")}));

      for (const pool of pools) {
        pushUnique(data.profiles, pool.profiles);
        pushUnique(data.mounts, pool.mounts);
        pushUnique(data.equipment, pool.equipment);
        pushUnique(data.factionMagicItems, pool.items);
        pushUnique(data.faction.characters, pool.characters);
        pushUnique(data.faction.regiments, pool.regiments);
        pushUnique(data.faction.warMachines, pool.warMachines);
      }

      installGoblinChariotMount(data);
      installGoblinShamans(data);
      installCommonGoblinArtillery(data);

      return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
    } catch (error) {
      console.error("Unable to load Ogre Mercenaries data", error);
      return response;
    }
  };
})();
;
/* ===== END ogre_mercenaries_loader.js ===== */

/* ===== BEGIN halflings_extensions.js ===== */
// Halflings of the Moot: allies, liberated magic, Thieves, flying livestock and one Dwarf Rune Item.
(() => {
  const ID="halflings_moot";
  const isHalfling=()=>state.data?.faction?.id===ID && state.selectedArmyId===ID;
  const tags=u=>u?.tags||[];
  const nativeRegs=()=>state.roster.filter(e=>e.sectionKey==="regiments" && tags(getUnit(e.sectionKey,e.unitId)).includes("halfling_regiment"));
  const empireAllies=()=>state.roster.filter(e=>tags(getUnit(e.sectionKey,e.unitId)).includes("allied_empire"));
  const woodAllies=()=>state.roster.filter(e=>tags(getUnit(e.sectionKey,e.unitId)).includes("allied_wood_elf"));
  const allyLimit=()=>Math.floor(nativeRegs().length/2);
  const foreignItem=id=>getMagicItem(id)?.halflingForeignItem;
  const foreignSource=id=>getMagicItem(id)?.halflingSourceFaction;
  const externalAllowance=()=>Math.max(1,Math.ceil(Number(state.pointsLimit||0)/800));

  function legalLiberatedItem(item) {
    if (!item?.halflingForeignItem) return false;
    if (item.category==="enchanted_item") return true;
    if (item.category==="magic_weapon") {
      const text=`${item.name||""} ${item.rules||""}`.toLowerCase();
      return !/(lance|spear|halberd|flail|double handed|double-handed|great weapon|staff|pistol|crossbow|handgun|throwing|bolas)/.test(text);
    }
    if (item.category==="magic_armour") return /light armour/i.test(String(item.rules||""));
    return false;
  }
  function isNativeHalflingBearer(unit) { return tags(unit).includes("halfling_character") || tags(unit).includes("halfling_regiment"); }
  function selectedForeignCount(ignoreId=null, draft=null) {
    let n=0;
    for (const e of state.roster) {
      if (e.id===ignoreId) continue;
      const u=getUnit(e.sectionKey,e.unitId);
      if (!isNativeHalflingBearer(u)) continue;
      n += (e.magicItems||[]).filter(foreignItem).length;
      n += (e.champion?.magicItems||[]).filter(foreignItem).length;
    }
    if (draft) {
      const u=getUnit(draft.sectionKey,draft.unitId);
      if (isNativeHalflingBearer(u)) {
        n += (draft.magicItems||[]).filter(foreignItem).length;
        n += (draft.champion?.magicItems||[]).filter(foreignItem).length;
      }
    }
    return n;
  }

  function patchData() {
    if (!isHalfling() || state.data.__halflingPatched) return;
    state.data.__halflingPatched=true;
    for (const u of state.data.faction.characters||[]) {
      if (tags(u).includes("human_wizard")) u.rules=[...(u.rules||[]),"Wizard uses College Magic."];
    }
  }

  const oldRenderBrowser=renderUnitBrowser;
  renderUnitBrowser=function(){ if(isHalfling()) patchData(); return oldRenderBrowser(); };

  const oldAddUnit=addUnit;
  addUnit=function(sectionKey,unitId){
    if(!isHalfling()) return oldAddUnit(sectionKey,unitId);
    patchData(); const unit=getUnit(sectionKey,unitId); if(!unit)return;
    if(tags(unit).includes("zero_one") && state.roster.some(e=>e.unitId===unitId)){alert(`${unit.name} may only be included once.`);return;}
    if(tags(unit).includes("allied_empire")) {
      if(woodAllies().length){alert("Empire Troops cannot be included in a Halfling army that already contains Wood Elf allies.");return;}
      if(empireAllies().length>=allyLimit()){alert("You need two native Halfling regiments for each Empire allied regiment.");return;}
    }
    if(tags(unit).includes("allied_wood_elf")) {
      if(empireAllies().length){alert("Wood Elf allies cannot be included in a Halfling army that already contains Empire Troops.");return;}
      if(woodAllies().length>=allyLimit()){alert("You need two native Halfling regiments for each Wood Elf allied regiment.");return;}
    }
    if(unit.id==="treeman" && !woodAllies().length){alert("A Treeman may only be included if the army also includes Wood Elf allies.");return;}
    if(unit.id==="cockatrice_independent" && state.roster.some(e=>e.unitId==="moot_general" && e.mount==="cockatrice")){alert("The army can include only one Cockatrice, either as the General's mount or independently.");return;}
    return oldAddUnit(sectionKey,unitId);
  };

  const oldGetMagic=getAllowedMagicItems;
  getAllowedMagicItems=function(unit,context){
    let items=oldGetMagic(unit,context); if(!isHalfling()) return items;
    if(tags(unit).includes("allied_empire")) return (state.data.commonMagicItems||[]).concat((state.data.factionMagicItems||[]).filter(i=>i.halflingSourceFaction==="empire"));
    if(tags(unit).includes("allied_wood_elf")) return (state.data.commonMagicItems||[]).concat((state.data.factionMagicItems||[]).filter(i=>i.halflingSourceFaction==="wood_elves"));
    if(!isNativeHalflingBearer(unit)) return items;
    const settings=context==="champion"?unit.champion?.magicItems:unit.magicItems;
    if(!settings)return [];
    const cats=settings.allowedCategories||["magic_weapon","magic_armour","enchanted_item"];
    return [...(state.data.commonMagicItems||[]),...(state.data.factionMagicItems||[]).filter(legalLiberatedItem)].filter(i=>cats.includes(i.category));
  };

  const oldBanner=renderMagicBannerEditor;
  renderMagicBannerEditor=function(entry,unit){
    if(!isHalfling()) return oldBanner(entry,unit);
    if(tags(unit).includes("allied_empire") || tags(unit).includes("allied_wood_elf")) {
      const src=tags(unit).includes("allied_empire")?"empire":"wood_elves", orig=state.data.factionMagicItems;
      state.data.factionMagicItems=(orig||[]).filter(i=>i.halflingSourceFaction===src);
      try{return oldBanner(entry,unit);}finally{state.data.factionMagicItems=orig;}
    }
    const orig=state.data.factionMagicItems; state.data.factionMagicItems=[];
    try{return oldBanner(entry,unit);}finally{state.data.factionMagicItems=orig;}
  };

  function runeCategories(){return state.data?.faction?.systems?.dwarfRunes?.categories||{};}
  function runeById(id){return Object.values(runeCategories()).flat().find(r=>r.id===id);}
  function runeBearerEligible(unit,entry){return isNativeHalflingBearer(unit) && !tags(unit).includes("thief") && !tags(unit).includes("human_wizard") && Number((entry.sectionKey==="regiments"?unit.champion?.magicItems:unit.magicItems)?.maximum||0)>0;}
  function ensureRunes(entry){entry.halflingRuneItem ||= {category:"weapon",runes:[]}; return entry.halflingRuneItem;}
  function runeUsedElsewhere(entryId){return state.roster.some(e=>e.id!==entryId && (e.halflingRuneItem?.runes||[]).length) || state.roster.some(e=>e.id!==entryId && (e.champion?.halflingRuneItem?.runes||[]).length);}
  function runeCost(entry){const r=entry.halflingRuneItem; return (r?.runes||[]).reduce((s,id)=>s+Number(runeById(id)?.cost||0),0);}
  function renderRuneEditor(entry,unit,champion=false){
    const target=champion?(entry.champion ||= {selected:false,magicItems:[]}):entry;
    if(!runeBearerEligible(unit,entry) || (champion && !entry.champion?.selected)) return "";
    const cfg=ensureRunes(target), used=runeUsedElsewhere(entry.id), cats=["weapon","armour","talisman"].filter(c=>(runeCategories()[c]||[]).length);
    if(!cats.length)return "";
    return `<section class="editor-section"><div class="magic-header"><h3 class="editor-section-title" style="margin:0;">Dwarf Rune Item</h3><span class="magic-counter">1 per army</span></div>
      <div class="field-hint">The Moot may craft one Dwarf Rune Item. A runic item uses one magic-item slot.</div>
      ${used && !(cfg.runes||[]).length?`<div class="warning-box">The army already contains its one Dwarf Rune Item.</div>`:`<div class="dialog-field"><label>Runic item type</label><select data-halfling-rune-category data-rune-champion="${champion}">${cats.map(c=>`<option value="${c}" ${cfg.category===c?"selected":""}>${humanise(c)}</option>`).join("")}</select></div>
      ${[0,1,2].map((slot)=>`<div class="dialog-field"><label>Rune ${slot+1}</label><select data-halfling-rune-slot="${slot}" data-rune-champion="${champion}"><option value="">None</option>${(runeCategories()[cfg.category]||[]).map(r=>`<option value="${escapeHtml(r.id)}" ${cfg.runes?.[slot]===r.id?"selected":""}>${escapeHtml(r.name)} (${formatPoints(r.cost)} pts)</option>`).join("")}</select></div>`).join("")}`}
    </section>`;
  }

  const oldCharEditor=renderCharacterEditor;
  renderCharacterEditor=function(entry,unit){let h=oldCharEditor(entry,unit); if(!isHalfling())return h; if(tags(unit).includes("thief")){
    const opts=nativeRegs().filter(e=>["halfling_bowmen","halfling_slingers","halfling_militia","pantry_guard","field_wardens"].includes(e.unitId));
    h+=`<section class="editor-section"><h3 class="editor-section-title">Hidden In Regiment</h3><select data-halfling-thief-regiment><option value="">Choose regiment</option>${opts.map(e=>`<option value="${e.id}" ${entry.hiddenInRegimentId===e.id?"selected":""}>${escapeHtml(getUnit(e.sectionKey,e.unitId).name)}</option>`).join("")}</select></section>`;
  } else h+=renderRuneEditor(entry,unit,false); return h;};
  const oldRegEditor=renderRegimentEditor;
  renderRegimentEditor=function(entry,unit){let h=oldRegEditor(entry,unit); if(isHalfling()&&entry.champion?.selected&&tags(unit).includes("halfling_regiment"))h+=renderRuneEditor(entry,unit,true);return h;};

  const oldWire=wireEditorControls;
  wireEditorControls=function(){oldWire(); if(!isHalfling()||!state.draft)return; const entry=state.draft;
    els.dialogContent.querySelector("[data-halfling-thief-regiment]")?.addEventListener("change",e=>{entry.hiddenInRegimentId=e.target.value||null;updateDialogTotal();});
    els.dialogContent.querySelectorAll("[data-halfling-rune-category]").forEach(s=>s.addEventListener("change",()=>{const t=s.dataset.runeChampion==="true"?entry.champion:entry;ensureRunes(t).category=s.value;ensureRunes(t).runes=[];renderEditor();}));
    els.dialogContent.querySelectorAll("[data-halfling-rune-slot]").forEach(s=>s.addEventListener("change",()=>{const t=s.dataset.runeChampion==="true"?entry.champion:entry,cfg=ensureRunes(t),slot=Number(s.dataset.halflingRuneSlot);while(cfg.runes.length<3)cfg.runes.push("");cfg.runes[slot]=s.value;const chosen=cfg.runes.filter(Boolean),defs=chosen.map(runeById);if(defs.filter(r=>r?.master).length>1){alert("A runic item may contain only one Master Rune.");cfg.runes[slot]="";}const d=runeById(s.value),times=chosen.filter(x=>x===s.value).length;if(s.value&&d&&!d.repeatable&&times>1){alert("That rune cannot be repeated on the same item.");cfg.runes[slot]="";}renderEditor();}));
  };

  const oldCalc=calculateEntry;
  calculateEntry=function(entry){let total=oldCalc(entry); if(!isHalfling())return total; total+=runeCost(entry); if(entry.champion?.selected)total+=runeCost(entry.champion); return total;};

  const oldSave=saveEditor;
  saveEditor=function(){if(isHalfling()&&state.draft){const e=state.draft,u=getUnit(e.sectionKey,e.unitId);
    if(tags(u).includes("thief")){if(!e.hiddenInRegimentId){alert("Choose the Halfling regiment in which the Thief is hiding.");return;}if(state.roster.some(x=>x.id!==e.id&&x.hiddenInRegimentId===e.hiddenInRegimentId)){alert("Only one Halfling Thief may hide in each regiment.");return;}}
    if(e.unitId==="moot_general"&&e.mount==="cockatrice"&&state.roster.some(x=>x.id!==e.id&&x.unitId==="cockatrice_independent")){alert("The army can include only one Cockatrice.");return;}
    if(e.unitId==="halfling_riders"&&e.optionSelections?.flying_livestock){if(state.roster.some(x=>x.id!==e.id&&x.unitId==="halfling_riders"&&x.optionSelections?.flying_livestock)){alert("Only one Halfling Rider regiment may ride flying livestock.");return;}e.command.standardBearer=false;e.magicBanner=null;}
    if(e.unitId==="pantry_guard"&&e.optionSelections?.spears&&e.optionSelections?.bows){alert("Pantry Guard cannot take both spears and bows.");return;}
    if(selectedForeignCount(e.id,e)>externalAllowance()){alert(`This ${state.pointsLimit}-point army may include at most ${externalAllowance()} liberated magic item${externalAllowance()===1?"":"s"} from other army books.`);return;}
    const runeCount=(e.halflingRuneItem?.runes||[]).filter(Boolean).length+(e.champion?.halflingRuneItem?.runes||[]).filter(Boolean).length;if(runeCount&&runeUsedElsewhere(e.id)){alert("A Halfling army may craft only one Dwarf Rune Item.");return;}
  } return oldSave();};

  const oldRegPts=calculateRegimentPoints;
  calculateRegimentPoints=function(){let total=oldRegPts(); if(!isHalfling())return total; const first=state.roster.find(e=>e.unitId==="treeman"); if(first)total+=calculateEntry(first); return total;};

  const oldStatus=renderArmyStatus;
  renderArmyStatus=function(total){oldStatus(total);if(!isHalfling())return;const badAllies=empireAllies().length+woodAllies().length>allyLimit();const panel=document.createElement("div");panel.className=`army-system-panel${badAllies?" warn":""}`;panel.innerHTML=`<div class="army-system-copy"><strong>Moot Allies & Liberated Magic</strong><span>${nativeRegs().length} native Halfling regiment(s): ${allyLimit()} allied regiment slot(s). ${empireAllies().length?"Empire route":woodAllies().length?"Wood Elf route":"No ally route chosen"}. Liberated items: ${selectedForeignCount()} / ${externalAllowance()}.</span></div>`;els.armyStatus.prepend(panel);};

  const oldDescribe=describeEntry;
  describeEntry=function(entry){let text=oldDescribe(entry);if(!isHalfling())return text;const bits=[];if(entry.hiddenInRegimentId){const target=state.roster.find(e=>e.id===entry.hiddenInRegimentId);if(target)bits.push(`Hidden in ${getUnit(target.sectionKey,target.unitId)?.name}`);}for(const target of [entry,entry.champion]){if((target?.halflingRuneItem?.runes||[]).filter(Boolean).length)bits.push(`Dwarf Rune Item: ${target.halflingRuneItem.runes.filter(Boolean).map(id=>runeById(id)?.name||id).join(", ")}`);}return bits.length?`${text==="Base configuration"?"":text+" · "}${bits.join(" · ")}`:text;};

  const oldMountRow=rosterPadUnitMountRow;
  rosterPadUnitMountRow=function(entry,unit){if(isHalfling()&&unit?.id==="halfling_riders"&&entry.optionSelections?.flying_livestock){const view=clone(unit);view.unitMount={mountId:"flying_livestock",name:"Flying Livestock Beast",quantity:"per_model",equipment:[]};return oldMountRow(entry,view);}return oldMountRow(entry,unit);};
})();
;
/* ===== END halflings_extensions.js ===== */

/* ===== BEGIN halflings_final_fixes.js ===== */
// Final Halfling edge cases: travelling wizards participate in Liberated Magic correctly.
(() => {
  const isHalfling = () => state.data?.faction?.id === "halflings_moot" && state.selectedArmyId === "halflings_moot";
  const tags = unit => unit?.tags || [];
  const isMootBearer = unit => tags(unit).includes("halfling_character") || tags(unit).includes("halfling_regiment") || tags(unit).includes("human_wizard");
  const isForeign = id => Boolean(getMagicItem(id)?.halflingForeignItem);

  function legalForeign(item) {
    if (!item?.halflingForeignItem) return false;
    if (item.category === "enchanted_item") return true;
    if (item.category === "magic_weapon") {
      const text = `${item.name || ""} ${item.rules || ""}`.toLowerCase();
      return !/(lance|spear|halberd|flail|double handed|double-handed|great weapon|staff|pistol|crossbow|handgun|throwing|bolas)/.test(text);
    }
    if (item.category === "magic_armour") return /light armour/i.test(String(item.rules || ""));
    return false;
  }

  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    if (!isHalfling() || !tags(unit).includes("human_wizard")) return previousGetAllowedMagicItems(unit, context);
    const settings = context === "champion" ? unit.champion?.magicItems : unit.magicItems;
    if (!settings) return [];
    const categories = settings.allowedCategories || ["magic_weapon", "magic_armour", "enchanted_item", "arcane_item", "familiar"];
    const common = (state.data.commonMagicItems || []).filter(item => categories.includes(item.category));
    const liberated = (state.data.factionMagicItems || []).filter(item => legalForeign(item) && categories.includes(item.category));
    return [...common, ...liberated];
  };

  function usedForeignItems(ignoreEntryId = null, draft = null) {
    let total = 0;
    for (const entry of state.roster) {
      if (entry.id === ignoreEntryId) continue;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (!isMootBearer(unit)) continue;
      total += (entry.magicItems || []).filter(isForeign).length;
      total += (entry.champion?.magicItems || []).filter(isForeign).length;
    }
    if (draft) {
      const unit = getUnit(draft.sectionKey, draft.unitId);
      if (isMootBearer(unit)) {
        total += (draft.magicItems || []).filter(isForeign).length;
        total += (draft.champion?.magicItems || []).filter(isForeign).length;
      }
    }
    return total;
  }

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isHalfling() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (tags(unit).includes("human_wizard")) {
        const allowance = Math.max(1, Math.ceil(Number(state.pointsLimit || 0) / 800));
        if (usedForeignItems(state.draft.id, state.draft) > allowance) {
          window.alert(`This ${state.pointsLimit}-point army may include at most ${allowance} liberated magic item${allowance === 1 ? "" : "s"} from other army books.`);
          return;
        }
      }
    }
    return previousSaveEditor();
  };
})();
;
/* ===== END halflings_final_fixes.js ===== */

/* ===== BEGIN dark_elves_loader.js ===== */
// Dark Elves compact army payload loader.
(() => {
  const previousFetch = window.fetch.bind(window);

  async function inflate(text) {
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  async function prepareDarkElves() {
    const payloadResponse = await previousFetch("./data/whr_dark_elves_v0_1.payload", {cache:"no-store"});
    if (!payloadResponse.ok) throw new Error("Could not load Dark Elf payload");
    const data = JSON.parse(await inflate(await payloadResponse.text()));

    // Common items are shared from the Empire dataset, as with the other compact factions.
    const commonResponse = await previousFetch("./data/whr_empire_v0_1.json", {cache:"no-store"});
    if (commonResponse.ok) {
      const common = await commonResponse.json();
      data.commonMagicItems = JSON.parse(JSON.stringify(common.commonMagicItems || []));
    }

    // The first ordinary Dark Elf Assassin contributes its full cost to Regiments.
    const assassin = data.faction?.characters?.find(unit => unit.id === "assassin");
    if (assassin) {
      assassin.composition = { rules: [{when:{instanceNumber:1}, category:"regiments"}] };
    }

    // WHR allows Dark Elf characters (including Sorcerers) to ride a Cold One Chariot
    // for the normal 66-point chariot price. Represent it as a character mount so it
    // participates in normal character pricing and Roster Pad output.
    if (!(data.profiles || []).some(p => p.id === "cold_one_chariot_mount_profile")) {
      data.profiles.push({
        id:"cold_one_chariot_mount_profile",
        name:"Cold One Chariot",
        stats:{M:null,WS:null,BS:null,S:5,T:5,W:4,I:null,A:null,Ld:null}
      });
    }
    if (!(data.mounts || []).some(m => m.id === "cold_one_chariot_mount")) {
      data.mounts.push({
        id:"cold_one_chariot_mount",
        name:"Cold One Chariot",
        profileId:"cold_one_chariot_mount_profile",
        type:"chariot",
        displayProfileOnRoster:true,
        rules:["Heavy Chariot pulled by two Cold Ones and normally crewed by two Elven Warriors.","Armour save 4+.","Stupidity because of the Cold Ones."]
      });
    }
    for (const unit of data.faction?.characters || []) {
      if (unit.id === "assassin") continue;
      const allowed = ["first_among_equals","elven_hero","witch_elf_hero","elven_bsb","sorcerer_lord","master_sorcerer","sorcerer_champion","sorcerer"].includes(unit.id);
      if (allowed && !(unit.mountOptions || []).some(m => m.mountId === "cold_one_chariot_mount")) {
        unit.mountOptions = [...(unit.mountOptions || []), {mountId:"cold_one_chariot_mount",cost:66}];
      }
    }

    // Fixed ridden special characters should print their mounts as actual profiles.
    const rakarth = data.faction?.specialCharacters?.find(unit => unit.id === "rakarth");
    if (rakarth) {
      rakarth.defaultMount = "black_dragon";
      rakarth.mountOptions = [{mountId:"black_dragon",cost:0}];
    }
    const hellebron = data.faction?.specialCharacters?.find(unit => unit.id === "hellebron");
    if (hellebron) {
      hellebron.defaultMount = "manticore";
      hellebron.mountOptions = [{mountId:"manticore",cost:0}];
    }

    return data;
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (url.endsWith("data/whr_dark_elves_v0_1.json") || url.endsWith("/whr_dark_elves_v0_1.json")) {
      try {
        const data = await prepareDarkElves();
        return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
      } catch (error) {
        console.error("Unable to prepare Dark Elf data", error);
        return new Response(JSON.stringify({error:String(error)}), {status:500, headers:{"Content-Type":"application/json"}});
      }
    }
    return previousFetch(input, init);
  };
})();
;
/* ===== END dark_elves_loader.js ===== */

/* ===== BEGIN dark_elves_extensions.js ===== */
// Dark Elf faction behaviour: Assassins, Beastmasters, item restrictions and special saves.
(() => {
  const ARMY_ID = "dark_elves";
  const isDE = () => state.data?.faction?.id === ARMY_ID && state.selectedArmyId === ARMY_ID;
  const tags = unit => unit?.tags || [];

  function isZeroOne(unit) {
    return Number(unit?.selection?.maximum || 0) === 1 || tags(unit).includes("zero_one");
  }

  function eligibleAssassinTargets(ignoreEntryId = null) {
    return state.roster.filter(entry => {
      if (entry.id === ignoreEntryId || entry.sectionKey !== "regiments") return false;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      return tags(unit).includes("assassin_hideable") && !tags(unit).includes("cavalry");
    });
  }

  function assassinTargetUsed(targetId, ignoreId = null) {
    return state.roster.some(entry => entry.id !== ignoreId && entry.unitId === "assassin" && entry.hiddenInRegimentId === targetId);
  }

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (!isDE()) return entry;
    if (unit.id === "assassin") entry.hiddenInRegimentId = null;
    if (unit.id === "beastmaster_pack") {
      entry.optionSelections = entry.optionSelections || {};
      entry.optionSelections.hound_type = "chaos_hounds";
      entry.optionSelections.hounds = 3;
      entry.optionSelections.beastmasters = 1;
    }
    if (unit.defaultMount && (unit.mountOptions || []).some(m => m.mountId === unit.defaultMount)) entry.mount = unit.defaultMount;
    return entry;
  };

  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isDE()) return oldAddUnit(sectionKey, unitId);
    const unit = getUnit(sectionKey, unitId);
    if (!unit) return;
    if (isZeroOne(unit) && state.roster.some(entry => entry.unitId === unitId)) {
      alert(`${unit.name} may only be included once.`);
      return;
    }
    return oldAddUnit(sectionKey, unitId);
  };

  const oldCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = oldCalculateEntry(entry);
    if (!isDE()) return total;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit) return total;

    if (unit.id === "beastmaster_pack") {
      const hounds = Math.max(0, Number(entry.optionSelections?.hounds || 0));
      const masters = Math.max(0, Number(entry.optionSelections?.beastmasters || 0));
      const houndCost = entry.optionSelections?.hound_type === "warhounds" ? 4 : 12;
      return hounds * houndCost + masters * 14;
    }

    if (unit.id === "repeating_bolt_thrower" && entry.optionSelections?.crew_light_armour) {
      total += 2 + Number(entry.optionSelections?.extra_crew || 0);
    }
    return total;
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isDE() || unit.id !== "beastmaster_pack") return oldRenderRegimentEditor(entry, unit);
    const type = entry.optionSelections?.hound_type || "chaos_hounds";
    const hounds = Number(entry.optionSelections?.hounds || 0);
    const masters = Number(entry.optionSelections?.beastmasters || 0);
    return `
      <section class="editor-section">
        <h3 class="editor-section-title">Beastmaster Pack</h3>
        <div class="field-hint">One pack per army. Chaos Hounds and Warhounds cannot be mixed.</div>
        <div class="dialog-field"><label>Hound type</label><select data-de-hound-type>
          <option value="chaos_hounds" ${type === "chaos_hounds" ? "selected" : ""}>Chaos Hounds — 12 pts each</option>
          <option value="warhounds" ${type === "warhounds" ? "selected" : ""}>Warhounds — 4 pts each</option>
        </select></div>
        <div class="dialog-field"><label>Hounds</label><input data-de-hound-count type="number" min="1" step="1" value="${hounds}"></div>
        <div class="dialog-field"><label>Dark Elf Beastmasters</label><input data-de-beastmaster-count type="number" min="1" step="1" value="${masters}"><div class="field-hint">14 pts each.</div></div>
      </section>
      <section class="editor-section"><h3 class="editor-section-title">Profiles</h3>
        <div class="field-hint">${type === "warhounds" ? "Warhounds are Fast Cavalry." : "Chaos Hounds"} and Dark Elf Beastmasters use their separate profiles on the Roster Pad.</div>
      </section>`;
  };

  const oldRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    let html = oldRenderCharacterEditor(entry, unit);
    if (!isDE() || unit.id !== "assassin") return html;
    const targets = eligibleAssassinTargets(entry.id);
    html += `<section class="editor-section">
      <h3 class="editor-section-title">Hidden Assassin</h3>
      <div class="field-hint">Choose the rank-and-file Dark Elf infantry regiment in which this Assassin begins the battle. Only one Assassin may hide in each regiment.</div>
      <div class="dialog-field"><label>Hide in regiment</label><select data-de-assassin-target>
        <option value="">Choose regiment</option>
        ${targets.map(target => {
          const targetUnit = getUnit(target.sectionKey, target.unitId);
          const disabled = assassinTargetUsed(target.id, entry.id) && entry.hiddenInRegimentId !== target.id;
          return `<option value="${escapeHtml(target.id)}" ${entry.hiddenInRegimentId === target.id ? "selected" : ""} ${disabled ? "disabled" : ""}>${escapeHtml(targetUnit?.name || "Regiment")}</option>`;
        }).join("")}
      </select></div>
    </section>`;
    return html;
  };

  function bearerCanTake(unit, needle) {
    const direct = new Set(unit.equipment || []);
    if (direct.has(needle)) return true;
    return (unit.equipmentOptions || []).some(group => (group.choices || []).some(choice => (typeof choice === "string" ? choice : choice.id) === needle));
  }

  const oldGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let items = oldGetAllowedMagicItems(unit, context);
    if (!isDE()) return items;
    const bsb = tags(unit).includes("battle_standard_bearer");
    return items.filter(item => {
      if (item.id === "banner_nagarythe") return bsb;
      if (item.category === "magic_banner") return bsb;
      if (item.id === "lifetaker") return bearerCanTake(unit, "repeating_crossbow");
      if (item.id === "heartrender") return bearerCanTake(unit, "lance");
      return true;
    });
  };

  function factionBannerAllowed(item, unit) {
    if (!item || item.category !== "magic_banner") return true;
    if (item.id === "banner_nagarythe") return false;
    if (item.id === "expert_rider_banner") return unit.id === "dark_riders";
    if (item.id === "blood_banner") return unit.id === "cold_one_riders";
    return true;
  }

  const oldRenderMagicBannerEditor = renderMagicBannerEditor;
  renderMagicBannerEditor = function(entry, unit) {
    if (!isDE()) return oldRenderMagicBannerEditor(entry, unit);
    const original = state.data.factionMagicItems;
    state.data.factionMagicItems = (original || []).filter(item => factionBannerAllowed(item, unit));
    try { return oldRenderMagicBannerEditor(entry, unit); }
    finally { state.data.factionMagicItems = original; }
  };

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isDE() || !state.draft) return;
    const entry = state.draft;

    els.dialogContent.querySelector("[data-de-assassin-target]")?.addEventListener("change", event => {
      entry.hiddenInRegimentId = event.target.value || null;
      updateDialogTotal();
    });
    els.dialogContent.querySelector("[data-de-hound-type]")?.addEventListener("change", event => {
      entry.optionSelections.hound_type = event.target.value;
      renderEditor();
    });
    els.dialogContent.querySelector("[data-de-hound-count]")?.addEventListener("input", event => {
      entry.optionSelections.hounds = Math.max(1, Number(event.target.value || 1));
      updateDialogTotal();
    });
    els.dialogContent.querySelector("[data-de-beastmaster-count]")?.addEventListener("input", event => {
      entry.optionSelections.beastmasters = Math.max(1, Number(event.target.value || 1));
      updateDialogTotal();
    });
  };

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isDE() && state.draft) {
      const entry = state.draft;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (unit?.id === "assassin") {
        if (!entry.hiddenInRegimentId) { alert("Choose the regiment in which the Assassin is hiding."); return; }
        if (assassinTargetUsed(entry.hiddenInRegimentId, entry.id)) { alert("Only one Assassin may hide in each regiment."); return; }
      }
      if (unit?.id === "beastmaster_pack") {
        if (Number(entry.optionSelections?.hounds || 0) < 1 || Number(entry.optionSelections?.beastmasters || 0) < 1) {
          alert("A Beastmaster Pack must contain at least one hound and one Dark Elf Beastmaster."); return;
        }
      }
      if (unit?.id === "cold_one_chariot") {
        const extraCrew = Number(entry.optionSelections?.extra_crew || 0);
        const commander = entry.optionSelections?.elven_commander ? 1 : 0;
        if (extraCrew + commander > 2) { alert("The Cold One Chariot may have at most two additional crew, including an Elven Commander."); return; }
      }
    }
    return oldSaveEditor();
  };

  const oldDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text = oldDescribeEntry(entry);
    if (!isDE()) return text;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const bits = [];
    if (unit?.id === "assassin" && entry.hiddenInRegimentId) {
      const target = state.roster.find(x => x.id === entry.hiddenInRegimentId);
      const targetUnit = target && getUnit(target.sectionKey, target.unitId);
      if (targetUnit) bits.push(`Hidden in ${targetUnit.name}`);
    }
    if (unit?.id === "beastmaster_pack") {
      const houndName = entry.optionSelections?.hound_type === "warhounds" ? "Warhounds" : "Chaos Hounds";
      bits.push(`${entry.optionSelections?.hounds || 0} ${houndName}`);
      bits.push(`${entry.optionSelections?.beastmasters || 0} Beastmaster${Number(entry.optionSelections?.beastmasters || 0) === 1 ? "" : "s"}`);
    }
    return bits.length ? `${text === "Base configuration" ? "" : text + " · "}${bits.join(" · ")}` : text;
  };

  // Roster Pad additions for mixed Beastmaster packs and optional chariot commander.
  const oldRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    let html = oldRosterPadRow(entry);
    if (!isDE()) return html;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (unit?.id === "beastmaster_pack") {
      const houndProfile = profileById.get(entry.optionSelections?.hound_type === "warhounds" ? "warhound" : "chaos_hound");
      const masterProfile = profileById.get("beastmaster");
      const rows = [
        houndProfile ? `<tr class="sub-profile-row"><td>${escapeHtml(entry.optionSelections?.hound_type === "warhounds" ? "Warhounds" : "Chaos Hounds")}</td>${rosterPadProfileCells(houndProfile)}</tr>` : "",
        masterProfile ? `<tr class="sub-profile-row"><td>Dark Elf Beastmasters</td>${rosterPadProfileCells(masterProfile)}</tr>` : ""
      ].join("");
      html = html.replace("</tr>", `</tr>${rows}`);
    }
    if (unit?.id === "cold_one_chariot" && entry.optionSelections?.elven_commander) {
      const commander = profileById.get("elven_commander");
      if (commander) html = html.replace("</tr>", `</tr><tr class="sub-profile-row"><td>Elven Commander</td>${rosterPadProfileCells(commander)}</tr>`);
    }
    return html;
  };
})();
;
/* ===== END dark_elves_extensions.js ===== */

/* ===== BEGIN dark_elves_final_fixes.js ===== */
// Final Dark Elf source-specific save rules and small roster corrections.
(() => {
  const isDE = () => state.data?.faction?.id === "dark_elves" && state.selectedArmyId === "dark_elves";

  const previousPrintedSave = calculatePrintedArmourSave;
  calculatePrintedArmourSave = function(entry, unit) {
    if (!isDE()) return previousPrintedSave(entry, unit);

    // Explicit fixed saves in the Dark Elf list.
    if (unit?.id === "black_ark_corsairs") return "5+";
    if (unit?.id === "war_hydra") return "5+";
    if (unit?.id === "cold_one_chariot") return "4+";

    let result = previousPrintedSave(entry, unit);

    // A Cold One improves its rider's armour by +2 rather than the normal +1
    // already applied by the generic mounted calculation, so improve once more.
    const ridesColdOne = entry?.mount === "cold_one" || unit?.unitMount?.mountId === "cold_one";
    if (ridesColdOne && result !== "–") {
      const n = Number(String(result).replace("+", ""));
      if (Number.isFinite(n)) result = `${Math.max(2, n - 1)}+`;
    }

    // A character riding the chariot uses its explicit 4+ chariot save unless
    // the character's own equipment/magic armour produces a better result.
    if (entry?.mount === "cold_one_chariot_mount") {
      const n = result === "–" ? 99 : Number(String(result).replace("+", ""));
      return `${Math.min(4, Number.isFinite(n) ? n : 4)}+`;
    }

    return result;
  };
})();
;
/* ===== END dark_elves_final_fixes.js ===== */

/* ===== BEGIN wood_elves_extensions.js ===== */
// Wood Elf faction systems: Classic/Savage lists, Forest Creatures, Shape Changers, Sprites and Zoats.
(() => {
  const ID="wood_elves";
  const isWE=()=>state.data?.faction?.id===ID && state.selectedArmyId===ID;
  const tags=u=>u?.tags||[];
  const opts=()=>{state.armyOptions=state.armyOptions||{};return state.armyOptions;};
  const style=()=>opts().woodElfStyle||"classic";
  const spriteDefs=()=>state.data?.faction?.systems?.sprites||[];
  const spriteById=id=>spriteDefs().find(s=>s.id===id);

  function styleAllowed(unit){
    if(!unit)return false;
    if(style()==="savage")return !tags(unit).includes("classic_only");
    return !tags(unit).includes("savage_only");
  }
  function allUnits(){const f=state.data?.faction||{};return ["characters","regiments","warMachines","specialCharacters"].flatMap(k=>f[k]||[]);}
  function patchData(){
    if(!isWE()||state.data.__woodElfPatched)return;
    state.data.__woodElfPatched=true;
    const ancient=(state.data.faction.characters||[]).find(u=>u.id==="treeman_ancient");
    if(ancient)ancient.magicItems={maximum:0,allowedPools:[],allowedCategories:[]};
    const bsb=(state.data.faction.characters||[]).find(u=>u.id==="wood_elf_bsb");
    if(bsb?.magicItems)bsb.magicItems.allowedCategories=["magic_weapon","magic_armour","enchanted_item","magic_banner"];
  }

  const oldCreate=createEntry;
  createEntry=function(sectionKey,unit){
    const e=oldCreate(sectionKey,unit);if(!isWE())return e;patchData();
    e.woodElfSprites=[];
    if(unit.id==="shape_changer")e.hiddenInRegimentId=null;
    if(unit.id==="forest_creatures")e.optionSelections={...(e.optionSelections||{}),bears:1,hunting_dogs:0,wild_cats:0,wild_hogs:0,beastmasters:0};
    if(unit.defaultMount)e.mount=unit.defaultMount;
    return e;
  };

  const oldBrowser=renderUnitBrowser;
  renderUnitBrowser=function(){
    if(!isWE())return oldBrowser();patchData();
    const f=state.data.faction, backups={};
    for(const section of sectionConfig){backups[section.key]=f[section.key]||[];f[section.key]=backups[section.key].filter(styleAllowed);}
    try{return oldBrowser();}finally{for(const section of sectionConfig)f[section.key]=backups[section.key];}
  };

  const oldAdd=addUnit;
  addUnit=function(sectionKey,unitId){
    if(!isWE())return oldAdd(sectionKey,unitId);patchData();
    const unit=getUnit(sectionKey,unitId);if(!unit||!styleAllowed(unit))return;
    if(tags(unit).includes("zero_one")&&state.roster.some(e=>e.unitId===unitId)){alert(`${unit.name} may only be included once.`);return;}
    if(tags(unit).includes("max_two")&&state.roster.filter(e=>e.unitId===unitId).length>=2){alert(`${unit.name} may only be included twice.`);return;}
    return oldAdd(sectionKey,unitId);
  };

  function stagCost(unit){
    if(unit.id==="wood_elf_warlord")return 33;
    if(unit.id==="wood_elf_hero")return 26;
    if(unit.id==="wood_elf_bsb")return 19;
    if(tags(unit).includes("wizard"))return 0;
    return null;
  }
  function characterView(unit){
    if(!isWE())return unit;
    const v=JSON.parse(JSON.stringify(unit));
    v.mountOptions=(v.mountOptions||[]).filter(m=>style()!=="savage"||m.mountId!=="wood_elf_chariot_mount");
    if(style()==="savage"){
      const c=stagCost(unit);if(c!=null&&!v.mountOptions.some(m=>m.mountId==="stag"))v.mountOptions.push({mountId:"stag",cost:c});
    }
    return v;
  }
  const oldCharEditor=renderCharacterEditor;
  renderCharacterEditor=function(entry,unit){
    let html=oldCharEditor(entry,characterView(unit));
    if(!isWE())return html;
    if(unit.id==="shape_changer"){
      const targets=state.roster.filter(e=>e.id!==entry.id&&e.sectionKey==="regiments"&&["wood_elf_archers","wood_elf_warriors"].includes(e.unitId));
      html+=`<section class="editor-section"><h3 class="editor-section-title">Hidden Shape Changer</h3><div class="field-hint">A Shape Changer must begin hidden in a rank-and-file infantry regiment. Only one may be allocated to each regiment.</div><div class="dialog-field"><label>Hide in regiment</label><select data-we-shape-target><option value="">Choose regiment</option>${targets.map(t=>{const used=state.roster.some(x=>x.id!==entry.id&&x.unitId==="shape_changer"&&x.hiddenInRegimentId===t.id);return `<option value="${escapeHtml(t.id)}" ${entry.hiddenInRegimentId===t.id?"selected":""} ${used?"disabled":""}>${escapeHtml(getUnit(t.sectionKey,t.unitId)?.name||"Regiment")}</option>`}).join("")}</select></div></section>`;
    }
    html+=renderSpriteEditor(entry,unit,false);
    return html;
  };

  function spriteCapacity(unit,champion=false){
    if(champion&&unit.id==="dryads")return 1;
    if(["treeman_ancient","durthu"].includes(unit.id))return 2;
    if(unit.id==="drycha")return 1;
    return 0;
  }
  function spriteSelections(target){return target?.woodElfSprites||[];}
  function spriteUsedElsewhere(id,entryId,target){
    for(const e of state.roster){
      if(e.id===entryId)continue;
      if(spriteSelections(e).includes(id)||spriteSelections(e.champion).includes(id))return true;
    }
    const draft=state.draft;
    if(draft&&draft.id===entryId){
      if(target!==draft&&spriteSelections(draft).includes(id))return true;
      if(target!==draft.champion&&spriteSelections(draft.champion).includes(id))return true;
    }
    return false;
  }
  function renderSpriteEditor(entry,unit,champion){
    const cap=spriteCapacity(unit,champion);if(!cap)return "";
    const target=champion?(entry.champion||{}):entry;
    if(champion&&!entry.champion?.selected)return "";
    target.woodElfSprites=target.woodElfSprites||[];
    return `<section class="editor-section"><div class="magic-header"><h3 class="editor-section-title" style="margin:0;">Sprites</h3><span class="magic-counter">${target.woodElfSprites.length} / ${cap}</span></div><div class="field-hint">Sprites are unique army-wide and each occupies a magic-item slot, but is not itself a magic item.</div>${spriteDefs().map(s=>{const checked=target.woodElfSprites.includes(s.id),used=spriteUsedElsewhere(s.id,entry.id,target);return `<label class="check-row"><input type="checkbox" data-we-sprite="${escapeHtml(s.id)}" data-we-sprite-champion="${champion}" ${checked?"checked":""} ${used&&!checked?"disabled":""}><span class="check-row-content"><span class="check-row-title"><span>${escapeHtml(s.name)}</span><span>+${formatPoints(s.cost)} pts</span></span><span class="check-row-sub">${escapeHtml(s.rules)}</span></span></label>`}).join("")}</section>`;
  }

  const oldRegEditor=renderRegimentEditor;
  renderRegimentEditor=function(entry,unit){
    if(isWE()&&unit.id==="forest_creatures"){
      const o=entry.optionSelections||{};
      return `<section class="editor-section"><h3 class="editor-section-title">Forest Creature Pack</h3><div class="field-hint">Up to two packs. Bears, Hunting Dogs, Wild Cats and Wild Hogs may be mixed freely; Beastmasters are optional.</div>${[["bears","Bears",15],["hunting_dogs","Hunting Dogs",10],["wild_cats","Wild Cats",10],["wild_hogs","Wild Hogs",5],["beastmasters","Wood Elf Beastmasters",14]].map(([id,n,c])=>`<div class="dialog-field"><label>${n}</label><input type="number" min="0" step="1" data-we-pack="${id}" value="${Number(o[id]||0)}"><div class="field-hint">${c} pts each</div></div>`).join("")}</section>`;
    }
    let html=oldRegEditor(entry,unit);
    if(isWE()&&unit.id==="dryads")html+=renderSpriteEditor(entry,unit,true);
    return html;
  };

  const oldWire=wireEditorControls;
  wireEditorControls=function(){
    oldWire();if(!isWE()||!state.draft)return;const e=state.draft,u=getUnit(e.sectionKey,e.unitId);
    els.dialogContent.querySelector("[data-we-shape-target]")?.addEventListener("change",ev=>{e.hiddenInRegimentId=ev.target.value||null;updateDialogTotal();});
    els.dialogContent.querySelectorAll("[data-we-pack]").forEach(inp=>inp.addEventListener("input",()=>{e.optionSelections[inp.dataset.wePack]=Math.max(0,Number(inp.value||0));updateDialogTotal();}));
    els.dialogContent.querySelectorAll("[data-we-sprite]").forEach(ch=>ch.addEventListener("change",()=>{
      const target=ch.dataset.weSpriteChampion==="true"?(e.champion||{}):e;target.woodElfSprites=target.woodElfSprites||[];
      const cap=spriteCapacity(u,ch.dataset.weSpriteChampion==="true"),id=ch.dataset.weSprite;
      if(ch.checked){if(target.woodElfSprites.length>=cap){alert(`This model may take at most ${cap} Sprite${cap===1?"":"s"}.`);ch.checked=false;return;}if(spriteUsedElsewhere(id,e.id,target)){alert("That Sprite is already used elsewhere in the army.");ch.checked=false;return;}target.woodElfSprites.push(id);}else target.woodElfSprites=target.woodElfSprites.filter(x=>x!==id);
      renderEditor();
    }));
  };

  const oldCalc=calculateEntry;
  calculateEntry=function(entry){
    let total=oldCalc(entry);if(!isWE())return total;const unit=getUnit(entry.sectionKey,entry.unitId);if(!unit)return total;
    if(unit.id==="forest_creatures"){
      const o=entry.optionSelections||{};total=Number(o.bears||0)*15+Number(o.hunting_dogs||0)*10+Number(o.wild_cats||0)*10+Number(o.wild_hogs||0)*5+Number(o.beastmasters||0)*14;
    }
    if(entry.mount==="stag")total+=Number(stagCost(unit)||0);
    if(unit.id==="wood_elf_lords"&&entry.optionSelections?.barding&&entry.command?.standardBearer)total-=10;
    for(const id of spriteSelections(entry))total+=Number(spriteById(id)?.cost||0);
    if(entry.champion?.selected)for(const id of spriteSelections(entry.champion))total+=Number(spriteById(id)?.cost||0);
    return total;
  };

  const oldEq=getSelectedEquipmentIds;
  getSelectedEquipmentIds=function(entry,unit){
    const ids=new Set(oldEq(entry,unit));if(!isWE())return [...ids];
    for(const id of ["shield","light_armour"]){if(entry.optionSelections?.[id])ids.add(id);}
    if(unit.id==="glade_riders"&&entry.optionSelections?.shields)ids.add("shield");
    if(unit.id==="glade_riders"&&entry.optionSelections?.longbows){ids.delete("bow");ids.add("wood_elf_longbow");}
    if(unit.id==="wood_elf_warriors"){
      if(entry.optionSelections?.additional_hand_weapons){ids.delete("shield");ids.add("additional_hand_weapon");}
      if(entry.optionSelections?.double_handed_weapons){ids.delete("shield");ids.add("double_handed_weapon");}
      if(entry.optionSelections?.spears)ids.add("spear");
      if(entry.optionSelections?.light_armour)ids.add("light_armour");
    }
    if(unit.id==="warhawk_riders"){
      if(entry.optionSelections?.bows)ids.add("bow");if(entry.optionSelections?.longbows)ids.add("wood_elf_longbow");
      if(entry.optionSelections?.spears)ids.add("spear");if(entry.optionSelections?.shields)ids.add("shield");if(entry.optionSelections?.light_armour)ids.add("light_armour");
    }
    return [...ids];
  };

  const oldArmour=calculatePrintedArmourSave;
  calculatePrintedArmourSave=function(entry,unit){
    if(isWE()){
      if(unit.id==="war_dancers"||unit.id==="war_dancer_hero"||unit.id==="wychwethyl")return "–";
      if(unit.id==="dryads"||unit.id==="drycha")return "5+";
      if(unit.id==="treeman")return "3+";
      if(unit.id==="durthu")return "2+";
      if(unit.id==="tree_kin")return "4+";
      if(unit.id==="zoat_warriors"||unit.id==="zoat_character")return "5+";
      if(unit.id==="wood_elf_chariot")return "5+";
    }
    return oldArmour(entry,unit);
  };

  function canBow(unit){
    const eq=new Set(unit.fixedEquipment||[]);if(eq.has("bow")||eq.has("wood_elf_longbow"))return true;
    if(["wood_elf_warlord","wood_elf_hero"].includes(unit.id))return true;
    return false;
  }
  const oldMagic=getAllowedMagicItems;
  getAllowedMagicItems=function(unit,context){
    let items=oldMagic(unit,context);if(!isWE())return items;
    const wizard=tags(unit).includes("wizard")||(unit.id==="zoat_character"&&state.draft?.optionSelections?.wizard_level1);
    return items.filter(item=>{
      if(item.id==="antler_totem"&&!wizard)return false;
      if(["hagbane_arrows","bow_loren","hail_doom","arcane_bodkins"].includes(item.id)&&!canBow(unit))return false;
      if(["arcane_item","familiar"].includes(item.category)&&!wizard)return false;
      return true;
    });
  };

  const oldSave=saveEditor;
  saveEditor=function(){
    if(isWE()&&state.draft){const e=state.draft,u=getUnit(e.sectionKey,e.unitId);
      if(u?.id==="shape_changer"){
        if(!e.hiddenInRegimentId){alert("Choose the rank-and-file regiment in which the Shape Changer is hiding.");return;}
        if(state.roster.some(x=>x.id!==e.id&&x.unitId==="shape_changer"&&x.hiddenInRegimentId===e.hiddenInRegimentId)){alert("Only one Shape Changer may be allocated to each regiment.");return;}
      }
      if(u?.id==="forest_creatures"){
        const o=e.optionSelections||{}, creatures=Number(o.bears||0)+Number(o.hunting_dogs||0)+Number(o.wild_cats||0)+Number(o.wild_hogs||0);
        if(creatures<1){alert("A Forest Creature pack must contain at least one Forest Creature.");return;}
      }
      if(u?.id==="wood_elf_warriors"&&[e.optionSelections?.spears,e.optionSelections?.additional_hand_weapons,e.optionSelections?.double_handed_weapons].filter(Boolean).length>1){alert("Wood Elf Warriors may select only one weapon option.");return;}
      if(u?.id==="warhawk_riders"&&e.optionSelections?.bows&&e.optionSelections?.longbows){alert("Warhawk Riders may take bows or Wood Elf Longbows, not both.");return;}
      if(u?.id==="wood_elf_lords"&&e.optionSelections?.barding)e.command.standardBearer=true;
      if(u?.id==="wood_elf_chariot"&&Number(e.optionSelections?.extra_crew||0)+(e.optionSelections?.elven_commander?1:0)>2){alert("A Wood Elf Chariot may have at most two additional crew, including an Elven Commander.");return;}
      if(style()==="savage"&&e.mount==="wood_elf_chariot_mount"){alert("Savage Wood Elf characters cannot ride Wood Elf Chariots.");return;}
    }
    return oldSave();
  };

  const oldDescribe=describeEntry;
  describeEntry=function(entry){let text=oldDescribe(entry);if(!isWE())return text;const u=getUnit(entry.sectionKey,entry.unitId),bits=[];
    if(u?.id==="shape_changer"&&entry.hiddenInRegimentId){const t=state.roster.find(x=>x.id===entry.hiddenInRegimentId);if(t)bits.push(`Hidden in ${getUnit(t.sectionKey,t.unitId)?.name}`);}
    if(u?.id==="forest_creatures"){const o=entry.optionSelections||{};[["bears","Bears"],["hunting_dogs","Hunting Dogs"],["wild_cats","Wild Cats"],["wild_hogs","Wild Hogs"],["beastmasters","Beastmasters"]].forEach(([id,n])=>{if(Number(o[id]||0))bits.push(`${o[id]} ${n}`)});}
    const sp=[...spriteSelections(entry),...spriteSelections(entry.champion)];if(sp.length)bits.push(`Sprites: ${sp.map(id=>spriteById(id)?.name).filter(Boolean).join(", ")}`);
    if(u?.id==="dryads")bits.push(style()==="savage"?"Savage: skirmishers; no Aspects":"Classic: Birch/Oak/Willow Aspects");
    return bits.length?`${text==="Base configuration"?"":text+" · "}${bits.join(" · ")}`:text;
  };

  function zoatStatus(){
    const es=state.roster.filter(e=>tags(getUnit(e.sectionKey,e.unitId)).includes("zoat"));if(!es.length)return null;
    const chars=es.filter(e=>e.sectionKey==="characters"),regs=es.filter(e=>e.sectionKey==="regiments");
    const cp=chars.reduce((s,e)=>s+calculateEntry(e),0),rp=regs.reduce((s,e)=>s+calculateEntry(e),0),zp=cp+rp,total=calculateArmyTotal();
    const problems=[];if(!chars.length)problems.push("requires at least one Zoat character");if(!regs.length)problems.push("requires at least one Zoat Warrior regiment");if(cp>rp)problems.push("Zoat character points exceed Zoat regiment points");if(total&&zp>total*.25+0.001)problems.push("Zoat contingent exceeds 25% of the army");
    return {cp,rp,zp,total,problems};
  }
  const oldStatus=renderArmyStatus;
  renderArmyStatus=function(total){
    oldStatus(total);if(!isWE())return;patchData();
    const z=zoatStatus(),panel=document.createElement("div");panel.className=`army-system-panel${z?.problems.length?" warn":""}`;
    panel.innerHTML=`<div class="army-system-copy"><strong>Wood Elf Army Style</strong><span>${style()==="savage"?"Savage list: later forest-spirit and Wild Rider roster; Dryads skirmish and cannot use Aspects.":"Classic list: traditional Wood Elf roster; optional Zoat contingent available."}${z?` Zoats: ${formatPoints(z.zp)} pts${z.problems.length?` — ${z.problems.join("; ")}`:" — legal composition"}.`:""}</span></div><select class="army-system-select" data-we-style><option value="classic" ${style()==="classic"?"selected":""}>Classic Wood Elves</option><option value="savage" ${style()==="savage"?"selected":""}>Savage Wood Elves</option></select>`;
    els.armyStatus.prepend(panel);
    panel.querySelector("[data-we-style]").addEventListener("change",ev=>{
      const next=ev.target.value,previous=style();if(next===previous)return;
      if(state.roster.length&&!confirm("Changing Wood Elf army style will remove choices that are not legal in the new style. Continue?")){ev.target.value=previous;return;}
      opts().woodElfStyle=next;
      state.roster=state.roster.filter(e=>styleAllowed(getUnit(e.sectionKey,e.unitId)));
      if(next==="savage")for(const e of state.roster)if(e.mount==="wood_elf_chariot_mount")e.mount=null;
      renderUnitBrowser();renderArmy();
    });
    const replacementProblems=[];
    if(state.roster.some(e=>e.unitId==="wychwethyl")&&!state.roster.some(e=>e.unitId==="war_dancers"))replacementProblems.push("Wychwethyl requires a War Dancer regiment");
    if(state.roster.some(e=>e.unitId==="drycha")&&!state.roster.some(e=>e.unitId==="dryads"))replacementProblems.push("Drycha replaces a Branch Wraith and requires Dryads");
    if(state.roster.some(e=>e.unitId==="gruarth")&&!state.roster.some(e=>e.unitId==="forest_creatures"))replacementProblems.push("Gruarth requires a Forest Creature pack");
    if(replacementProblems.length){const p=document.createElement("div");p.className="army-system-panel warn";p.innerHTML=`<div class="army-system-copy"><strong>Special Character Requirements</strong><span>${replacementProblems.join("; ")}.</span></div>`;els.armyStatus.append(p);}
  };

  const oldPad=rosterPadRow;
  rosterPadRow=function(entry){let html=oldPad(entry);if(!isWE())return html;const u=getUnit(entry.sectionKey,entry.unitId);if(u?.id==="forest_creatures"){
    const o=entry.optionSelections||{},rows=[["bears","Bears","bear"],["hunting_dogs","Hunting Dogs","hunting_dog"],["wild_cats","Wild Cats","wild_cat"],["wild_hogs","Wild Hogs","wild_hog"],["beastmasters","Wood Elf Beastmasters","wood_elf_beastmaster"]].filter(([id])=>Number(o[id]||0)>0).map(([id,n,p])=>`<tr class="sub-profile-row"><td>${escapeHtml(`${o[id]} ${n}`)}</td>${rosterPadProfileCells(profileById.get(p))}</tr>`).join("");html=html.replace("</tr>",`</tr>${rows}`);}
    if(u?.id==="wood_elf_chariot"&&entry.optionSelections?.elven_commander){const p=profileById.get("elven_commander");if(p)html=html.replace("</tr>",`</tr><tr class="sub-profile-row"><td>Elven Commander</td>${rosterPadProfileCells(p)}</tr>`);}
    return html;
  };
})();
;
/* ===== END wood_elves_extensions.js ===== */

/* ===== BEGIN wood_elves_final_fixes.js ===== */
// Final Wood Elf editor/composition edge cases kept separate from the main faction systems.
(() => {
  const isWE=()=>state.data?.faction?.id==="wood_elves"&&state.selectedArmyId==="wood_elves";

  // Apply model-size details that the generic editor reads from unit.size.
  const oldBrowser=renderUnitBrowser;
  renderUnitBrowser=function(){
    if(isWE()){
      for(const u of state.data.faction.regiments||[]){
        if(["warhawk_riders","tree_kin","zoat_warriors"].includes(u.id))u.size={...(u.size||{}),minimum:3};
      }
    }
    return oldBrowser();
  };

  // Character options (free armour, bows and Orion's hounds) use the same option controls as regiments.
  const oldCharacterEditor=renderCharacterEditor;
  renderCharacterEditor=function(entry,unit){
    let html=oldCharacterEditor(entry,unit);
    if(isWE()&&(unit.options||[]).length){
      html+=`<section class="editor-section"><h3 class="editor-section-title">Options</h3>${renderUnitOptions(entry,unit)}</section>`;
    }
    return html;
  };

  // Start Forest Creature packs at a legal 60-point configuration instead of a single 15-point Bear.
  const oldCreate=createEntry;
  createEntry=function(sectionKey,unit){
    const e=oldCreate(sectionKey,unit);
    if(isWE()&&unit?.id==="forest_creatures")e.optionSelections.bears=4;
    return e;
  };

  // Only the cheapest 60-point value of the first unridden Chariot belongs to Regiments; its upgrades do not.
  const oldRegimentPoints=calculateRegimentPoints;
  calculateRegimentPoints=function(){
    let total=oldRegimentPoints();
    if(!isWE())return total;
    const first=state.roster.find(e=>e.sectionKey==="warMachines"&&e.unitId==="wood_elf_chariot");
    if(first)total-=Math.max(0,calculateEntry(first)-60);
    return total;
  };

  const bowMagic=new Set(["hagbane_arrows","bow_loren","hail_doom","arcane_bodkins"]);
  const oldSave=saveEditor;
  saveEditor=function(){
    if(isWE()&&state.draft){
      const e=state.draft,u=getUnit(e.sectionKey,e.unitId);
      if(u?.id==="forest_creatures"&&calculateEntry(e)<50){alert("A Forest Creature regiment must contain at least 50 points of models.");return;}
      if(["wood_elf_warlord","wood_elf_hero"].includes(u?.id)&&(e.magicItems||[]).some(id=>bowMagic.has(id))&&!e.optionSelections?.bow_or_longbow){
        alert("That magic weapon requires the character to buy a Bow or Wood Elf Longbow.");return;
      }
    }
    return oldSave();
  };
})();
;
/* ===== END wood_elves_final_fixes.js ===== */

/* ===== BEGIN dogs_of_war_extensions.js ===== */
// Dogs of War faction rules: mainstay, Paymaster, mercenary magic pools and Regiments of Renown.
(() => {
  const FACTION_ID = "dogs_of_war";
  const isDoW = () => state.data?.faction?.id === FACTION_ID && state.selectedArmyId === FACTION_ID;
  const tags = unit => unit?.tags || [];
  const hasTag = (unit, tag) => tags(unit).includes(tag);
  const unitFor = entry => getUnit(entry?.sectionKey, entry?.unitId);

  function isMainstay(unit) {
    return hasTag(unit, "old_world_human") || unit?.id === "vesperos_vendetta";
  }

  function mainstayCount() {
    return state.roster.filter(entry => entry.sectionKey === "regiments" && isMainstay(unitFor(entry))).length;
  }

  function isPaymaster(unit) {
    return unit?.id === "human_paymaster" || unit?.id === "myrdas" || hasTag(unit, "paymaster");
  }

  function isHumanCharacter(unit) {
    if (!unit || !["characters", "specialCharacters"].some(section => (state.data?.faction?.[section] || []).includes(unit))) return false;
    return hasTag(unit, "human") && !isPaymaster(unit);
  }

  function halflingRegimentPresent() {
    return state.roster.some(entry => entry.sectionKey === "regiments" && ["halfling_militia", "halfling_bowmen"].includes(entry.unitId));
  }

  function ogreRegimentPresent() {
    return state.roster.some(entry => entry.sectionKey === "regiments" && entry.unitId === "ogre_mercenaries");
  }

  function patchData() {
    if (!isDoW() || state.data.__dogsOfWarPatched) return;
    state.data.__dogsOfWarPatched = true;

    const faction = state.data.faction;
    const all = ["characters", "regiments", "warMachines", "specialCharacters"].flatMap(key => faction[key] || []);
    const byId = id => all.find(unit => unit.id === id);

    // The three generic Human character classes receive free barding on their
    // Warhorse. Wizards may also bard their free Warhorse at no extra cost.
    for (const id of ["human_mercenary_lord", "human_mercenary_hero", "hireling_wizard_lord", "hireling_master_wizard", "hireling_wizard_champion", "hireling_wizard"]) {
      const unit = byId(id);
      if (!unit) continue;
      for (const mount of unit.mountOptions || []) {
        if (mount.mountId === "warhorse") mount.mountId = "barded_warhorse";
      }
    }

    // Paymasters cannot be mounted and the WHR Paymaster equipment line does
    // not include a lance.
    const paymaster = byId("human_paymaster");
    if (paymaster) {
      paymaster.mountOptions = [];
      const melee = (paymaster.equipmentOptions || []).find(group => group.id === "melee_weapon");
      if (melee) melee.choices = (melee.choices || []).filter(choice => choice !== "lance");
    }

    // Vespero is a Tilean Human regiment and therefore fulfils the Old World
    // Human mainstay requirement.
    const vespero = byId("vesperos_vendetta");
    if (vespero && !hasTag(vespero, "old_world_human")) vespero.tags = [...tags(vespero), "old_world_human"];
  }

  function nonMainstayCount(unitId, sectionKey) {
    return state.roster.filter(entry => entry.sectionKey === sectionKey && entry.unitId === unitId).length;
  }

  const previousCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = previousCreateEntry(sectionKey, unit);
    if (!isDoW()) return entry;
    patchData();
    entry.dowLeaderMagicItems = entry.dowLeaderMagicItems || [];
    entry.dowExtraChampions = Number(entry.dowExtraChampions || 0);
    entry.dowExtraChampionItems = entry.dowExtraChampionItems || [];
    if (unit?.mount) entry.mount = unit.mount;
    if (unit?.id === "asarnil") entry.optionSelections.dragon_colour = entry.optionSelections.dragon_colour || "red";
    return entry;
  };

  const previousAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isDoW()) return previousAddUnit(sectionKey, unitId);
    patchData();
    const unit = getUnit(sectionKey, unitId);
    if (!unit) return;

    if ((hasTag(unit, "zero_one") || hasTag(unit, "regiment_of_renown")) && state.roster.some(entry => entry.unitId === unitId)) {
      window.alert(`${unit.name} may only be included once.`);
      return;
    }
    if (isPaymaster(unit) && state.roster.some(entry => isPaymaster(unitFor(entry)))) {
      window.alert("A Dogs of War army may include only one Paymaster.");
      return;
    }
    if (unitId === "ogre_mercenary_hero" && !ogreRegimentPresent()) {
      window.alert("An Ogre Mercenary Hero requires an Ogre Mercenaries regiment in the army.");
      return;
    }
    if (unitId === "halfling_hot_pot" && !halflingRegimentPresent()) {
      window.alert("The Halfling Hot-Pot requires at least one Halfling regiment.");
      return;
    }

    if ((sectionKey === "regiments" || sectionKey === "warMachines") && !isMainstay(unit)) {
      const allowance = mainstayCount();
      const copies = nonMainstayCount(unitId, sectionKey);
      if (copies >= allowance) {
        window.alert(allowance
          ? `You currently have ${allowance} Old World Human mainstay regiment${allowance === 1 ? "" : "s"}, so you may include at most ${allowance} of ${unit.name}.`
          : "Add an Old World Human mainstay regiment before adding other mercenary regiments or war machines.");
        return;
      }
    }

    return previousAddUnit(sectionKey, unitId);
  };

  function borrowedSourcesFor(unit, context) {
    if (context === "character") {
      if (unit.id === "ogre_mercenary_hero") return ["ogre_mercenaries"];
      return [];
    }
    const pool = unit.champion?.dowMagicPool || unit.champion?.magicItems?.allowedPools?.find(pool => pool !== "common") || "";
    const mapping = state.data?.faction?.systems?.borrowedItemPools || {};
    return mapping[pool] || mapping[unit.magicBanner?.sourcePool] || [];
  }

  function itemMatchesSources(item, sources) {
    return item?.dowSourceFaction && sources.includes(item.dowSourceFaction);
  }

  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    if (!isDoW()) return previousGetAllowedMagicItems(unit, context);
    patchData();
    const settings = context === "champion" ? unit.champion?.magicItems : unit.magicItems;
    if (!settings) return [];
    const categories = settings.allowedCategories || ["magic_weapon", "magic_armour", "enchanted_item", "arcane_item", "familiar"];
    const sources = borrowedSourcesFor(unit, context);
    const items = [
      ...(state.data.commonMagicItems || []),
      ...(state.data.factionMagicItems || []).filter(item => itemMatchesSources(item, sources))
    ].filter(item => categories.includes(item.category));

    // Bretonnian virtues are not magic items for Dogs of War. Human Knights
    // are the sole exception explicitly allowed to take one item OR virtue.
    return items.filter(item => !item.isVirtue || (context === "champion" && unit.id === "human_knights"));
  };

  function bannerSources(unit) {
    const pool = unit.magicBanner?.sourcePool || "";
    const mapping = state.data?.faction?.systems?.borrowedItemPools || {};
    return mapping[pool] || [];
  }

  function itemAllowedForUnit(item, unit) {
    if (item.allowedUnitIds?.length) {
      // Army-book-specific unit restrictions only apply when the borrowed item
      // explicitly names this Dogs of War unit. This prevents e.g. a Knights
      // Panther-only banner leaking into generic Human Knights.
      return item.allowedUnitIds.includes(unit.id);
    }
    return true;
  }

  const previousRenderMagicBannerEditor = renderMagicBannerEditor;
  renderMagicBannerEditor = function(entry, unit) {
    if (!isDoW()) return previousRenderMagicBannerEditor(entry, unit);
    const sources = bannerSources(unit);
    const banners = [
      ...(state.data.commonMagicItems || []).filter(item => item.category === "magic_banner"),
      ...(state.data.factionMagicItems || []).filter(item => item.category === "magic_banner" && itemMatchesSources(item, sources))
    ].filter(item => itemAllowedForUnit(item, unit));

    return `<section class="editor-section"><h3 class="editor-section-title">Magic Banner</h3><div class="dialog-field"><label>Banner</label><select data-magic-banner><option value="">None</option>${banners.map(item => {
      const used = magicItemUsedElsewhere(item.id, entry.id, "banner");
      return `<option value="${escapeHtml(item.id)}" ${entry.magicBanner === item.id ? "selected" : ""} ${used && entry.magicBanner !== item.id ? "disabled" : ""}>${escapeHtml(item.name)} (${formatPoints(item.cost)} pts)${item.dowSourceName ? ` — ${escapeHtml(item.dowSourceName)}` : ""}</option>`;
    }).join("")}</select></div></section>`;
  };

  function rorLeaderConfig(unit) {
    if (unit.id === "vesperos_vendetta") return {name:"Vespero", maximum:2, sources:[], common:true};
    if (unit.id === "oglah_khans_wolfboyz") return {name:"Oglah Khan", maximum:2, sources:["chaos_dwarfs"], common:true};
    if (unit.id === "cursed_company") return {name:"Richter Kreugar", maximum:2, sources:["classic_undead"], common:false};
    return null;
  }

  function leaderItemsFor(unit) {
    const cfg = rorLeaderConfig(unit);
    if (!cfg) return [];
    const result = [];
    if (cfg.common) result.push(...(state.data.commonMagicItems || []).filter(item => item.category !== "magic_banner"));
    result.push(...(state.data.factionMagicItems || []).filter(item => itemMatchesSources(item, cfg.sources) && item.category !== "magic_banner"));
    return result;
  }

  function customItemUsedElsewhere(itemId, entryId, slotIndex = -1) {
    for (const entry of state.roster) {
      if (entry.id !== entryId && (entry.dowLeaderMagicItems || []).includes(itemId)) return true;
      if (entry.id !== entryId && (entry.dowExtraChampionItems || []).includes(itemId)) return true;
      if (entry.id === entryId) {
        if ((entry.dowLeaderMagicItems || []).some((id, index) => index !== slotIndex && id === itemId)) return true;
      }
    }
    return false;
  }

  const previousMagicItemUsedElsewhere = magicItemUsedElsewhere;
  magicItemUsedElsewhere = function(itemId, contextEntryId, context) {
    if (previousMagicItemUsedElsewhere(itemId, contextEntryId, context)) return true;
    if (!isDoW()) return false;
    return customItemUsedElsewhere(itemId, contextEntryId);
  };

  function renderLeaderMagicEditor(entry, unit) {
    const cfg = rorLeaderConfig(unit);
    if (!cfg) return "";
    entry.dowLeaderMagicItems = entry.dowLeaderMagicItems || [];
    const items = leaderItemsFor(unit);
    return `<section class="editor-section"><h3 class="editor-section-title">${escapeHtml(cfg.name)} — Magic Items</h3><div class="field-hint">${cfg.name} may take up to ${cfg.maximum} magic items${unit.id === "cursed_company" ? " from the Undead army book, in addition to the Wight Blade" : unit.id === "oglah_khans_wolfboyz" ? ", including items from the Chaos Dwarfs army book" : ""}.</div>${Array.from({length:cfg.maximum}, (_, index) => `<div class="dialog-field"><label>Magic item ${index + 1}</label><select data-dow-leader-item="${index}"><option value="">None</option>${items.map(item => {
      const selected = entry.dowLeaderMagicItems[index] === item.id;
      const used = magicItemUsedElsewhere(item.id, entry.id, "dowLeader") || customItemUsedElsewhere(item.id, entry.id, index);
      return `<option value="${escapeHtml(item.id)}" ${selected ? "selected" : ""} ${used && !selected ? "disabled" : ""}>${escapeHtml(item.name)} (${formatPoints(item.cost)} pts)${item.dowSourceName ? ` — ${escapeHtml(item.dowSourceName)}` : ""}</option>`;
    }).join("")}</select></div>`).join("")}</section>`;
  }

  function roRBaseText(unit) {
    if (unit.id === "vesperos_vendetta") return "Four Duelists plus Vespero (120 pts); additional Duelists cost 15 pts each.";
    if (unit.id === "oglah_khans_wolfboyz") return "Four Hobgoblins plus Oglah Khan (145 pts); additional Wolfboyz cost 17 pts each.";
    if (unit.id === "cursed_company") return "Nine Skeletons plus Richter Kreugar (145 pts); additional Skeletons cost 7 pts each.";
    return "";
  }

  const previousRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isDoW()) return previousRenderRegimentEditor(entry, unit);
    if (hasTag(unit, "regiment_of_renown")) {
      return `<section class="editor-section"><h3 class="editor-section-title">Fixed Regiment of Renown</h3><div class="dialog-note">${escapeHtml(roRBaseText(unit))}</div></section>${(unit.options || []).length ? `<section class="editor-section"><h3 class="editor-section-title">Additional Models</h3>${renderUnitOptions(entry, unit)}</section>` : ""}${renderLeaderMagicEditor(entry, unit)}${unit.rules?.length ? `<section class="editor-section"><h3 class="editor-section-title">Rules</h3>${unit.rules.map(rule => `<div class="dialog-note">${escapeHtml(rule)}</div>`).join("")}</section>` : ""}`;
    }
    let html = previousRenderRegimentEditor(entry, unit);
    if (unit.id === "norse_huscarls") {
      entry.dowExtraChampionItems = entry.dowExtraChampionItems || [];
      html += `<section class="editor-section"><h3 class="editor-section-title">Additional Norse Champions</h3><div class="field-hint">Unlike normal regiments, Norse Huscarls may be joined by any number of Norse Champions. The normal Champion control above represents the first; add further Champions here.</div><div class="dialog-field"><label>Additional Champions</label><input type="number" min="0" step="1" value="${Number(entry.dowExtraChampions || 0)}" data-dow-extra-champions></div>${Array.from({length:Number(entry.dowExtraChampions || 0)}, (_, index) => {
        const items = getAllowedMagicItems(unit, "champion");
        return `<div class="dialog-field"><label>Extra Champion ${index + 1} magic item</label><select data-dow-extra-champion-item="${index}"><option value="">None</option>${items.map(item => {
          const selected = entry.dowExtraChampionItems[index] === item.id;
          const used = magicItemUsedElsewhere(item.id, entry.id, "dowExtra") || entry.dowExtraChampionItems.some((id, i) => i !== index && id === item.id);
          return `<option value="${escapeHtml(item.id)}" ${selected ? "selected" : ""} ${used && !selected ? "disabled" : ""}>${escapeHtml(item.name)} (${formatPoints(item.cost)} pts)</option>`;
        }).join("")}</select></div>`;
      }).join("")}</section>`;
    }
    return html;
  };

  const previousRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    let html = previousRenderCharacterEditor(entry, unit);
    if (!isDoW()) return html;
    if ((unit.options || []).length && entry.sectionKey === "specialCharacters") {
      html += `<section class="editor-section"><h3 class="editor-section-title">Special Character Options</h3>${renderUnitOptions(entry, unit)}</section>`;
    }
    return html;
  };

  const previousWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    previousWireEditorControls();
    if (!isDoW() || !state.draft) return;
    const entry = state.draft;
    const unit = unitFor(entry);

    els.dialogContent.querySelectorAll("[data-dow-leader-item]").forEach(select => {
      select.addEventListener("change", () => {
        const index = Number(select.dataset.dowLeaderItem);
        entry.dowLeaderMagicItems = entry.dowLeaderMagicItems || [];
        entry.dowLeaderMagicItems[index] = select.value || null;
        entry.dowLeaderMagicItems = entry.dowLeaderMagicItems.slice(0, rorLeaderConfig(unit)?.maximum || 0);
        updateDialogTotal();
      });
    });

    const extraChampions = els.dialogContent.querySelector("[data-dow-extra-champions]");
    if (extraChampions) extraChampions.addEventListener("change", () => {
      entry.dowExtraChampions = Math.max(0, Math.floor(Number(extraChampions.value || 0)));
      entry.dowExtraChampionItems = (entry.dowExtraChampionItems || []).slice(0, entry.dowExtraChampions);
      renderEditor();
    });

    els.dialogContent.querySelectorAll("[data-dow-extra-champion-item]").forEach(select => select.addEventListener("change", () => {
      const index = Number(select.dataset.dowExtraChampionItem);
      entry.dowExtraChampionItems = entry.dowExtraChampionItems || [];
      entry.dowExtraChampionItems[index] = select.value || null;
      updateDialogTotal();
    }));
  };

  function perTrooperCost(entry, unit) {
    return Number(unit.points?.value || 0) + Number(selectedPerModelOptionCost(entry, unit) || 0);
  }

  const previousCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = previousCalculateEntry(entry);
    if (!isDoW()) return total;
    const unit = unitFor(entry);
    if (!unit) return total;

    if (unit.id === "human_cavalry_retainers" && entry.optionSelections?.armour === "heavy_armour" && entry.command?.standardBearer) total -= 10;

    if (unit.id === "norse_huscarls" && Number(entry.dowExtraChampions || 0) > 0) {
      const count = Number(entry.dowExtraChampions || 0);
      total += count * (20 + perTrooperCost(entry, unit));
      total += (entry.dowExtraChampionItems || []).reduce((sum, id) => sum + Number(getMagicItem(id)?.cost || 0), 0);
    }

    total += (entry.dowLeaderMagicItems || []).reduce((sum, id) => sum + Number(getMagicItem(id)?.cost || 0), 0);
    return total;
  };

  const previousGetSelectedEquipmentIds = getSelectedEquipmentIds;
  getSelectedEquipmentIds = function(entry, unit) {
    const ids = new Set(previousGetSelectedEquipmentIds(entry, unit));
    if (!isDoW()) return [...ids];
    const o = entry.optionSelections || {};

    for (const key of ["shield", "light_armour", "heavy_armour", "pavise", "barding"]) if (o[key]) ids.add(key);
    for (const key of ["melee_weapon", "missile_weapon", "armour"]) if (typeof o[key] === "string" && o[key]) ids.add(o[key]);
    if (o.longbows) { ids.delete("bow"); ids.add("longbow"); }
    if (o.armour === "heavy_armour" || o.heavy_armour) ids.delete("light_armour");
    return [...ids];
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isDoW() && state.draft) {
      const entry = state.draft;
      const unit = unitFor(entry);
      const o = entry.optionSelections || {};
      if (unit?.id === "human_foot_soldiers" && o.missile_weapon) {
        const melee = !!o.melee_weapon;
        const shield = !!o.shield;
        if (melee || shield) {
          window.alert("Human Foot Soldiers may take longbows, crossbows or handguns only when they have no other equipment apart from light armour. Crossbowmen may additionally take a pavise.");
          return;
        }
        if (o.pavise && o.missile_weapon !== "crossbow") {
          window.alert("A pavise may only be taken by Human Foot Soldiers equipped with crossbows.");
          return;
        }
      }
      if (unit?.id === "dwarf_mercenary_warriors" && o.missile_weapon && (o.melee_weapon || o.shield)) {
        window.alert("Dwarf Mercenary Warriors may take crossbows or handguns only if they take no other weapons or shields.");
        return;
      }
    }
    return previousSaveEditor();
  };

  const previousDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text = previousDescribeEntry(entry);
    if (!isDoW()) return text;
    const unit = unitFor(entry);
    const additions = [];
    if (unit?.id === "human_cavalry_retainers" && entry.optionSelections?.armour === "heavy_armour") additions.push("Heavy armour: no longer Fast Cavalry");
    if (unit?.id === "norse_huscarls" && Number(entry.dowExtraChampions || 0)) additions.push(`${entry.dowExtraChampions} additional Norse Champion${entry.dowExtraChampions === 1 ? "" : "s"}`);
    if (hasTag(unit, "regiment_of_renown")) {
      const extra = Number(entry.optionSelections?.extra_models || 0);
      if (extra) additions.push(`${extra} additional models`);
      const cfg = rorLeaderConfig(unit);
      if (cfg && entry.dowLeaderMagicItems?.filter(Boolean).length) additions.push(`${cfg.name}: ${entry.dowLeaderMagicItems.filter(Boolean).map(id => getMagicItem(id)?.name || id).join(", ")}`);
    }
    if (unit?.id === "asarnil") additions.push(`${humanise(entry.optionSelections?.dragon_colour || "red")} Dragon`);
    if (!additions.length) return text;
    return text === "Base configuration" ? additions.join(" · ") : `${text} · ${additions.join(" · ")}`;
  };

  const previousRosterPadNotes = rosterPadNotes;
  rosterPadNotes = function(entry, unit) {
    const notes = previousRosterPadNotes(entry, unit);
    if (!isDoW()) return notes;
    if (isPaymaster(unit)) notes.push("Paymaster: regiment is Unbreakable while he lives; Dogs of War units within 12 inches gain +1 Leadership.");
    if (unit?.id === "human_cavalry_retainers" && entry.optionSelections?.armour === "heavy_armour") notes.push("Heavy armour: loses Fast Cavalry status.");
    if (unit?.id === "norse_huscarls" && Number(entry.dowExtraChampions || 0)) notes.push(`${entry.dowExtraChampions} additional Norse Champion${entry.dowExtraChampions === 1 ? "" : "s"}.`);
    const cfg = rorLeaderConfig(unit);
    if (cfg) for (const id of entry.dowLeaderMagicItems || []) { const item = getMagicItem(id); if (item) notes.push(`${cfg.name}: ${item.name} — ${item.rules || ""}`); }
    if (unit?.id === "asarnil") notes.push(`${humanise(entry.optionSelections?.dragon_colour || "red")} Dragon.`);
    return [...new Set(notes)];
  };

  function extraProfileRow(name, profileId, note = "") {
    const profile = profileById.get(profileId);
    if (!profile) return "";
    return `<tr class="mount-row"><td class="unit-cell mount-name">↳ ${escapeHtml(name)}</td>${rosterPadProfileCells(profile)}<td class="save">–</td><td class="notes-cell mount-notes">${rosterPadNotesInline(note ? [note] : [])}</td><td class="points-cell"></td></tr>`;
  }

  const previousRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    let html = previousRosterPadRow(entry);
    if (!isDoW()) return html;
    const unit = unitFor(entry);
    if (!unit) return html;
    if (unit.id === "vesperos_vendetta") html += extraProfileRow("Vespero", "vespero", "Regiment leader");
    if (unit.id === "oglah_khans_wolfboyz") html += extraProfileRow("Oglah Khan", "oglah_khan", "Regiment leader");
    if (unit.id === "cursed_company") html += extraProfileRow("Richter Kreugar", "richter_kreugar", "Wight; carries a Wight Blade");
    if (unit.id === "myrdas") {
      html += extraProfileRow("Sheik Yadosh", "human_mercenary_soldier", "Always accompanies Myrdas");
      html += extraProfileRow("Bodyguards", "elite_human_mercenary_soldier", `${5 + Number(entry.optionSelections?.extra_bodyguards || 0)} models; halberds and light armour`);
    }
    if (unit.id === "galloper_gun") html += extraProfileRow("Galloper Horse", "normal_horse", "Raises movement allowance to 8 inches");
    return html;
  };

  const previousRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    previousRenderArmyStatus(total);
    if (!isDoW()) return;
    patchData();
    const mainstay = mainstayCount();
    const warnings = [];
    if (!mainstay) warnings.push("The army must include at least one Human regiment of Old World origin (Norse do not count).");
    if (!state.roster.some(entry => isHumanCharacter(unitFor(entry)))) warnings.push("The army must include a Human character eligible to serve as General.");
    if (!state.roster.some(entry => isPaymaster(unitFor(entry)))) warnings.push("Dogs of War use a Human Paymaster and Pay Chest instead of a Battle Standard Bearer.");
    if (state.roster.filter(entry => isPaymaster(unitFor(entry))).length > 1) warnings.push("Only one Paymaster may be included.");
    if (state.roster.some(entry => entry.unitId === "ogre_mercenary_hero") && !ogreRegimentPresent()) warnings.push("The Ogre Mercenary Hero requires an Ogre Mercenaries regiment.");
    if (state.roster.some(entry => entry.unitId === "halfling_hot_pot") && !halflingRegimentPresent()) warnings.push("The Halfling Hot-Pot requires a Halfling regiment.");

    const counts = new Map();
    for (const entry of state.roster) {
      if (!["regiments", "warMachines"].includes(entry.sectionKey)) continue;
      const unit = unitFor(entry);
      if (isMainstay(unit)) continue;
      const key = `${entry.sectionKey}:${entry.unitId}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    for (const [key, count] of counts) if (count > mainstay) {
      const [, id] = key.split(":");
      const unit = ["regiments", "warMachines"].flatMap(section => state.data.faction[section] || []).find(x => x.id === id);
      warnings.push(`${unit?.name || humanise(id)}: ${count} included but only ${mainstay} allowed by your ${mainstay} Old World Human mainstay regiment${mainstay === 1 ? "" : "s"}.`);
    }

    const panel = document.createElement("div");
    panel.className = `army-system-panel${warnings.length ? " warn" : ""}`;
    panel.innerHTML = `<div class="army-system-copy"><strong>Dogs of War Mainstay & Paymaster</strong><span>${mainstay} Old World Human mainstay regiment${mainstay === 1 ? "" : "s"}. Each other regiment or war machine may be taken no more than this many times.${warnings.length ? `<br>${warnings.map(w => `⚠ ${escapeHtml(w)}`).join("<br>")}` : " Army construction requirements currently satisfied."}</span></div>`;
    els.armyStatus.prepend(panel);
  };
})();
;
/* ===== END dogs_of_war_extensions.js ===== */

/* ===== BEGIN dogs_of_war_dwarf_runes.js ===== */
// Dwarf Mercenary Champions and standards may use Dwarf runic items.
(() => {
  const isDoW = () => state.data?.faction?.id === "dogs_of_war" && state.selectedArmyId === "dogs_of_war";
  const isDwarfMercs = unit => unit?.id === "dwarf_mercenary_warriors";
  const categories = () => state.data?.faction?.systems?.dwarfRunes?.categories || {};
  const runeById = id => Object.values(categories()).flat().find(rune => rune.id === id);

  function ensure(entry) {
    entry.dowDwarfRunes = entry.dowDwarfRunes || {champion:{weapon:[], armour:[], talisman:[]}, standard:[]};
    entry.dowDwarfRunes.champion = entry.dowDwarfRunes.champion || {weapon:[], armour:[], talisman:[]};
    for (const key of ["weapon","armour","talisman"]) if (!Array.isArray(entry.dowDwarfRunes.champion[key])) entry.dowDwarfRunes.champion[key] = [];
    if (!Array.isArray(entry.dowDwarfRunes.standard)) entry.dowDwarfRunes.standard = [];
    return entry.dowDwarfRunes;
  }

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isDoW() && isDwarfMercs(unit)) ensure(entry);
    return entry;
  };

  function usedChampionRuneItem(entry) {
    const runes = ensure(entry).champion;
    return ["weapon","armour","talisman"].some(key => runes[key].length);
  }

  function runeCost(id) { return Number(runeById(id)?.cost || 0); }
  function totalRuneCost(entry) {
    const r = ensure(entry);
    return [...r.champion.weapon, ...r.champion.armour, ...r.champion.talisman, ...r.standard].reduce((sum,id)=>sum+runeCost(id),0);
  }

  const oldGetMagicMaximum = getMagicMaximum;
  getMagicMaximum = function(unit, context) {
    const maximum = oldGetMagicMaximum(unit, context);
    if (!isDoW() || !isDwarfMercs(unit) || context !== "champion" || !state.draft) return maximum;
    return Math.max(0, maximum - (usedChampionRuneItem(state.draft) ? 1 : 0));
  };

  const oldCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    const total = oldCalculateEntry(entry);
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!isDoW() || !isDwarfMercs(unit)) return total;
    return total + totalRuneCost(entry);
  };

  function runesFor(category) {
    return (categories()[category] || []).filter(rune => !rune.onlyRunesmith && (!rune.allowedUnits || !rune.allowedUnits.length));
  }

  function renderRuneItem(entry, category, title, standard=false) {
    const selected = standard ? ensure(entry).standard : ensure(entry).champion[category];
    const available = runesFor(standard ? "protection" : category);
    if (!available.length) return "";
    return `<section class="editor-section"><div class="magic-header"><h3 class="editor-section-title" style="margin:0;">${escapeHtml(title)}</h3><span class="magic-counter">${selected.length} / 3 runes</span></div><div class="field-hint">Up to three runes form one runic item. A Dwarf Champion may carry one runic item in place of his normal magic item.${standard ? " A runic standard replaces a conventional magic banner." : ""}</div>${[0,1,2].map(slot=>`<div class="dialog-field"><label>Rune ${slot+1}</label><select data-dow-dwarf-rune="${standard ? "standard" : category}" data-dow-rune-slot="${slot}"><option value="">None</option>${available.map(rune=>`<option value="${escapeHtml(rune.id)}" ${selected[slot]===rune.id?"selected":""}>${escapeHtml(rune.name)} (${formatPoints(rune.cost)} pts)</option>`).join("")}</select></div>`).join("")}</section>`;
  }

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = oldRenderRegimentEditor(entry, unit);
    if (!isDoW() || !isDwarfMercs(unit)) return html;
    ensure(entry);
    if (entry.champion?.selected) {
      html += renderRuneItem(entry,"weapon","Champion Runic Weapon");
      html += renderRuneItem(entry,"armour","Champion Runic Armour");
      html += renderRuneItem(entry,"talisman","Champion Runic Talisman");
    }
    if (entry.command?.standardBearer) html += renderRuneItem(entry,"protection","Runic Standard",true);
    return html;
  };

  function runeCountElsewhere(id, entryId) {
    let count=0;
    for (const entry of state.roster) {
      if (entry.id===entryId || !entry.dowDwarfRunes) continue;
      const r=ensure(entry);
      for (const arr of [r.champion.weapon,r.champion.armour,r.champion.talisman,r.standard]) count += arr.filter(x=>x===id).length;
    }
    return count;
  }

  function validate(entry, category, slot, id) {
    if (!id) return {ok:true, next:null};
    const standard = category === "standard";
    const rune = runeById(id);
    const source = standard ? ensure(entry).standard : ensure(entry).champion[category];
    const next=[...source]; while(next.length<3) next.push(""); next[slot]=id;
    const chosen=next.filter(Boolean), details=chosen.map(runeById);
    if (details.filter(r=>r?.master).length>1) return {ok:false,msg:"A runic item may contain only one Master Rune."};
    if (rune?.master && runeCountElsewhere(id,entry.id)) return {ok:false,msg:"That Master Rune is already used elsewhere in the army."};
    const times=chosen.filter(x=>x===id).length;
    if (rune && !rune.repeatable && times>1) return {ok:false,msg:"That rune cannot be repeated on the same item."};
    if (rune?.maxRepeats && times>Number(rune.maxRepeats)) return {ok:false,msg:`${rune.name} may be taken at most ${rune.maxRepeats} times.`};
    if (id==="r_spellbreaking" && runeCountElsewhere(id,entry.id)+times>2) return {ok:false,msg:"No more than two Runes of Spellbreaking may be included in the army."};
    if (standard && entry.magicBanner) return {ok:false,msg:"Remove the conventional magic banner before creating a runic standard."};
    if (!standard) {
      if (entry.champion?.magicItems?.length) return {ok:false,msg:"The Dwarf Champion's runic item uses his single magic-item allowance. Remove his conventional magic item first."};
      const other=["weapon","armour","talisman"].filter(key=>key!==category && ensure(entry).champion[key].length);
      if (other.length) return {ok:false,msg:"The Dwarf Champion may carry only one runic item."};
    }
    return {ok:true,next:chosen};
  }

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isDoW() || !state.draft || !isDwarfMercs(getUnit(state.draft.sectionKey,state.draft.unitId))) return;
    const entry=state.draft; ensure(entry);
    els.dialogContent.querySelectorAll("[data-dow-dwarf-rune]").forEach(select=>select.addEventListener("change",()=>{
      const category=select.dataset.dowDwarfRune, slot=Number(select.dataset.dowRuneSlot);
      const check=validate(entry,category,slot,select.value);
      if(!check.ok){window.alert(check.msg);renderEditor();return;}
      const target=category==="standard"?entry.dowDwarfRunes.standard:entry.dowDwarfRunes.champion[category];
      const next=[...target]; while(next.length<3)next.push(""); next[slot]=select.value||"";
      if(category==="standard")entry.dowDwarfRunes.standard=next.filter(Boolean);else entry.dowDwarfRunes.champion[category]=next.filter(Boolean);
      renderEditor();
    }));
  };

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isDoW() && state.draft && isDwarfMercs(getUnit(state.draft.sectionKey,state.draft.unitId))) {
      const r=ensure(state.draft);
      if (r.standard.length && state.draft.magicBanner) {
        window.alert("A Dwarf regiment cannot carry both a conventional magic banner and a runic standard.");
        return;
      }
      if (usedChampionRuneItem(state.draft) && state.draft.champion?.magicItems?.length) {
        window.alert("The Dwarf Champion's runic item uses his single magic-item allowance.");
        return;
      }
    }
    return oldSaveEditor();
  };

  const oldDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text=oldDescribeEntry(entry);
    const unit=getUnit(entry.sectionKey,entry.unitId);
    if(!isDoW()||!isDwarfMercs(unit)||!entry.dowDwarfRunes)return text;
    const r=ensure(entry), additions=[];
    for(const key of ["weapon","armour","talisman"])if(r.champion[key].length)additions.push(`Champion ${humanise(key)} runes: ${r.champion[key].map(id=>runeById(id)?.name||id).join(", ")}`);
    if(r.standard.length)additions.push(`Runic Standard: ${r.standard.map(id=>runeById(id)?.name||id).join(", ")}`);
    return additions.length?(text==="Base configuration"?additions.join(" · "):`${text} · ${additions.join(" · ")}`):text;
  };

  const oldRosterPadNotes = rosterPadNotes;
  rosterPadNotes = function(entry,unit) {
    const notes=oldRosterPadNotes(entry,unit);
    if(!isDoW()||!isDwarfMercs(unit)||!entry.dowDwarfRunes)return notes;
    const r=ensure(entry);
    for(const key of ["weapon","armour","talisman"])if(r.champion[key].length)notes.push(`${unit.champion?.name||"Dwarf Champion"} runic ${key}: ${r.champion[key].map(id=>runeById(id)?.name||id).join(", ")}`);
    if(r.standard.length)notes.push(`Runic Standard: ${r.standard.map(id=>runeById(id)?.name||id).join(", ")}`);
    return [...new Set(notes)];
  };
})();
;
/* ===== END dogs_of_war_dwarf_runes.js ===== */

/* ===== BEGIN dogs_of_war_final_fixes.js ===== */
// Small Dogs of War presentation/equipment fixes kept separate from the main rules layer.
(() => {
  const isDoW = () => state.data?.faction?.id === "dogs_of_war" && state.selectedArmyId === "dogs_of_war";

  const oldSelectedEquipment = getSelectedEquipmentIds;
  getSelectedEquipmentIds = function(entry, unit) {
    const ids = new Set(oldSelectedEquipment(entry, unit));
    if (!isDoW()) return [...ids];
    if (unit?.id === "sea_elf_mercenaries" && entry.optionSelections?.longbow) {
      ids.delete("bow");
      ids.add("longbow");
    }
    return [...ids];
  };

  const oldRenderCommandEditor = renderCommandEditor;
  renderCommandEditor = function(entry, unit) {
    if (!isDoW() || unit?.id !== "human_cavalry_retainers" || entry.optionSelections?.armour !== "heavy_armour") {
      return oldRenderCommandEditor(entry, unit);
    }
    const view = clone(unit);
    view.command = clone(unit.command || {});
    view.command.standardBearer = {...(view.command.standardBearer || {}), cost:0};
    return oldRenderCommandEditor(entry, view);
  };

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isDoW() || !state.draft) return;
    if (state.draft.unitId === "human_cavalry_retainers") {
      const armour = els.dialogContent.querySelector('[data-option-choice="armour"]');
      if (armour) armour.addEventListener("change", () => renderEditor());
    }
  };
})();
;
/* ===== END dogs_of_war_final_fixes.js ===== */

/* ===== BEGIN dogs_of_war_magic_guard.js ===== */
// Enforce bearer restrictions on magic items borrowed from other army books.
(() => {
  const isDoW = () => state.data?.faction?.id === "dogs_of_war" && state.selectedArmyId === "dogs_of_war";
  const isKnightUnit = unit => unit?.id === "human_knights";

  function legalBorrowedItem(item, unit, context) {
    if (!item?.dowSourceFaction) return true;
    const rules = String(item.rules || "");

    // Source-book unit-specific items remain restricted to the unit named by
    // their original book; a generic Dogs of War regiment does not inherit that identity.
    if (item.allowedUnitIds?.length && !item.allowedUnitIds.includes(unit?.id)) return false;
    if (item.generalOnly || item.lordOnly || item.wizardOnly || item.commonerChampionOnly) return false;
    if (/\b(general|lord|wizard|mage|priest|runesmith) only\b/i.test(rules)) return false;

    // Bretonnian knightly items/virtues are only meaningful to the explicit
    // Human Knights exception in the Dogs of War list.
    if (item.knightlyOnly && !isKnightUnit(unit)) return false;
    if (item.isVirtue && !(context === "champion" && isKnightUnit(unit))) return false;

    return true;
  }

  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const items = previousGetAllowedMagicItems(unit, context);
    if (!isDoW()) return items;
    return items.filter(item => legalBorrowedItem(item, unit, context));
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isDoW() && state.draft) {
      const selected = [
        ...(state.draft.dowLeaderMagicItems || []),
        ...(state.draft.dowExtraChampionItems || [])
      ].filter(Boolean);
      if (new Set(selected).size !== selected.length) {
        window.alert("Each magic item is unique in the army; the same item cannot be selected more than once for this unit.");
        return;
      }
    }
    return previousSaveEditor();
  };
})();
;
/* ===== END dogs_of_war_magic_guard.js ===== */

/* ===== BEGIN lizardmen_extensions.js ===== */
// Pure Lizardmen faction behaviour: mixed Skink/Kroxigor units, BSB rules, item restrictions and roster profiles.
(() => {
  const ARMY_ID = "lizardmen";
  const isLiz = () => state.data?.faction?.id === ARMY_ID && state.selectedArmyId === ARMY_ID;
  const tags = unit => unit?.tags || [];
  const hasTag = (unit, tag) => tags(unit).includes(tag);

  function isZeroOne(unit) {
    return hasTag(unit, "zero_one") || Number(unit?.selection?.maximum || 0) === 1;
  }

  function isSkinkBearer(unit) {
    return hasTag(unit, "skink") || ["skink_warriors","chameleon_skinks","great_crested_cold_one_riders","terradon_riders"].includes(unit?.id);
  }

  function isSlann(unit) { return hasTag(unit, "slann"); }
  function isWizard(unit) { return hasTag(unit, "wizard") || Number(unit?.wizardLevel || 0) > 0; }

  function isBsbEntry(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit) return false;
    return hasTag(unit, "bsb") || Boolean(entry.optionSelections?.battle_standard);
  }

  function otherBsbExists(ignoreId = null) {
    return state.roster.some(entry => entry.id !== ignoreId && isBsbEntry(entry));
  }

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (!isLiz()) return entry;
    entry.lizardChampionHornedOne = Boolean(entry.lizardChampionHornedOne);
    return entry;
  };

  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isLiz()) return oldAddUnit(sectionKey, unitId);
    const unit = getUnit(sectionKey, unitId);
    if (!unit) return;
    if (isZeroOne(unit) && state.roster.some(entry => entry.unitId === unitId)) {
      alert(`${unit.name} may only be included once.`);
      return;
    }
    if (hasTag(unit, "bsb") && otherBsbExists()) {
      alert("A Lizardmen army may include only one Battle Standard Bearer.");
      return;
    }
    return oldAddUnit(sectionKey, unitId);
  };

  const oldCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = oldCalculateEntry(entry);
    if (!isLiz()) return total;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit) return total;
    if (entry.champion?.selected && entry.lizardChampionHornedOne && ["saurus_cold_one_riders","great_crested_cold_one_riders"].includes(unit.id)) total += 10;
    return total;
  };

  function bearerAllows(item, unit, context) {
    if (!item) return false;
    if (item.category === "magic_banner") {
      if (context !== "character") return false;
      return hasTag(unit, "bsb") || Boolean(state.draft?.optionSelections?.battle_standard) || hasTag(unit, "bsb");
    }
    if (item.lizardmenBearer === "slann" && !isSlann(unit)) return false;
    if (item.lizardmenBearer === "skink" && !isSkinkBearer(unit)) return false;
    if (item.lizardmenBearer === "skink_on_foot" && (!isSkinkBearer(unit) || Boolean(state.draft?.mount) || hasTag(unit, "cavalry") || hasTag(unit, "terradon_riders"))) return false;
    if (!isWizard(unit) && ["arcane_item","familiar"].includes(item.category)) return false;
    if (isWizard(unit) && item.category === "magic_armour") return false;
    if (hasTag(unit, "mummified_slann") && ["magic_weapon","magic_armour"].includes(item.category)) return false;
    return true;
  }

  const oldGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    if (!isLiz()) return oldGetAllowedMagicItems(unit, context);
    const settings = context === "champion" ? unit.champion?.magicItems : unit.magicItems;
    if (!settings) return [];
    let categories = [...(settings.allowedCategories || ["magic_weapon","magic_armour","enchanted_item","arcane_item","familiar"])];
    if (context === "character" && (hasTag(unit, "bsb") || state.draft?.optionSelections?.battle_standard)) categories.push("magic_banner");
    const items = [...(state.data.commonMagicItems || []), ...(state.data.factionMagicItems || [])];
    return items.filter(item => categories.includes(item.category) && bearerAllows(item, unit, context));
  };

  function bannerAllowed(item, unit) {
    if (!item || item.category !== "magic_banner") return true;
    if (item.id === "skavenpelt_banner") return isSkinkBearer(unit);
    return true;
  }

  const oldRenderMagicBannerEditor = renderMagicBannerEditor;
  renderMagicBannerEditor = function(entry, unit) {
    if (!isLiz()) return oldRenderMagicBannerEditor(entry, unit);
    const original = state.data.factionMagicItems;
    state.data.factionMagicItems = (original || []).filter(item => bannerAllowed(item, unit));
    try { return oldRenderMagicBannerEditor(entry, unit); }
    finally { state.data.factionMagicItems = original; }
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = oldRenderRegimentEditor(entry, unit);
    if (!isLiz()) return html;
    if (unit.id === "skink_warriors") {
      const max = Math.floor(Number(entry.size || 0) / 8);
      html += `<section class="editor-section"><h3 class="editor-section-title">Skink / Kroxigor Formation</h3><div class="field-hint">At this size the regiment may contain up to ${max} Kroxigor${max === 1 ? "" : "s"}. Poisoned missiles require skirmish formation; embedded Kroxigors require rank-and-file, so the two options cannot be combined.</div></section>`;
    }
    if (entry.champion?.selected && ["saurus_cold_one_riders","great_crested_cold_one_riders"].includes(unit.id)) {
      html += `<section class="editor-section"><h3 class="editor-section-title">Champion Mount</h3><label class="check-row"><input type="checkbox" data-liz-champion-horned ${entry.lizardChampionHornedOne ? "checked" : ""}><span class="check-row-content"><span class="check-row-title"><span>Exchange Champion's Cold One for Horned One</span><span>+10 pts</span></span></span></label></section>`;
    }
    return html;
  };

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isLiz() || !state.draft) return;
    els.dialogContent.querySelector("[data-liz-champion-horned]")?.addEventListener("change", event => {
      state.draft.lizardChampionHornedOne = event.target.checked;
      updateDialogTotal();
    });
  };

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isLiz() && state.draft) {
      const entry = state.draft;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (unit?.id === "skink_warriors") {
        const kroxigors = Number(entry.optionSelections?.kroxigors || 0);
        const max = Math.floor(Number(entry.size || 0) / 8);
        if (kroxigors > max) { alert(`This regiment may include at most ${max} Kroxigor${max === 1 ? "" : "s"} at its current Skink size.`); return; }
        if (kroxigors > 0 && entry.optionSelections?.poison_missiles) { alert("Poisoned Skink missile weapons require skirmish formation, while embedded Kroxigors require rank-and-file formation. Choose one or the other."); return; }
      }
      if (!entry.champion?.selected) entry.lizardChampionHornedOne = false;
      if (entry.optionSelections?.battle_standard && otherBsbExists(entry.id)) { alert("A Lizardmen army may include only one Battle Standard Bearer."); return; }
      if (hasTag(unit, "bsb") && otherBsbExists(entry.id)) { alert("A Lizardmen army may include only one Battle Standard Bearer."); return; }
    }
    return oldSaveEditor();
  };

  const oldDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text = oldDescribeEntry(entry);
    if (!isLiz()) return text;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const bits = [];
    if (unit?.id === "skink_warriors" && Number(entry.optionSelections?.kroxigors || 0)) bits.push(`${entry.optionSelections.kroxigors} embedded Kroxigor${Number(entry.optionSelections.kroxigors) === 1 ? "" : "s"}`);
    if (entry.champion?.selected && entry.lizardChampionHornedOne) bits.push("Champion on Horned One");
    if (entry.optionSelections?.battle_standard) bits.push("Battle Standard Bearer");
    return bits.length ? `${text === "Base configuration" ? "" : text + " · "}${bits.join(" · ")}` : text;
  };

  const oldPrintedSave = calculatePrintedArmourSave;
  calculatePrintedArmourSave = function(entry, unit) {
    if (!isLiz()) return oldPrintedSave(entry, unit);
    if (unit.id === "oxayotl") return "5+";
    if (unit.id === "mazdamundi") return "4+";
    const t = tags(unit);
    let save = null;
    if (t.includes("kroxigor") || t.includes("salamander") || t.includes("stegadon")) save = 4;
    else if (t.includes("saurus")) save = 5;
    else if (t.includes("skink")) save = 6;
    if (save == null) return oldPrintedSave(entry, unit);
    const equipment = new Set(getSelectedEquipmentIds(entry, unit));
    if (equipment.has("light_armour")) save -= 1;
    if (equipment.has("shield") || entry.optionSelections?.shield || entry.optionSelections?.shields) save -= 1;
    const mounted = Boolean(entry.mount) || Boolean(unit.unitMount?.mountId) || t.includes("cavalry");
    if (mounted) save -= 1;
    const coldMount = ["cold_one","horned_one"].includes(entry.mount) || unit.unitMount?.mountId === "cold_one";
    if (coldMount) save -= 1;
    return `${Math.max(2, save)}+`;
  };

  function extraProfileRow(label, profileId, notes="") {
    const profile = profileById.get(profileId);
    if (!profile) return "";
    return `<tr class="sub-profile-row"><td class="unit-cell">↳ ${escapeHtml(label)}</td>${rosterPadProfileCells(profile)}<td class="save">–</td><td class="notes-cell">${escapeHtml(notes)}</td><td class="points-cell"></td></tr>`;
  }

  const oldRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    let html = oldRosterPadRow(entry);
    if (!isLiz()) return html;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const rows = [];
    if (unit?.id === "skink_warriors" && Number(entry.optionSelections?.kroxigors || 0)) rows.push(extraProfileRow(`${entry.optionSelections.kroxigors} Kroxigor${Number(entry.optionSelections.kroxigors) === 1 ? "" : "s"}`, "kroxigor", "Embedded in Skink regiment"));
    if (unit?.id === "stegadon") {
      const count = 4 + (entry.optionSelections?.extra_five_crew ? 5 : 0);
      rows.push(extraProfileRow(`${count} Skink Crew`, "skink_warrior", entry.optionSelections?.extra_five_crew ? "Two-tier howdah" : "Howdah crew"));
    }
    if (unit?.id === "salamander") rows.push(extraProfileRow("4 Skink Handlers", "skink_warrior", "Prodders give +1S"));
    if (entry.champion?.selected && entry.lizardChampionHornedOne) rows.push(extraProfileRow("Champion's Horned One", "horned_one", "Fear; Stupidity; +1 rider armour"));
    if (rows.length) html = html.replace("</tr>", `</tr>${rows.join("")}`);
    return html;
  };

  const oldRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    oldRenderArmyStatus(total);
    if (!isLiz()) return;
    const warnings = [];
    const bsbs = state.roster.filter(isBsbEntry);
    if (bsbs.length > 1) warnings.push("Only one Battle Standard Bearer may be included in a Lizardmen army.");
    for (const entry of state.roster.filter(e => e.unitId === "skink_warriors")) {
      const max = Math.floor(Number(entry.size || 0) / 8), krox = Number(entry.optionSelections?.kroxigors || 0);
      if (krox > max) warnings.push(`A Skink Warrior regiment has ${krox} Kroxigors but may include only ${max} at its current size.`);
      if (krox && entry.optionSelections?.poison_missiles) warnings.push("A Skink Warrior regiment cannot combine poisoned missile weapons with embedded Kroxigors.");
    }
    if (warnings.length) els.armyStatus.insertAdjacentHTML("beforeend", `<div class="warning-box">${warnings.map(escapeHtml).join("<br>")}</div>`);
  };
})();
;
/* ===== END lizardmen_extensions.js ===== */

/* ===== BEGIN lizardmen_final_fixes.js ===== */
// Small Lizardmen integration fixes that depend on the core/extensions already being loaded.
(() => {
  const isLiz = () => state.data?.faction?.id === "lizardmen" && state.selectedArmyId === "lizardmen";
  const tags = unit => unit?.tags || [];

  function patchUnitMounts() {
    if (!isLiz()) return;
    const byId = id => (state.data.faction.regiments || []).find(unit => unit.id === id);
    const coldSaurus = byId("saurus_cold_one_riders");
    const coldSkinks = byId("great_crested_cold_one_riders");
    const terradons = byId("terradon_riders");
    if (coldSaurus) coldSaurus.unitMount = {mountId:"cold_one", name:"Cold Ones"};
    if (coldSkinks) coldSkinks.unitMount = {mountId:"cold_one", name:"Cold Ones"};
    if (terradons) terradons.unitMount = {mountId:"terradon", name:"Terradons"};
  }

  const oldSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await oldSelectArmy(armyId);
    if (!isLiz()) return;
    patchUnitMounts();
    renderUnitBrowser();
    renderArmy();
  };

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isLiz() && unit?.mount) entry.mount = unit.mount;
    return entry;
  };

  const oldRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    let html = oldRenderCharacterEditor(entry, unit);
    if (!isLiz() || !tags(unit).includes("slann") || !(unit.options || []).some(option => option.id === "battle_standard")) return html;
    html += `<section class="editor-section"><h3 class="editor-section-title">Battle Standard</h3>
      <label class="check-row"><input type="checkbox" data-liz-slann-bsb ${entry.optionSelections?.battle_standard ? "checked" : ""}>
        <span class="check-row-content"><span class="check-row-title"><span>Carry the Battle Standard</span><span>+75 pts</span></span>
        <span class="check-row-sub">Only one Battle Standard Bearer may be included. If selected, one of this Mage Priest's normal magic-item slots may contain a magic banner.</span></span>
      </label></section>`;
    return html;
  };

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isLiz() || !state.draft) return;
    els.dialogContent.querySelector("[data-liz-slann-bsb]")?.addEventListener("change", event => {
      state.draft.optionSelections.battle_standard = event.target.checked;
      if (!event.target.checked) {
        state.draft.magicItems = (state.draft.magicItems || []).filter(id => getMagicItem(id)?.category !== "magic_banner");
      }
      renderEditor();
    });
  };

  const oldPrintedSave = calculatePrintedArmourSave;
  calculatePrintedArmourSave = function(entry, unit) {
    const result = oldPrintedSave(entry, unit);
    if (!isLiz() || !entry.optionSelections?.light_armour || result === "–") return result;
    const number = Number(String(result).replace("+", ""));
    return Number.isFinite(number) ? `${Math.max(2, number - 1)}+` : result;
  };
})();
;
/* ===== END lizardmen_final_fixes.js ===== */

/* ===== BEGIN ogre_mercenaries_extensions.js ===== */
// Ogre Mercenaries faction behaviour: allied tribes, Beastmaster packs and list-construction rules.
(() => {
  const ARMY_ID="ogre_mercenaries";
  const isOgre=()=>state.data?.faction?.id===ARMY_ID && state.selectedArmyId===ARMY_ID;
  const tags=u=>u?.tags||[];
  const has=(u,t)=>tags(u).includes(t);
  const tribe=()=>state.armyOptions?.ogreAllyTribe||"";
  const isAlly=u=>has(u,"ogre_ally");
  const isNativeOgreRegiment=u=>has(u,"ogre")&&!isAlly(u);
  const goblinTribes=new Set(["common_goblins","forest_goblins","night_goblins"]);

  function visibleForTribe(unit){ return !isAlly(unit) || unit.ogreAllyTribe===tribe(); }
  function withFilteredFaction(fn){
    const f=state.data?.faction;if(!f)return fn();
    const saved={characters:f.characters,regiments:f.regiments,warMachines:f.warMachines,specialCharacters:f.specialCharacters};
    f.characters=saved.characters.filter(visibleForTribe);f.regiments=saved.regiments.filter(visibleForTribe);f.warMachines=saved.warMachines.filter(visibleForTribe);
    try{return fn();}finally{Object.assign(f,saved);}
  }

  // WHR core command rules: monstrous regiments receive a musician for free,
  // may buy a standard bearer for 10 pts, and a regiment with a standard may
  // carry a magic banner unless its army-book entry specifically forbids it.
  function patchNativeOgreCommand(){
    for(const unit of state.data?.faction?.regiments||[]){
      if(!isNativeOgreRegiment(unit))continue;
      unit.command={...(unit.command||{}),useGlobalDefaults:true};
      unit.magicBanner={...(unit.magicBanner||{}),allowed:true};
    }
  }

  const oldSelectArmy=selectArmy;
  selectArmy=async function(armyId){
    await oldSelectArmy(armyId);
    if(!isOgre())return;
    state.armyOptions=state.armyOptions||{};
    state.armyOptions.ogreAllyTribe=state.armyOptions.ogreAllyTribe||"";
    patchNativeOgreCommand();
    renderUnitBrowser();renderArmy();
  };

  const oldRenderUnitBrowser=renderUnitBrowser;
  renderUnitBrowser=function(){ if(!isOgre())return oldRenderUnitBrowser(); return withFilteredFaction(()=>oldRenderUnitBrowser()); };

  const oldCreateEntry=createEntry;
  createEntry=function(sectionKey,unit){
    const entry=oldCreateEntry(sectionKey,unit);
    if(!isOgre())return entry;
    if(unit?.id==="ogre_beastmaster_pack"){
      entry.optionSelections=entry.optionSelections||{};
      entry.optionSelections.beastmasters=1;entry.optionSelections.sabretooths=1;
    }
    return entry;
  };

  function zeroOne(unit){return Number(unit?.selection?.maximum||0)===1||has(unit,"zero_one");}
  function hasTribeRegiment(which){return state.roster.some(e=>e.sectionKey==="regiments"&&getUnit(e.sectionKey,e.unitId)?.ogreAllyTribe===which);}
  function requiresTribeRegiment(unit){
    if(!isAlly(unit))return false;
    if(goblinTribes.has(unit.ogreAllyTribe))return true;
    if(unit.ogreAllyTribe==="hobgoblins"&&(unit.ogreAllyRequiresRegiment||has(unit,"requires_hobgoblin_regiment")))return true;
    return Boolean(unit.ogreAllyRequiresRegiment);
  }

  const oldAddUnit=addUnit;
  addUnit=function(sectionKey,unitId){
    if(!isOgre())return oldAddUnit(sectionKey,unitId);
    const unit=getUnit(sectionKey,unitId);if(!unit)return;
    if(zeroOne(unit)&&state.roster.some(e=>e.unitId===unitId)){alert(`${unit.name} may only be included once.`);return;}
    if(isAlly(unit)&&unit.ogreAllyTribe!==tribe()){alert("Choose that allied tribe before adding this unit.");return;}
    if(isAlly(unit)&&requiresTribeRegiment(unit)&&sectionKey!=="regiments"&&!hasTribeRegiment(unit.ogreAllyTribe)){
      alert(`Add a ${unit.ogreAllyTribe.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())} regiment before this character, chariot or war machine.`);return;
    }
    return oldAddUnit(sectionKey,unitId);
  };

  const oldCalculateEntry=calculateEntry;
  calculateEntry=function(entry){
    let total=oldCalculateEntry(entry);if(!isOgre())return total;
    const unit=getUnit(entry.sectionKey,entry.unitId);if(!unit)return total;
    if(unit.id==="ogre_beastmaster_pack"){
      const models=Math.max(0,Number(entry.optionSelections?.beastmasters||0))*30 + Math.max(0,Number(entry.optionSelections?.sabretooths||0))*20;
      // oldCalculateEntry contributes command and magic-banner costs; the pack's
      // own model cost is maintained by the mixed-pack controls above.
      return models+total;
    }
    return total;
  };

  const oldRenderRegimentEditor=renderRegimentEditor;
  renderRegimentEditor=function(entry,unit){
    if(!isOgre()||unit.id!=="ogre_beastmaster_pack")return oldRenderRegimentEditor(entry,unit);
    let html=`<section class="editor-section"><h3 class="editor-section-title">Beastmaster Pack</h3>
      <div class="field-hint">0–1 pack. Ogre Beastmasters cost 30 pts each; Sabretooth Tigers cost 20 pts each.</div>
      <div class="dialog-field"><label>Ogre Beastmasters</label><input type="number" min="1" step="1" value="${Number(entry.optionSelections?.beastmasters||1)}" data-ogre-beastmasters></div>
      <div class="dialog-field"><label>Sabretooth Tigers</label><input type="number" min="1" step="1" value="${Number(entry.optionSelections?.sabretooths||1)}" data-ogre-sabretooths></div>
      <div class="dialog-note">Sabretooth Tigers cause fear and may take manoeuvres as though they have a musician.</div></section>`;
    html+=renderCommandEditor(entry,unit);
    if(entry.command?.standardBearer&&unit.magicBanner?.allowed)html+=renderMagicBannerEditor(entry,unit);
    return html;
  };

  const oldWire=wireEditorControls;
  wireEditorControls=function(){
    oldWire();if(!isOgre()||!state.draft)return;
    els.dialogContent.querySelector("[data-ogre-beastmasters]")?.addEventListener("input",e=>{state.draft.optionSelections.beastmasters=Math.max(1,Number(e.target.value||1));updateDialogTotal();});
    els.dialogContent.querySelector("[data-ogre-sabretooths]")?.addEventListener("input",e=>{state.draft.optionSelections.sabretooths=Math.max(1,Number(e.target.value||1));updateDialogTotal();});
  };

  const oldSave=saveEditor;
  saveEditor=function(){
    if(isOgre()&&state.draft){const u=getUnit(state.draft.sectionKey,state.draft.unitId);if(u?.id==="ogre_beastmaster_pack"&&(Number(state.draft.optionSelections?.beastmasters||0)<1||Number(state.draft.optionSelections?.sabretooths||0)<1)){alert("The Beastmaster pack must include at least one Ogre Beastmaster and one Sabretooth Tiger.");return;}}
    return oldSave();
  };

  function ogItemAllowedForTribe(item,unit){
    if(unit?.ogreAllySource!=="orcs_goblins"||item?.ogreAllySource!=="orcs_goblins")return true;
    const text=String(item.rules||"").toLowerCase();
    const tr=unit.ogreAllyTribe;
    if(text.includes("common orc")||text.includes("black orc")||text.includes("savage orc")||text.includes("orc infantry"))return false;
    if(text.includes("common goblin"))return tr==="common_goblins";
    if(text.includes("forest goblin"))return tr==="forest_goblins";
    if(text.includes("night goblin"))return tr==="night_goblins";
    return true;
  }

  const oldMagic=getAllowedMagicItems;
  getAllowedMagicItems=function(unit,context){
    let items=oldMagic(unit,context);if(!isOgre())return items;
    if(isAlly(unit)){
      const source=unit.ogreAllySource;
      return items
        .filter(item=>!item.ogreAllySource || item.ogreAllySource===source)
        .filter(item=>!["iron_boot","iron_fist","smuckle_buckle"].includes(item.id))
        .filter(item=>ogItemAllowedForTribe(item,unit));
    }
    return items.filter(item=>!item.ogreAllySource);
  };

  const oldBanner=renderMagicBannerEditor;
  renderMagicBannerEditor=function(entry,unit){
    if(!isOgre())return oldBanner(entry,unit);
    const common=state.data.commonMagicItems, faction=state.data.factionMagicItems;
    if(isAlly(unit)){
      state.data.factionMagicItems=faction.filter(item=>item.ogreAllySource===unit.ogreAllySource&&ogItemAllowedForTribe(item,unit));
    }else{
      // Native Ogres have no Ogre-specific magic-banner section. Keep the
      // common banner pool, but do not leak imported allied-race banners.
      state.data.factionMagicItems=faction.filter(item=>!item.ogreAllySource);
    }
    try{return oldBanner(entry,unit);}finally{state.data.commonMagicItems=common;state.data.factionMagicItems=faction;}
  };

  function nativeOgrePoints(){return state.roster.reduce((sum,e)=>{const u=getUnit(e.sectionKey,e.unitId);return sum+(!isAlly(u)?calculateEntry(e):0);},0);}
  function limitedChoiceCount(which){
    return state.roster.reduce((count,e)=>{
      const u=getUnit(e.sectionKey,e.unitId);if(!u||u.ogreAllyTribe!==which)return count;
      if(e.sectionKey==="warMachines"&&["common_goblins","hobgoblins","halflings"].includes(which))return count+1;
      if(which==="common_goblins"&&e.mount==="ogally_orcs_goblins_goblin_wolf_chariot_character")return count+1;
      return count;
    },0);
  }
  function invalidAllyEntries(){return state.roster.filter(e=>{const u=getUnit(e.sectionKey,e.unitId);return isAlly(u)&&u.ogreAllyTribe!==tribe();});}
  function missingRegimentEntries(){return state.roster.filter(e=>{const u=getUnit(e.sectionKey,e.unitId);return u&&isAlly(u)&&requiresTribeRegiment(u)&&e.sectionKey!=="regiments"&&!hasTribeRegiment(u.ogreAllyTribe);});}

  const oldStatus=renderArmyStatus;
  renderArmyStatus=function(total){
    oldStatus(total);if(!isOgre())return;
    const labels={"":"No allied tribe","common_goblins":"Common Goblins","forest_goblins":"Forest Goblins","night_goblins":"Night Goblins","hobgoblins":"Hobgoblins","halflings":"Halflings"};
    const warnings=[];
    if(!state.roster.some(e=>e.sectionKey==="regiments"&&has(getUnit(e.sectionKey,e.unitId),"ogre_core")))warnings.push("The army must include at least one native regiment of Ogres, Ogre Maneaters or Ogre Lead-belchers.");
    if(!state.roster.some(e=>e.sectionKey==="characters"&&has(getUnit(e.sectionKey,e.unitId),"ogre")&&!has(getUnit(e.sectionKey,e.unitId),"bsb")))warnings.push("The army General must be an Ogre character.");
    const allowance=Math.floor(nativeOgrePoints()/1000), selectedTribe=tribe(), limited=["common_goblins","hobgoblins","halflings"].includes(selectedTribe)?limitedChoiceCount(selectedTribe):0;
    if(limited>allowance)warnings.push(`Only ${allowance} ${labels[selectedTribe]||"allied"} war machine/chariot${allowance===1?"":"s"} may be included at the current native Ogre points total; ${limited} selected.`);
    if(missingRegimentEntries().length)warnings.push("An allied Goblin/Hobgoblin character, chariot or war machine is present without the required regiment of its own type.");
    if(invalidAllyEntries().length)warnings.push("The roster contains units from an allied tribe other than the currently selected tribe.");
    els.armyStatus.insertAdjacentHTML("beforeend",`<div class="warning-box" style="margin-top:10px"><strong>Allied Tribe</strong><div class="dialog-field" style="margin-top:6px"><select data-ogre-ally-tribe>${Object.entries(labels).map(([v,l])=>`<option value="${v}" ${tribe()===v?"selected":""}>${l}</option>`).join("")}</select></div><div class="field-hint">Choose at most one tribe. Goblin tribes include their Shamans. Common Goblins, Hobgoblins and Halflings may also take their specified chariot/war-machine choices at one per full 1,000 native Ogre points. Allied characters use their own army-book magic items, never Ogre items.</div>${warnings.length?`<div style="margin-top:8px">${warnings.map(escapeHtml).join("<br>")}</div>`:""}</div>`);
    els.armyStatus.querySelector("[data-ogre-ally-tribe]")?.addEventListener("change",e=>{state.armyOptions.ogreAllyTribe=e.target.value;renderUnitBrowser();renderArmy();});
  };

  function extraRow(label,profileId,notes=""){
    const p=profileById.get(profileId);if(!p)return"";return `<tr class="sub-profile-row"><td class="unit-cell">↳ ${escapeHtml(label)}</td>${rosterPadProfileCells(p)}<td class="save">–</td><td class="notes-cell">${escapeHtml(notes)}</td><td class="points-cell"></td></tr>`;
  }
  const oldPad=rosterPadRow;
  rosterPadRow=function(entry){
    let html=oldPad(entry);if(!isOgre())return html;const u=getUnit(entry.sectionKey,entry.unitId);const rows=[];
    if(u?.id==="ogre_beastmaster_pack")rows.push(extraRow(`${entry.optionSelections?.sabretooths||0} Sabretooth Tiger${Number(entry.optionSelections?.sabretooths||0)===1?"":"s"}`,"sabretooth_tiger","Fear; beastmaster pack"));
    if(u?.id==="rhino_rider")rows.push(extraRow("Rhino","rhino","Fear; heavy-chariot style mount"));
    if(entry.mount==="ogally_orcs_goblins_goblin_wolf_chariot_character"){
      rows.push(extraRow("2 Giant Wolves","ogally_orcs_goblins_giant_wolf","Pull the Wolf Chariot"));
      rows.push(extraRow("2 Common Goblin crew","ogally_orcs_goblins_common_goblin","Wolf Chariot crew"));
    }
    return rows.length?html.replace("</tr>",`</tr>${rows.join("")}`):html;
  };
})();
;
/* ===== END ogre_mercenaries_extensions.js ===== */

/* ===== BEGIN ogre_mercenaries_final_fixes.js ===== */
// Completes Ogre allied-tribe entries that are absent from the current O&G dataset,
// and enforces the Ogre-list-specific allied magic restrictions.
(() => {
  const isOgre = () => state.data?.faction?.id === "ogre_mercenaries" && state.selectedArmyId === "ogre_mercenaries";
  const allyTags = tribe => ["ogre_ally", `ogre_ally_${tribe}`, "ogre_ally_source_orcs_goblins"];
  const P = "ogre_ally_";

  function addUnique(list, value) {
    if (!list.some(x => x.id === value.id)) list.push(value);
  }

  function goblinChampion(name, profileId) {
    return {
      name,
      profileId,
      cost: {base:10, add:{type:"unit_model_cost"}},
      magicItems: {max:1}
    };
  }

  function patchData() {
    if (!isOgre() || state.data.__ogreFinalPatched) return;
    const data = state.data;
    const faction = data.faction;

    // Ogre-allied Halflings explicitly do NOT use Liberated Magic.
    // Hobgoblins use the O&G pool which the Chaos Dwarf dataset exposes with og_ IDs,
    // not Chaos Dwarf items or Daemonic Rewards.
    data.factionMagicItems = (data.factionMagicItems || []).filter(item => {
      if (item.ogreAllySource === "halflings_moot") return false;
      if (item.ogreAllySource === "chaos_dwarfs") return item.id.startsWith("ogally_chaos_dwarfs_og_");
      return true;
    });

    const profiles = [
      {id:P+"forest_goblin",name:"Forest Goblin",stats:{M:4,WS:2,BS:3,S:3,T:3,W:1,I:2,A:1,Ld:5}},
      {id:P+"forest_goblin_champion",name:"Forest Goblin Champion",stats:{M:4,WS:3,BS:4,S:4,T:3,W:1,I:3,A:2,Ld:5}},
      {id:P+"night_goblin",name:"Night Goblin",stats:{M:4,WS:2,BS:3,S:3,T:3,W:1,I:2,A:1,Ld:5}},
      {id:P+"night_goblin_champion",name:"Night Goblin Champion",stats:{M:4,WS:3,BS:4,S:4,T:3,W:1,I:3,A:2,Ld:5}},
      {id:P+"night_goblin_fanatic",name:"Night Goblin Fanatic",stats:{M:"2D6",WS:2,BS:3,S:5,T:3,W:1,I:1,A:"1D6",Ld:5}},
      {id:P+"cave_squig",name:"Cave Squig",stats:{M:"2D6",WS:4,BS:0,S:5,T:3,W:1,I:5,A:2,Ld:2}}
    ];
    profiles.forEach(p => addUnique(data.profiles, p));

    const eq = [
      {id:P+"spear",name:"Spear",type:"melee_weapon"},
      {id:P+"double_handed_weapon",name:"Double Handed Weapon",type:"melee_weapon"},
      {id:P+"short_bow",name:"Short Bow",type:"missile_weapon"},
      {id:P+"shield",name:"Shield",type:"armour"},
      {id:P+"prodder",name:"Prodder (Spear)",type:"melee_weapon"},
      {id:P+"nets_clubs",name:"Nets and Clubs",type:"melee_weapon"}
    ];
    eq.forEach(e => addUnique(data.equipment, e));

    const forest = {
      id:P+"forest_goblin_infantry",
      name:"Forest Goblin Infantry — Allied",
      profileId:P+"forest_goblin",
      unitType:"infantry",
      points:{type:"per_model",value:2.5}, size:{minimum:5},
      tags:allyTags("forest_goblins"), ogreAllyTribe:"forest_goblins", ogreAllySource:"orcs_goblins",
      options:[
        {id:"weapon",type:"choice_group",choices:[
          {id:P+"spear",label:"Spears",cost:{type:"per_model",value:0.5},addsEquipment:[P+"spear"]},
          {id:P+"double_handed_weapon",label:"Double Handed Weapons",cost:{type:"per_model",value:2},addsEquipment:[P+"double_handed_weapon"]},
          {id:P+"short_bow",label:"Short Bows",cost:{type:"per_model",value:1},addsEquipment:[P+"short_bow"]}
        ]},
        {id:"shields",type:"toggle",cost:{type:"per_model",value:0.5},addsEquipment:[P+"shield"],rules:"Not available if armed with short bows."}
      ],
      champion:goblinChampion("Forest Goblin Champion",P+"forest_goblin_champion"),
      magicBanner:{allowed:true},
      rules:["Fear Elves unless they outnumber them two-to-one.","May traverse woods without movement reduction.","Ogre ally: the Forest Goblin poisoned-arrow army upgrade is not available."]
    };

    const nightInfantry = {
      id:P+"night_goblin_infantry",
      name:"Night Goblin Infantry — Allied",
      profileId:P+"night_goblin",
      unitType:"infantry",
      points:{type:"per_model",value:2.5}, size:{minimum:5},
      tags:allyTags("night_goblins"), ogreAllyTribe:"night_goblins", ogreAllySource:"orcs_goblins",
      options:[
        {id:"weapon",type:"choice_group",choices:[
          {id:P+"spear",label:"Spears",cost:{type:"per_model",value:0.5},addsEquipment:[P+"spear"]},
          {id:P+"double_handed_weapon",label:"Double Handed Weapons",cost:{type:"per_model",value:2},addsEquipment:[P+"double_handed_weapon"]},
          {id:P+"short_bow",label:"Short Bows",cost:{type:"per_model",value:1},addsEquipment:[P+"short_bow"]}
        ]},
        {id:"fanatics",type:"quantity",minimum:0,maximum:3,cost:{type:"fixed",value:30},rules:"Hidden Night Goblin Fanatics. Fanatic points do not count toward the 50-point regiment-model minimum."},
        {id:"mad_cap_mushroom",type:"toggle",cost:20,rules:"One Fanatic in the army may have a Mad Cap Mushroom; requires at least one Fanatic."},
        {id:"shields",type:"toggle",cost:{type:"per_model",value:0.5},addsEquipment:[P+"shield"],rules:"Not available if armed with short bows."}
      ],
      champion:goblinChampion("Night Goblin Champion",P+"night_goblin_champion"),
      magicBanner:{allowed:true},
      rules:["Fear Elves unless they outnumber them two-to-one.","Hate Dwarfs, but not Chaos Dwarfs.","May conceal up to three Night Goblin Fanatics."]
    };

    const hoppers = {
      id:P+"night_goblin_squig_hoppers",
      name:"Night Goblin Squig-Hoppers — Allied",
      profileId:P+"cave_squig",
      unitType:"infantry",
      points:{type:"per_model",value:25}, size:{minimum:2},
      tags:[...allyTags("night_goblins"),"skirmisher"], ogreAllyTribe:"night_goblins", ogreAllySource:"orcs_goblins",
      command:{musician:{allowed:false},standardBearer:{allowed:false}},
      rules:["No characters may join.","Immune to psychology; no animosity.","Deploy together, then each model acts independently.","Compulsory 2D6 bounce movement; use the Cave Squig profile because the rider does not fight."]
    };

    const hunters = {
      id:P+"night_goblin_squig_hunters",
      name:"Night Goblin Squig-Hunters — Allied",
      profileId:P+"night_goblin",
      unitType:"infantry",
      points:{type:"fixed",value:0},
      tags:allyTags("night_goblins"), ogreAllyTribe:"night_goblins", ogreAllySource:"orcs_goblins",
      command:{musician:{allowed:false},standardBearer:{allowed:false}},
      rules:["Mixed regiment: 6 pts per Night Goblin and 12 pts per Cave Squig.","At least one Night Goblin is required per three Cave Squigs.","No characters, standard, musician or champion may join.","Night Goblins carry prodders (spears); rank-and-file Cave Squigs are unbreakable and may go wild if handlers flee or are lost."]
    };

    const netters = {
      id:P+"night_goblin_netters_clubbers",
      name:"Night Goblin Netters and Clubbers — Allied",
      profileId:P+"night_goblin",
      unitType:"infantry",
      points:{type:"per_model",value:6}, size:{minimum:5},
      equipment:[P+"nets_clubs"],
      tags:allyTags("night_goblins"), ogreAllyTribe:"night_goblins", ogreAllySource:"orcs_goblins",
      champion:goblinChampion("Night Goblin Champion",P+"night_goblin_champion"),
      magicBanner:{allowed:true},
      rules:["Nets and clubs count as double handed weapons, but strike first regardless of the normal double-handed-weapon strike-last rule.","Fear Elves unless they outnumber them two-to-one; hate Dwarfs but not Chaos Dwarfs."]
    };

    [forest,nightInfantry,hoppers,hunters,netters].forEach(unit => addUnique(faction.regiments, unit));
    data.__ogreFinalPatched = true;
    buildIndexes();
  }

  const oldSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await oldSelectArmy(armyId);
    if (!isOgre()) return;
    patchData();
    renderUnitBrowser(); renderArmy();
  };

  const oldLoadRoster = loadRoster;
  loadRoster = async function(id) {
    const result = await oldLoadRoster(id);
    if (isOgre()) { patchData(); renderUnitBrowser(); renderArmy(); }
    return result;
  };

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (!isOgre()) return entry;
    if (unit?.id === P+"night_goblin_squig_hunters") {
      entry.optionSelections = entry.optionSelections || {};
      entry.optionSelections.night_goblins = 5;
      entry.optionSelections.cave_squigs = 2;
    }
    return entry;
  };

  const oldCalculate = calculateEntry;
  calculateEntry = function(entry) {
    if (!isOgre()) return oldCalculate(entry);
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (unit?.id === P+"night_goblin_squig_hunters") {
      return 6 * Math.max(0, Number(entry.optionSelections?.night_goblins || 0)) + 12 * Math.max(0, Number(entry.optionSelections?.cave_squigs || 0));
    }
    return oldCalculate(entry);
  };

  const oldRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isOgre() || unit.id !== P+"night_goblin_squig_hunters") return oldRegimentEditor(entry, unit);
    return `<section class="editor-section"><h3 class="editor-section-title">Squig-Hunter Pack</h3>
      <div class="field-hint">6 pts per Night Goblin; 12 pts per Cave Squig. At least one Night Goblin is required for every three Cave Squigs.</div>
      <div class="dialog-field"><label>Night Goblin handlers</label><input type="number" min="1" step="1" value="${Number(entry.optionSelections?.night_goblins || 5)}" data-ogre-night-handlers></div>
      <div class="dialog-field"><label>Cave Squigs</label><input type="number" min="1" step="1" value="${Number(entry.optionSelections?.cave_squigs || 2)}" data-ogre-cave-squigs></div>
      <div class="dialog-note">No standard, musician, champion or joined characters.</div></section>`;
  };

  const oldWire = wireEditorControls;
  wireEditorControls = function() {
    oldWire();
    if (!isOgre() || !state.draft) return;
    els.dialogContent.querySelector("[data-ogre-night-handlers]")?.addEventListener("input", e => { state.draft.optionSelections.night_goblins = Math.max(1, Number(e.target.value || 1)); updateDialogTotal(); });
    els.dialogContent.querySelector("[data-ogre-cave-squigs]")?.addEventListener("input", e => { state.draft.optionSelections.cave_squigs = Math.max(1, Number(e.target.value || 1)); updateDialogTotal(); });
  };

  const oldSave = saveEditor;
  saveEditor = function() {
    if (isOgre() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (unit?.id === P+"night_goblin_squig_hunters") {
        const ng = Number(state.draft.optionSelections?.night_goblins || 0), sq = Number(state.draft.optionSelections?.cave_squigs || 0);
        if (ng < 1 || sq < 1 || sq > ng * 3) { alert("Squig-Hunters require at least one Night Goblin per three Cave Squigs."); return; }
        if (ng * 6 + sq * 12 < 50) { alert("A Squig-Hunter regiment must contain at least 50 points of models."); return; }
      }
      if (unit?.id === P+"night_goblin_infantry") {
        const fanatics = Number(state.draft.optionSelections?.fanatics || 0);
        if (state.draft.optionSelections?.mad_cap_mushroom && fanatics < 1) { alert("A Mad Cap Mushroom requires at least one hidden Fanatic."); return; }
        if (state.draft.optionSelections?.mad_cap_mushroom && state.roster.some(e => e.id !== state.draft.id && e.optionSelections?.mad_cap_mushroom)) { alert("Only one Night Goblin Fanatic in the army may have a Mad Cap Mushroom."); return; }
        if (state.draft.optionSelections?.shields && state.draft.optionSelections?.weapon === P+"short_bow") { alert("Night Goblins with short bows cannot also take shields."); return; }
      }
      if (unit?.id === P+"forest_goblin_infantry" && state.draft.optionSelections?.shields && state.draft.optionSelections?.weapon === P+"short_bow") { alert("Forest Goblins with short bows cannot also take shields."); return; }
    }
    return oldSave();
  };

  function profileRow(label, profileId, notes="") {
    const p = profileById.get(profileId); if (!p) return "";
    return `<tr class="sub-profile-row"><td class="unit-cell">↳ ${escapeHtml(label)}</td>${rosterPadProfileCells(p)}<td class="save">–</td><td class="notes-cell">${escapeHtml(notes)}</td><td class="points-cell"></td></tr>`;
  }
  const oldPad = rosterPadRow;
  rosterPadRow = function(entry) {
    let html = oldPad(entry); if (!isOgre()) return html;
    const unit = getUnit(entry.sectionKey, entry.unitId); const rows=[];
    if (unit?.id === P+"night_goblin_squig_hunters") rows.push(profileRow(`${entry.optionSelections?.cave_squigs || 0} Cave Squigs`,P+"cave_squig","Mixed Squig-Hunter regiment"));
    if (unit?.id === P+"night_goblin_infantry" && Number(entry.optionSelections?.fanatics || 0)) rows.push(profileRow(`${entry.optionSelections.fanatics} Night Goblin Fanatic${Number(entry.optionSelections.fanatics)===1?"":"s"}`,P+"night_goblin_fanatic",entry.optionSelections?.mad_cap_mushroom?"One has Mad Cap Mushroom":"Hidden Fanatics"));
    return rows.length ? html.replace("</tr>",`</tr>${rows.join("")}`) : html;
  };
})();
;
/* ===== END ogre_mercenaries_final_fixes.js ===== */

/* ===== BEGIN ogre_mercenaries_guard.js ===== */
// Final construction and magic-pool guards for Ogre Mercenaries.
(() => {
  const isOgre = () => state.data?.faction?.id === "ogre_mercenaries" && state.selectedArmyId === "ogre_mercenaries";
  const tags = unit => unit?.tags || [];
  const isAlly = unit => tags(unit).includes("ogre_ally");
  const isBsb = unit => tags(unit).includes("bsb") || tags(unit).includes("battle_standard_bearer") || /battle standard|\bbsb\b/i.test(unit?.name || "");
  const isWizard = unit => Boolean(unit?.wizard) || tags(unit).includes("wizard") || tags(unit).includes("shaman") || /wizard|shaman|sorcer/i.test(unit?.name || "") || Number(unit?.wizardLevel || 0) > 0;
  const nativePoints = () => state.roster.reduce((sum, entry) => {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return sum + (unit && !isAlly(unit) ? calculateEntry(entry) : 0);
  }, 0);

  function limitedChoiceCount(tribe, excludeEntryId=null) {
    return state.roster.reduce((count, entry) => {
      if (entry.id === excludeEntryId) return count;
      const unit = getUnit(entry.sectionKey, entry.unitId);
      if (!unit || unit.ogreAllyTribe !== tribe) return count;
      if (entry.sectionKey === "warMachines" && ["common_goblins","hobgoblins","halflings"].includes(tribe)) return count + 1;
      if (tribe === "common_goblins" && entry.mount === "ogally_orcs_goblins_goblin_wolf_chariot_character") return count + 1;
      return count;
    }, 0);
  }

  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isOgre()) return oldAddUnit(sectionKey, unitId);
    const unit = getUnit(sectionKey, unitId);
    if (!unit) return;

    if (isBsb(unit) && state.roster.some(entry => isBsb(getUnit(entry.sectionKey, entry.unitId)))) {
      alert("An Ogre Mercenaries army may include only one Battle Standard Bearer, and it must be an Ogre.");
      return;
    }

    if (sectionKey === "warMachines" && isAlly(unit) && ["common_goblins","hobgoblins","halflings"].includes(unit.ogreAllyTribe)) {
      const allowance = Math.floor(nativePoints() / 1000);
      if (limitedChoiceCount(unit.ogreAllyTribe) >= allowance) {
        alert(`You may include one ${unit.ogreAllyTribe.replaceAll("_"," ")} war machine or chariot for each full 1,000 points of models in the Ogre army. Current allowance: ${allowance}.`);
        return;
      }
    }

    return oldAddUnit(sectionKey, unitId);
  };

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isOgre() && state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (unit?.ogreAllyTribe === "common_goblins" && state.draft.mount === "ogally_orcs_goblins_goblin_wolf_chariot_character") {
        const allowance = Math.floor(nativePoints() / 1000);
        if (limitedChoiceCount("common_goblins", state.draft.id) >= allowance) {
          alert(`A Common Goblin Wolf Chariot uses the same allied chariot/war-machine allowance. Current allowance: ${allowance}.`);
          return;
        }
      }
    }
    return oldSaveEditor();
  };

  function sourceBearerAllows(item, unit) {
    if (unit.ogreAllySource !== "orcs_goblins") return true;
    const text = `${item.name || ""} ${item.rules || ""}`.toLowerCase();
    const tribe = unit.ogreAllyTribe;
    if (text.includes("common goblin") && tribe !== "common_goblins") return false;
    if (text.includes("forest goblin") && tribe !== "forest_goblins") return false;
    if (text.includes("night goblin") && tribe !== "night_goblins") return false;
    if (text.includes("common orc") || text.includes("black orc") || text.includes("orc only")) return false;
    if ((text.includes("shaman only") || text.includes("shamans only")) && !isWizard(unit)) return false;
    return true;
  }

  // Imported allied units have namespaced item IDs. The older O&G character data
  // uses magicItemLimit rather than a magicItems object, so support both schemas.
  const oldAllowedMagic = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const base = oldAllowedMagic(unit, context);
    if (!isOgre() || !isAlly(unit)) return base;

    let settings = context === "champion" ? unit.champion?.magicItems : unit.magicItems;
    const legacyLimit = context === "character" && Number(unit.magicItemLimit || 0) > 0;
    if (!settings && legacyLimit) settings = {allowedCategories:["magic_weapon","magic_armour","enchanted_item"]};
    if (!settings) return base;

    const categories = new Set(settings.allowedCategories || ["magic_weapon","magic_armour","enchanted_item","arcane_item","familiar"]);
    if (!isWizard(unit)) { categories.delete("arcane_item"); categories.delete("familiar"); }

    const sourceItems = (state.data.factionMagicItems || []).filter(item =>
      item.ogreAllySource === unit.ogreAllySource && categories.has(item.category) && sourceBearerAllows(item, unit)
    );
    const commonItems = legacyLimit ? (state.data.commonMagicItems || []).filter(item => categories.has(item.category)) : [];

    const byId = new Map(base.filter(item => categories.has(item.category)).map(item => [item.id,item]));
    for (const item of commonItems) byId.set(item.id,item);
    for (const item of sourceItems) byId.set(item.id,item);
    return [...byId.values()].filter(item => !["iron_boot","iron_fist","smuckle_buckle"].includes(item.id));
  };
})();
;
/* ===== END ogre_mercenaries_guard.js ===== */

/* ===== BEGIN kislev_extensions.js ===== */
// Kislev-specific construction, editor, magic-item and Roster Pad behaviour.
(() => {
  const ARMY_ID = "kislev";
  const isKislev = () => state.selectedArmyId === ARMY_ID && state.data?.faction?.id === ARMY_ID;
  const hasTag = (unit, tag) => (unit?.tags || []).includes(tag);
  const specialTriad = new Set(["tzarina_katarin", "boris_ursus", "igor_terrible"]);
  const forcedItems = {
    tzarina_katarin: "fearfrost",
    boris_ursus: "shard_blade",
    tzar_saltan: "black_blade",
    ilja_murova: "wyrmslayer_sword",
    igor_terrible: "bloodedge"
  };

  // A few named characters have a steed included in their listed points and may
  // swap it for another mount. Expose the included steed as a free editor option
  // so editing the character cannot accidentally drop the compulsory base mount.
  function ensureIncludedSpecialMounts() {
    if (!isKislev()) return;
    for (const unit of state.data.faction.specialCharacters || []) {
      if (!unit.mount || !(unit.mountOptions || []).length) continue;
      if (!unit.mountOptions.some(option => option.mountId === unit.mount)) {
        unit.mountOptions.unshift({ mountId: unit.mount, cost: 0, includedMount: true });
      }
    }
  }

  const oldSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await oldSelectArmy(armyId);
    if (!isKislev()) return;
    ensureIncludedSpecialMounts();
    renderUnitBrowser();
    renderArmy();
  };

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (!isKislev()) return entry;
    if (sectionKey === "specialCharacters" && unit?.mount) entry.mount = unit.mount;
    if (unit?.id === "beasts_beastmasters") {
      entry.optionSelections = entry.optionSelections || {};
      entry.optionSelections.beastmasters = 1;
      entry.optionSelections.beastType = "bears";
      entry.optionSelections.beasts = 3;
    }
    return entry;
  };

  function maxOne(unit) {
    return Number(unit?.selection?.maximum || 0) === 1 || hasTag(unit, "zero_one");
  }

  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isKislev()) return oldAddUnit(sectionKey, unitId);
    const unit = getUnit(sectionKey, unitId);
    if (!unit) return;
    if (maxOne(unit) && state.roster.some(e => e.unitId === unitId)) {
      alert(`${unit.name} may only be included once.`);
      return;
    }
    if (specialTriad.has(unitId) && state.roster.some(e => specialTriad.has(e.unitId))) {
      alert("Tzarina Katarin, Boris Ursus and Igor the Terrible may not be fielded together.");
      return;
    }
    if (unitId === "prince_radinov" && !state.roster.some(e => e.unitId === "gryphon_legion")) {
      alert("Prince Ivan Radinov may only be fielded if the army includes Gryphon Legion.");
      return;
    }
    return oldAddUnit(sectionKey, unitId);
  };

  const oldCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = oldCalculateEntry(entry);
    if (!isKislev()) return total;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit) return total;
    if (unit.id === "beasts_beastmasters") {
      const masters = Math.max(1, Number(entry.optionSelections?.beastmasters || 1));
      const beasts = Math.max(1, Number(entry.optionSelections?.beasts || 1));
      const beastCost = entry.optionSelections?.beastType === "wolves" ? 10 : 15;
      return masters * 12 + beasts * beastCost;
    }
    return total;
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isKislev() || unit.id !== "beasts_beastmasters") return oldRenderRegimentEditor(entry, unit);
    const type = entry.optionSelections?.beastType || "bears";
    return `<section class="editor-section"><h3 class="editor-section-title">Beasts and Beastmasters</h3>
      <div class="dialog-note">0–1 regiment. Choose Bears or Giant Wolves, led by unarmoured Beastmasters. No musician, standard bearer or champion.</div>
      <div class="dialog-field"><label>Beastmasters (12 pts each)</label><input type="number" min="1" step="1" value="${Number(entry.optionSelections?.beastmasters || 1)}" data-kislev-beastmasters></div>
      <div class="dialog-field"><label>Beast type</label><select data-kislev-beast-type><option value="bears" ${type === "bears" ? "selected" : ""}>Bears (15 pts each)</option><option value="wolves" ${type === "wolves" ? "selected" : ""}>Giant Wolves (10 pts each)</option></select></div>
      <div class="dialog-field"><label>Beasts</label><input type="number" min="1" step="1" value="${Number(entry.optionSelections?.beasts || 3)}" data-kislev-beasts></div>
    </section>`;
  };

  const oldWire = wireEditorControls;
  wireEditorControls = function() {
    oldWire();
    if (!isKislev() || !state.draft) return;
    const set = (key, value) => { state.draft.optionSelections = state.draft.optionSelections || {}; state.draft.optionSelections[key] = value; updateDialogTotal(); };
    els.dialogContent.querySelector("[data-kislev-beastmasters]")?.addEventListener("input", e => set("beastmasters", Math.max(1, Number(e.target.value || 1))));
    els.dialogContent.querySelector("[data-kislev-beasts]")?.addEventListener("input", e => set("beasts", Math.max(1, Number(e.target.value || 1))));
    els.dialogContent.querySelector("[data-kislev-beast-type]")?.addEventListener("change", e => set("beastType", e.target.value));
  };

  const oldAllowedMagic = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let items = oldAllowedMagic(unit, context);
    if (!isKislev()) return items;
    if (!hasTag(unit, "ice_witch") && unit.id !== "miska" && unit.id !== "baba_yaga") items = items.filter(i => i.id !== "ice_armour");
    const ownForced = forcedItems[unit.id];
    if (ownForced) items = items.filter(i => i.id !== ownForced);
    const carried = new Set(state.roster.map(e => forcedItems[e.unitId]).filter(Boolean));
    items = items.filter(i => !carried.has(i.id));
    return items;
  };

  const oldStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    oldStatus(total);
    if (!isKislev()) return;
    const warnings = [];
    if (state.roster.some(e => e.unitId === "prince_radinov") && !state.roster.some(e => e.unitId === "gryphon_legion")) warnings.push("Prince Ivan Radinov requires a Gryphon Legion regiment.");
    if (state.roster.filter(e => specialTriad.has(e.unitId)).length > 1) warnings.push("Katarin, Boris and Igor cannot be fielded together.");
    if (warnings.length) els.armyStatus.insertAdjacentHTML("beforeend", `<div class="warning-box" style="margin-top:10px"><strong>Kislev restrictions</strong><div style="margin-top:6px">${warnings.map(escapeHtml).join("<br>")}</div></div>`);
  };

  function profileRow(label, profileId, notes = "") {
    const p = profileById.get(profileId);
    if (!p) return "";
    return `<tr class="sub-profile-row"><td class="unit-cell">↳ ${escapeHtml(label)}</td>${rosterPadProfileCells(p)}<td class="save">–</td><td class="notes-cell">${escapeHtml(notes)}</td><td class="points-cell"></td></tr>`;
  }

  const oldPad = rosterPadRow;
  rosterPadRow = function(entry) {
    let html = oldPad(entry);
    if (!isKislev()) return html;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    const rows = [];
    if (unit?.id === "beasts_beastmasters") {
      const beasts = Math.max(1, Number(entry.optionSelections?.beasts || 1));
      const wolves = entry.optionSelections?.beastType === "wolves";
      rows.push(profileRow(`${beasts} ${wolves ? "Giant Wolf" : "Bear"}${beasts === 1 ? "" : wolves ? "ves" : "s"}`, wolves ? "giant_wolf" : "bear", "Beasts and Beastmasters"));
    }
    if (unit?.crew?.profileId) rows.push(profileRow(`${Number(unit.crew.base || 0) + Number(entry.optionSelections?.extra_crew || 0)} Crew`, unit.crew.profileId, unit.name));
    return rows.length ? html.replace("</tr>", `</tr>${rows.join("")}`) : html;
  };
})();
;
/* ===== END kislev_extensions.js ===== */

/* ===== BEGIN norse_extensions.js ===== */
// Norse army systems: raider mode, Heroic Individuals, Shape Changers, Dwarf runes and monster composition.
(() => {
  const ID="norse";
  const isNorse=()=>state.selectedArmyId===ID&&state.data?.faction?.id===ID;
  const tags=u=>u?.tags||[];
  const opts=()=>{state.armyOptions=state.armyOptions||{};return state.armyOptions;};
  const mode=()=>opts().norseRaidMode||"sea";
  const runeSystem=()=>state.data?.faction?.systems?.dwarfRunes||{};
  const runeCategories=()=>runeSystem().categories||{};
  const runeById=id=>Object.values(runeCategories()).flat().find(r=>r.id===id);
  const magicPool=()=>[...(state.data?.commonMagicItems||[]),...(state.data?.factionMagicItems||[])];
  const magicByLocalId=id=>magicPool().find(i=>i.id===id);

  function patchData(){
    if(!isNorse()||state.data.__norsePatched)return;
    state.data.__norsePatched=true;
    const eagle=state.data.faction.warMachines.find(u=>u.id==="great_eagle");if(eagle)eagle.selection={};
    const mammoth=state.data.faction.warMachines.find(u=>u.id==="mammoth");if(mammoth)mammoth.composition={rules:[{when:{instanceNumber:1},category:"regiments"}]};
  }

  function ensureHeroics(entry,unit){
    if(tags(unit).includes("heroic_multi")){
      entry.norseHeroics=entry.norseHeroics||{champions:[],shieldmaidens:[],ulfhednar:0};
      entry.norseHeroics.champions=Array.isArray(entry.norseHeroics.champions)?entry.norseHeroics.champions:[];
      entry.norseHeroics.shieldmaidens=Array.isArray(entry.norseHeroics.shieldmaidens)?entry.norseHeroics.shieldmaidens:[];
      entry.norseHeroics.ulfhednar=Math.max(0,Number(entry.norseHeroics.ulfhednar||0));
    }
    if(unit.id==="norse_dwarf_troll_slayers"){
      entry.norseGiantSlayers=Array.isArray(entry.norseGiantSlayers)?entry.norseGiantSlayers:[];
    }
    if(tags(unit).includes("dwarf")){
      entry.norseDwarfRunes=entry.norseDwarfRunes||{champion:{weapon:[],armour:[],talisman:[]},standard:[]};
      for(const k of ["weapon","armour","talisman"])entry.norseDwarfRunes.champion[k]=Array.isArray(entry.norseDwarfRunes.champion[k])?entry.norseDwarfRunes.champion[k]:[];
      entry.norseDwarfRunes.standard=Array.isArray(entry.norseDwarfRunes.standard)?entry.norseDwarfRunes.standard:[];
    }
  }

  const oldCreate=createEntry;
  createEntry=function(sectionKey,unit){
    const e=oldCreate(sectionKey,unit);if(!isNorse())return e;patchData();ensureHeroics(e,unit);
    if(unit.id==="shape_changer")e.hiddenInRegimentId=null;
    if(unit.id==="beasts_beastmasters")e.optionSelections={...(e.optionSelections||{}),beastmasters:1,beastType:"bears",beasts:3};
    if(unit.id==="norse_warriors")e.norseAmbush=false;
    return e;
  };

  function allowedByMode(unit){return unit?.id!=="mammoth"||mode()==="land";}
  const oldBrowser=renderUnitBrowser;
  renderUnitBrowser=function(){
    if(!isNorse())return oldBrowser();patchData();
    const f=state.data.faction, original=f.warMachines;f.warMachines=original.filter(allowedByMode);
    try{return oldBrowser();}finally{f.warMachines=original;}
  };

  function hasGiantSlayers(){return state.roster.some(e=>e.unitId==="norse_dwarf_troll_slayers"&&(e.norseGiantSlayers||[]).length>0);}
  const oldAdd=addUnit;
  addUnit=function(sectionKey,unitId){
    if(!isNorse())return oldAdd(sectionKey,unitId);patchData();
    const unit=getUnit(sectionKey,unitId);if(!unit||!allowedByMode(unit))return;
    if((unit.selection?.maximum===1||tags(unit).includes("zero_one"))&&state.roster.some(e=>e.unitId===unitId)){alert(`${unit.name} may only be included once.`);return;}
    if(unitId==="stone_trolls"&&state.roster.some(e=>e.unitId==="norse_dwarf_troll_slayers")){alert("Stone Trolls cannot be included with Norse Dwarf Troll Slayers.");return;}
    if(unitId==="norse_dwarf_troll_slayers"&&state.roster.some(e=>e.unitId==="stone_trolls")){alert("Norse Dwarf Troll Slayers cannot be included with Stone Trolls.");return;}
    if(unitId==="giant"&&hasGiantSlayers()){alert("Giants cannot be included with Giant Slayers.");return;}
    if(unitId==="mounted_norse_warriors"){
      const foot=state.roster.filter(e=>e.unitId==="norse_warriors").length,mounted=state.roster.filter(e=>e.unitId===unitId).length;
      if(mounted>=foot){alert("Mounted Norse Warrior regiments may not outnumber Norse Warrior regiments on foot.");return;}
    }
    return oldAdd(sectionKey,unitId);
  };

  function selectedTrooperCost(entry,unit){return Number(unit.points?.value||0)+Number(selectedPerModelOptionCost(entry,unit)||0);}
  function usedMagicIds(excludeEntryId=null){
    const used=new Set();
    for(const e of state.roster){
      if(e.id===excludeEntryId)continue;
      for(const id of e.magicItems||[])used.add(id);for(const id of e.champion?.magicItems||[])used.add(id);if(e.magicBanner)used.add(e.magicBanner);
      for(const id of e.norseHeroics?.champions||[])if(id)used.add(id);for(const id of e.norseHeroics?.shieldmaidens||[])if(id)used.add(id);
      for(const gs of e.norseGiantSlayers||[])if(gs?.magic)used.add(gs.magic);
    }
    return used;
  }
  function heroMagicOptions(current,entry,weaponOnly=false){
    const used=usedMagicIds(entry.id);const cats=weaponOnly?["magic_weapon"]:["magic_weapon","magic_armour","enchanted_item"];
    return magicPool().filter(i=>cats.includes(i.category)).map(i=>`<option value="${escapeHtml(i.id)}" ${current===i.id?"selected":""} ${used.has(i.id)&&current!==i.id?"disabled":""}>${escapeHtml(i.name)} (${formatPoints(i.cost)} pts)</option>`).join("");
  }
  function resizeMagicArray(arr,count){const out=[...arr];while(out.length<count)out.push(null);return out.slice(0,count);}

  function renderHeroics(entry,unit){
    ensureHeroics(entry,unit);const h=entry.norseHeroics;if(!h)return"";
    const canShield=unit.id!=="berserkers";
    return `<section class="editor-section"><h3 class="editor-section-title">Heroic Individuals</h3><div class="field-hint">Eligible Norse regiments may include multiple champions. Each Norse Champion or Shieldmaiden may carry one magic item; Ulfhednar may not.</div>
      <div class="dialog-field"><label>Norse Champions</label><input type="number" min="0" step="1" value="${h.champions.length}" data-norse-hero-count="champions"></div>
      ${h.champions.map((id,i)=>`<div class="dialog-field"><label>Champion ${i+1} magic item</label><select data-norse-hero-magic="champions" data-norse-hero-index="${i}"><option value="">None</option>${heroMagicOptions(id,entry)}</select></div>`).join("")}
      ${canShield?`<div class="dialog-field"><label>Shieldmaidens</label><input type="number" min="0" step="1" value="${h.shieldmaidens.length}" data-norse-hero-count="shieldmaidens"></div>${h.shieldmaidens.map((id,i)=>`<div class="dialog-field"><label>Shieldmaiden ${i+1} magic item</label><select data-norse-hero-magic="shieldmaidens" data-norse-hero-index="${i}"><option value="">None</option>${heroMagicOptions(id,entry)}</select></div>`).join("")}`:""}
      <div class="dialog-field"><label>Ulfhednar</label><input type="number" min="0" step="1" value="${h.ulfhednar}" data-norse-ulfhednar></div></section>`;
  }

  function availableRunes(category){return (runeCategories()[category]||[]).filter(r=>!r.onlyRunesmith&&(!r.allowedUnits||!r.allowedUnits.length));}
  function runeSelect(category,selected,attrs="") {return `<select ${attrs}><option value="">None</option>${availableRunes(category).map(r=>`<option value="${escapeHtml(r.id)}" ${selected===r.id?"selected":""}>${escapeHtml(r.name)} (${formatPoints(r.cost)} pts)</option>`).join("")}</select>`;}
  function renderRuneSlots(selected,category,attrs){return [0,1,2].map(i=>`<div class="dialog-field"><label>Rune ${i+1}</label>${runeSelect(category,selected[i]||"",`${attrs} data-norse-rune-slot="${i}"`)}</div>`).join("");}
  function renderDwarfRunes(entry,unit){
    ensureHeroics(entry,unit);if(!tags(unit).includes("dwarf"))return"";const r=entry.norseDwarfRunes;
    let html="";
    if(unit.id==="norse_dwarf_warriors"&&entry.champion?.selected){
      html+=`<section class="editor-section"><h3 class="editor-section-title">Dwarf Champion Runic Item</h3><div class="field-hint">A runic item uses the Champion's single magic-item allowance. Use only one category.</div>${["weapon","armour","talisman"].map(cat=>`<h4>${humanise(cat)}</h4>${renderRuneSlots(r.champion[cat],cat,`data-norse-champ-rune="${cat}"`)}`).join("")}</section>`;
    }
    if(entry.command?.standardBearer)html+=`<section class="editor-section"><h3 class="editor-section-title">Runic Standard</h3><div class="field-hint">A runic standard replaces a conventional magic banner.</div>${renderRuneSlots(r.standard,"protection","data-norse-standard-rune")}</section>`;
    return html;
  }
  function renderGiantSlayers(entry){
    const gs=entry.norseGiantSlayers||[];
    return `<section class="editor-section"><h3 class="editor-section-title">Giant Slayers</h3><div class="field-hint">Any number may join the Troll Slayers. Each costs 20 pts + one trooper and may take one magic weapon, including a Dwarf runic weapon.</div><div class="dialog-field"><label>Giant Slayers</label><input type="number" min="0" step="1" value="${gs.length}" data-norse-giant-count></div>${gs.map((g,i)=>`<div class="editor-section"><h4>Giant Slayer ${i+1}</h4><div class="dialog-field"><label>Conventional magic weapon</label><select data-norse-giant-magic="${i}"><option value="">None</option>${heroMagicOptions(g.magic||null,entry,true)}</select></div><div class="field-hint">Or create a runic weapon:</div>${renderRuneSlots(g.runes||[],"weapon",`data-norse-giant-rune="${i}"`)}</div>`).join("")}</section>`;
  }

  const oldCharEditor=renderCharacterEditor;
  renderCharacterEditor=function(entry,unit){
    let html=oldCharEditor(entry,unit);if(!isNorse())return html;
    if(unit.id==="shape_changer"){
      const targets=state.roster.filter(e=>e.sectionKey==="regiments"&&["norse_huscarls","berserkers","norse_warriors"].includes(e.unitId));
      html+=`<section class="editor-section"><h3 class="editor-section-title">Hidden Shape Changer</h3><div class="field-hint">Must begin hidden in Huscarls, Norse Warriors or Berserkers. Only one Shape Changer per regiment.</div><div class="dialog-field"><label>Hide in regiment</label><select data-norse-shape-target><option value="">Choose regiment</option>${targets.map(t=>{const used=state.roster.some(x=>x.id!==entry.id&&x.unitId==="shape_changer"&&x.hiddenInRegimentId===t.id);return `<option value="${escapeHtml(t.id)}" ${entry.hiddenInRegimentId===t.id?"selected":""} ${used?"disabled":""}>${escapeHtml(getUnit(t.sectionKey,t.unitId)?.name||"Regiment")}</option>`}).join("")}</select></div></section>`;
    }
    return html;
  };

  const oldRegEditor=renderRegimentEditor;
  renderRegimentEditor=function(entry,unit){
    if(isNorse()&&unit.id==="beasts_beastmasters"){
      const o=entry.optionSelections||{};return `<section class="editor-section"><h3 class="editor-section-title">Norse Beasts and Beastmasters</h3><div class="field-hint">0–1. Choose either Bears or Giant Wolves; Beastmasters are 13 pts each.</div><div class="dialog-field"><label>Beastmasters</label><input type="number" min="1" step="1" value="${Number(o.beastmasters||1)}" data-norse-beastmasters></div><div class="dialog-field"><label>Beast type</label><select data-norse-beast-type><option value="bears" ${o.beastType!=="wolves"?"selected":""}>Bears (15 pts)</option><option value="wolves" ${o.beastType==="wolves"?"selected":""}>Giant Wolves (10 pts)</option></select></div><div class="dialog-field"><label>Beasts</label><input type="number" min="1" step="1" value="${Number(o.beasts||3)}" data-norse-beasts></div></section>`;
    }
    let html=oldRegEditor(entry,unit);if(!isNorse())return html;ensureHeroics(entry,unit);
    if(tags(unit).includes("heroic_multi"))html+=renderHeroics(entry,unit);
    if(unit.id==="norse_warriors"&&mode()==="sea")html+=`<section class="editor-section"><h3 class="editor-section-title">Sea Raider Ambush</h3><label class="check-row"><input type="checkbox" data-norse-ambush ${entry.norseAmbush?"checked":""}><span class="check-row-content"><span class="check-row-title">Use Ambush</span><span class="check-row-sub">Only one Norse Warrior regiment may Ambush, and only when the Hird has no Mammoths.</span></span></label></section>`;
    if(unit.id==="norse_dwarf_troll_slayers")html+=renderGiantSlayers(entry);
    if(tags(unit).includes("dwarf"))html+=renderDwarfRunes(entry,unit);
    return html;
  };

  function validRuneList(ids){
    const details=ids.filter(Boolean).map(runeById).filter(Boolean);if(details.filter(r=>r.master).length>1)return false;
    for(const r of details){const n=ids.filter(id=>id===r.id).length;if(!r.repeatable&&n>1)return false;if(r.maxRepeats&&n>Number(r.maxRepeats))return false;}return true;
  }
  const oldWire=wireEditorControls;
  wireEditorControls=function(){
    oldWire();if(!isNorse()||!state.draft)return;const e=state.draft,u=getUnit(e.sectionKey,e.unitId);ensureHeroics(e,u);
    els.dialogContent.querySelector("[data-norse-shape-target]")?.addEventListener("change",ev=>{e.hiddenInRegimentId=ev.target.value||null;updateDialogTotal();});
    els.dialogContent.querySelector("[data-norse-beastmasters]")?.addEventListener("input",ev=>{e.optionSelections.beastmasters=Math.max(1,Number(ev.target.value||1));updateDialogTotal();});
    els.dialogContent.querySelector("[data-norse-beasts]")?.addEventListener("input",ev=>{e.optionSelections.beasts=Math.max(1,Number(ev.target.value||1));updateDialogTotal();});
    els.dialogContent.querySelector("[data-norse-beast-type]")?.addEventListener("change",ev=>{e.optionSelections.beastType=ev.target.value;updateDialogTotal();});
    els.dialogContent.querySelectorAll("[data-norse-hero-count]").forEach(inp=>inp.addEventListener("change",()=>{const k=inp.dataset.norseHeroCount;e.norseHeroics[k]=resizeMagicArray(e.norseHeroics[k],Math.max(0,Number(inp.value||0)));renderEditor();}));
    els.dialogContent.querySelectorAll("[data-norse-hero-magic]").forEach(sel=>sel.addEventListener("change",()=>{e.norseHeroics[sel.dataset.norseHeroMagic][Number(sel.dataset.norseHeroIndex)]=sel.value||null;updateDialogTotal();}));
    els.dialogContent.querySelector("[data-norse-ulfhednar]")?.addEventListener("change",ev=>{e.norseHeroics.ulfhednar=Math.max(0,Number(ev.target.value||0));updateDialogTotal();});
    els.dialogContent.querySelector("[data-norse-ambush]")?.addEventListener("change",ev=>{if(ev.target.checked&&state.roster.some(x=>x.id!==e.id&&x.norseAmbush)){alert("Only one Norse Warrior regiment may use Ambush.");ev.target.checked=false;return;}e.norseAmbush=ev.target.checked;});
    els.dialogContent.querySelector("[data-norse-giant-count]")?.addEventListener("change",ev=>{const n=Math.max(0,Number(ev.target.value||0));if(n>0&&state.roster.some(x=>x.unitId==="giant")){alert("Giant Slayers cannot be included with Giants.");ev.target.value=e.norseGiantSlayers.length;return;}while(e.norseGiantSlayers.length<n)e.norseGiantSlayers.push({magic:null,runes:[]});e.norseGiantSlayers=e.norseGiantSlayers.slice(0,n);renderEditor();});
    els.dialogContent.querySelectorAll("[data-norse-giant-magic]").forEach(sel=>sel.addEventListener("change",()=>{const g=e.norseGiantSlayers[Number(sel.dataset.norseGiantMagic)];g.magic=sel.value||null;if(g.magic)g.runes=[];renderEditor();}));
    const runeHandler=(sel,target)=>{sel.addEventListener("change",()=>{const slot=Number(sel.dataset.norseRuneSlot),next=[...target];while(next.length<3)next.push("");next[slot]=sel.value||"";if(!validRuneList(next)){alert("Invalid rune combination: only one Master Rune and non-repeatable runes cannot be duplicated.");renderEditor();return;}target.splice(0,target.length,...next.filter(Boolean));renderEditor();});};
    els.dialogContent.querySelectorAll("[data-norse-champ-rune]").forEach(sel=>runeHandler(sel,e.norseDwarfRunes.champion[sel.dataset.norseChampRune]));
    els.dialogContent.querySelectorAll("[data-norse-standard-rune]").forEach(sel=>runeHandler(sel,e.norseDwarfRunes.standard));
    els.dialogContent.querySelectorAll("[data-norse-giant-rune]").forEach(sel=>{const g=e.norseGiantSlayers[Number(sel.dataset.norseGiantRune)];runeHandler(sel,g.runes);sel.addEventListener("change",()=>{if(g.runes.length)g.magic=null;});});
  };

  function runeCost(ids){return (ids||[]).reduce((s,id)=>s+Number(runeById(id)?.cost||0),0);}
  function heroicCost(entry,unit){
    if(!entry.norseHeroics)return 0;const troop=selectedTrooperCost(entry,unit),h=entry.norseHeroics;
    let total=h.champions.length*(20+troop)+h.shieldmaidens.length*(30+troop)+Number(h.ulfhednar||0)*(40+Number(unit.points?.value||0));
    for(const id of [...h.champions,...h.shieldmaidens])if(id)total+=Number(magicByLocalId(id)?.cost||0);return total;
  }
  function giantSlayerCost(entry,unit){return (entry.norseGiantSlayers||[]).reduce((s,g)=>s+20+Number(unit.points?.value||0)+Number(g.magic?magicByLocalId(g.magic)?.cost||0:0)+runeCost(g.runes),0);}
  function dwarfRuneCost(entry){if(!entry.norseDwarfRunes)return 0;const r=entry.norseDwarfRunes;return runeCost(r.standard)+Object.values(r.champion).reduce((s,a)=>s+runeCost(a),0);}
  const oldCalc=calculateEntry;
  calculateEntry=function(entry){
    let total=oldCalc(entry);if(!isNorse())return total;const u=getUnit(entry.sectionKey,entry.unitId);if(!u)return total;
    if(u.id==="beasts_beastmasters"){const o=entry.optionSelections||{};return Number(o.beastmasters||1)*13+Number(o.beasts||1)*(o.beastType==="wolves"?10:15);}
    total+=heroicCost(entry,u)+giantSlayerCost(entry,u)+dwarfRuneCost(entry);return total;
  };
  const oldRegPoints=calculateRegimentPoints;
  calculateRegimentPoints=function(){
    let total=oldRegPoints();if(!isNorse())return total;
    for(const e of state.roster){if(e.sectionKey!=="regiments")continue;const u=getUnit(e.sectionKey,e.unitId);total-=heroicCost(e,u)+giantSlayerCost(e,u);}
    return total;
  };

  const oldSave=saveEditor;
  saveEditor=function(){
    if(isNorse()&&state.draft){const e=state.draft,u=getUnit(e.sectionKey,e.unitId);ensureHeroics(e,u);
      if(u.id==="shape_changer"&&!e.hiddenInRegimentId){alert("Choose the regiment in which the Shape Changer begins hidden.");return;}
      if(e.norseAmbush&&mode()!=="sea"){alert("Ambush is only available to Sea Raiders.");return;}
      if(u.id==="norse_dwarf_warriors"&&e.norseDwarfRunes){const r=e.norseDwarfRunes,items=Object.values(r.champion).filter(a=>a.length);if(items.length>1){alert("A Dwarf Champion may carry only one runic item.");return;}if(items.length&&e.champion?.magicItems?.length){alert("A runic item uses the Dwarf Champion's single magic-item allowance.");return;}}
      if(e.norseDwarfRunes?.standard?.length&&e.magicBanner){alert("A regiment cannot carry both a runic standard and a conventional magic banner.");return;}
    }return oldSave();
  };

  const oldStatus=renderArmyStatus;
  renderArmyStatus=function(total){
    oldStatus(total);if(!isNorse())return;patchData();
    const mounted=state.roster.filter(e=>e.unitId==="mounted_norse_warriors").length,foot=state.roster.filter(e=>e.unitId==="norse_warriors").length,mammoths=state.roster.filter(e=>e.unitId==="mammoth").length;
    const warnings=[];if(mounted>foot)warnings.push("Mounted Norse Warrior regiments outnumber Norse Warrior regiments on foot.");if(mode()==="sea"&&mammoths)warnings.push("Sea Raiders cannot include Mammoths.");if(state.roster.some(e=>e.norseAmbush)&&mammoths)warnings.push("A Hird cannot use Ambush and include Mammoths.");
    els.armyStatus.insertAdjacentHTML("afterbegin",`<div class="status-card"><strong>Raider Style</strong><div class="field-hint">Sea Raiders: one Norse Warrior regiment may Ambush. Land Raiders: Mammoths are available.</div><select data-norse-mode><option value="sea" ${mode()==="sea"?"selected":""}>Sea Raiders</option><option value="land" ${mode()==="land"?"selected":""}>Land Raiders</option></select></div>${warnings.length?`<div class="warning-box"><strong>Norse restrictions</strong><div>${warnings.map(escapeHtml).join("<br>")}</div></div>`:""}`);
    els.armyStatus.querySelector("[data-norse-mode]")?.addEventListener("change",ev=>{const next=ev.target.value;if(next==="sea"&&state.roster.some(e=>e.unitId==="mammoth")){alert("Remove all Mammoths before switching to Sea Raiders.");ev.target.value=mode();return;}if(next==="land"&&state.roster.some(e=>e.norseAmbush)){alert("Remove the Ambush selection before switching to Land Raiders.");ev.target.value=mode();return;}opts().norseRaidMode=next;renderUnitBrowser();renderArmy();});
  };

  function profileRow(label,profileId,notes="") {const p=profileById.get(profileId);if(!p)return"";return `<tr class="sub-profile-row"><td class="unit-cell">↳ ${escapeHtml(label)}</td>${rosterPadProfileCells(p)}<td class="save">–</td><td class="notes-cell">${escapeHtml(notes)}</td><td class="points-cell"></td></tr>`;}
  const oldPad=rosterPadRow;
  rosterPadRow=function(entry){
    let html=oldPad(entry);if(!isNorse())return html;const u=getUnit(entry.sectionKey,entry.unitId),rows=[];
    if(u?.id==="beasts_beastmasters"){const o=entry.optionSelections||{},wolves=o.beastType==="wolves",n=Number(o.beasts||1),m=Number(o.beastmasters||1);rows.push(profileRow(`${n} ${wolves?"Giant Wolves":"Bears"}`,wolves?"giant_wolf":"bear","Beasts"));rows.push(profileRow(`${m} Beastmaster${m===1?"":"s"}`,"norse_beastmaster","Handlers"));}
    if(u?.id==="mammoth")rows.push(profileRow("4 Norse Hunters","norse_hunter","Howdah crew: bows and heavy throwing spears"));
    if(u?.id==="mounted_norse_warriors"&&entry.optionSelections?.warhorses){html=html.replace(/<tr class="sub-profile-row">[\s\S]*?Normal Horse[\s\S]*?<\/tr>/,"" );rows.push(profileRow(`${entry.size} Warhorses`,"warhorse","Mounts"));}
    return rows.length?html.replace("</tr>",`</tr>${rows.join("")}`):html;
  };

  const oldNotes=rosterPadNotes;
  rosterPadNotes=function(entry,unit){const notes=oldNotes(entry,unit);if(!isNorse())return notes;
    if(entry.norseAmbush)notes.push("Sea Raider Ambush");if(entry.hiddenInRegimentId)notes.push("Begins hidden in an eligible Norse infantry regiment");
    if(entry.norseHeroics){if(entry.norseHeroics.champions.length)notes.push(`${entry.norseHeroics.champions.length} Norse Champion(s)`);if(entry.norseHeroics.shieldmaidens.length)notes.push(`${entry.norseHeroics.shieldmaidens.length} Shieldmaiden(s)`);if(entry.norseHeroics.ulfhednar)notes.push(`${entry.norseHeroics.ulfhednar} Ulfhednar`);}
    if(entry.norseGiantSlayers?.length)notes.push(`${entry.norseGiantSlayers.length} Giant Slayer(s)`);return [...new Set(notes)];};
})();
;
/* ===== END norse_extensions.js ===== */

/* ===== BEGIN norse_final_fixes.js ===== */
// Final Norse source restrictions and legacy-core compatibility fixes.
(() => {
  const isNorse=()=>state.selectedArmyId==="norse"&&state.data?.faction?.id==="norse";
  function applyDataFixes(){
    if(!isNorse()||state.data.__norseFinalPatched)return;state.data.__norseFinalPatched=true;
    const eagle=state.data.faction.warMachines.find(x=>x.id==="great_eagle");
    if(eagle){eagle.selection={};eagle.tags=(eagle.tags||[]).filter(tag=>tag!=="zero_one");}
    for(const id of ["norse_king","norse_jarl"]){
      const u=state.data.faction.characters.find(x=>x.id===id);if(!u)continue;
      u.equipmentOptions=[
        {id:"armour",type:"choice_group",maximum:1,cost:0,choices:["light_armour"]},
        {id:"shield",type:"choice_group",maximum:1,cost:0,choices:["shield"]},
        {id:"melee_weapon",type:"choice_group",maximum:1,cost:0,choices:["additional_hand_weapon","spear","double_handed_weapon"]},
        {id:"missile_weapon",type:"choice_group",maximum:1,cost:10,choices:["bow","heavy_throwing_spear"]}
      ];
    }
    const bsb=state.data.faction.characters.find(x=>x.id==="norse_bsb");
    if(bsb)bsb.equipmentOptions=[{id:"armour",type:"choice_group",maximum:1,cost:0,choices:["light_armour"]}];
  }
  const oldSelect=selectArmy;
  selectArmy=async function(id){await oldSelect(id);if(isNorse()){applyDataFixes();renderUnitBrowser();renderArmy();}};

  const oldAllowed=getAllowedMagicItems;
  getAllowedMagicItems=function(unit,context){
    let items=oldAllowed(unit,context);if(!isNorse())return items;applyDataFixes();
    const draft=state.draft;
    items=items.filter(item=>{
      if(item.id==="gandstaff")return Boolean(unit?.wizard||unit?.tags?.includes("wizard"));
      if(item.id==="andvares_gift")return ["norse_king","norse_jarl"].includes(unit?.id)&&context==="character"&&!draft?.mount;
      if(item.id==="enchanted_wolf_pelt"){
        if(context==="character")return !draft?.mount;
        if(context==="champion")return unit?.unitType!=="cavalry";
      }
      return true;
    });
    return items;
  };

  const oldSave=saveEditor;
  saveEditor=function(){
    if(isNorse()&&state.draft){
      const e=state.draft,u=getUnit(e.sectionKey,e.unitId),o=e.optionSelections||{};
      if(u?.id==="berserkers"&&o.additional_hand_weapons&&o.double_handed_weapons){alert("Berserkers must choose additional hand weapons or double handed weapons, not both.");return;}
      if(u?.id==="norse_thralls"&&o.shields_throwing_spears&&o.bows){alert("Norse Thralls must choose shields and throwing spears or bows, not both.");return;}
      if(u?.id==="mounted_norse_warriors"){
        if(o.spears&&o.lances){alert("Mounted Norse Warriors must choose spears or lances, not both.");return;}
        if(o.lances&&o.bows){alert("Mounted Norse Warriors may only take bows when they are not using lances.");return;}
      }
      if(u?.id==="norse_dwarf_warriors"){
        if(o.spears&&o.double_handed_weapons){alert("Norse Dwarfs must choose spears or double handed weapons, not both.");return;}
        const other=Boolean(o.shields||o.spears||o.double_handed_weapons);
        if(o.bows&&other){alert("Norse Dwarfs may take bows only if they take no other weapon or armour upgrades.");return;}
        if(o.skis&&!o.bows){alert("Norse Dwarfs may use skis only when equipped with bows.");return;}
      }
    }
    return oldSave();
  };

  const oldArmour=calculatePrintedArmourSave;
  calculatePrintedArmourSave=function(entry,unit){
    if(isNorse()){
      if(unit?.id==="mammoth")return "4+";
      if(unit?.id==="stone_trolls")return "5+";
    }
    return oldArmour(entry,unit);
  };
})();
;
/* ===== END norse_final_fixes.js ===== */

/* ===== BEGIN norse_guard.js ===== */
// Norse army-wide uniqueness guards for Heroic Individuals and Dwarf runes.
(() => {
  const isNorse=()=>state.selectedArmyId==="norse"&&state.data?.faction?.id==="norse";
  const runeCategories=()=>state.data?.faction?.systems?.dwarfRunes?.categories||{};
  const runeById=id=>Object.values(runeCategories()).flat().find(r=>r.id===id);

  function entryMagicSelections(entry){
    const ids=[];
    for(const id of entry.magicItems||[])if(id)ids.push(id);
    for(const id of entry.champion?.magicItems||[])if(id)ids.push(id);
    if(entry.magicBanner)ids.push(entry.magicBanner);
    for(const id of entry.norseHeroics?.champions||[])if(id)ids.push(id);
    for(const id of entry.norseHeroics?.shieldmaidens||[])if(id)ids.push(id);
    for(const gs of entry.norseGiantSlayers||[])if(gs?.magic)ids.push(gs.magic);
    return ids;
  }

  function runeItems(entry){
    const items=[];
    const r=entry.norseDwarfRunes;
    if(r){
      for(const key of ["weapon","armour","talisman"])if(r.champion?.[key]?.length)items.push(r.champion[key]);
      if(r.standard?.length)items.push(r.standard);
    }
    for(const gs of entry.norseGiantSlayers||[])if(gs?.runes?.length)items.push(gs.runes);
    return items;
  }

  function validateMagicUniqueness(draft){
    const own=entryMagicSelections(draft);
    const seen=new Set();
    for(const id of own){if(seen.has(id))return `The magic item ${getMagicItem(id)?.name||humanise(id)} is selected more than once in this regiment.`;seen.add(id);}
    const elsewhere=new Set();
    for(const e of state.roster){if(e.id===draft.id)continue;for(const id of entryMagicSelections(e))elsewhere.add(id);}
    for(const id of own)if(elsewhere.has(id))return `${getMagicItem(id)?.name||humanise(id)} is already used elsewhere in the army.`;
    return null;
  }

  function validateRunes(draft){
    const entries=state.roster.filter(e=>e.id!==draft.id).concat([draft]);
    const masterCounts=new Map();let spellbreaking=0;
    for(const e of entries){
      for(const item of runeItems(e)){
        const masters=item.filter(id=>runeById(id)?.master);
        if(masters.length>1)return "A runic item may contain only one Master Rune.";
        for(const id of masters)masterCounts.set(id,(masterCounts.get(id)||0)+1);
        spellbreaking+=item.filter(id=>id==="r_spellbreaking").length;
      }
    }
    for(const [id,count] of masterCounts)if(count>1)return `${runeById(id)?.name||humanise(id)} is a Master Rune and may only be used once in the army.`;
    if(spellbreaking>2)return "No more than two Runes of Spellbreaking may be included in the army.";
    return null;
  }

  const oldSave=saveEditor;
  saveEditor=function(){
    if(isNorse()&&state.draft){
      const magicError=validateMagicUniqueness(state.draft);if(magicError){alert(magicError);return;}
      const runeError=validateRunes(state.draft);if(runeError){alert(runeError);return;}
    }
    return oldSave();
  };
})();
;
/* ===== END norse_guard.js ===== */

/* ===== BEGIN slann_empire_extensions.js ===== */
// Slann Empire construction systems: native tribes, handlers, Heirlooms and source restrictions.
(() => {
  const ID="slann_empire";
  const isSlann=()=>state.selectedArmyId===ID&&state.data?.faction?.id===ID;
  const tags=u=>u?.tags||[];
  const heirlooms=()=>state.data?.faction?.systems?.heirlooms||[];
  const heirloomById=id=>heirlooms().find(x=>x.id===id);

  function patchData(){
    if(!isSlann()||state.data.__slannEmpirePatched)return;
    state.data.__slannEmpirePatched=true;
    const swarm=state.data.faction.warMachines.find(u=>u.id==="jungle_swarm");
    if(swarm)swarm.composition={rules:[{when:{instanceNumber:1},category:"regiments"}]};
  }

  const oldCreate=createEntry;
  createEntry=function(sectionKey,unit){
    const e=oldCreate(sectionKey,unit);if(!isSlann())return e;patchData();
    e.slannHeirlooms=[];
    if(unit.id==="slann_animal_handlers")e.optionSelections={beastmasters:1,hounds:5};
    return e;
  };

  const oldAdd=addUnit;
  addUnit=function(sectionKey,unitId){
    if(!isSlann())return oldAdd(sectionKey,unitId);patchData();
    const unit=getUnit(sectionKey,unitId);if(!unit)return;
    if((unit.selection?.maximum===1||tags(unit).includes("zero_one"))&&state.roster.some(e=>e.unitId===unitId)){alert(`${unit.name} may only be included once.`);return;}
    if(tags(unit).includes("native_tribe")&&state.roster.some(e=>tags(getUnit(e.sectionKey,e.unitId)).includes("native_tribe"))){alert("The Slann Empire may include only one Native Tribe regiment in total.");return;}
    return oldAdd(sectionKey,unitId);
  };

  const baseMagicMax=unit=>Number(unit?.magicItems?.maximum??unit?.magicItemLimit??0);
  const heirloomAllowed=unit=>tags(unit).includes("slann")&&unit.id!=="war_altar";
  const oldMaximum=getMagicMaximum;
  getMagicMaximum=function(unit,context){
    const max=oldMaximum(unit,context);
    if(!isSlann()||context!=="character"||!state.draft||!heirloomAllowed(unit))return max;
    return Math.max(0,Number(max||baseMagicMax(unit))-(state.draft.slannHeirlooms||[]).length);
  };

  const oldMagic=getAllowedMagicItems;
  getAllowedMagicItems=function(unit,context){
    let items=oldMagic(unit,context);if(!isSlann())return items;
    const isSkink=tags(unit).includes("skink")||/skink/i.test(unit?.name||"");
    const wizard=tags(unit).includes("wizard")||Boolean(unit?.wizard);
    return items.filter(item=>{
      if(item.id==="dagger_sotek"&&!isSkink)return false;
      if(item.wizardOnly&&!wizard)return false;
      if(item.category==="arcane_item"&&!wizard&&unit?.id!=="war_altar")return false;
      if(unit?.id==="war_altar"&&!['enchanted_item','arcane_item'].includes(item.category))return false;
      return true;
    });
  };

  const oldBanner=renderMagicBannerEditor;
  renderMagicBannerEditor=function(entry,unit){
    if(!isSlann())return oldBanner(entry,unit);
    const banners=[...(state.data.commonMagicItems||[]),...(state.data.factionMagicItems||[])].filter(i=>i.category==="magic_banner"&&(i.id!=="shackle_standard"||unit.id==="lobotomised_slaves"));
    return `<section class="editor-section"><h3 class="editor-section-title">Magic Banner</h3><div class="dialog-field"><label>Banner</label><select data-magic-banner><option value="">None</option>${banners.map(item=>{const used=magicItemUsedElsewhere(item.id,entry.id,"banner");return `<option value="${escapeHtml(item.id)}" ${entry.magicBanner===item.id?"selected":""} ${used&&entry.magicBanner!==item.id?"disabled":""}>${escapeHtml(item.name)} (${formatPoints(item.cost)} pts)</option>`}).join("")}</select></div></section>`;
  };

  function renderHeirlooms(entry,unit){
    if(!heirloomAllowed(unit))return "";
    const selected=entry.slannHeirlooms||[],max=baseMagicMax(unit);
    return `<section class="editor-section"><div class="magic-header"><h3 class="editor-section-title" style="margin:0;">Heirlooms of the Old Slann</h3><span class="magic-counter">${selected.length} / ${max} slots</span></div><div class="field-hint">Technological artefacts: not magical and not unique army-wide, but each occupies a normal magic-item slot. Each character may take each Heirloom once.</div>${heirlooms().map(h=>`<label class="check-row"><input type="checkbox" data-slann-heirloom="${escapeHtml(h.id)}" ${selected.includes(h.id)?"checked":""}><span class="check-row-content"><span class="check-row-title"><span>${escapeHtml(h.name)}</span><span>+${formatPoints(h.cost)} pts</span></span><span class="check-row-sub">${escapeHtml(h.rules)}</span></span></label>`).join("")}</section>`;
  }

  const oldChar=renderCharacterEditor;
  renderCharacterEditor=function(entry,unit){const html=oldChar(entry,unit);return isSlann()?html+renderHeirlooms(entry,unit):html;};

  const oldReg=renderRegimentEditor;
  renderRegimentEditor=function(entry,unit){
    if(isSlann()&&unit.id==="slann_animal_handlers"){
      const o=entry.optionSelections||{};
      return `<section class="editor-section"><h3 class="editor-section-title">Slann Animal Handlers</h3><div class="field-hint">0–1. Slann Beastmasters cost 14 pts each; Lizard Hounds cost 8 pts each. No command, champion or joining characters.</div><div class="dialog-field"><label>Slann Beastmasters</label><input type="number" min="1" step="1" value="${Number(o.beastmasters||1)}" data-slann-beastmasters></div><div class="dialog-field"><label>Lizard Hounds</label><input type="number" min="1" step="1" value="${Number(o.hounds||5)}" data-slann-hounds></div></section>`;
    }
    return oldReg(entry,unit);
  };

  const oldWire=wireEditorControls;
  wireEditorControls=function(){
    oldWire();if(!isSlann()||!state.draft)return;const e=state.draft,u=getUnit(e.sectionKey,e.unitId);
    els.dialogContent.querySelector("[data-slann-beastmasters]")?.addEventListener("input",ev=>{e.optionSelections.beastmasters=Math.max(1,Number(ev.target.value||1));updateDialogTotal();});
    els.dialogContent.querySelector("[data-slann-hounds]")?.addEventListener("input",ev=>{e.optionSelections.hounds=Math.max(1,Number(ev.target.value||1));updateDialogTotal();});
    els.dialogContent.querySelectorAll("[data-slann-heirloom]").forEach(ch=>ch.addEventListener("change",()=>{
      e.slannHeirlooms=e.slannHeirlooms||[];const id=ch.dataset.slannHeirloom;
      if(ch.checked){if(e.slannHeirlooms.length+(e.magicItems||[]).length>=baseMagicMax(u)){alert("This character has no remaining magic-item slots.");ch.checked=false;return;}if(!e.slannHeirlooms.includes(id))e.slannHeirlooms.push(id);}else e.slannHeirlooms=e.slannHeirlooms.filter(x=>x!==id);
      renderEditor();
    }));
  };

  const oldCalc=calculateEntry;
  calculateEntry=function(entry){
    let total=oldCalc(entry);if(!isSlann())return total;const unit=getUnit(entry.sectionKey,entry.unitId);if(!unit)return total;
    if(unit.id==="slann_animal_handlers")total=Number(entry.optionSelections?.beastmasters||1)*14+Number(entry.optionSelections?.hounds||5)*8;
    for(const id of entry.slannHeirlooms||[])total+=Number(heirloomById(id)?.cost||0);
    return total;
  };

  const oldRegPts=calculateRegimentPoints;
  calculateRegimentPoints=function(){
    if(!isSlann())return oldRegPts();let total=0,seen={};
    for(const entry of state.roster){const unit=getUnit(entry.sectionKey,entry.unitId);if(!unit)continue;seen[unit.id]=(seen[unit.id]||0)+1;if(entry.sectionKey==="regiments"){total+=calculateEntry(entry)-calculateChampionCost(entry,unit);continue;}const rule=unit.composition?.rules?.find(r=>r.when?.instanceNumber===seen[unit.id]&&r.category==="regiments");if(rule)total+=calculateEntry(entry);}
    return total;
  };

  const oldStatus=renderArmyStatus;
  renderArmyStatus=function(total){
    oldStatus(total);if(!isSlann())return;
    let slann=0,aux=0;for(const e of state.roster){if(e.sectionKey!=="regiments")continue;const u=getUnit(e.sectionKey,e.unitId);if(tags(u).includes("slann"))slann++;if(tags(u).includes("auxiliary"))aux++;}
    const warnings=[];if(aux>slann)warnings.push(`Slann regiment requirement: ${slann} Slann vs ${aux} Auxiliary. Add ${aux-slann} Slann regiment${aux-slann===1?"":"s"}.`);
    const eligible=state.roster.filter(e=>["characters","specialCharacters"].includes(e.sectionKey)&&tags(getUnit(e.sectionKey,e.unitId)).includes("slann")&&!tags(getUnit(e.sectionKey,e.unitId)).includes("not_general"));
    if(state.roster.length&&!eligible.length)warnings.push("The army General must be a Slann character; add an eligible Slann character.");
    if(warnings.length)els.armyStatus.innerHTML+=`<div class="status-warning">${warnings.map(escapeHtml).join("<br>")}</div>`;
  };

  const oldArmour=calculatePrintedArmourSave;
  calculatePrintedArmourSave=function(entry,unit){
    if(isSlann()){
      if(["skink_hero","skink_shaman","terradon_riders","chameleon_skinks"].includes(unit?.id))return "6+";
      if(["saurus_hero","saurus_temple_guard","saurus_warriors"].includes(unit?.id))return "5+";
      if(["kroxigors","stegadon","salamander"].includes(unit?.id))return "4+";
    }
    return oldArmour(entry,unit);
  };

  const oldPad=rosterPadRow;
  rosterPadRow=function(entry){
    let html=oldPad(entry);if(!isSlann())return html;const unit=getUnit(entry.sectionKey,entry.unitId);
    const add=(pid,label)=>{const p=profileById.get(pid);if(!p)return;const s=p.stats;html+=`<div class="roster-pad-subprofile"><strong>${escapeHtml(label||p.name)}</strong> M ${s.M} WS ${s.WS} BS ${s.BS} S ${s.S} T ${s.T} W ${s.W} I ${s.I} A ${s.A} Ld ${s.Ld}</div>`;};
    if(unit?.id==="slann_animal_handlers"){add("slann_beastmaster","Slann Beastmasters");add("lizard_hound","Lizard Hounds");}
    if(unit?.id==="terradon_riders"){add("terradon","Terradons");add("skink_warrior","Skink Riders");}
    if(unit?.id==="stegadon")add("skink_crew","Skink Crew");
    if(unit?.id==="salamander")add("skink_crew","Skink Handlers");
    return html;
  };
})();
;
/* ===== END slann_empire_extensions.js ===== */

/* ===== BEGIN slann_empire_final_fixes.js ===== */
// Final Slann Empire source-completeness and printed-profile fixes.
(() => {
  const ID="slann_empire";
  const isSlann=()=>state.selectedArmyId===ID&&state.data?.faction?.id===ID;
  const byId=(section,id)=>(state.data?.faction?.[section]||[]).find(u=>u.id===id);

  function patchData(){
    if(!isSlann()||state.data.__slannEmpireFinalPatched)return;
    state.data.__slannEmpireFinalPatched=true;

    const equip={
      lobotomised_slaves:["shield"],
      slann_warriors:["light_armour","shield"],
      slann_venom_tribes:["blowpipe"],
      slann_totem_warriors:["light_armour","shield"],
      slann_totem_cold_one_riders:["light_armour","spear","shield"],
      kroxigors:["double_handed_weapon"],
      saurus_temple_guard:["halberd"],
      saurus_warriors:["hand_weapon","shield"],
      native_halflings:["blowpipe"],
      native_ghouls:["blowpipe"],
      native_amazons:["additional_hand_weapon","bow"],
      chameleon_skinks:["blowpipe"]
    };
    for(const [id,items] of Object.entries(equip)){const u=byId("regiments",id);if(u)u.fixedEquipment=items;}

    const venom=byId("regiments","slann_venom_tribes");
    if(venom){venom.tags=(venom.tags||[]).filter(t=>t!=="skirmisher");venom.command={useGlobalDefaults:true};}

    const riders=byId("regiments","slann_totem_cold_one_riders");
    if(riders)riders.unitMount={mountId:"cold_one",name:"Cold Ones"};
    const terradons=byId("regiments","terradon_riders");
    if(terradons)terradons.unitMount={mountId:"terradon",name:"Terradons"};

    // Treat each Swarm base as an individual roster entry so exactly the first
    // 40-point base contributes to Regiments and later bases count as Monsters.
    const swarm=byId("warMachines","jungle_swarm");
    if(swarm){swarm.points={type:"fixed",value:40};swarm.size=undefined;swarm.composition={rules:[{when:{instanceNumber:1},category:"regiments"}]};}
  }

  const oldSelect=selectArmy;
  selectArmy=async function(id){await oldSelect(id);if(isSlann()){patchData();renderUnitBrowser();renderArmy();}};

  const oldCreate=createEntry;
  createEntry=function(sectionKey,unit){const e=oldCreate(sectionKey,unit);if(!isSlann())return e;patchData();if(unit?.id==="slann_totem_cold_one_riders")e.slannChampionHornedOne=false;return e;};

  const oldReg=renderRegimentEditor;
  renderRegimentEditor=function(entry,unit){let html=oldReg(entry,unit);if(!isSlann()||unit?.id!=="slann_totem_cold_one_riders"||!entry.champion?.selected)return html;return html+`<section class="editor-section"><h3 class="editor-section-title">Spawn Master Mount</h3><label class="check-row"><input type="checkbox" data-slann-champ-horned ${entry.slannChampionHornedOne?"checked":""}><span class="check-row-content"><span class="check-row-title"><span>Replace the Spawn Master's Cold One with a Horned One</span><span>+10 pts</span></span><span class="check-row-sub">The ordinary riders remain mounted on Cold Ones.</span></span></label></section>`;};

  const oldWire=wireEditorControls;
  wireEditorControls=function(){oldWire();if(!isSlann()||!state.draft)return;els.dialogContent.querySelector("[data-slann-champ-horned]")?.addEventListener("change",ev=>{state.draft.slannChampionHornedOne=ev.target.checked;updateDialogTotal();});};

  const oldCalc=calculateEntry;
  calculateEntry=function(entry){let total=oldCalc(entry);if(isSlann()&&entry.unitId==="slann_totem_cold_one_riders"&&entry.champion?.selected&&entry.slannChampionHornedOne)total+=10;return total;};

  const oldSave=saveEditor;
  saveEditor=function(){if(isSlann()&&state.draft?.unitId==="slann_totem_cold_one_riders"&&!state.draft.champion?.selected)state.draft.slannChampionHornedOne=false;return oldSave();};

  function improve(result,steps=1){if(result==="–")return result;const n=Number(String(result).replace("+",""));return Number.isFinite(n)?`${Math.max(2,n-steps)}+`:result;}
  function selectedIds(entry,unit){return new Set(getSelectedEquipmentIds(entry,unit));}
  const previousArmour=calculatePrintedArmourSave;
  calculatePrintedArmourSave=function(entry,unit){
    patchData();
    if(!isSlann())return previousArmour(entry,unit);

    const id=unit?.id, eq=selectedIds(entry,unit);
    const natural = ["skink_hero","skink_shaman","terradon_riders","chameleon_skinks"].includes(id)?6:
      ["saurus_hero","saurus_temple_guard","saurus_warriors"].includes(id)?5:
      ["kroxigors","stegadon","salamander"].includes(id)?4:null;

    if(natural!=null){
      let save=natural;
      if(eq.has("light_armour"))save--;
      if(eq.has("heavy_armour"))save-=2;
      if(eq.has("shield"))save--;
      const mounted=Boolean(entry.mount)||Boolean(unit.unitMount?.mountId)||unit.unitType==="cavalry";
      if(mounted)save--;
      const cold=entry.mount==="cold_one"||entry.mount==="horned_one"||unit.unitMount?.mountId==="cold_one";
      if(cold)save--;
      return `${Math.max(2,save)}+`;
    }

    let result=previousArmour(entry,unit);
    const cold=entry.mount==="cold_one"||entry.mount==="horned_one"||unit?.unitMount?.mountId==="cold_one";
    if(cold)result=improve(result,1);
    return result;
  };

  const oldNotes=rosterPadNotes;
  rosterPadNotes=function(entry,unit){const notes=oldNotes(entry,unit);if(isSlann()&&unit?.id==="slann_totem_cold_one_riders"&&entry.champion?.selected&&entry.slannChampionHornedOne)notes.push("Spawn Master rides a Horned One (+10 pts)");return [...new Set(notes)];};

  const oldPad=rosterPadRow;
  rosterPadRow=function(entry){let html=oldPad(entry);if(!isSlann())return html;const unit=getUnit(entry.sectionKey,entry.unitId);if(unit?.id==="slann_totem_cold_one_riders"&&entry.champion?.selected&&entry.slannChampionHornedOne){const p=profileById.get("horned_one");if(p){const s=p.stats;html+=`<div class="roster-pad-subprofile"><strong>Spawn Master's Horned One</strong> M ${s.M} WS ${s.WS} BS ${s.BS} S ${s.S} T ${s.T} W ${s.W} I ${s.I} A ${s.A} Ld ${s.Ld}</div>`;}}return html;};
})();
;
/* ===== END slann_empire_final_fixes.js ===== */

/* ===== BEGIN global_consistency_fixes.js ===== */
// Cross-army consistency fixes for universal WHR builder rules.
(() => {
  function isWizard(unit) {
    const tags = unit?.tags || [];
    return Boolean(unit?.wizard) || tags.includes("wizard") || tags.includes("mage") || tags.includes("sorcerer") || tags.includes("shaman");
  }

  function legacyMagicMaximum(unit, context) {
    if (context === "champion") {
      return Number(
        unit?.champion?.magicItemLimit ??
        unit?.champion?.magicItems?.limit ??
        unit?.champion?.magicItems?.maximum ??
        0
      );
    }
    return Number(
      unit?.magicItemLimit ??
      unit?.magicItems?.limit ??
      unit?.magicItems?.maximum ??
      unit?.magicItems?.additionalMaximum ??
      0
    );
  }

  const previousMagicMaximum = getMagicMaximum;
  getMagicMaximum = function(unit, context) {
    const current = Number(previousMagicMaximum(unit, context) || 0);
    return current > 0 ? current : legacyMagicMaximum(unit, context);
  };

  const previousAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const maximum = getMagicMaximum(unit, context);
    if (maximum <= 0) return [];

    let items = previousAllowedMagicItems(unit, context) || [];
    const wizard = isWizard(unit);

    // Legacy army files used magicItemLimit without a modern magicItems block.
    // Preserve their intended access to the army/common pools while keeping
    // universal wizard-only categories closed to mundane characters.
    const isLegacy = context === "champion"
      ? Boolean(unit?.champion?.magicItemLimit != null && !unit?.champion?.magicItems)
      : Boolean(unit?.magicItemLimit != null && !unit?.magicItems);

    if (!items.length && isLegacy) {
      const categories = new Set(["magic_weapon", "magic_armour", "enchanted_item"]);
      if (wizard) {
        categories.add("arcane_item");
        categories.add("familiar");
      }
      items = [
        ...(state.data?.commonMagicItems || []),
        ...(state.data?.factionMagicItems || [])
      ].filter(item => categories.has(item.category));
    }

    if (!wizard) {
      items = items.filter(item => item.category !== "arcane_item" && item.category !== "familiar");
    }

    return items;
  };

  function unitHasStandardBearer(unit) {
    if (!unit || unit.unitType === "skirmisher" || (unit.tags || []).includes("skirmisher")) return false;
    if (unit.magicBanner?.allowed) return true;
    const command = unit.command || {};
    const definition = getCommandDefinition(unit, "standardBearer") || {};
    if (definition.allowed === false) return false;
    if (command.useGlobalDefaults) return true;
    return Boolean(command.standardBearer);
  }

  const previousRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = previousRegimentEditor(entry, unit);
    if (
      entry?.command?.standardBearer &&
      unitHasStandardBearer(unit) &&
      !String(html).includes("data-magic-banner")
    ) {
      html += renderMagicBannerEditor(entry, unit);
    }
    return html;
  };

  function patchRosterProfileGaps() {
    if (!state.data?.faction) return false;
    let changed = false;

    // WHR Empire p.22: one Warrior Priest may ride a large chariot drawn by
    // two barded warhorses. The option existed in the original dataset but
    // the corresponding mount/profile did not, so Roster Pad could not show it.
    if (state.data.faction.id === "empire") {
      state.data.profiles = state.data.profiles || [];
      state.data.mounts = state.data.mounts || [];
      if (!state.data.profiles.some(p => p.id === "warrior_priest_chariot_profile")) {
        state.data.profiles.push({
          id: "warrior_priest_chariot_profile",
          name: "Large Chariot",
          stats: { M:"–", WS:"–", BS:"–", S:5, T:5, W:4, I:"–", A:"–", Ld:"–" }
        });
        changed = true;
      }
      if (!state.data.mounts.some(m => m.id === "warrior_priest_chariot")) {
        state.data.mounts.push({
          id: "warrior_priest_chariot",
          name: "Large Chariot (2 Barded Warhorses)",
          profileId: "warrior_priest_chariot_profile",
          rules: ["heavy_chariot", "two_barded_warhorses"]
        });
        changed = true;
      }
    }

    // Modern Chaos Dwarf Magma Cannons inherit the Dwarf Flame Cannon rules.
    // Some payload versions referenced a crew profile id that was not present;
    // alias that id to the existing Chaos Dwarf Warrior/Crewman statline.
    if (state.data.faction.id === "chaos_dwarfs") {
      const magma = (state.data.faction.warMachines || []).find(u => /magma cannon/i.test(u.name || ""));
      if (magma) {
        const entry = createEntry("warMachines", magma);
        const crew = resolveWarMachineCrew(entry, magma);
        if (crew?.profileId && !profileById.get(crew.profileId)) {
          const source = (state.data.profiles || []).find(p => /chaos dwarf (warrior|crew)/i.test(p.name || ""));
          if (source) {
            state.data.profiles.push({...clone(source), id:crew.profileId, name:"Chaos Dwarf Crewman"});
            changed = true;
          }
        }
      }
    }

    return changed;
  }

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!state.data) return;
    if (patchRosterProfileGaps()) buildIndexes();
    renderUnitBrowser();
    renderArmy();
  };

  // The Warrior Priest's large chariot is drawn by two barded warhorses.
  // Print their profile as well as the chariot body profile.
  const previousRosterPadMountRow = rosterPadMountRow;
  rosterPadMountRow = function(entry, unit) {
    let html = previousRosterPadMountRow(entry, unit);
    if (state.data?.faction?.id === "empire" && entry?.mount === "warrior_priest_chariot") {
      html += rosterPadUnitMountRow(entry, {
        ...unit,
        unitMount: { mountId:"warhorse", name:"2 Barded Warhorses", equipment:["barding"] }
      });
    }
    return html;
  };

  // Expose invariant helpers for the all-army regression workflow.
  window.whrUnitHasStandardBearer = unitHasStandardBearer;
})();
;
/* ===== END global_consistency_fixes.js ===== */

/* ===== BEGIN special_character_magic_fixes.js ===== */
// Cross-faction special-character magic item corrections.
// Source: WHR Armies 2026-27. Special characters only receive extra items
// where their own entry explicitly permits them.
(() => {
  const fullMagicCategories = ["magic_weapon", "magic_armour", "enchanted_item", "arcane_item", "familiar"];
  const martialMagicCategories = ["magic_weapon", "magic_armour", "enchanted_item"];

  function specialById(id) {
    return (state.data?.faction?.specialCharacters || []).find(unit => unit.id === id) || null;
  }

  function giveMagicItems(id, maximum, { wizard = false, banner = false, combinedBloodline = false } = {}) {
    const unit = specialById(id);
    if (!unit) return;
    const categories = wizard ? [...fullMagicCategories] : [...martialMagicCategories];
    if (banner) categories.push("magic_banner");
    unit.magicItems = {
      maximum: Number(maximum),
      allowedPools: ["common", "faction"],
      allowedCategories: categories
    };
    if (combinedBloodline) unit.combinedMagicAndBloodlineLimit = Number(maximum);
  }

  function markVonCarsteinVampire(unit) {
    if (!unit) return;
    unit.tags = [...new Set([...(unit.tags || []), "vampire", "von_carstein_only"])];
    unit.bloodlineOnly = "von_carstein";
  }

  function patchSpecialCharacterAllowances() {
    const army = state.selectedArmyId;

    if (army === "vampire_counts") {
      const vlad = specialById("vlad_isabella");
      const mannfred = specialById("mannfred_von_carstein");
      const konrad = specialById("konrad_von_carstein");
      [vlad, mannfred, konrad].forEach(markVonCarsteinVampire);

      // WHR p.78. Vlad has one extra item AND one extra bloodline power.
      if (vlad) {
        giveMagicItems("vlad_isabella", 1, { wizard: true });
        vlad.bloodlinePowers = { ...(vlad.bloodlinePowers || {}), maximum: 1 };
      }

      // WHR p.78. These are shared pools: items + bloodline powers may not
      // exceed the stated total in any combination.
      giveMagicItems("mannfred_von_carstein", 4, { wizard: true, combinedBloodline: true });
      giveMagicItems("konrad_von_carstein", 2, { combinedBloodline: true });
    }

    if (army === "tomb_kings") {
      // WHR p.85.
      giveMagicItems("khalida", 3);
      giveMagicItems("arkhan", 4, { wizard: true });
    }

    if (army === "classic_undead") {
      // WHR p.89.
      giveMagicItems("krell", 1);
      giveMagicItems("dieter", 3, { wizard: true });
      giveMagicItems("heinrich", 3, { wizard: true });
    }

    if (army === "lizardmen") {
      // Mazdamundi is the BSB and WHR explicitly permits one of his four
      // additional items to be a magic banner.
      const maz = specialById("mazdamundi");
      if (maz?.magicItems) {
        const categories = new Set(maz.magicItems.allowedCategories || fullMagicCategories);
        categories.add("magic_banner");
        maz.magicItems.allowedCategories = [...categories];
      }
    }
  }

  function resolveFixedMagicItem(itemId) {
    return getMagicItem(itemId) ||
      (state.data?.faction?.specialCharacterOnlyItems || []).find(item => item.id === itemId) ||
      null;
  }

  function renderIncludedMagicItems(unit) {
    if (!(unit?.fixedMagicItems || []).length) return "";
    const items = unit.fixedMagicItems
      .map(resolveFixedMagicItem)
      .filter(Boolean);
    if (!items.length) return "";

    return `
      <section class="editor-section included-magic-items">
        <h3 class="editor-section-title">Included Magic Items</h3>
        ${items.map(item => `
          <div class="dialog-note included-magic-item" data-fixed-magic-item="${escapeHtml(item.id)}">
            <strong>${escapeHtml(item.name)}</strong>${item.rules ? ` — ${escapeHtml(item.rules)}` : ""}
          </div>
        `).join("")}
      </section>
    `;
  }

  // Patch after every faction's loaders/extensions have completed their own
  // selectArmy work, then rebuild indexes so altered magic settings are live.
  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!state.data) return;
    patchSpecialCharacterAllowances();
    buildIndexes();
    renderUnitBrowser();
    renderArmy();
  };

  // The Roster Pad already prints fixedMagicItems with rules. Mirror that
  // information in the edit dialog so included items are never unexplained.
  const previousRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    return previousRenderCharacterEditor(entry, unit) + renderIncludedMagicItems(unit);
  };

  window.whrResolveFixedSpecialMagicItem = resolveFixedMagicItem;
})();
;
/* ===== END special_character_magic_fixes.js ===== */

/* ===== BEGIN special_character_mount_fixes.js ===== */
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
;
/* ===== END special_character_mount_fixes.js ===== */

/* ===== BEGIN tomb_kings_champion_fix.js ===== */
// Targeted Tomb Kings support for the two Tomb Guard champion choices.
(() => {
  const previousSelectArmy = selectArmy;
  const previousCalculateChampionCost = calculateChampionCost;
  const previousDescribeEntry = describeEntry;
  const previousRenderRegimentEditor = renderRegimentEditor;
  const previousWireEditorControls = wireEditorControls;
  const previousRosterPadNotes = rosterPadNotes;
  const previousRosterPadChampionRow = rosterPadChampionRow;

  const TOMB_CHAMPION = {
    id: "tomb_champion",
    name: "Tomb Champion",
    profileId: "tomb_champion",
    cost: { base: 30, add: { type: "unit_model_cost" } },
    magicItems: { maximum: 1, allowedPools: ["common", "undead"] }
  };

  const MUMMY_CHAMPION = {
    id: "mummy_champion",
    name: "Mummy Champion",
    profileId: "mummy_champion",
    cost: { base: 60 },
    equipment: ["light_armour", "double_handed_weapon"],
    magicItems: { maximum: 1, allowedPools: ["common", "undead"] }
  };

  function isTombGuards(unit) {
    return state.data?.faction?.id === "tomb_kings" && unit?.id === "tomb_guards";
  }

  function selectedChampion(entry) {
    return entry?.champion?.type === "mummy_champion" ? MUMMY_CHAMPION : TOMB_CHAMPION;
  }

  function withSelectedChampion(entry, unit, fn) {
    if (!isTombGuards(unit)) return fn();
    const original = unit.champion;
    unit.champion = selectedChampion(entry);
    try {
      return fn();
    } finally {
      unit.champion = original;
    }
  }

  function applyTombGuardChampionFix() {
    if (state.data?.faction?.id !== "tomb_kings") return;
    const tombGuards = state.data.faction.regiments?.find(unit => unit.id === "tomb_guards");
    if (!tombGuards) return;
    tombGuards.champion = { ...TOMB_CHAMPION };
    tombGuards.championChoices = [TOMB_CHAMPION, MUMMY_CHAMPION];
  }

  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    applyTombGuardChampionFix();
    if (state.data?.faction?.id === "tomb_kings") {
      renderUnitBrowser();
      renderArmy();
    }
  };

  calculateChampionCost = function(entry, unit) {
    return withSelectedChampion(entry, unit, () => previousCalculateChampionCost(entry, unit));
  };

  describeEntry = function(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return withSelectedChampion(entry, unit, () => previousDescribeEntry(entry));
  };

  renderRegimentEditor = function(entry, unit) {
    let html = withSelectedChampion(entry, unit, () => previousRenderRegimentEditor(entry, unit));
    if (!isTombGuards(unit)) return html;

    const choice = selectedChampion(entry).id;
    const selector = `
      <div class="dialog-field tomb-guard-champion-choice">
        <label>Champion type</label>
        <select data-tomb-guard-champion-type>
          <option value="tomb_champion" ${choice === "tomb_champion" ? "selected" : ""}>Tomb Champion (30 pts + one Tomb Guard)</option>
          <option value="mummy_champion" ${choice === "mummy_champion" ? "selected" : ""}>Mummy Champion (60 pts)</option>
        </select>
        <div class="field-hint">Choose which champion type to add, then tick the champion checkbox below. The Mummy Champion has light armour and a double handed weapon.</div>
      </div>
    `;

    return html.replace(
      /(<section class="editor-section">\s*<h3 class="editor-section-title">Champion<\/h3>)/,
      `$1${selector}`
    );
  };

  wireEditorControls = function() {
    previousWireEditorControls();
    const selector = els.dialogContent.querySelector("[data-tomb-guard-champion-type]");
    if (!selector || !state.draft) return;
    selector.addEventListener("change", () => {
      state.draft.champion.type = selector.value;
      state.draft.champion.magicItems = [];
      renderEditor();
    });
  };

  rosterPadNotes = function(entry, unit) {
    return withSelectedChampion(entry, unit, () => {
      const notes = previousRosterPadNotes(entry, unit);
      if (isTombGuards(unit) && entry.champion?.selected && entry.champion?.type === "mummy_champion") {
        if (!notes.includes("Light Armour")) notes.push("Light Armour");
        if (!notes.includes("Double Handed Weapon")) notes.push("Double Handed Weapon");
      }
      return notes;
    });
  };

  rosterPadChampionRow = function(entry, unit) {
    return withSelectedChampion(entry, unit, () => previousRosterPadChampionRow(entry, unit));
  };

  window.whrApplyTombGuardChampionFix = applyTombGuardChampionFix;
  window.whrTombGuardChampionForEntry = selectedChampion;
})();
;
/* ===== END tomb_kings_champion_fix.js ===== */

/* ===== BEGIN classic_undead_champion_fix.js ===== */
// Classic Undead selectable regimental champion support.
(() => {
  const previousCalculateChampionCost = calculateChampionCost;
  const previousDescribeEntry = describeEntry;
  const previousRenderRegimentEditor = renderRegimentEditor;
  const previousWireEditorControls = wireEditorControls;
  const previousRosterPadChampionRow = rosterPadChampionRow;

  const CHOICES = {
    zombies: [
      { id: "wight", name: "Wight Champion", profileId: "wight_champion", cost: 25 },
      { id: "vampire_thrall", name: "Von Carstein Vampire Thrall", profileId: "vampire_thrall", cost: 60 },
      { id: "wraith", name: "Wraith Champion", profileId: "wraith_champion", cost: 50 }
    ],
    skeleton_warriors: [
      { id: "wight", name: "Wight Champion", profileId: "wight_champion", cost: 35 },
      { id: "vampire_thrall", name: "Von Carstein Vampire Thrall", profileId: "vampire_thrall", cost: 70 },
      { id: "wraith", name: "Wraith Champion", profileId: "wraith_champion", cost: 60 }
    ],
    skeleton_horsemen: [
      { id: "wight", name: "Wight Champion", profileId: "wight_champion", cost: 50, mounted: true },
      { id: "vampire_thrall", name: "Mounted Von Carstein Vampire Thrall", profileId: "vampire_thrall", cost: 80, mounted: true },
      { id: "wraith", name: "Mounted Wraith Champion", profileId: "wraith_champion", cost: 70, mounted: true }
    ]
  };

  function isClassicUndead() {
    return state.data?.faction?.id === "classic_undead";
  }

  function choicesFor(unit) {
    return isClassicUndead() ? (CHOICES[unit?.id] || null) : null;
  }

  function selectedChoice(entry, unit) {
    const choices = choicesFor(unit);
    if (!choices) return null;
    const id = entry?.champion?.choiceId || choices[0].id;
    return choices.find(choice => choice.id === id) || choices[0];
  }

  function championDefinition(entry, unit) {
    const choice = selectedChoice(entry, unit);
    if (!choice) return unit.champion;
    return {
      name: choice.name,
      profileId: choice.profileId,
      cost: { base: choice.cost },
      magicItems: {
        maximum: 1,
        allowedPools: ["common", "undead"]
      },
      mounted: Boolean(choice.mounted)
    };
  }

  function withSelectedChampion(entry, unit, fn) {
    if (!choicesFor(unit)) return fn();
    const original = unit.champion;
    unit.champion = championDefinition(entry, unit);
    try {
      return fn();
    } finally {
      unit.champion = original;
    }
  }

  calculateChampionCost = function(entry, unit) {
    return withSelectedChampion(entry, unit, () => previousCalculateChampionCost(entry, unit));
  };

  describeEntry = function(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    let text = withSelectedChampion(entry, unit, () => previousDescribeEntry(entry));
    if (!choicesFor(unit) || !entry.champion?.selected) return text;
    const choice = selectedChoice(entry, unit);
    if (!choice) return text;
    if (!text.includes(choice.name)) {
      text = `${text === "Base configuration" ? "" : text + " · "}${choice.name}`;
    }
    return text;
  };

  renderRegimentEditor = function(entry, unit) {
    let html = withSelectedChampion(entry, unit, () => previousRenderRegimentEditor(entry, unit));
    const choices = choicesFor(unit);
    if (!choices) return html;

    const selected = selectedChoice(entry, unit);
    const selector = `
      <div class="dialog-field classic-undead-champion-choice">
        <label>Champion type</label>
        <select data-classic-undead-champion-type>
          ${choices.map(choice => `<option value="${escapeHtml(choice.id)}" ${selected?.id === choice.id ? "selected" : ""}>${escapeHtml(choice.name)} (${formatPoints(choice.cost)} pts)</option>`).join("")}
        </select>
        <div class="field-hint">Choose which champion type to add, then tick the champion checkbox below.</div>
      </div>
    `;

    return html.replace(
      /(<section class="editor-section">\s*<h3 class="editor-section-title">Champion<\/h3>)/,
      `$1${selector}`
    );
  };

  wireEditorControls = function() {
    previousWireEditorControls();
    const selector = els.dialogContent.querySelector("[data-classic-undead-champion-type]");
    if (!selector || !state.draft) return;
    selector.addEventListener("change", () => {
      state.draft.champion.choiceId = selector.value;
      state.draft.champion.magicItems = [];
      renderEditor();
    });
  };

  rosterPadChampionRow = function(entry, unit) {
    return withSelectedChampion(entry, unit, () => previousRosterPadChampionRow(entry, unit));
  };
})();
;
/* ===== END classic_undead_champion_fix.js ===== */

/* ===== BEGIN roster_interactions.js ===== */
// Generic roster interactions: duplicate configured regiments and reorder them by drag/drop.
(() => {
  let dragState = null;
  let touchState = null;

  function clearMagicDuplicates(entry) {
    const removed = Boolean(
      entry.magicBanner ||
      (entry.magicItems || []).length ||
      (entry.champion?.magicItems || []).length
    );

    entry.magicBanner = null;
    entry.magicItems = [];
    if (entry.champion) entry.champion.magicItems = [];
    return removed;
  }

  function duplicateRegiment(entryId) {
    const source = state.roster.find(entry => entry.id === entryId);
    if (!source || source.sectionKey !== "regiments") return;

    // Go through the final wrapped addUnit implementation first. This preserves
    // faction-specific 0-1, prerequisite and other construction guards.
    const idsBefore = new Set(state.roster.map(entry => entry.id));
    addUnit(source.sectionKey, source.unitId);

    const added = state.roster.find(entry => !idsBefore.has(entry.id));
    if (!added) return; // A faction rule blocked the duplicate and already explained why.

    const copy = clone(source);
    copy.id = added.id;

    // WHR magic items and magic banners are army-unique. Copy all mundane
    // configuration, command and champion settings, but never manufacture a
    // second copy of a unique magic item/banner.
    const omittedUniqueMagic = clearMagicDuplicates(copy);

    const addedIndex = state.roster.findIndex(entry => entry.id === added.id);
    if (addedIndex >= 0) state.roster.splice(addedIndex, 1);

    const sourceIndex = state.roster.findIndex(entry => entry.id === source.id);
    state.roster.splice(sourceIndex + 1, 0, copy);

    renderArmy();
    showToast(omittedUniqueMagic
      ? "Regiment copied; unique magic items/banner were not duplicated"
      : "Regiment copied");
  }

  function reorderWithinSection(draggedId, targetId, before) {
    if (!draggedId || !targetId || draggedId === targetId) return;

    const dragged = state.roster.find(entry => entry.id === draggedId);
    const target = state.roster.find(entry => entry.id === targetId);
    if (!dragged || !target || dragged.sectionKey !== target.sectionKey) return;

    const ordered = state.roster.filter(entry =>
      entry.sectionKey === dragged.sectionKey && entry.id !== draggedId
    );
    const targetIndex = ordered.findIndex(entry => entry.id === targetId);
    if (targetIndex < 0) return;

    ordered.splice(targetIndex + (before ? 0 : 1), 0, dragged);

    let cursor = 0;
    state.roster = state.roster.map(entry =>
      entry.sectionKey === dragged.sectionKey ? ordered[cursor++] : entry
    );

    renderArmy();
    showToast("Regiment order updated");
  }

  function clearDropMarkers() {
    els.roster.querySelectorAll(".roster-card-drop-before, .roster-card-drop-after, .roster-card-dragging")
      .forEach(card => card.classList.remove(
        "roster-card-drop-before",
        "roster-card-drop-after",
        "roster-card-dragging"
      ));
  }

  function markDropTarget(card, clientY) {
    els.roster.querySelectorAll(".roster-card-drop-before, .roster-card-drop-after")
      .forEach(other => other.classList.remove("roster-card-drop-before", "roster-card-drop-after"));

    if (!card) return null;
    const rect = card.getBoundingClientRect();
    const before = clientY < rect.top + rect.height / 2;
    card.classList.add(before ? "roster-card-drop-before" : "roster-card-drop-after");
    return before;
  }

  function wireDesktopDrag(card, handle, entry) {
    handle.draggable = true;

    handle.addEventListener("dragstart", event => {
      dragState = { id: entry.id, sectionKey: entry.sectionKey };
      card.classList.add("roster-card-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", entry.id);
    });

    handle.addEventListener("dragend", () => {
      dragState = null;
      clearDropMarkers();
    });

    card.addEventListener("dragover", event => {
      if (!dragState || dragState.sectionKey !== entry.sectionKey || dragState.id === entry.id) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      markDropTarget(card, event.clientY);
    });

    card.addEventListener("drop", event => {
      if (!dragState || dragState.sectionKey !== entry.sectionKey || dragState.id === entry.id) return;
      event.preventDefault();
      const before = markDropTarget(card, event.clientY);
      const draggedId = dragState.id;
      dragState = null;
      clearDropMarkers();
      reorderWithinSection(draggedId, entry.id, before);
    });
  }

  function wirePointerDrag(card, handle, entry) {
    handle.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" || event.button !== 0) return;
      event.preventDefault();
      touchState = {
        id: entry.id,
        sectionKey: entry.sectionKey,
        pointerId: event.pointerId,
        targetId: null,
        before: true
      };
      handle.setPointerCapture?.(event.pointerId);
      card.classList.add("roster-card-dragging");
    });

    handle.addEventListener("pointermove", event => {
      if (!touchState || touchState.pointerId !== event.pointerId) return;
      event.preventDefault();
      const targetCard = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".roster-card[data-entry-id]");
      if (!targetCard || targetCard.dataset.entryId === touchState.id || targetCard.dataset.sectionKey !== touchState.sectionKey) {
        touchState.targetId = null;
        clearDropMarkers();
        card.classList.add("roster-card-dragging");
        return;
      }
      touchState.targetId = targetCard.dataset.entryId;
      touchState.before = markDropTarget(targetCard, event.clientY);
      card.classList.add("roster-card-dragging");
    });

    const finish = event => {
      if (!touchState || touchState.pointerId !== event.pointerId) return;
      const completed = touchState;
      touchState = null;
      try { handle.releasePointerCapture?.(event.pointerId); } catch (_) {}
      clearDropMarkers();
      if (completed.targetId) reorderWithinSection(completed.id, completed.targetId, completed.before);
    };

    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
  }

  function decorateRegimentCards() {
    if (!state.data || !els.roster || !state.roster.length) return;

    const regimentSection = [...els.roster.querySelectorAll(".roster-section")]
      .find(section => section.querySelector(".roster-section-title")?.textContent.trim() === "Regiments");
    if (!regimentSection) return;

    const entries = state.roster.filter(entry => entry.sectionKey === "regiments");
    const cards = [...regimentSection.querySelectorAll(".roster-card")];

    cards.forEach((card, index) => {
      const entry = entries[index];
      if (!entry) return;

      card.dataset.entryId = entry.id;
      card.dataset.sectionKey = entry.sectionKey;

      const actions = card.querySelector(".roster-card-actions");
      if (!actions) return;

      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "roster-drag-handle";
      handle.setAttribute("aria-label", "Drag to reorder regiment");
      handle.title = "Drag to reorder";
      handle.textContent = "↕";
      actions.prepend(handle);

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "duplicate-button";
      copyButton.textContent = "Copy";
      copyButton.title = "Duplicate this regiment";
      copyButton.addEventListener("click", () => duplicateRegiment(entry.id));

      const editButton = actions.querySelector("[data-edit]");
      if (editButton) editButton.insertAdjacentElement("afterend", copyButton);
      else actions.append(copyButton);

      wireDesktopDrag(card, handle, entry);
      wirePointerDrag(card, handle, entry);
    });
  }

  const previousRenderArmy = renderArmy;
  renderArmy = function() {
    const result = previousRenderArmy.apply(this, arguments);
    decorateRegimentCards();
    return result;
  };

  // Expose tiny hooks for browser regression tests.
  window.whrDuplicateRegiment = duplicateRegiment;
  window.whrReorderRosterEntry = reorderWithinSection;
})();
;
/* ===== END roster_interactions.js ===== */

/* ===== BEGIN unit_model_count.js ===== */
// Show the actual physical model count represented by each per-model regiment entry.
// A champion using add.type = "unit_model_cost" is an additional model, so it increases
// the displayed total by one. This is display-only and does not change any points logic.
(() => {
  function totalModelsForEntry(entry, unit) {
    if (!entry || !unit || unit.points?.type !== "per_model") return null;

    const baseModels = Math.max(0, Number(entry.size || 0));
    const championIsExtraModel = Boolean(
      entry.champion?.selected &&
      unit.champion?.cost?.add?.type === "unit_model_cost"
    );

    return {
      total: baseModels + (championIsExtraModel ? 1 : 0),
      base: baseModels,
      championIsExtraModel
    };
  }

  function decorateModelCounts() {
    if (!els.roster || !state.data) return;

    els.roster.querySelectorAll("[data-edit]").forEach(editButton => {
      const entry = state.roster.find(item => item.id === editButton.dataset.edit);
      if (!entry) return;

      const unit = getUnit(entry.sectionKey, entry.unitId);
      const count = totalModelsForEntry(entry, unit);
      if (!count) return;

      const card = editButton.closest(".roster-card");
      if (!card || card.querySelector(".unit-model-count")) return;

      const name = card.querySelector(".roster-card-name");
      if (!name) return;

      const badge = document.createElement("span");
      badge.className = "unit-model-count";
      badge.textContent = count.championIsExtraModel
        ? `${count.total} models (${count.base} + Champion)`
        : `${count.total} model${count.total === 1 ? "" : "s"}`;
      badge.title = count.championIsExtraModel
        ? `This unit contains ${count.base} regular models plus one additional champion model.`
        : `This unit contains ${count.total} model${count.total === 1 ? "" : "s"}.`;

      name.appendChild(badge);
    });
  }

  const style = document.createElement("style");
  style.textContent = `
    .unit-model-count {
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
      padding: 2px 7px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--surface-soft);
      color: var(--muted);
      font-size: 10px;
      font-weight: 800;
      line-height: 1.35;
      vertical-align: middle;
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);

  const previousRenderArmy = renderArmy;
  renderArmy = function() {
    previousRenderArmy();
    decorateModelCounts();
  };

  window.whrTotalModelsForEntry = totalModelsForEntry;
})();
;
/* ===== END unit_model_count.js ===== */

/* ===== BEGIN unit_scrollbar.js ===== */
// ChromeOS can auto-hide native scrollbars. This custom scrollbar is always
// visible whenever the Add to Army list has overflow, while the list itself
// remains the real scroll container for wheel, trackpad, touch and keyboard.
(() => {
  function initialiseUnitScrollbar() {
    const list = document.querySelector('.unit-sections');
    if (!list || list.closest('.unit-scroll-shell')) return;

    const shell = document.createElement('div');
    shell.className = 'unit-scroll-shell';
    list.parentNode.insertBefore(shell, list);
    shell.appendChild(list);

    const track = document.createElement('div');
    track.className = 'unit-custom-scrollbar';
    track.setAttribute('aria-hidden', 'true');

    const thumb = document.createElement('div');
    thumb.className = 'unit-custom-scrollbar-thumb';
    thumb.tabIndex = -1;
    track.appendChild(thumb);
    shell.appendChild(track);

    const TRACK_INSET = 2;
    const MIN_THUMB = 46;

    function metrics() {
      const viewport = list.clientHeight;
      const content = list.scrollHeight;
      const trackHeight = Math.max(0, track.clientHeight - TRACK_INSET * 2);
      const overflow = Math.max(0, content - viewport);
      const thumbHeight = overflow > 0
        ? Math.max(MIN_THUMB, Math.min(trackHeight, trackHeight * viewport / content))
        : trackHeight;
      const travel = Math.max(0, trackHeight - thumbHeight);
      return { viewport, content, trackHeight, overflow, thumbHeight, travel };
    }

    function syncThumb() {
      const m = metrics();
      track.hidden = m.overflow <= 1;
      if (track.hidden) return;

      const ratio = m.overflow ? list.scrollTop / m.overflow : 0;
      thumb.style.height = `${m.thumbHeight}px`;
      thumb.style.transform = `translateY(${Math.max(0, Math.min(m.travel, ratio * m.travel))}px)`;
    }

    list.addEventListener('scroll', syncThumb, { passive: true });

    let dragStartY = 0;
    let dragStartScrollTop = 0;

    thumb.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const m = metrics();
      if (!m.overflow || !m.travel) return;

      dragStartY = event.clientY;
      dragStartScrollTop = list.scrollTop;
      thumb.classList.add('is-dragging');
      thumb.setPointerCapture(event.pointerId);
    });

    thumb.addEventListener('pointermove', event => {
      if (!thumb.hasPointerCapture(event.pointerId)) return;
      const m = metrics();
      if (!m.overflow || !m.travel) return;

      const delta = event.clientY - dragStartY;
      list.scrollTop = dragStartScrollTop + (delta / m.travel) * m.overflow;
    });

    const endDrag = event => {
      if (thumb.hasPointerCapture(event.pointerId)) thumb.releasePointerCapture(event.pointerId);
      thumb.classList.remove('is-dragging');
    };
    thumb.addEventListener('pointerup', endDrag);
    thumb.addEventListener('pointercancel', endDrag);

    track.addEventListener('pointerdown', event => {
      if (event.target === thumb) return;
      event.preventDefault();
      const m = metrics();
      if (!m.overflow || !m.travel) return;

      const rect = track.getBoundingClientRect();
      const desiredThumbTop = event.clientY - rect.top - TRACK_INSET - m.thumbHeight / 2;
      const ratio = Math.max(0, Math.min(1, desiredThumbTop / m.travel));
      list.scrollTop = ratio * m.overflow;
    });

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(syncThumb);
      resizeObserver.observe(list);
      resizeObserver.observe(shell);
    }

    const mutationObserver = new MutationObserver(syncThumb);
    mutationObserver.observe(list, { childList: true, subtree: true });

    window.addEventListener('resize', syncThumb, { passive: true });
    requestAnimationFrame(syncThumb);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseUnitScrollbar, { once: true });
  } else {
    initialiseUnitScrollbar();
  }
})();
;
/* ===== END unit_scrollbar.js ===== */

/* ===== BEGIN roster_pad_sort.js ===== */
// Roster Pad display ordering only.
// General first, then Special Characters, Characters, Regiments and War Machines.
// Within each group, print highest-point entries first. The builder's roster order is unchanged.
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

  function sortedRosterPadEntries(roster) {
    return roster
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
    const originalCalculateRegimentPoints = calculateRegimentPoints;

    // The existing exporter reads state.roster directly. Swap in a sorted shallow copy
    // only for the duration of printing, then restore the builder's real roster order.
    state.roster = sortedRosterPadEntries(originalRoster);

    // Regiment composition rules can depend on original instance order, so calculate
    // that percentage against the real builder roster even while the print rows are sorted.
    calculateRegimentPoints = function() {
      const currentRoster = state.roster;
      state.roster = originalRoster;
      try {
        return originalCalculateRegimentPoints();
      } finally {
        state.roster = currentRoster;
      }
    };

    try {
      return previousExportPrintableRoster();
    } finally {
      state.roster = originalRoster;
      calculateRegimentPoints = originalCalculateRegimentPoints;
    }
  };

  window.whrSortedRosterPadEntries = sortedRosterPadEntries;
})();
;
/* ===== END roster_pad_sort.js ===== */

/* ===== BEGIN roster_pad_layout_fix.js ===== */
// Keep the Roster Pad screen controls in their own row so they never cover
// the army-name box. The existing printable sheet itself is left unchanged.
(() => {
  const button = document.getElementById('printRosterBtn');
  if (!button || typeof exportPrintableRoster !== 'function') return;

  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const originalOpen = window.open;
    let rosterWindow = null;

    window.open = function(...args) {
      rosterWindow = originalOpen.apply(window, args);
      return rosterWindow;
    };

    try {
      exportPrintableRoster();
    } finally {
      window.open = originalOpen;
    }

    if (!rosterWindow || !rosterWindow.document) return;

    const applyLayoutFix = () => {
      const doc = rosterWindow.document;
      if (!doc.head || doc.getElementById('whr-roster-pad-layout-fix')) return;

      const style = doc.createElement('style');
      style.id = 'whr-roster-pad-layout-fix';
      style.textContent = `
        .print-controls {
          position: static !important;
          width: min(277mm, calc(100% - 28px));
          margin: 12px auto 8px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
        }

        @media (max-width: 760px) {
          .print-controls {
            width: calc(100% - 20px);
            margin: 10px auto 7px;
          }
        }

        @media print {
          .print-controls { display: none !important; }
        }
      `;
      doc.head.appendChild(style);
    };

    applyLayoutFix();
    rosterWindow.addEventListener('load', applyLayoutFix, { once: true });
  }, true);
})();
;
/* ===== END roster_pad_layout_fix.js ===== */

/* ===== BEGIN swarm_unit_fixes.js ===== */
// Normalise swarm unit sizing across all WHR army books.
// All swarms are multi-model units with a minimum size of 3 models.
(() => {
  const SWARM_MINIMUM = 3;
  const SECTIONS = ["regiments", "warMachines"];

  function isSwarm(unit) {
    if (!unit) return false;
    const tags = unit.tags || [];
    return tags.includes("swarm") || /swarm/i.test(`${unit.id || ""} ${unit.name || ""}`);
  }

  function normaliseSwarm(unit) {
    if (!isSwarm(unit)) return false;

    unit.tags = Array.from(new Set([...(unit.tags || []), "swarm"]));
    unit.points = { ...(unit.points || {}), type: "per_model" };
    unit.size = { ...(unit.size || {}), minimum: SWARM_MINIMUM };
    return true;
  }

  function normaliseCurrentArmy() {
    if (!state.data?.faction) return false;
    let changed = false;

    for (const section of SECTIONS) {
      for (const unit of state.data.faction[section] || []) {
        changed = normaliseSwarm(unit) || changed;
      }
    }

    return changed;
  }

  // Patch every army after all faction-specific loaders have finished.
  const oldSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    const result = await oldSelectArmy(armyId);
    if (normaliseCurrentArmy()) {
      buildIndexes();
      renderUnitBrowser();
      renderArmy();
    }
    return result;
  };

  // Swarms do not use the normal 50-point regiment minimum when choosing
  // their starting size; they always begin at their rules minimum of 3.
  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isSwarm(unit)) entry.size = Math.max(SWARM_MINIMUM, Number(unit.size?.minimum || 0));
    return entry;
  };

  // Several swarm choices live in War Machines / Monsters rather than the
  // Regiments section. The generic war-machine editor does not normally show
  // a model-count field, so add one specifically for swarms.
  const oldRenderWarMachineEditor = renderWarMachineEditor;
  renderWarMachineEditor = function(entry, unit) {
    let html = oldRenderWarMachineEditor(entry, unit);
    if (!isSwarm(unit)) return html;

    const sizeEditor = `
      <section class="editor-section">
        <h3 class="editor-section-title">Unit Size</h3>
        <div class="dialog-field">
          <label for="edit-size">Number of models</label>
          <input id="edit-size" type="number" min="${SWARM_MINIMUM}" step="1"
            value="${Math.max(SWARM_MINIMUM, Number(entry.size || SWARM_MINIMUM))}" data-field="size">
          <div class="field-hint">
            Base cost: ${formatPoints(unit.points?.value || 0)} pts per model. Swarms must contain at least ${SWARM_MINIMUM} models.
          </div>
        </div>
      </section>
    `;

    return sizeEditor + html;
  };

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (isSwarm(unit)) {
        const size = Number(state.draft.size || 0);
        if (!Number.isInteger(size) || size < SWARM_MINIMUM) {
          alert(`Swarms must contain at least ${SWARM_MINIMUM} models.`);
          return;
        }
      }
    }
    return oldSaveEditor();
  };
})();
;
/* ===== END swarm_unit_fixes.js ===== */

/* ===== BEGIN vampire_wraith_steed_fix.js ===== */
// Show Undead Steed stats on the Roster Pad when Vampire Counts Wraiths buy ethereal steeds.
(() => {
  const previousRosterPadRow = rosterPadRow;

  rosterPadRow = function(entry) {
    let html = previousRosterPadRow(entry);
    if (state.data?.faction?.id !== "vampire_counts" || entry?.unitId !== "wraiths") return html;
    if (!entry.optionSelections?.ethereal_undead_steeds) return html;

    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit || String(html).includes("Wraiths' Ethereal Undead Steeds")) return html;

    const mountRow = rosterPadUnitMountRow(entry, {
      ...unit,
      unitMount: {
        mountId: "undead_steed",
        name: "Wraiths' Ethereal Undead Steeds",
        quantity: "per_model",
        equipment: []
      }
    });

    if (!mountRow) return html;
    return html + mountRow;
  };
})();
;
/* ===== END vampire_wraith_steed_fix.js ===== */

/* ===== BEGIN global_zero_one.js ===== */
// Global WHR 0-1 / unique-unit enforcement.
// Any unit explicitly marked 0-1, maxUnits:1, any Special Character, and any
// flying regiment may only be included once. The Add to Army entry is labelled
// consistently from the same rule.
(() => {
  function hasZeroOneRule(unit) {
    return (unit?.rules || []).some(rule => /^0\s*-\s*1$/i.test(String(rule).trim()));
  }

  function isFlyingRegiment(sectionKey, unit) {
    if (sectionKey !== "regiments" || !unit) return false;

    const tags = (unit.tags || []).map(tag => String(tag).toLowerCase());
    const type = String(unit.unitType || "").toLowerCase();
    const rules = (unit.rules || []).map(rule => String(rule).toLowerCase());

    if (tags.some(tag => ["flying", "flyer", "flying_regiment", "flying regiment"].includes(tag))) return true;
    if (/flying[_\s-]?regiment/.test(type)) return true;

    // Some army books store Fly as a reference rule rather than a tag/type.
    return rules.some(rule =>
      /^fly(?:\s*\([^)]*\))?$/.test(rule.trim()) ||
      /\bflying regiment\b/.test(rule)
    );
  }

  function isUniqueChoice(sectionKey, unit) {
    if (!unit) return false;
    if (sectionKey === "specialCharacters") return true;
    if (Number(unit.maxUnits) === 1) return true;
    if (hasZeroOneRule(unit)) return true;
    if (isFlyingRegiment(sectionKey, unit)) return true;
    return false;
  }

  function markUniqueChoices() {
    if (!state.data?.faction) return;

    for (const section of sectionConfig) {
      for (const unit of state.data.faction[section.key] || []) {
        if (!isUniqueChoice(section.key, unit)) continue;
        unit.maxUnits = 1;
        unit.rules = Array.isArray(unit.rules) ? unit.rules : [];
        if (!hasZeroOneRule(unit)) unit.rules.unshift("0-1");
      }
    }
  }

  function existingCopy(sectionKey, unitId, ignoreEntryId = null) {
    return state.roster.find(entry =>
      entry.id !== ignoreEntryId &&
      entry.sectionKey === sectionKey &&
      entry.unitId === unitId
    ) || null;
  }

  const previousAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    const unit = getUnit(sectionKey, unitId);
    if (isUniqueChoice(sectionKey, unit) && existingCopy(sectionKey, unitId)) {
      window.alert(`${unit.name} is a 0-1 choice. Only one unit may be included in the army.`);
      return;
    }
    return previousAddUnit(sectionKey, unitId);
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (state.draft) {
      const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
      if (
        isUniqueChoice(state.draft.sectionKey, unit) &&
        existingCopy(state.draft.sectionKey, state.draft.unitId, state.draft.id)
      ) {
        window.alert(`${unit.name} is a 0-1 choice. Only one unit may be included in the army.`);
        return;
      }
    }
    return previousSaveEditor();
  };

  const previousRenderUnitBrowser = renderUnitBrowser;
  renderUnitBrowser = function() {
    previousRenderUnitBrowser();
    if (!state.data?.faction) return;

    els.unitBrowser.querySelectorAll(".unit-choice").forEach(button => {
      const sectionKey = button.dataset.section;
      const unit = getUnit(sectionKey, button.dataset.unitId);
      if (!isUniqueChoice(sectionKey, unit)) return;

      const meta = button.querySelector(".unit-choice-meta");
      if (meta) meta.textContent = "0-1 choice · Add now, configure in your roster";
      button.dataset.zeroOne = "true";
    });
  };

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!state.data) return;
    markUniqueChoices();
    renderUnitBrowser();
    renderArmy();
  };

  // Expose the rule for regression checks and future army extensions.
  window.whrIsUniqueChoice = isUniqueChoice;
})();
;
/* ===== END global_zero_one.js ===== */

/* ===== BEGIN chaos_daemon_regiment_items.js ===== */
// Chaos Daemon regiment-specific magic items from the WHR army list.
// These are bought by the regiment itself (not a character/champion) and only
// one regiment in the army may take each item.
(() => {
  const CHAOS_IDS = new Set(["chaos_daemons", "chaos_warband", "chaos_warhost"]);

  const ITEMS = [
    { names:["Bloodletters of Khorne"], option:{ id:"the_bloodhorn", label:"The Bloodhorn", type:"toggle", cost:{value:20}, rules:"One regiment only. Bloodletters on foot carrying the Bloodhorn may always march." } },
    { names:["Pink Horrors of Tzeentch"], option:{ id:"the_drum_of_change", label:"The Drum of Change", type:"toggle", cost:{value:30}, rules:"One regiment only. Draw one Tzeentch spell for every full five models in the regiment; the stored spells may be cast from the drum as bound spells, one per magic phase, and are discarded after successful use." } },
    { names:["Plaguebearers of Nurgle"], option:{ id:"the_gong_of_despair", label:"The Gong of Despair", type:"toggle", cost:{value:30}, rules:"One regiment only. Plaguebearers on foot carrying the Gong always count as outnumbering an enemy they beat in melee combat." } },
    { names:["Daemonettes of Slaanesh"], option:{ id:"the_siren_flute", label:"The Siren Flute", type:"toggle", cost:{value:10}, rules:"One regiment only. Enemies may not Stand and Shoot as a charge reaction against Daemonettes on foot carrying the Siren Flute." } }
  ];

  const normalise = value => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  function isRelevantChaosArmy(){ return state.data?.faction?.id === "chaos" && CHAOS_IDS.has(state.selectedArmyId); }
  function patchRegiments(){
    if (!isRelevantChaosArmy()) return;
    const regiments = state.data?.faction?.regiments || [];
    for (const config of ITEMS) {
      const wanted = new Set(config.names.map(normalise));
      const unit = regiments.find(candidate => wanted.has(normalise(candidate.name)));
      if (!unit) continue;
      unit.options = unit.options || [];
      if (!unit.options.some(option => option.id === config.option.id)) unit.options.push({ ...config.option });
    }
  }

  // New armies pass through selectArmy(), but cloud/local saved-army loading can
  // replace state.data directly and then call buildIndexes(). Patch at that common
  // point as well so daemon regiment items are restored regardless of load path.
  const previousBuildIndexes = buildIndexes;
  buildIndexes = function(){
    previousBuildIndexes();
    patchRegiments();
  };

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId){ await previousSelectArmy(armyId); patchRegiments(); if (isRelevantChaosArmy()){ renderUnitBrowser(); renderArmy(); } };

  const previousRenderUnitOptions = renderUnitOptions;
  renderUnitOptions = function(entry, unit){
    let html = previousRenderUnitOptions(entry, unit);
    if (!isRelevantChaosArmy()) return html;
    for (const {option} of ITEMS) {
      if (!(unit.options || []).some(candidate => candidate.id === option.id)) continue;
      html = html.replaceAll(`>${escapeHtml(humanise(option.id))}<`, `>${escapeHtml(option.label)}<`);
    }
    return html;
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function(){
    if (isRelevantChaosArmy() && state.draft?.sectionKey === "regiments") {
      for (const {option} of ITEMS) {
        if (!state.draft.optionSelections?.[option.id]) continue;
        const alreadyUsed = state.roster.some(entry => entry.id !== state.draft.id && Boolean(entry.optionSelections?.[option.id]));
        if (alreadyUsed) { window.alert(`${option.label} may only be taken by one regiment in the army.`); return; }
      }
    }
    previousSaveEditor();
  };
})();
;
/* ===== END chaos_daemon_regiment_items.js ===== */

/* ===== BEGIN dogs_of_war_regiments_of_renown.js ===== */
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

// Roster Pad support for the three Regiments of Renown that were already in
// the compact Dogs of War payload. Their leaders are compulsory champions, and
// Oglah Khan's Wolfboyz are all mounted on Giant Wolves.
(() => {
  const isDoW = () => state.data?.faction?.id === "dogs_of_war" && state.selectedArmyId === "dogs_of_war";

  const SUPPORT_PROFILES = [
    {id:"dow_richter_kreugar",name:"Richter Kreugar",stats:{M:4,WS:5,BS:0,S:5,T:5,W:2,I:5,A:3,Ld:9}},
    {id:"dow_oglah_khan",name:"Oglah Khan",stats:{M:4,WS:5,BS:5,S:4,T:4,W:2,I:4,A:3,Ld:7}},
    {id:"dow_giant_wolf",name:"Giant Wolf",stats:{M:9,WS:4,BS:0,S:3,T:3,W:1,I:3,A:1,Ld:3}}
  ];

  function patchRosterPadProfiles() {
    if (!isDoW() || state.data.__dowRorRosterPadProfilesPatched) return;
    state.data.__dowRorRosterPadProfilesPatched = true;

    state.data.profiles = state.data.profiles || [];
    for (const profile of SUPPORT_PROFILES) {
      if (!state.data.profiles.some(existing => existing.id === profile.id)) state.data.profiles.push(profile);
    }

    state.data.mounts = state.data.mounts || [];
    if (!state.data.mounts.some(mount => mount.id === "dow_giant_wolf")) {
      state.data.mounts.push({
        id:"dow_giant_wolf",
        name:"Giant Wolf",
        profileId:"dow_giant_wolf",
        type:"cavalry_mount",
        displayProfileOnRoster:true
      });
    }

    const regiments = state.data.faction?.regiments || [];

    const cursed = regiments.find(unit => unit.id === "cursed_company");
    if (cursed) {
      cursed.champion = cursed.champion || {};
      cursed.champion.name = "Richter Kreugar";
      cursed.champion.profileId = "dow_richter_kreugar";
      cursed.champion.cost = cursed.champion.cost || {value:0};
    }

    const wolfboyz = regiments.find(unit => unit.id === "oglah_khans_wolfboyz");
    if (wolfboyz) {
      wolfboyz.champion = wolfboyz.champion || {};
      wolfboyz.champion.name = "Oglah Khan";
      wolfboyz.champion.profileId = "dow_oglah_khan";
      wolfboyz.champion.cost = wolfboyz.champion.cost || {value:0};
      wolfboyz.unitMount = {
        mountId:"dow_giant_wolf",
        name:"Giant Wolves"
      };
    }

    if (typeof buildIndexes === "function") buildIndexes();
  }

  const oldSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await oldSelectArmy(armyId);
    patchRosterPadProfiles();
    if (isDoW()) {
      // Existing/new RoR entries use compulsory leaders; make sure any roster
      // created before this fix also prints the leader profile.
      for (const entry of state.roster || []) {
        if (["cursed_company","oglah_khans_wolfboyz"].includes(entry.unitId)) {
          entry.champion = entry.champion || {magicItems:[]};
          entry.champion.selected = true;
          entry.champion.magicItems = entry.champion.magicItems || [];
        }
      }
      renderArmy();
    }
  };

  const oldLoadRoster = loadRoster;
  loadRoster = async function(id) {
    await oldLoadRoster(id);
    patchRosterPadProfiles();
    if (isDoW()) {
      for (const entry of state.roster || []) {
        if (["cursed_company","oglah_khans_wolfboyz"].includes(entry.unitId)) {
          entry.champion = entry.champion || {magicItems:[]};
          entry.champion.selected = true;
          entry.champion.magicItems = entry.champion.magicItems || [];
        }
      }
      renderArmy();
    }
  };
})();
;
/* ===== END dogs_of_war_regiments_of_renown.js ===== */

/* ===== BEGIN general_system.js ===== */
// Global WHR General selection and validation.
(() => {
  state.generalEntryId = state.generalEntryId || null;

  document.head.insertAdjacentHTML("beforeend", `
    <style>
      .general-button {
        min-height: 34px;
        padding: 6px 10px;
        border: 1px solid #b08a3b;
        border-radius: 6px;
        color: #5b4315;
        background: #fff8e8;
        font-size: 12px;
        font-weight: 850;
        white-space: nowrap;
      }
      .general-button:hover { background:#f7e7bd; }
      .general-button.selected {
        color:#fff;
        background:#7b211b;
        border-color:#561713;
      }
      .general-badge {
        display:inline-block;
        margin-left:7px;
        padding:2px 7px;
        border-radius:999px;
        color:#fff;
        background:#7b211b;
        font-size:10px;
        font-weight:900;
        letter-spacing:.05em;
        text-transform:uppercase;
        vertical-align:middle;
      }
      .general-status {
        margin-top:10px;
        padding:10px 12px;
        border:1px solid var(--border);
        border-left:4px solid var(--warning);
        border-radius:7px;
        background:#fff8e8;
        color:var(--text);
        font-size:12px;
        line-height:1.4;
      }
      .general-status.good {
        border-left-color:var(--success);
        background:#f3faf5;
      }
      .general-status strong { color:var(--accent-dark); }
    </style>
  `);

  const GENERAL_SECTIONS = new Set(["characters", "specialCharacters"]);

  function generalRule() {
    return state.data?.globalArmyRules?.general || {};
  }

  function entryUnit(entry) {
    return entry ? getUnit(entry.sectionKey, entry.unitId) : null;
  }

  function entryProfile(entry) {
    const unit = entryUnit(entry);
    return unit ? profileById.get(unit.profileId) || null : null;
  }

  function entryLeadership(entry) {
    const raw = entryProfile(entry)?.stats?.Ld;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  function selectedOptionLooksLikeBsb(entry, unit) {
    for (const option of unit?.options || []) {
      const selected = entry?.optionSelections?.[option.id];
      if (selected == null || selected === false || selected === "" || selected === 0) continue;
      const choice = option.type === "choice_group"
        ? (option.choices || []).find(item => (typeof item === "string" ? item : item.id) === selected)
        : null;
      const text = [
        option.id, option.name, option.label, option.rules,
        typeof choice === "string" ? choice : choice?.id,
        typeof choice === "object" ? choice?.name : null,
        typeof choice === "object" ? choice?.label : null,
        typeof choice === "object" ? choice?.rules : null
      ].filter(Boolean).join(" ").toLowerCase();
      if (/\bbsb\b|battle standard bearer/.test(text)) return true;
    }
    return false;
  }

  function isBattleStandardBearer(entry, unit) {
    const tags = (unit?.tags || []).map(tag => String(tag).toLowerCase());
    const identity = [unit?.id, unit?.name, unit?.profileId, ...(unit?.rules || [])]
      .filter(Boolean).join(" ").toLowerCase();
    return tags.some(tag => tag === "bsb" || tag.includes("battle_standard")) ||
      /\bbsb\b|battle standard bearer/.test(identity) ||
      selectedOptionLooksLikeBsb(entry, unit);
  }

  function armySpecificGeneralEligible(entry, unit) {
    // Bretonnia's Grand Army requires a knightly character, not a wizard.
    if (state.data?.faction?.id === "bretonnia") {
      const tags = unit?.tags || [];
      return tags.includes("knightly") && !tags.includes("wizard");
    }
    return true;
  }

  function entryGeneralEligible(entry) {
    if (!entry || !GENERAL_SECTIONS.has(entry.sectionKey)) return false;
    const unit = entryUnit(entry);
    if (!unit || unit.generalEligible === false) return false;
    if (generalRule().battleStandardBearerEligible === false && isBattleStandardBearer(entry, unit)) return false;
    if (!armySpecificGeneralEligible(entry, unit)) return false;
    return entryLeadership(entry) != null;
  }

  function eligibleEntries() {
    return state.roster.filter(entryGeneralEligible);
  }

  function highestEligibleLeadership() {
    const values = eligibleEntries().map(entryLeadership).filter(value => value != null);
    return values.length ? Math.max(...values) : null;
  }

  function permittedGeneralEntries() {
    const eligible = eligibleEntries();
    if (!generalRule().mustBeAmongHighestLeadership) return eligible;
    const highest = highestEligibleLeadership();
    return eligible.filter(entry => entryLeadership(entry) === highest);
  }

  function selectedGeneralEntry() {
    return state.roster.find(entry => entry.id === state.generalEntryId) || null;
  }

  function normalizeGeneralSelection() {
    if (!state.generalEntryId) return;
    const selected = selectedGeneralEntry();
    const permitted = new Set(permittedGeneralEntries().map(entry => entry.id));
    if (!selected || !permitted.has(selected.id)) state.generalEntryId = null;
  }

  function setGeneral(entryId) {
    const permitted = new Set(permittedGeneralEntries().map(entry => entry.id));
    if (!permitted.has(entryId)) {
      const highest = highestEligibleLeadership();
      window.alert(highest == null
        ? "This army does not currently contain an eligible General."
        : `The General must be chosen from an eligible character with the highest Leadership (${highest}).`);
      return;
    }
    state.generalEntryId = entryId;
    renderArmy();
  }

  function decorateRosterCards() {
    if (!els.roster || !state.roster.length) return;
    const permitted = new Set(permittedGeneralEntries().map(entry => entry.id));

    els.roster.querySelectorAll("[data-edit]").forEach(editButton => {
      const entry = state.roster.find(item => item.id === editButton.dataset.edit);
      if (!entry || !GENERAL_SECTIONS.has(entry.sectionKey)) return;
      const unit = entryUnit(entry);
      const card = editButton.closest(".roster-card");
      const actions = card?.querySelector(".roster-card-actions");
      const name = card?.querySelector(".roster-card-name > span:first-child");
      if (!actions || !name) return;

      if (entry.id === state.generalEntryId) {
        name.insertAdjacentHTML("beforeend", `<span class="general-badge">General</span>`);
      }

      if (permitted.has(entry.id)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `general-button${entry.id === state.generalEntryId ? " selected" : ""}`;
        button.textContent = entry.id === state.generalEntryId ? "General" : "Make General";
        button.addEventListener("click", () => setGeneral(entry.id));
        actions.insertBefore(button, editButton);
      }
    });
  }

  function generalStatusHtml() {
    const eligible = eligibleEntries();
    const permitted = permittedGeneralEntries();
    const selected = selectedGeneralEntry();
    const highest = highestEligibleLeadership();

    if (!eligible.length) {
      return `<div class="general-status"><strong>General required:</strong> add an eligible character to the army.</div>`;
    }

    if (!selected) {
      const names = permitted.map(entry => entryUnit(entry)?.name).filter(Boolean);
      return `<div class="general-status"><strong>Choose a General:</strong> ${
        generalRule().mustBeAmongHighestLeadership && highest != null
          ? `select a highest-Leadership eligible character (Ld ${escapeHtml(highest)}).`
          : "select an eligible character."
      }${names.length ? ` Eligible: ${escapeHtml(names.join(", "))}.` : ""}</div>`;
    }

    const unit = entryUnit(selected);
    return `<div class="general-status good"><strong>General:</strong> ${escapeHtml(unit?.name || "Character")} (Ld ${escapeHtml(entryLeadership(selected))}).</div>`;
  }

  const previousRenderArmy = renderArmy;
  renderArmy = function() {
    normalizeGeneralSelection();
    previousRenderArmy();
    decorateRosterCards();
  };

  const previousRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    previousRenderArmyStatus(total);
    els.armyStatus.insertAdjacentHTML("beforeend", generalStatusHtml());
  };

  const previousMakeRosterSnapshot = makeRosterSnapshot;
  makeRosterSnapshot = function() {
    const snapshot = previousMakeRosterSnapshot();
    snapshot.generalEntryId = state.generalEntryId || null;
    snapshot.schemaVersion = Math.max(2, Number(snapshot.schemaVersion || 1));
    return snapshot;
  };

  const previousLoadRoster = loadRoster;
  loadRoster = async function(id) {
    const saved = getSavedRosters().find(roster => roster.id === id);
    await previousLoadRoster(id);
    if (!saved || state.currentSaveId !== id) return;
    state.generalEntryId = saved.generalEntryId || null;
    normalizeGeneralSelection();
    renderArmy();
  };

  const previousNewRoster = newRoster;
  newRoster = function() {
    const before = state.currentSaveId;
    previousNewRoster();
    if (!state.roster.length && state.currentSaveId !== before) state.generalEntryId = null;
    if (!state.roster.length) state.generalEntryId = null;
  };

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    state.generalEntryId = null;
    return previousSelectArmy(armyId);
  };

  const previousShowArmySelection = showArmySelection;
  showArmySelection = function() {
    const rosterBefore = state.roster;
    previousShowArmySelection();
    if (state.roster !== rosterBefore || !state.data) state.generalEntryId = null;
  };

  // Put the General designation directly onto the printed Roster Pad row.
  const previousPrintableUnitName = printableUnitName;
  printableUnitName = function(entry, unit) {
    const name = previousPrintableUnitName(entry, unit);
    return entry.id === state.generalEntryId ? `${name} [GENERAL]` : name;
  };

  window.whrGeneral = {
    entryGeneralEligible,
    highestEligibleLeadership,
    permittedGeneralEntries,
    setGeneral
  };
})();
;
/* ===== END general_system.js ===== */

/* ===== BEGIN general_overrides.js ===== */
// WHR General edge-case overrides.
// Loaded after general_system.js so exceptional army/item rules take priority
// over the normal highest-Leadership General selection.
(() => {
  if (!window.whrGeneral) return;

  const original = window.whrGeneral;
  const FORCED_ITEM_NAMES = new Set(["forenrond's sword", "forenrond’s sword"]);
  const PROHIBITED_UNIT_PATTERNS = [/\bkorhil\b/i, /\bassassin\b/i];

  function unitFor(entry) {
    return entry ? getUnit(entry.sectionKey, entry.unitId) : null;
  }

  function selectedMagicItems(entry) {
    return (entry?.magicItems || []).map(getMagicItem).filter(Boolean);
  }

  function selectedChampionMagicItems(entry) {
    return (entry?.champion?.magicItems || []).map(getMagicItem).filter(Boolean);
  }

  function hasForenrondsSword(items) {
    return items.some(item => FORCED_ITEM_NAMES.has(String(item?.name || "").trim().toLowerCase()));
  }

  function forcedGeneralTarget() {
    if (Number(state.pointsLimit || 0) < 2000) return null;

    for (const entry of state.roster) {
      if (hasForenrondsSword(selectedMagicItems(entry))) {
        return { entryId: entry.id, model: "character", reason: "Forenrond’s Sword" };
      }
      if (entry.champion?.selected && hasForenrondsSword(selectedChampionMagicItems(entry))) {
        return { entryId: entry.id, model: "champion", reason: "Forenrond’s Sword" };
      }
    }
    return null;
  }

  function unitCannotBeGeneral(entry) {
    const unit = unitFor(entry);
    if (!unit) return false;
    if (unit.generalEligible === false) return true;
    const text = [unit.id, unit.name, unit.profileId, ...(unit.rules || []), ...(unit.tags || [])]
      .filter(Boolean).join(" ");
    return PROHIBITED_UNIT_PATTERNS.some(pattern => pattern.test(text));
  }

  function targetKey(target) {
    if (!target) return null;
    return target.model === "champion" ? `${target.entryId}::champion` : target.entryId;
  }

  function forcedEntry() {
    const target = forcedGeneralTarget();
    return target ? state.roster.find(entry => entry.id === target.entryId) || null : null;
  }

  const previousEligible = original.entryGeneralEligible;
  function entryGeneralEligible(entry) {
    const forced = forcedGeneralTarget();
    if (forced) return entry.id === forced.entryId;
    if (unitCannotBeGeneral(entry)) return false;
    return previousEligible(entry);
  }

  function permittedGeneralEntries() {
    const forced = forcedEntry();
    if (forced) return [forced];
    return original.permittedGeneralEntries().filter(entry => !unitCannotBeGeneral(entry));
  }

  function setGeneral(entryId) {
    const forced = forcedGeneralTarget();
    if (forced) {
      state.generalEntryId = forced.entryId;
      state.generalModel = forced.model;
      renderArmy();
      return;
    }
    state.generalModel = "character";
    return original.setGeneral(entryId);
  }

  window.whrGeneral = {
    ...original,
    entryGeneralEligible,
    permittedGeneralEntries,
    setGeneral,
    forcedGeneralTarget,
    targetKey
  };

  const previousRenderArmy = renderArmy;
  renderArmy = function() {
    const forced = forcedGeneralTarget();
    if (forced) {
      state.generalEntryId = forced.entryId;
      state.generalModel = forced.model;
    } else if (state.generalModel === "champion") {
      state.generalEntryId = null;
      state.generalModel = "character";
    }
    previousRenderArmy();

    if (forced?.model === "champion") {
      const edit = els.roster?.querySelector(`[data-edit="${forced.entryId}"]`);
      const card = edit?.closest(".roster-card");
      const name = card?.querySelector(".roster-card-name > span:first-child");
      if (name && !name.querySelector(".general-badge")) {
        name.insertAdjacentHTML("beforeend", `<span class="general-badge">General (Champion)</span>`);
      }
    }
  };

  const previousSnapshot = makeRosterSnapshot;
  makeRosterSnapshot = function() {
    const snapshot = previousSnapshot();
    snapshot.generalModel = state.generalModel || "character";
    return snapshot;
  };

  const previousLoadRoster = loadRoster;
  loadRoster = async function(id) {
    const saved = getSavedRosters().find(roster => roster.id === id);
    await previousLoadRoster(id);
    if (saved && state.currentSaveId === id) {
      state.generalModel = saved.generalModel || "character";
      renderArmy();
    }
  };

  const previousPrintableUnitName = printableUnitName;
  printableUnitName = function(entry, unit) {
    let name = previousPrintableUnitName(entry, unit);
    const forced = forcedGeneralTarget();
    if (forced?.entryId === entry.id && forced.model === "champion") {
      name = name.replace(/ \[GENERAL\]$/, "");
      return `${name} [GENERAL: CHAMPION]`;
    }
    return name;
  };
})();
;
/* ===== END general_overrides.js ===== */

/* ===== BEGIN dev_roster_pad_sort.js ===== */
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
;
/* ===== END dev_roster_pad_sort.js ===== */
