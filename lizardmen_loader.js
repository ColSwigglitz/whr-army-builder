// Inflates the pure Lizardmen army payload and loads the shared common magic-item pool.
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
    if (!response.ok || !(url.endsWith("data/whr_lizardmen_v0_1.json") || url.endsWith("/whr_lizardmen_v0_1.json"))) return response;

    try {
      const stub = await response.clone().json();
      const payloadFile = stub?.meta?.payloadFile;
      if (!payloadFile) return response;
      const payloadResponse = await previousFetch(`./data/${payloadFile}`, {cache:"no-store"});
      if (!payloadResponse.ok) throw new Error(`Could not load ${payloadFile}`);
      const data = JSON.parse(await inflate(await payloadResponse.text()));

      const commonResponse = await previousFetch("./data/whr_empire_v0_1.json", {cache:"no-store"});
      if (commonResponse.ok) data.commonMagicItems = (await commonResponse.json()).commonMagicItems || [];

      return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
    } catch (error) {
      console.error("Unable to load populated Lizardmen army data", error);
      return response;
    }
  };
})();
