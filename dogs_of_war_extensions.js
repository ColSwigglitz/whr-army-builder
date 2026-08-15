// Dogs of War faction rules: mainstay, Paymaster, mercenary magic pools and Regiments of Renown.
(() => {
  const FACTION_ID = "dogs_of_war";
  const isDoW = () => state.data?.faction?.id === FACTION_ID && state.selectedArmyId === FACTION_ID;
  const tags = unit => unit?.tags || [];
  const hasTag = (unit, tag) => tags(unit).includes(tag);
  const unitFor = entry => getUnit(entry?.sectionKey, entry?.unitId);

  function isMainstay(unit) {
    return hasTag(unit, "old_world_human") || unit?.id === "vesperos_vendetta";
  }

  function mainstayCount() {
    return state.roster.filter(entry => entry.sectionKey === "regiments" && isMainstay(unitFor(entry))).length;
  }

  function isPaymaster(unit) {
    return unit?.id === "human_paymaster" || unit?.id === "myrdas" || hasTag(unit, "paymaster");
  }

  function isHumanCharacter(unit) {
    if (!unit || !["characters", "specialCharacters"].some(section => (state.data?.faction?.[section] || []).includes(unit))) return false;
    return hasTag(unit, "human") && !isPaymaster(unit);
  }

  function halflingRegimentPresent() {
    return state.roster.some(entry => entry.sectionKey === "regiments" && ["halfling_militia", "halfling_bowmen"].includes(entry.unitId));
  }

  function ogreRegimentPresent() {
    return state.roster.some(entry => entry.sectionKey === "regiments" && entry.unitId === "ogre_mercenaries");
  }

  function patchData() {
    if (!isDoW() || state.data.__dogsOfWarPatched) return;
    state.data.__dogsOfWarPatched = true;

    const faction = state.data.faction;
    const all = ["characters", "regiments", "warMachines", "specialCharacters"].flatMap(key => faction[key] || []);
    const byId = id => all.find(unit => unit.id === id);

    // The three generic Human character classes receive free barding on their
    // Warhorse. Wizards may also bard their free Warhorse at no extra cost.
    for (const id of ["human_mercenary_lord", "human_mercenary_hero", "hireling_wizard_lord", "hireling_master_wizard", "hireling_wizard_champion", "hireling_wizard"]) {
      const unit = byId(id);
      if (!unit) continue;
      for (const mount of unit.mountOptions || []) {
        if (mount.mountId === "warhorse") mount.mountId = "barded_warhorse";
      }
    }

    // Paymasters cannot be mounted and the WHR Paymaster equipment line does
    // not include a lance.
    const paymaster = byId("human_paymaster");
    if (paymaster) {
      paymaster.mountOptions = [];
      const melee = (paymaster.equipmentOptions || []).find(group => group.id === "melee_weapon");
      if (melee) melee.choices = (melee.choices || []).filter(choice => choice !== "lance");
    }

    // Vespero is a Tilean Human regiment and therefore fulfils the Old World
    // Human mainstay requirement.
    const vespero = byId("vesperos_vendetta");
    if (vespero && !hasTag(vespero, "old_world_human")) vespero.tags = [...tags(vespero), "old_world_human"];
  }

  function nonMainstayCount(unitId, sectionKey) {
    return state.roster.filter(entry => entry.sectionKey === sectionKey && entry.unitId === unitId).length;
  }

  const previousCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = previousCreateEntry(sectionKey, unit);
    if (!isDoW()) return entry;
    patchData();
    entry.dowLeaderMagicItems = entry.dowLeaderMagicItems || [];
    entry.dowExtraChampions = Number(entry.dowExtraChampions || 0);
    entry.dowExtraChampionItems = entry.dowExtraChampionItems || [];
    if (unit?.mount) entry.mount = unit.mount;
    if (unit?.id === "asarnil") entry.optionSelections.dragon_colour = entry.optionSelections.dragon_colour || "red";
    return entry;
  };

  const previousAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (!isDoW()) return previousAddUnit(sectionKey, unitId);
    patchData();
    const unit = getUnit(sectionKey, unitId);
    if (!unit) return;

    if ((hasTag(unit, "zero_one") || hasTag(unit, "regiment_of_renown")) && state.roster.some(entry => entry.unitId === unitId)) {
      window.alert(`${unit.name} may only be included once.`);
      return;
    }
    if (isPaymaster(unit) && state.roster.some(entry => isPaymaster(unitFor(entry)))) {
      window.alert("A Dogs of War army may include only one Paymaster.");
      return;
    }
    if (unitId === "ogre_mercenary_hero" && !ogreRegimentPresent()) {
      window.alert("An Ogre Mercenary Hero requires an Ogre Mercenaries regiment in the army.");
      return;
    }
    if (unitId === "halfling_hot_pot" && !halflingRegimentPresent()) {
      window.alert("The Halfling Hot-Pot requires at least one Halfling regiment.");
      return;
    }

    if ((sectionKey === "regiments" || sectionKey === "warMachines") && !isMainstay(unit)) {
      const allowance = mainstayCount();
      const copies = nonMainstayCount(unitId, sectionKey);
      if (copies >= allowance) {
        window.alert(allowance
          ? `You currently have ${allowance} Old World Human mainstay regiment${allowance === 1 ? "" : "s"}, so you may include at most ${allowance} of ${unit.name}.`
          : "Add an Old World Human mainstay regiment before adding other mercenary regiments or war machines.");
        return;
      }
    }

    return previousAddUnit(sectionKey, unitId);
  };

  function borrowedSourcesFor(unit, context) {
    if (context === "character") {
      if (unit.id === "ogre_mercenary_hero") return ["ogre_mercenaries"];
      return [];
    }
    const pool = unit.champion?.dowMagicPool || unit.champion?.magicItems?.allowedPools?.find(pool => pool !== "common") || "";
    const mapping = state.data?.faction?.systems?.borrowedItemPools || {};
    return mapping[pool] || mapping[unit.magicBanner?.sourcePool] || [];
  }

  function itemMatchesSources(item, sources) {
    return item?.dowSourceFaction && sources.includes(item.dowSourceFaction);
  }

  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    if (!isDoW()) return previousGetAllowedMagicItems(unit, context);
    patchData();
    const settings = context === "champion" ? unit.champion?.magicItems : unit.magicItems;
    if (!settings) return [];
    const categories = settings.allowedCategories || ["magic_weapon", "magic_armour", "enchanted_item", "arcane_item", "familiar"];
    const sources = borrowedSourcesFor(unit, context);
    const items = [
      ...(state.data.commonMagicItems || []),
      ...(state.data.factionMagicItems || []).filter(item => itemMatchesSources(item, sources))
    ].filter(item => categories.includes(item.category));

    // Bretonnian virtues are not magic items for Dogs of War. Human Knights
    // are the sole exception explicitly allowed to take one item OR virtue.
    return items.filter(item => !item.isVirtue || (context === "champion" && unit.id === "human_knights"));
  };

  function bannerSources(unit) {
    const pool = unit.magicBanner?.sourcePool || "";
    const mapping = state.data?.faction?.systems?.borrowedItemPools || {};
    return mapping[pool] || [];
  }

  function itemAllowedForUnit(item, unit) {
    if (item.allowedUnitIds?.length) {
      // Army-book-specific unit restrictions only apply when the borrowed item
      // explicitly names this Dogs of War unit. This prevents e.g. a Knights
      // Panther-only banner leaking into generic Human Knights.
      return item.allowedUnitIds.includes(unit.id);
    }
    return true;
  }

  const previousRenderMagicBannerEditor = renderMagicBannerEditor;
  renderMagicBannerEditor = function(entry, unit) {
    if (!isDoW()) return previousRenderMagicBannerEditor(entry, unit);
    const sources = bannerSources(unit);
    const banners = [
      ...(state.data.commonMagicItems || []).filter(item => item.category === "magic_banner"),
      ...(state.data.factionMagicItems || []).filter(item => item.category === "magic_banner" && itemMatchesSources(item, sources))
    ].filter(item => itemAllowedForUnit(item, unit));

    return `<section class="editor-section"><h3 class="editor-section-title">Magic Banner</h3><div class="dialog-field"><label>Banner</label><select data-magic-banner><option value="">None</option>${banners.map(item => {
      const used = magicItemUsedElsewhere(item.id, entry.id, "banner");
      return `<option value="${escapeHtml(item.id)}" ${entry.magicBanner === item.id ? "selected" : ""} ${used && entry.magicBanner !== item.id ? "disabled" : ""}>${escapeHtml(item.name)} (${formatPoints(item.cost)} pts)${item.dowSourceName ? ` — ${escapeHtml(item.dowSourceName)}` : ""}</option>`;
    }).join("")}</select></div></section>`;
  };

  function rorLeaderConfig(unit) {
    if (unit.id === "vesperos_vendetta") return {name:"Vespero", maximum:2, sources:[], common:true};
    if (unit.id === "oglah_khans_wolfboyz") return {name:"Oglah Khan", maximum:2, sources:["chaos_dwarfs"], common:true};
    if (unit.id === "cursed_company") return {name:"Richter Kreugar", maximum:2, sources:["classic_undead"], common:false};
    return null;
  }

  function leaderItemsFor(unit) {
    const cfg = rorLeaderConfig(unit);
    if (!cfg) return [];
    const result = [];
    if (cfg.common) result.push(...(state.data.commonMagicItems || []).filter(item => item.category !== "magic_banner"));
    result.push(...(state.data.factionMagicItems || []).filter(item => itemMatchesSources(item, cfg.sources) && item.category !== "magic_banner"));
    return result;
  }

  function customItemUsedElsewhere(itemId, entryId, slotIndex = -1) {
    for (const entry of state.roster) {
      if (entry.id !== entryId && (entry.dowLeaderMagicItems || []).includes(itemId)) return true;
      if (entry.id !== entryId && (entry.dowExtraChampionItems || []).includes(itemId)) return true;
      if (entry.id === entryId) {
        if ((entry.dowLeaderMagicItems || []).some((id, index) => index !== slotIndex && id === itemId)) return true;
      }
    }
    return false;
  }

  const previousMagicItemUsedElsewhere = magicItemUsedElsewhere;
  magicItemUsedElsewhere = function(itemId, contextEntryId, context) {
    if (previousMagicItemUsedElsewhere(itemId, contextEntryId, context)) return true;
    if (!isDoW()) return false;
    return customItemUsedElsewhere(itemId, contextEntryId);
  };

  function renderLeaderMagicEditor(entry, unit) {
    const cfg = rorLeaderConfig(unit);
    if (!cfg) return "";
    entry.dowLeaderMagicItems = entry.dowLeaderMagicItems || [];
    const items = leaderItemsFor(unit);
    return `<section class="editor-section"><h3 class="editor-section-title">${escapeHtml(cfg.name)} — Magic Items</h3><div class="field-hint">${cfg.name} may take up to ${cfg.maximum} magic items${unit.id === "cursed_company" ? " from the Undead army book, in addition to the Wight Blade" : unit.id === "oglah_khans_wolfboyz" ? ", including items from the Chaos Dwarfs army book" : ""}.</div>${Array.from({length:cfg.maximum}, (_, index) => `<div class="dialog-field"><label>Magic item ${index + 1}</label><select data-dow-leader-item="${index}"><option value="">None</option>${items.map(item => {
      const selected = entry.dowLeaderMagicItems[index] === item.id;
      const used = magicItemUsedElsewhere(item.id, entry.id, "dowLeader") || customItemUsedElsewhere(item.id, entry.id, index);
      return `<option value="${escapeHtml(item.id)}" ${selected ? "selected" : ""} ${used && !selected ? "disabled" : ""}>${escapeHtml(item.name)} (${formatPoints(item.cost)} pts)${item.dowSourceName ? ` — ${escapeHtml(item.dowSourceName)}` : ""}</option>`;
    }).join("")}</select></div>`).join("")}</section>`;
  }

  function roRBaseText(unit) {
    if (unit.id === "vesperos_vendetta") return "Four Duelists plus Vespero (120 pts); additional Duelists cost 15 pts each.";
    if (unit.id === "oglah_khans_wolfboyz") return "Four Hobgoblins plus Oglah Khan (145 pts); additional Wolfboyz cost 17 pts each.";
    if (unit.id === "cursed_company") return "Nine Skeletons plus Richter Kreugar (145 pts); additional Skeletons cost 7 pts each.";
    return "";
  }

  const previousRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isDoW()) return previousRenderRegimentEditor(entry, unit);
    if (hasTag(unit, "regiment_of_renown")) {
      return `<section class="editor-section"><h3 class="editor-section-title">Fixed Regiment of Renown</h3><div class="dialog-note">${escapeHtml(roRBaseText(unit))}</div></section>${(unit.options || []).length ? `<section class="editor-section"><h3 class="editor-section-title">Additional Models</h3>${renderUnitOptions(entry, unit)}</section>` : ""}${renderLeaderMagicEditor(entry, unit)}${unit.rules?.length ? `<section class="editor-section"><h3 class="editor-section-title">Rules</h3>${unit.rules.map(rule => `<div class="dialog-note">${escapeHtml(rule)}</div>`).join("")}</section>` : ""}`;
    }
    let html = previousRenderRegimentEditor(entry, unit);
    if (unit.id === "norse_huscarls") {
      entry.dowExtraChampionItems = entry.dowExtraChampionItems || [];
      html += `<section class="editor-section"><h3 class="editor-section-title">Additional Norse Champions</h3><div class="field-hint">Unlike normal regiments, Norse Huscarls may be joined by any number of Norse Champions. The normal Champion control above represents the first; add further Champions here.</div><div class="dialog-field"><label>Additional Champions</label><input type="number" min="0" step="1" value="${Number(entry.dowExtraChampions || 0)}" data-dow-extra-champions></div>${Array.from({length:Number(entry.dowExtraChampions || 0)}, (_, index) => {
        const items = getAllowedMagicItems(unit, "champion");
        return `<div class="dialog-field"><label>Extra Champion ${index + 1} magic item</label><select data-dow-extra-champion-item="${index}"><option value="">None</option>${items.map(item => {
          const selected = entry.dowExtraChampionItems[index] === item.id;
          const used = magicItemUsedElsewhere(item.id, entry.id, "dowExtra") || entry.dowExtraChampionItems.some((id, i) => i !== index && id === item.id);
          return `<option value="${escapeHtml(item.id)}" ${selected ? "selected" : ""} ${used && !selected ? "disabled" : ""}>${escapeHtml(item.name)} (${formatPoints(item.cost)} pts)</option>`;
        }).join("")}</select></div>`;
      }).join("")}</section>`;
    }
    return html;
  };

  const previousRenderCharacterEditor = renderCharacterEditor;
  renderCharacterEditor = function(entry, unit) {
    let html = previousRenderCharacterEditor(entry, unit);
    if (!isDoW()) return html;
    if ((unit.options || []).length && entry.sectionKey === "specialCharacters") {
      html += `<section class="editor-section"><h3 class="editor-section-title">Special Character Options</h3>${renderUnitOptions(entry, unit)}</section>`;
    }
    return html;
  };

  const previousWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    previousWireEditorControls();
    if (!isDoW() || !state.draft) return;
    const entry = state.draft;
    const unit = unitFor(entry);

    els.dialogContent.querySelectorAll("[data-dow-leader-item]").forEach(select => {
      select.addEventListener("change", () => {
        const index = Number(select.dataset.dowLeaderItem);
        entry.dowLeaderMagicItems = entry.dowLeaderMagicItems || [];
        entry.dowLeaderMagicItems[index] = select.value || null;
        entry.dowLeaderMagicItems = entry.dowLeaderMagicItems.slice(0, rorLeaderConfig(unit)?.maximum || 0);
        updateDialogTotal();
      });
    });

    const extraChampions = els.dialogContent.querySelector("[data-dow-extra-champions]");
    if (extraChampions) extraChampions.addEventListener("change", () => {
      entry.dowExtraChampions = Math.max(0, Math.floor(Number(extraChampions.value || 0)));
      entry.dowExtraChampionItems = (entry.dowExtraChampionItems || []).slice(0, entry.dowExtraChampions);
      renderEditor();
    });

    els.dialogContent.querySelectorAll("[data-dow-extra-champion-item]").forEach(select => select.addEventListener("change", () => {
      const index = Number(select.dataset.dowExtraChampionItem);
      entry.dowExtraChampionItems = entry.dowExtraChampionItems || [];
      entry.dowExtraChampionItems[index] = select.value || null;
      updateDialogTotal();
    }));
  };

  function perTrooperCost(entry, unit) {
    return Number(unit.points?.value || 0) + Number(selectedPerModelOptionCost(entry, unit) || 0);
  }

  const previousCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    let total = previousCalculateEntry(entry);
    if (!isDoW()) return total;
    const unit = unitFor(entry);
    if (!unit) return total;

    if (unit.id === "human_cavalry_retainers" && entry.optionSelections?.armour === "heavy_armour" && entry.command?.standardBearer) total -= 10;

    if (unit.id === "norse_huscarls" && Number(entry.dowExtraChampions || 0) > 0) {
      const count = Number(entry.dowExtraChampions || 0);
      total += count * (20 + perTrooperCost(entry, unit));
      total += (entry.dowExtraChampionItems || []).reduce((sum, id) => sum + Number(getMagicItem(id)?.cost || 0), 0);
    }

    total += (entry.dowLeaderMagicItems || []).reduce((sum, id) => sum + Number(getMagicItem(id)?.cost || 0), 0);
    return total;
  };

  const previousGetSelectedEquipmentIds = getSelectedEquipmentIds;
  getSelectedEquipmentIds = function(entry, unit) {
    const ids = new Set(previousGetSelectedEquipmentIds(entry, unit));
    if (!isDoW()) return [...ids];
    const o = entry.optionSelections || {};

    for (const key of ["shield", "light_armour", "heavy_armour", "pavise", "barding"]) if (o[key]) ids.add(key);
    for (const key of ["melee_weapon", "missile_weapon", "armour"]) if (typeof o[key] === "string" && o[key]) ids.add(o[key]);
    if (o.longbows) { ids.delete("bow"); ids.add("longbow"); }
    if (o.armour === "heavy_armour" || o.heavy_armour) ids.delete("light_armour");
    return [...ids];
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isDoW() && state.draft) {
      const entry = state.draft;
      const unit = unitFor(entry);
      const o = entry.optionSelections || {};
      if (unit?.id === "human_foot_soldiers" && o.missile_weapon) {
        const melee = !!o.melee_weapon;
        const shield = !!o.shield;
        if (melee || shield) {
          window.alert("Human Foot Soldiers may take longbows, crossbows or handguns only when they have no other equipment apart from light armour. Crossbowmen may additionally take a pavise.");
          return;
        }
        if (o.pavise && o.missile_weapon !== "crossbow") {
          window.alert("A pavise may only be taken by Human Foot Soldiers equipped with crossbows.");
          return;
        }
      }
      if (unit?.id === "dwarf_mercenary_warriors" && o.missile_weapon && (o.melee_weapon || o.shield)) {
        window.alert("Dwarf Mercenary Warriors may take crossbows or handguns only if they take no other weapons or shields.");
        return;
      }
    }
    return previousSaveEditor();
  };

  const previousDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text = previousDescribeEntry(entry);
    if (!isDoW()) return text;
    const unit = unitFor(entry);
    const additions = [];
    if (unit?.id === "human_cavalry_retainers" && entry.optionSelections?.armour === "heavy_armour") additions.push("Heavy armour: no longer Fast Cavalry");
    if (unit?.id === "norse_huscarls" && Number(entry.dowExtraChampions || 0)) additions.push(`${entry.dowExtraChampions} additional Norse Champion${entry.dowExtraChampions === 1 ? "" : "s"}`);
    if (hasTag(unit, "regiment_of_renown")) {
      const extra = Number(entry.optionSelections?.extra_models || 0);
      if (extra) additions.push(`${extra} additional models`);
      const cfg = rorLeaderConfig(unit);
      if (cfg && entry.dowLeaderMagicItems?.filter(Boolean).length) additions.push(`${cfg.name}: ${entry.dowLeaderMagicItems.filter(Boolean).map(id => getMagicItem(id)?.name || id).join(", ")}`);
    }
    if (unit?.id === "asarnil") additions.push(`${humanise(entry.optionSelections?.dragon_colour || "red")} Dragon`);
    if (!additions.length) return text;
    return text === "Base configuration" ? additions.join(" · ") : `${text} · ${additions.join(" · ")}`;
  };

  const previousRosterPadNotes = rosterPadNotes;
  rosterPadNotes = function(entry, unit) {
    const notes = previousRosterPadNotes(entry, unit);
    if (!isDoW()) return notes;
    if (isPaymaster(unit)) notes.push("Paymaster: regiment is Unbreakable while he lives; Dogs of War units within 12 inches gain +1 Leadership.");
    if (unit?.id === "human_cavalry_retainers" && entry.optionSelections?.armour === "heavy_armour") notes.push("Heavy armour: loses Fast Cavalry status.");
    if (unit?.id === "norse_huscarls" && Number(entry.dowExtraChampions || 0)) notes.push(`${entry.dowExtraChampions} additional Norse Champion${entry.dowExtraChampions === 1 ? "" : "s"}.`);
    const cfg = rorLeaderConfig(unit);
    if (cfg) for (const id of entry.dowLeaderMagicItems || []) { const item = getMagicItem(id); if (item) notes.push(`${cfg.name}: ${item.name} — ${item.rules || ""}`); }
    if (unit?.id === "asarnil") notes.push(`${humanise(entry.optionSelections?.dragon_colour || "red")} Dragon.`);
    return [...new Set(notes)];
  };

  function extraProfileRow(name, profileId, note = "") {
    const profile = profileById.get(profileId);
    if (!profile) return "";
    return `<tr class="mount-row"><td class="unit-cell mount-name">↳ ${escapeHtml(name)}</td>${rosterPadProfileCells(profile)}<td class="save">–</td><td class="notes-cell mount-notes">${rosterPadNotesInline(note ? [note] : [])}</td><td class="points-cell"></td></tr>`;
  }

  const previousRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    let html = previousRosterPadRow(entry);
    if (!isDoW()) return html;
    const unit = unitFor(entry);
    if (!unit) return html;
    if (unit.id === "vesperos_vendetta") html += extraProfileRow("Vespero", "vespero", "Regiment leader");
    if (unit.id === "oglah_khans_wolfboyz") html += extraProfileRow("Oglah Khan", "oglah_khan", "Regiment leader");
    if (unit.id === "cursed_company") html += extraProfileRow("Richter Kreugar", "richter_kreugar", "Wight; carries a Wight Blade");
    if (unit.id === "myrdas") {
      html += extraProfileRow("Sheik Yadosh", "human_mercenary_soldier", "Always accompanies Myrdas");
      html += extraProfileRow("Bodyguards", "elite_human_mercenary_soldier", `${5 + Number(entry.optionSelections?.extra_bodyguards || 0)} models; halberds and light armour`);
    }
    if (unit.id === "galloper_gun") html += extraProfileRow("Galloper Horse", "normal_horse", "Raises movement allowance to 8 inches");
    return html;
  };

  const previousRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    previousRenderArmyStatus(total);
    if (!isDoW()) return;
    patchData();
    const mainstay = mainstayCount();
    const warnings = [];
    if (!mainstay) warnings.push("The army must include at least one Human regiment of Old World origin (Norse do not count).");
    if (!state.roster.some(entry => isHumanCharacter(unitFor(entry)))) warnings.push("The army must include a Human character eligible to serve as General.");
    if (!state.roster.some(entry => isPaymaster(unitFor(entry)))) warnings.push("Dogs of War use a Human Paymaster and Pay Chest instead of a Battle Standard Bearer.");
    if (state.roster.filter(entry => isPaymaster(unitFor(entry))).length > 1) warnings.push("Only one Paymaster may be included.");
    if (state.roster.some(entry => entry.unitId === "ogre_mercenary_hero") && !ogreRegimentPresent()) warnings.push("The Ogre Mercenary Hero requires an Ogre Mercenaries regiment.");
    if (state.roster.some(entry => entry.unitId === "halfling_hot_pot") && !halflingRegimentPresent()) warnings.push("The Halfling Hot-Pot requires a Halfling regiment.");

    const counts = new Map();
    for (const entry of state.roster) {
      if (!["regiments", "warMachines"].includes(entry.sectionKey)) continue;
      const unit = unitFor(entry);
      if (isMainstay(unit)) continue;
      const key = `${entry.sectionKey}:${entry.unitId}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    for (const [key, count] of counts) if (count > mainstay) {
      const [, id] = key.split(":");
      const unit = ["regiments", "warMachines"].flatMap(section => state.data.faction[section] || []).find(x => x.id === id);
      warnings.push(`${unit?.name || humanise(id)}: ${count} included but only ${mainstay} allowed by your ${mainstay} Old World Human mainstay regiment${mainstay === 1 ? "" : "s"}.`);
    }

    const panel = document.createElement("div");
    panel.className = `army-system-panel${warnings.length ? " warn" : ""}`;
    panel.innerHTML = `<div class="army-system-copy"><strong>Dogs of War Mainstay & Paymaster</strong><span>${mainstay} Old World Human mainstay regiment${mainstay === 1 ? "" : "s"}. Each other regiment or war machine may be taken no more than this many times.${warnings.length ? `<br>${warnings.map(w => `⚠ ${escapeHtml(w)}`).join("<br>")}` : " Army construction requirements currently satisfied."}</span></div>`;
    els.armyStatus.prepend(panel);
  };
})();
