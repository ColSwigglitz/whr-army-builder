// Wood Elves compact payload loader and common-item enrichment.
(() => {
  const previousFetch = window.fetch.bind(window);
  async function inflate(text) {
    const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }
  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  function patch(data) {
    const byId = id => [...(data.faction.characters||[]),...(data.faction.regiments||[]),...(data.faction.warMachines||[]),...(data.faction.specialCharacters||[])].find(u=>u.id===id);
    // Fixed weapons are important for armour/missile legality and print output.
    const fixed = {
      wood_elf_archers:["wood_elf_longbow"], wood_elf_warriors:["shield"],
      way_watchers:["wood_elf_longbow"], wood_elf_scouts:["wood_elf_longbow"],
      glade_riders:["light_armour","spear","bow"], wood_elf_lords:["light_armour","shield","lance"],
      eternal_guard:["spear","light_armour","shield"], rangers:["light_armour","double_handed_weapon"],
      wild_riders:["spear"], sisters_thorn:["spear"], falconers:[], war_dancers:["shield"]
    };
    for (const [id,eq] of Object.entries(fixed)) { const u=byId(id); if(u)u.fixedEquipment=eq; }
    for (const id of ["wood_elf_warlord","wood_elf_hero"]) {
      const u=byId(id); if(!u)continue;
      u.options=[...(u.options||[]),
        {id:"shield",name:"Shield",type:"toggle",cost:{type:"fixed",value:0}},
        {id:"light_armour",name:"Light Armour",type:"toggle",cost:{type:"fixed",value:0}}];
      const steed=(u.mountOptions||[]).find(m=>m.mountId==="elven_steed");
      if(steed)u.mountOptions.push({mountId:"barded_elven_steed",cost:steed.cost});
    }
    const bsb=byId("wood_elf_bsb");
    if(bsb){bsb.options=[{id:"light_armour",name:"Light Armour",type:"toggle",cost:{type:"fixed",value:0}}];bsb.mountOptions.push({mountId:"barded_elven_steed",cost:13});}
    for (const id of ["mage_lord","master_mage","mage_champion","mage"]) {
      const u=byId(id), steed=u&&(u.mountOptions||[]).find(m=>m.mountId==="elven_steed");
      if(steed)u.mountOptions.push({mountId:"barded_elven_steed",cost:steed.cost});
    }
    const orion=byId("orion"); if(orion)orion.options=[{id:"hunting_dogs",name:"Hunting Dogs",type:"quantity",minimum:0,cost:{type:"fixed",value:10}}];
    return data;
  }
  async function prepare() {
    const p=await previousFetch("./data/whr_wood_elves_v0_1.payload",{cache:"no-store"});
    if(!p.ok)throw new Error("Could not load Wood Elf payload");
    const data=patch(JSON.parse(await inflate(await p.text())));
    const e=await previousFetch("./data/whr_empire_v0_1.json",{cache:"no-store"});
    if(e.ok)data.commonMagicItems=clone((await e.json()).commonMagicItems||[]);
    return data;
  }
  window.fetch=async function(input,init){
    const url=typeof input==="string"?input:input?.url||"";
    if(url.endsWith("data/whr_wood_elves_v0_1.json")||url.endsWith("/whr_wood_elves_v0_1.json")){
      try{return new Response(JSON.stringify(await prepare()),{status:200,headers:{"Content-Type":"application/json"}});}
      catch(error){console.error("Unable to prepare Wood Elf data",error);return new Response(JSON.stringify({error:String(error)}),{status:500,headers:{"Content-Type":"application/json"}});}
    }
    return previousFetch(input,init);
  };
})();
