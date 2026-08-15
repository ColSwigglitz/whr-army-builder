// Dogs of War compact payload plus race-specific borrowed magic-item pools.
(() => {
  const previousFetch = window.fetch.bind(window);
  const clone = value => JSON.parse(JSON.stringify(value));

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

    const sources = [
      ["high_elves", "High Elves", "whr_high_elves_v0_1.json"],
      ["bretonnia", "Bretonnia", "whr_bretonnia_v0_1.json"],
      ["dwarfs", "Dwarfs", "whr_dwarfs_v0_1.json"],
      ["chaos_dwarfs", "Chaos Dwarfs", "whr_chaos_dwarfs_v0_1.json"],
      ["classic_undead", "Undead", "whr_classic_undead_v0_1.json"]
    ];
    for (const [id, name, file] of sources) {
      const source = await fetchArmy(file);
      if (source) addItems(borrowed, source.factionMagicItems, id, name);
    }

    // Human champions are allowed Empire, Kislev and Bretonnia items. Kislev is
    // automatically added later once that army has a populated dataset.
    data.factionMagicItems = borrowed;
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