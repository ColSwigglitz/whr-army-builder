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
