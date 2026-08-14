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
