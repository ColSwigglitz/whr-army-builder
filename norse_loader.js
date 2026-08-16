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
