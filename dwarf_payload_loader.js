// Inflates the populated Dwarf army payload while keeping the manifest JSON compact.
(() => {
  const previousFetch = window.fetch.bind(window);

  const zeroOneIds = new Set([
    "longbeards",
    "hammerers",
    "ironbreakers",
    "rangers",
    "miners",
    "goblin_hewer"
  ]);

  const zeroOneNames = new Set([
    "longbeards",
    "long beards",
    "hammerers",
    "ironbreakers",
    "rangers",
    "miners",
    "dwarf miners",
    "goblin hewer",
    "goblin hewer war machine"
  ]);

  function normaliseName(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function markZeroOneChoices(data) {
    for (const sectionKey of ["regiments", "warMachines"]) {
      for (const unit of data?.faction?.[sectionKey] || []) {
        const restricted = zeroOneIds.has(String(unit.id || "").toLowerCase()) || zeroOneNames.has(normaliseName(unit.name));
        if (!restricted) continue;
        unit.rules = unit.rules || [];
        if (!unit.rules.some(rule => /^0\s*-\s*1$/i.test(String(rule).trim()))) unit.rules.unshift("0-1");
        unit.maxUnits = 1;
      }
    }
    return data;
  }

  async function inflateBase64Gzip(text) {
    if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support DecompressionStream.");
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    const response = await previousFetch(input, init);
    if (!response.ok || !(url.endsWith("data/whr_dwarfs_v0_1.json") || url.endsWith("/whr_dwarfs_v0_1.json"))) return response;

    try {
      const stub = await response.clone().json();
      const payloadFile = stub?.meta?.payloadFile;
      if (!payloadFile) return response;
      const payloadResponse = await previousFetch(`./data/${payloadFile}`, {cache:"no-store"});
      if (!payloadResponse.ok) throw new Error(`Could not load ${payloadFile}`);
      const data = markZeroOneChoices(JSON.parse(await inflateBase64Gzip(await payloadResponse.text())));
      return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
    } catch (error) {
      console.error("Unable to load populated Dwarf army data", error);
      return response;
    }
  };
})();
