// Loads compact faction data used by armies that are too large to duplicate shared data.
// High Elves stores its faction-specific JSON as a gzip/base64 payload and reuses
// the common magic-item list already present in the Empire data file.
(() => {
  const nativeFetch = window.fetch.bind(window);

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

    if (url.endsWith("data/whr_high_elves_v0_1.json") || url.endsWith("/whr_high_elves_v0_1.json")) {
      const payloadResponse = await nativeFetch("./data/whr_high_elves_v0_1.payload", { cache: "no-store" });
      if (!payloadResponse.ok) return payloadResponse;

      const highElfText = await inflateBase64Gzip(await payloadResponse.text());
      const highElves = JSON.parse(highElfText);

      // Common magic items are game-wide and already live in the Empire data file.
      // Reuse them rather than maintaining a second identical 128-item list.
      const empireResponse = await nativeFetch("./data/whr_empire_v0_1.json", { cache: "no-store" });
      if (!empireResponse.ok) throw new Error("Could not load common magic items.");
      const empire = await empireResponse.json();
      highElves.commonMagicItems = empire.commonMagicItems || [];

      return new Response(JSON.stringify(highElves), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return nativeFetch(input, init);
  };
})();
