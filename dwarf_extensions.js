// Dwarf-specific roster support: rune construction, tiered Miners, and shared magic-item loading.
(() => {
  const previousFetch = window.fetch.bind(window);

  window.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    const response = await previousFetch(input, init);
    if (!response.ok || !(url.endsWith("data/whr_dwarfs_v0_1.json") || url.endsWith("/whr_dwarfs_v0_1.json"))) return response;
    try {
      const data = await response.clone().json();
      if (!data.commonMagicItems?.length) {
        const commonResponse = await previousFetch("./data/whr_empire_v0_1.json", { cache: "no-store" });
        if (commonResponse.ok) data.commonMagicItems = (await commonResponse.json()).commonMagicItems || [];
      }
      return new Response(JSON.stringify(data), {status:200, headers:{"Content-Type":"application/json"}});
    } catch (error) {
      console.error("Unable to prepare Dwarf data", error);
      return response;
    }
  };

  const isDwarfArmy = () => state.data?.faction?.id === "dwarfs";
  const emptyRuneSet = () => ({weapon:[], armour:[], talisman:[], protection:[], engineering:[]});
  const runeCategories = () => state.data?.faction?.systems?.runes?.categories || {};
  const runeById = id => Object.values(runeCategories()).flat().find(r => r.id === id);

  function ensureRunes(entry) {
    if (!entry.runes) entry.runes = emptyRuneSet();
    for (const key of Object.keys(emptyRuneSet())) if (!Array.isArray(entry.runes[key])) entry.runes[key] = [];
    entry.champion = entry.champion || {selected:false, magicItems:[]};
    if (!entry.champion.runes) entry.champion.runes = emptyRuneSet();
    return entry;
  }

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isDwarfArmy()) ensureRunes(entry);
    return entry;
  };

  const oldGetDefaultSize = getDefaultSize;
  getDefaultSize = unit => isDwarfArmy() && unit.points?.type === "tiered"
    ? Number(unit.points.firstModels || unit.size?.minimum || 5)
    : oldGetDefaultSize(unit);

  const oldGetBaseCostLabel = getBaseCostLabel;
  getBaseCostLabel = function(unit) {
    if (isDwarfArmy() && unit.points?.type === "tiered") {
      return `${formatPoints(unit.points.firstCost)} pts / first ${unit.points.firstModels}, +${formatPoints(unit.points.additionalModelCost)} / extra model`;
    }
    return oldGetBaseCostLabel(unit);
  };

  function selectedRuneIds(entry, category, champion=false) {
    ensureRunes(entry);
    return (champion ? entry.champion.runes : entry.runes)[category] || [];
  }

  function runeCost(id, unit) {
    const rune = runeById(id);
    if (!rune) return 0;
    let cost = Number(rune.cost || 0);
    if (unit?.id === "gyrocopter" && (id === "eng_penetrating" || id === "eng_disguise")) cost *= 2;
    return cost;
  }

  function totalRuneCost(entry, unit) {
    ensureRunes(entry);
    let total = 0;
    for (const ids of Object.values(entry.runes)) for (const id of ids) total += runeCost(id, unit);
    if (entry.champion?.selected) for (const ids of Object.values(entry.champion.runes || {})) for (const id of ids) total += runeCost(id, unit);
    return total;
  }

  const oldCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    let total = oldCalculateEntry(entry);
    if (!isDwarfArmy() || !unit) return total;
    ensureRunes(entry);

    if (unit.points?.type === "tiered") {
      total += Number(unit.points.firstCost || 0) + Math.max(0, Number(entry.size || 0) - Number(unit.points.firstModels || 0)) * Number(unit.points.additionalModelCost || 0);
      if (entry.champion?.selected && unit.champion?.cost?.add?.type === "unit_model_cost") total += Number(unit.points.additionalModelCost || 0);
    }

    if (entry.sectionKey === "warMachines") {
      const extra = Number(entry.optionSelections?.extra_crew || 0);
      if (entry.optionSelections?.crew_armour === "light_armour") total += extra;
      if (entry.optionSelections?.crew_armour === "heavy_armour") total += extra * 2;
    }
    return total + totalRuneCost(entry, unit);
  };

  function runeItemCount(entry, champion=false) {
    ensureRunes(entry);
    const src = champion ? entry.champion.runes : entry.runes;
    return ["weapon","armour","talisman","protection"].filter(k => (src[k] || []).length).length;
  }

  const oldGetMagicMaximum = getMagicMaximum;
  getMagicMaximum = function(unit, context) {
    const base = oldGetMagicMaximum(unit, context);
    if (!isDwarfArmy() || !state.draft) return base;
    return Math.max(0, base - runeItemCount(state.draft, context === "champion"));
  };

  const oldGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    if (!isDwarfArmy()) return oldGetAllowedMagicItems(unit, context);
    const settings = context === "champion" ? unit.champion?.magicItems : unit.magicItems;
    if (!settings) return [];
    const categories = settings.allowedCategories || ["magic_weapon","magic_armour","enchanted_item","familiar"];
    const result = [];
    if ((settings.allowedPools || []).includes("common")) result.push(...(state.data.commonMagicItems || []));
    if ((settings.allowedPools || []).some(p => p === "faction" || p === "dwarfs")) result.push(...(state.data.factionMagicItems || []));
    const conflicts = new Set();
    if (state.draft) {
      ensureRunes(state.draft);
      const src = context === "champion" ? state.draft.champion.runes : state.draft.runes;
      if (src.weapon?.length) conflicts.add("magic_weapon");
      if (src.armour?.length) conflicts.add("magic_armour");
      if (src.talisman?.length) conflicts.add("enchanted_item");
      if (src.protection?.length) conflicts.add("magic_banner");
    }
    return result.filter(item => categories.includes(item.category) && item.category !== "arcane_item" && !conflicts.has(item.category) && !/\bbound\b/i.test(String(item.rules || "")));
  };

  const oldRenderMagicItemEditor = renderMagicItemEditor;
  renderMagicItemEditor = function(entry, unit, context) {
    const html = oldRenderMagicItemEditor(entry, unit, context);
    if (!isDwarfArmy()) return html;
    return html.replace("The list is taken from the common and Empire magic-item pools allowed by this character.", "The list is taken from the common and Dwarf magic-item pools. Bound spells and arcane items are excluded.");
  };

  function availableRunes(category, unit, champion, includeMasters) {
    const tags = unit.tags || [];
    return (runeCategories()[category] || []).filter(r => {
      if (r.master && !includeMasters) return false;
      if (r.allowedUnits && !r.allowedUnits.includes(unit.id)) return false;
      if (r.onlyRunesmith && !tags.includes("runesmith")) return false;
      return true;
    });
  }

  function renderRuneItem(entry, unit, category, title, champion=false, includeMasters=true) {
    const ids = selectedRuneIds(entry, category, champion);
    const options = availableRunes(category, unit, champion, includeMasters);
    if (!options.length) return "";
    return `<section class="editor-section dwarf-rune-section">
      <div class="magic-header"><h3 class="editor-section-title" style="margin:0;">${escapeHtml(title)}</h3><span class="magic-counter">${ids.length} / 3 runes</span></div>
      <div class="field-hint">These runes form one runic item. A runic item uses one magic-item slot where applicable.</div>
      ${[0,1,2].map(slot => `<div class="dialog-field"><label>Rune ${slot+1}</label><select data-dwarf-rune="${category}" data-rune-slot="${slot}" data-rune-context="${champion ? "champion" : "model"}"><option value="">None</option>${options.map(r => `<option value="${escapeHtml(r.id)}" ${ids[slot] === r.id ? "selected" : ""}>${escapeHtml(r.name)} (${formatPoints(runeCost(r.id, unit))} pts)</option>`).join("")}</select></div>`).join("")}
    </section>`;
  }

  function renderRuneAccess(entry, unit, champion=false) {
    const access = champion ? (unit.champion?.runeAccess || []) : (unit.runeAccess || []);
    const labels = {weapon:"Runic Weapon",armour:"Runic Armour",talisman:"Runic Talisman",protection:"Runic Battle Standard"};
    return access.map(cat => renderRuneItem(entry, unit, cat, labels[cat] || humanise(cat), champion, true)).join("");
  }

  const oldRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    let html = oldRenderCharacterEditor(entry, unit);
    if (!isDwarfArmy()) return html;
    ensureRunes(entry);
    if ((unit.options || []).length) html += `<section class="editor-section"><h3 class="editor-section-title">Options</h3>${renderUnitOptions(entry, unit)}</section>`;
    return html + renderRuneAccess(entry, unit, false);
  };

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = oldRenderRegimentEditor(entry, unit);
    if (!isDwarfArmy()) return html;
    ensureRunes(entry);
    if (unit.points?.type === "tiered") html = html.replace(/Base cost: 0 pts per model\./, `Base cost: ${formatPoints(unit.points.firstCost)} pts for the first ${unit.points.firstModels} models, +${formatPoints(unit.points.additionalModelCost)} pts per additional model.`);
    if (entry.champion?.selected && unit.champion?.runeAccess?.length) html += renderRuneAccess(entry, unit, true);
    if (entry.command?.standardBearer && unit.runicBanner) html += renderRuneItem(entry, unit, "protection", "Runic Standard", false, false);
    return html;
  };

  const oldRenderWarMachineEditor = renderWarMachineEditor;
  renderWarMachineEditor = function(entry, unit) {
    let html = oldRenderWarMachineEditor(entry, unit);
    if (!isDwarfArmy() || !unit.engineeringRunes) return html;
    ensureRunes(entry);
    return html + renderRuneItem(entry, unit, "engineering", "Engineering Runes", false, true);
  };

  const oldDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text = oldDescribeEntry(entry);
    if (!isDwarfArmy()) return text;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    ensureRunes(entry);
    const labels = {weapon:"Runic Weapon",armour:"Runic Armour",talisman:"Runic Talisman",protection:"Runic Standard",engineering:"Engineering Runes"};
    const parts = [];
    for (const [cat,ids] of Object.entries(entry.runes)) if (ids.length) parts.push(`${labels[cat]}: ${ids.map(id => runeById(id)?.name || id).join(", ")}`);
    if (entry.champion?.selected) for (const [cat,ids] of Object.entries(entry.champion.runes || {})) if (ids.length) parts.push(`${unit.champion?.name || "Champion"} ${labels[cat] || humanise(cat)}: ${ids.map(id => runeById(id)?.name || id).join(", ")}`);
    return parts.length ? `${text === "Base configuration" ? "" : text + " · "}${parts.join(" · ")}` : text;
  };

  function runeCountElsewhere(id, ignoreId) {
    let count = 0;
    for (const e of state.roster) {
      if (e.id === ignoreId) continue;
      ensureRunes(e);
      for (const ids of Object.values(e.runes)) count += ids.filter(x => x === id).length;
      for (const ids of Object.values(e.champion?.runes || {})) count += ids.filter(x => x === id).length;
    }
    return count;
  }

  function validateRune(entry, unit, category, slot, id, champion) {
    if (!id) return {ok:true};
    const rune = runeById(id);
    const src = champion ? entry.champion.runes : entry.runes;
    const next = [...(src[category] || [])]; while (next.length < 3) next.push(""); next[slot] = id;
    const chosen = next.filter(Boolean), details = chosen.map(runeById);
    if (details.filter(r => r?.master).length > 1) return {ok:false,msg:"A runic item may contain only one Master Rune."};
    if (rune.master && runeCountElsewhere(id, entry.id)) return {ok:false,msg:"That Master Rune is already used elsewhere in the army."};
    const times = chosen.filter(x => x === id).length;
    if (!rune.repeatable && times > 1) return {ok:false,msg:"That rune cannot be repeated on the same item."};
    if (rune.maxRepeats && times > Number(rune.maxRepeats)) return {ok:false,msg:`${rune.name} may be taken at most ${rune.maxRepeats} times.`};
    if (id === "r_spellbreaking" && runeCountElsewhere(id, entry.id) + times > 2) return {ok:false,msg:"No more than two Runes of Spellbreaking may be included in the army."};
    if (!champion && entry.sectionKey === "regiments" && category === "protection" && entry.magicBanner) return {ok:false,msg:"Remove the conventional magic banner before creating a runic standard."};
    const catMagic = {weapon:"magic_weapon",armour:"magic_armour",talisman:"enchanted_item",protection:"magic_banner"}[category];
    const normalItems = champion ? entry.champion.magicItems : entry.magicItems;
    if (catMagic && normalItems.some(x => getMagicItem(x)?.category === catMagic)) return {ok:false,msg:"Runes cannot be inscribed on an existing magic item. Remove the conventional item in this category first."};
    if (category !== "engineering" && !(entry.sectionKey === "regiments" && !champion && category === "protection")) {
      const maximum = Number((champion ? unit.champion?.magicItems : unit.magicItems)?.maximum || 0);
      const old = src[category]; src[category] = chosen;
      const used = runeItemCount(entry, champion) + normalItems.length;
      src[category] = old;
      if (used > maximum) return {ok:false,msg:`This model may take a maximum of ${maximum} magic item${maximum === 1 ? "" : "s"}, including runic items.`};
    }
    return {ok:true,chosen};
  }

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isDwarfArmy() || !state.draft) return;
    const entry = state.draft, unit = getUnit(entry.sectionKey, entry.unitId); ensureRunes(entry);
    els.dialogContent.querySelectorAll("[data-dwarf-rune]").forEach(select => select.addEventListener("change", () => {
      const cat = select.dataset.dwarfRune, slot = Number(select.dataset.runeSlot), champion = select.dataset.runeContext === "champion";
      const check = validateRune(entry, unit, cat, slot, select.value, champion);
      if (!check.ok) { window.alert(check.msg); renderEditor(); return; }
      const src = champion ? entry.champion.runes : entry.runes;
      const next = [...(src[cat] || [])]; while (next.length < 3) next.push(""); next[slot] = select.value || ""; src[cat] = next.filter(Boolean);
      renderEditor();
    }));
  };
})();
