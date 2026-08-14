// Loads the compact Chaos Dwarfs payload and supplements its magic-item pools.
(() => {
  const previousFetch = window.fetch.bind(window);

  async function inflateBase64Gzip(text) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support DecompressionStream.");
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  function cloneItem(item) {
    return JSON.parse(JSON.stringify(item));
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.endsWith("data/whr_chaos_dwarfs_v0_1.json") && !url.endsWith("/whr_chaos_dwarfs_v0_1.json")) {
      return previousFetch(input, init);
    }

    const payloadResponse = await previousFetch("./data/whr_chaos_dwarfs_v0_1.payload", { cache: "no-store" });
    if (!payloadResponse.ok) throw new Error(`Could not load Chaos Dwarfs payload (${payloadResponse.status})`);
    const data = JSON.parse(await inflateBase64Gzip(await payloadResponse.text()));

    // Common magic items are shared by every army.
    const empireResponse = await previousFetch("./data/whr_empire_v0_1.json", { cache: "no-store" });
    if (empireResponse.ok) {
      const empire = await empireResponse.json();
      data.commonMagicItems = empire.commonMagicItems || [];
    }

    // Greenskin characters/champions in the Chaos Dwarf list are explicitly allowed
    // to select items from the Orcs & Goblins army book. Prefix IDs to avoid clashes.
    const orcResponse = await previousFetch("./data/whr_orcs_goblins_v0_1.json", { cache: "no-store" });
    if (orcResponse.ok) {
      const orcs = await orcResponse.json();
      for (const item of orcs.factionMagicItems || []) {
        const copy = cloneItem(item);
        copy.id = `og_${item.id}`;
        copy.chaosDwarfExternalPool = "orcs_goblins";
        data.factionMagicItems.push(copy);
      }
    }

    // A K'daii Manburner may take one Daemonic Reward from the Chaos "All" list.
    const chaosResponse = await previousFetch("./data/whr_chaos_v0_1.json", { cache: "no-store" });
    if (chaosResponse.ok) {
      const chaos = await chaosResponse.json();
      for (const item of chaos.factionMagicItems || []) {
        if (!item.daemonReward || item.chaosPower) continue;
        const copy = cloneItem(item);
        copy.id = `cd_daemon_${item.id}`;
        copy.category = "daemon_reward";
        copy.chaosDwarfExternalPool = "daemon_reward_all";
        data.factionMagicItems.push(copy);
      }
    }

    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  };
})();
