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