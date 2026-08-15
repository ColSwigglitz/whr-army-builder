// Dark Elves compact army payload loader.
(() => {
  const previousFetch = window.fetch.bind(window);

  async function inflate(text) {
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  async function prepareDarkElves() {
    const payloadResponse = await previousFetch("./data/whr_dark_elves_v0_1.payload", {cache:"no-store"});
    if (!payloadResponse.ok) throw new Error("Could not load Dark Elf payload");
    const data = JSON.parse(await inflate(await payloadResponse.text()));

    // Common items are shared from the Empire dataset, as with the other compact factions.
    const commonResponse = await previousFetch("./data/whr_empire_v0_1.json", {cache:"no-store"});
    if (commonResponse.ok) {
      const common = await commonResponse.json();
      data.commonMagicItems = JSON.parse(JSON.stringify(common.commonMagicItems || []));
    }

    // The first ordinary Dark Elf Assassin contributes its full cost to Regiments.
    const assassin = data.faction?.characters?.find(unit => unit.id === "assassin");
    if (assassin) {
      assassin.composition = {
        rules: [{when:{instanceNumber:1}, category:"regiments"}]
      };
    }

    // Fixed ridden special characters should print their mounts as actual profiles.
    const rakarth = data.faction?.specialCharacters?.find(unit => unit.id === "rakarth");
    if (rakarth) {
      rakarth.defaultMount = "black_dragon";
      rakarth.mountOptions = [{mountId:"black_dragon",cost:0}];
    }
    const hellebron = data.faction?.specialCharacters?.find(unit => unit.id === "hellebron");
    if (hellebron) {
      hellebron.defaultMount = "manticore";
      hellebron.mountOptions = [{mountId:"manticore",cost:0}];
    }

    return data;
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (url.endsWith("data/whr_dark_elves_v0_1.json") || url.endsWith("/whr_dark_elves_v0_1.json")) {
      try {
        const data = await prepareDarkElves();
        return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
      } catch (error) {
        console.error("Unable to prepare Dark Elf data", error);
        return new Response(JSON.stringify({error:String(error)}), {status:500, headers:{"Content-Type":"application/json"}});
      }
    }
    return previousFetch(input, init);
  };
})();
