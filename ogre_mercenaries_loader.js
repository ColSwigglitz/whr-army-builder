// Loads the compact Ogre Mercenaries dataset and attaches the five legal WHR allied-tribe pools.
(() => {
  const previousFetch = window.fetch.bind(window);

  async function inflate(text) {
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  const lower = value => String(value || "").toLowerCase();
  const tags = unit => (unit?.tags || []).map(lower);
  const tagged = (unit, needle) => tags(unit).some(tag => tag === needle || tag.includes(needle));

  function belongsToTribe(unit, tribe) {
    const name = lower(unit?.name);
    if (tribe === "forest_goblins") return name.includes("forest goblin") || tagged(unit, "forest_goblin");
    if (tribe === "night_goblins") return name.includes("night goblin") || tagged(unit, "night_goblin");
    if (tribe === "common_goblins") {
      const goblin = name.includes("goblin") || tagged(unit, "goblin");
      return goblin && !name.includes("night goblin") && !name.includes("forest goblin") && !name.includes("hobgoblin") && !tagged(unit, "night_goblin") && !tagged(unit, "forest_goblin");
    }
    if (tribe === "hobgoblins") return name.includes("hobgoblin") || tagged(unit, "hobgoblin");
    if (tribe === "halflings") return (name.includes("halfling") || tagged(unit, "halfling")) && !name.includes("wizard");
    return false;
  }

  function isBsb(unit) {
    const name = lower(unit?.name);
    return name.includes("battle standard") || name.includes(" bsb") || tagged(unit, "battle_standard_bearer") || tagged(unit, "bsb");
  }

  function isAllowedWarMachine(unit, tribe) {
    const name = lower(unit?.name);
    if (tribe === "common_goblins") return belongsToTribe(unit, tribe) || (name.includes("goblin") && (name.includes("chariot") || name.includes("bolt thrower") || name.includes("rock lobber")) && !name.includes("night") && !name.includes("forest"));
    if (tribe === "hobgoblins") return name.includes("hobgoblin") && name.includes("bolt thrower");
    if (tribe === "halflings") return (name.includes("halfling") || tagged(unit, "halfling")) && !name.includes("treeman") && !name.includes("wood elf") && !name.includes("empire");
    return false;
  }

  function prefixSource(source, sourceKey, tribe, selectors) {
    const prefix = `ogally_${sourceKey}_`;
    const profileIds = new Set((source.profiles || []).map(x => x.id));
    const mountIds = new Set((source.mounts || []).map(x => x.id));
    const equipmentIds = new Set((source.equipment || []).map(x => x.id));
    const itemIds = new Set([...(source.factionMagicItems || []), ...(source.faction?.specialCharacterOnlyItems || [])].map(x => x.id));
    const remapString = value => {
      if (profileIds.has(value) || mountIds.has(value) || equipmentIds.has(value) || itemIds.has(value)) return prefix + value;
      return value;
    };
    const deep = value => {
      if (Array.isArray(value)) return value.map(deep);
      if (value && typeof value === "object") {
        const out = {};
        for (const [k,v] of Object.entries(value)) out[k] = deep(v);
        return out;
      }
      return typeof value === "string" ? remapString(value) : value;
    };
    const cloneUnit = unit => {
      const out = deep(unit);
      out.id = prefix + unit.id;
      out.name = `${unit.name} — Allied`;
      out.tags = [...(out.tags || []), "ogre_ally", `ogre_ally_${tribe}`, `ogre_ally_source_${sourceKey}`];
      out.ogreAllyTribe = tribe;
      out.ogreAllySource = sourceKey;

      // The Ogre army has two explicit exceptions to the Forest Goblin list.
      if (tribe === "forest_goblins") {
        out.options = (out.options || []).filter(option => !lower(JSON.stringify(option)).includes("poison"));
        out.equipmentOptions = (out.equipmentOptions || []).map(group => ({
          ...group,
          choices: (group.choices || []).filter(choice => !lower(JSON.stringify(choice)).includes("poison"))
        }));
      }
      if (tribe === "common_goblins") {
        out.rules = [...(out.rules || []), "Ogre ally: Common Goblins do not receive the higher-Leadership-without-Orcs benefit."];
      }
      return out;
    };
    return {
      profiles:(source.profiles || []).map(p => ({...deep(p), id:prefix+p.id})),
      mounts:(source.mounts || []).map(m => ({...deep(m), id:prefix+m.id})),
      equipment:(source.equipment || []).map(e => ({...deep(e), id:prefix+e.id})),
      items:(source.factionMagicItems || []).map(i => ({...deep(i), id:prefix+i.id, ogreAllySource:sourceKey})),
      characters:(source.faction?.characters || []).filter(u => selectors.character(u) && !isBsb(u)).map(cloneUnit),
      regiments:(source.faction?.regiments || []).filter(u => selectors.regiment(u) && !(tribe === "forest_goblins" && lower(u.name).includes("gargantuan spider"))).map(cloneUnit),
      warMachines:(source.faction?.warMachines || []).filter(selectors.warMachine).map(cloneUnit)
    };
  }

  async function sourceJson(path) {
    const response = await previousFetch(path, {cache:"no-store"});
    return response.ok ? response.json() : null;
  }

  function pushUnique(target, additions) {
    const seen = new Set(target.map(x => x.id));
    for (const item of additions || []) if (item?.id && !seen.has(item.id)) { target.push(item); seen.add(item.id); }
  }

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    const response = await previousFetch(input, init);
    if (!response.ok || !(url.endsWith("data/whr_ogre_mercenaries_v0_1.json") || url.endsWith("/whr_ogre_mercenaries_v0_1.json"))) return response;
    try {
      const stub = await response.clone().json();
      if (!stub?.meta?.payloadFile) return response;
      const payload = await previousFetch(`./data/${stub.meta.payloadFile}`, {cache:"no-store"});
      if (!payload.ok) throw new Error(`Could not load ${stub.meta.payloadFile}`);
      const data = JSON.parse(await inflate(await payload.text()));
      const empire = await sourceJson("./data/whr_empire_v0_1.json");
      if (empire) data.commonMagicItems = empire.commonMagicItems || [];

      const [og, cd, hf] = await Promise.all([
        sourceJson("./data/whr_orcs_goblins_v0_1.json"),
        sourceJson("./data/whr_chaos_dwarfs_v0_1.json"),
        sourceJson("./data/whr_halflings_moot_v0_1.json")
      ]);
      const pools=[];
      for (const tribe of ["common_goblins","forest_goblins","night_goblins"]) if (og) pools.push(prefixSource(og,"orcs_goblins",tribe,{character:u=>belongsToTribe(u,tribe),regiment:u=>belongsToTribe(u,tribe),warMachine:u=>tribe==="common_goblins"&&isAllowedWarMachine(u,tribe)}));
      if (cd) pools.push(prefixSource(cd,"chaos_dwarfs","hobgoblins",{character:u=>belongsToTribe(u,"hobgoblins"),regiment:u=>belongsToTribe(u,"hobgoblins"),warMachine:u=>isAllowedWarMachine(u,"hobgoblins")}));
      if (hf) pools.push(prefixSource(hf,"halflings_moot","halflings",{character:u=>belongsToTribe(u,"halflings"),regiment:u=>belongsToTribe(u,"halflings")&&!lower(u.name).includes("wood elf")&&!lower(u.name).includes("empire")&&!lower(u.name).includes("treeman"),warMachine:u=>isAllowedWarMachine(u,"halflings")}));

      for (const pool of pools) {
        pushUnique(data.profiles, pool.profiles);
        pushUnique(data.mounts, pool.mounts);
        pushUnique(data.equipment, pool.equipment);
        pushUnique(data.factionMagicItems, pool.items);
        pushUnique(data.faction.characters, pool.characters);
        pushUnique(data.faction.regiments, pool.regiments);
        pushUnique(data.faction.warMachines, pool.warMachines);
      }
      return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
    } catch (error) {
      console.error("Unable to load Ogre Mercenaries data", error);
      return response;
    }
  };
})();
