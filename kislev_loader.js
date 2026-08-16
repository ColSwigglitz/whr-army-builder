// Loads the compact Kislev payload and supplies the shared common magic-item pool.
(() => {
  const previousFetch = window.fetch.bind(window);

  async function inflateBase64Gzip(text) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support DecompressionStream.");
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
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

    const empireResponse = await previousFetch("./data/whr_empire_v0_1.json", { cache: "no-store" });
    if (empireResponse.ok) {
      const empire = await empireResponse.json();
      data.commonMagicItems = empire.commonMagicItems || [];
    }

    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  };
})();
