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

      // A Daemon Prince using the Small reward may carry the battle standard.
      // Keep this as an explicit builder option; the final Chaos validation
      // enforces Small/no-wings and the special Chaos Banner allowance.
      const daemonPrince = (data.faction?.characters || []).find(unit => unit.id === "daemon_prince");
      if (daemonPrince) {
        daemonPrince.options = daemonPrince.options || [];
        if (!daemonPrince.options.some(option => option.id === "battle_standard")) {
          daemonPrince.options.push({
            id: "battle_standard",
            label: "Battle Standard Bearer",
            type: "toggle",
            cost: { value: 0 }
          });
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
