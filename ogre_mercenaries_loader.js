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
      if (["common_goblins","hobgoblins","halflings"].includes(tribe) && (out.tags || []).some(t => ["chariot","war_machine","classic_modern_machine"].includes(t))) {
        out.ogreAllyLimitedChoice = true;
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

  function installGoblinShamans(data) {
    const prefix = "ogally_orcs_goblins_";
    const levels = [
      { key:"shaman_lord", title:"Shaman Lord", level:4, common:170, forest:170, night:180, profile:"goblin_shaman_lord" },
      { key:"master_shaman", title:"Master Shaman", level:3, common:120, forest:120, night:130, profile:"goblin_master_shaman" },
      { key:"shaman_champion", title:"Shaman Champion", level:2, common:75, forest:75, night:85, profile:"goblin_shaman_champion" },
      { key:"shaman", title:"Shaman", level:1, common:30, forest:30, night:40, profile:"goblin_shaman" }
    ];
    const configs = {
      common_goblins: {
        label:"Common Goblin", costKey:"common",
        mounts:[
          {mountId:`${prefix}giant_wolf`,cost:0},
          {mountId:`${prefix}goblin_wolf_chariot_character`,cost:44,ogreAllyLimitedChoice:true},
          {mountId:`${prefix}monstrous_spider`,cost:32}
        ],
        rules:["Waaagh! Shaman; uses Waaagh! spells.","Ogre ally: Common Goblins do not receive the higher-Leadership-without-Orcs benefit."]
      },
      forest_goblins: {
        label:"Forest Goblin", costKey:"forest",
        mounts:[{mountId:`${prefix}giant_spider`,cost:0},{mountId:`${prefix}monstrous_spider`,cost:32}],
        rules:["Waaagh! Shaman; uses Waaagh! spells.","Forester.","On the specified failed Waaagh! result the Shaman enters a trance instead of taking the normal Toughness test, and moves 1D6 inches randomly as described in the army book."]
      },
      night_goblins: {
        label:"Night Goblin", costKey:"night",
        mounts:[{mountId:`${prefix}monstrous_spider`,cost:32}],
        rules:["Waaagh! Shaman; uses Waaagh! spells.","Hates Dwarfs (not Chaos Dwarfs).","Carries one magic mushroom: after Winds of Magic are dealt it may be consumed for 1D6 extra magic cards usable only by this Shaman, with the army-book risk on a subsequent failed Waaagh! test."]
      }
    };
    for (const [tribe,cfg] of Object.entries(configs)) {
      for (const row of levels) {
        const id = `${prefix}${tribe.replace(/s$/,"")}_${row.key}`;
        if (data.faction.characters.some(u => u.id === id)) continue;
        data.faction.characters.push({
          id,
          name:`${cfg.label} ${row.title} — Allied`,
          profileId:`${prefix}${row.profile}`,
          points:{type:"fixed",value:row[cfg.costKey]},
          tags:["wizard","shaman",`${tribe.replace(/s$/,"")}`,"ogre_ally",`ogre_ally_${tribe}`,"ogre_ally_source_orcs_goblins"],
          wizard:{level:row.level,lore:"Waaagh!"},
          magicItems:{maximum:row.level,allowedPools:["common","faction"],allowedCategories:["magic_weapon","enchanted_item","arcane_item","familiar"]},
          mountOptions:cfg.mounts.map(x=>({...x})),
          rules:[...cfg.rules],
          ogreAllyTribe:tribe,
          ogreAllySource:"orcs_goblins",
          ogreAllyRequiresRegiment:true
        });
      }
    }
  }

  function installGoblinChariotMount(data) {
    const id="ogally_orcs_goblins_goblin_wolf_chariot_character";
    if (!data.mounts.some(m=>m.id===id)) {
      data.mounts.push({
        id,
        name:"Goblin Wolf Chariot",
        profileId:"ogally_orcs_goblins_light_chariot",
        type:"chariot",
        rules:["Light Chariot","Pulled by two Giant Wolves and normally crewed by two Common Goblins.","Combined armour save 5+."],
        displayProfileOnRoster:true,
        ogreAllyLimitedChoice:true
      });
    }
    // The home O&G entries permit Common Goblin Warlords and Heroes to ride a
    // Wolf Chariot for the price of the chariot. Preserve that option as allies.
    for (const unit of data.faction.characters.filter(u=>u.ogreAllyTribe==="common_goblins" && /warlord|hero/i.test(u.name))) {
      unit.mountOptions=unit.mountOptions||[];
      if(!unit.mountOptions.some(m=>m.mountId===id))unit.mountOptions.push({mountId:id,cost:44,ogreAllyLimitedChoice:true});
      unit.ogreAllyRequiresRegiment=true;
    }
  }

  function installCommonGoblinArtillery(data) {
    const commonTags=["ogre_ally","ogre_ally_common_goblins","ogre_ally_source_orcs_goblins","war_machine"];
    const crew={baseCount:3,profileId:"ogally_orcs_goblins_common_goblin",name:"Common Goblins",extraCrewOptionId:"extra_crew"};
    const extraCrew={id:"extra_crew",label:"Extra Common Goblin crew",type:"quantity",minimum:0,maximum:2,cost:{value:2.5}};
    const machines=[
      {id:"ogally_orcs_goblins_goblin_spear_chukka",name:"Spear Chukka, Goblins — Allied",cost:42.5,rules:["Bolt Thrower with three Common Goblin crewmen."],extra:true},
      {id:"ogally_orcs_goblins_goblin_small_rock_lobber",name:"Small Rock Lobber, Goblins — Allied",cost:72.5,rules:["Small Stone Thrower with three Common Goblin crewmen."],extra:true},
      {id:"ogally_orcs_goblins_goblin_large_rock_lobber",name:"Large Rock Lobber, Goblins — Allied",cost:87.5,rules:["Large Stone Thrower with three Common Goblin crewmen."],extra:true},
      {id:"ogally_orcs_goblins_goblin_doom_diver",name:"Goblin Doom Diver — Allied",cost:67.5,rules:["Uses an endless supply of Common Goblins, counting as three crewmen.","Shoots using the WHR Doom Diver rules: large-stone-thrower style attack with a 2-inch template, steerable scatter and its own misfire rules."],extra:false}
    ];
    for(const m of machines){
      if(data.faction.warMachines.some(u=>u.id===m.id))continue;
      data.faction.warMachines.push({
        id:m.id,name:m.name,profileId:"ogally_orcs_goblins_war_machine",points:{type:"fixed",value:m.cost},
        options:m.extra?[{...extraCrew}]:[],crew:{...crew,...(!m.extra?{extraCrewOptionId:null}:{})},rules:m.rules,
        tags:[...commonTags],ogreAllyTribe:"common_goblins",ogreAllySource:"orcs_goblins",ogreAllyLimitedChoice:true,ogreAllyRequiresRegiment:true
      });
    }
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

      installGoblinChariotMount(data);
      installGoblinShamans(data);
      installCommonGoblinArtillery(data);

      return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
    } catch (error) {
      console.error("Unable to load Ogre Mercenaries data", error);
      return response;
    }
  };
})();
