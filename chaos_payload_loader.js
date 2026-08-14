// Loads the compact shared Chaos army data used by all five Chaos army constructions.
(() => {
  const previousFetch = window.fetch.bind(window);

  async function inflateBase64Gzip(text) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("This browser does not support DecompressionStream.");
    }
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!(url.endsWith("data/whr_chaos_v0_1.json") || url.endsWith("/whr_chaos_v0_1.json"))) {
      return previousFetch(input, init);
    }

    try {
      const payloadResponse = await previousFetch("./data/whr_chaos_v0_1.payload", { cache: "no-store" });
      if (!payloadResponse.ok) return payloadResponse;

      const data = JSON.parse(await inflateBase64Gzip(await payloadResponse.text()));

      if (!data.commonMagicItems?.length) {
        const commonResponse = await previousFetch("./data/whr_empire_v0_1.json", { cache: "no-store" });
        if (commonResponse.ok) {
          const common = await commonResponse.json();
          data.commonMagicItems = common.commonMagicItems || [];
        }
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Unable to load Chaos army data", error);
      return previousFetch(input, init);
    }
  };
})();
