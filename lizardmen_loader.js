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
