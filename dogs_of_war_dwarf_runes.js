// Dwarf Mercenary Champions and standards may use Dwarf runic items.
(() => {
  const isDoW = () => state.data?.faction?.id === "dogs_of_war" && state.selectedArmyId === "dogs_of_war";
  const isDwarfMercs = unit => unit?.id === "dwarf_mercenary_warriors";
  const categories = () => state.data?.faction?.systems?.dwarfRunes?.categories || {};
  const runeById = id => Object.values(categories()).flat().find(rune => rune.id === id);

  function ensure(entry) {
    entry.dowDwarfRunes = entry.dowDwarfRunes || {champion:{weapon:[], armour:[], talisman:[]}, standard:[]};
    entry.dowDwarfRunes.champion = entry.dowDwarfRunes.champion || {weapon:[], armour:[], talisman:[]};
    for (const key of ["weapon","armour","talisman"]) if (!Array.isArray(entry.dowDwarfRunes.champion[key])) entry.dowDwarfRunes.champion[key] = [];
    if (!Array.isArray(entry.dowDwarfRunes.standard)) entry.dowDwarfRunes.standard = [];
    return entry.dowDwarfRunes;
  }

  const oldCreateEntry = createEntry;
  createEntry = function(sectionKey, unit) {
    const entry = oldCreateEntry(sectionKey, unit);
    if (isDoW() && isDwarfMercs(unit)) ensure(entry);
    return entry;
  };

  function usedChampionRuneItem(entry) {
    const runes = ensure(entry).champion;
    return ["weapon","armour","talisman"].some(key => runes[key].length);
  }

  function runeCost(id) { return Number(runeById(id)?.cost || 0); }
  function totalRuneCost(entry) {
    const r = ensure(entry);
    return [...r.champion.weapon, ...r.champion.armour, ...r.champion.talisman, ...r.standard].reduce((sum,id)=>sum+runeCost(id),0);
  }

  const oldGetMagicMaximum = getMagicMaximum;
  getMagicMaximum = function(unit, context) {
    const maximum = oldGetMagicMaximum(unit, context);
    if (!isDoW() || !isDwarfMercs(unit) || context !== "champion" || !state.draft) return maximum;
    return Math.max(0, maximum - (usedChampionRuneItem(state.draft) ? 1 : 0));
  };

  const oldCalculateEntry = calculateEntry;
  calculateEntry = function(entry) {
    const total = oldCalculateEntry(entry);
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!isDoW() || !isDwarfMercs(unit)) return total;
    return total + totalRuneCost(entry);
  };

  function runesFor(category) {
    return (categories()[category] || []).filter(rune => !rune.onlyRunesmith && (!rune.allowedUnits || !rune.allowedUnits.length));
  }

  function renderRuneItem(entry, category, title, standard=false) {
    const selected = standard ? ensure(entry).standard : ensure(entry).champion[category];
    const available = runesFor(standard ? "protection" : category);
    if (!available.length) return "";
    return `<section class="editor-section"><div class="magic-header"><h3 class="editor-section-title" style="margin:0;">${escapeHtml(title)}</h3><span class="magic-counter">${selected.length} / 3 runes</span></div><div class="field-hint">Up to three runes form one runic item. A Dwarf Champion may carry one runic item in place of his normal magic item.${standard ? " A runic standard replaces a conventional magic banner." : ""}</div>${[0,1,2].map(slot=>`<div class="dialog-field"><label>Rune ${slot+1}</label><select data-dow-dwarf-rune="${standard ? "standard" : category}" data-dow-rune-slot="${slot}"><option value="">None</option>${available.map(rune=>`<option value="${escapeHtml(rune.id)}" ${selected[slot]===rune.id?"selected":""}>${escapeHtml(rune.name)} (${formatPoints(rune.cost)} pts)</option>`).join("")}</select></div>`).join("")}</section>`;
  }

  const oldRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = oldRenderRegimentEditor(entry, unit);
    if (!isDoW() || !isDwarfMercs(unit)) return html;
    ensure(entry);
    if (entry.champion?.selected) {
      html += renderRuneItem(entry,"weapon","Champion Runic Weapon");
      html += renderRuneItem(entry,"armour","Champion Runic Armour");
      html += renderRuneItem(entry,"talisman","Champion Runic Talisman");
    }
    if (entry.command?.standardBearer) html += renderRuneItem(entry,"protection","Runic Standard",true);
    return html;
  };

  function runeCountElsewhere(id, entryId) {
    let count=0;
    for (const entry of state.roster) {
      if (entry.id===entryId || !entry.dowDwarfRunes) continue;
      const r=ensure(entry);
      for (const arr of [r.champion.weapon,r.champion.armour,r.champion.talisman,r.standard]) count += arr.filter(x=>x===id).length;
    }
    return count;
  }

  function validate(entry, category, slot, id) {
    if (!id) return {ok:true, next:null};
    const standard = category === "standard";
    const rune = runeById(id);
    const source = standard ? ensure(entry).standard : ensure(entry).champion[category];
    const next=[...source]; while(next.length<3) next.push(""); next[slot]=id;
    const chosen=next.filter(Boolean), details=chosen.map(runeById);
    if (details.filter(r=>r?.master).length>1) return {ok:false,msg:"A runic item may contain only one Master Rune."};
    if (rune?.master && runeCountElsewhere(id,entry.id)) return {ok:false,msg:"That Master Rune is already used elsewhere in the army."};
    const times=chosen.filter(x=>x===id).length;
    if (rune && !rune.repeatable && times>1) return {ok:false,msg:"That rune cannot be repeated on the same item."};
    if (rune?.maxRepeats && times>Number(rune.maxRepeats)) return {ok:false,msg:`${rune.name} may be taken at most ${rune.maxRepeats} times.`};
    if (id==="r_spellbreaking" && runeCountElsewhere(id,entry.id)+times>2) return {ok:false,msg:"No more than two Runes of Spellbreaking may be included in the army."};
    if (standard && entry.magicBanner) return {ok:false,msg:"Remove the conventional magic banner before creating a runic standard."};
    if (!standard) {
      if (entry.champion?.magicItems?.length) return {ok:false,msg:"The Dwarf Champion's runic item uses his single magic-item allowance. Remove his conventional magic item first."};
      const other=["weapon","armour","talisman"].filter(key=>key!==category && ensure(entry).champion[key].length);
      if (other.length) return {ok:false,msg:"The Dwarf Champion may carry only one runic item."};
    }
    return {ok:true,next:chosen};
  }

  const oldWireEditorControls = wireEditorControls;
  wireEditorControls = function() {
    oldWireEditorControls();
    if (!isDoW() || !state.draft || !isDwarfMercs(getUnit(state.draft.sectionKey,state.draft.unitId))) return;
    const entry=state.draft; ensure(entry);
    els.dialogContent.querySelectorAll("[data-dow-dwarf-rune]").forEach(select=>select.addEventListener("change",()=>{
      const category=select.dataset.dowDwarfRune, slot=Number(select.dataset.dowRuneSlot);
      const check=validate(entry,category,slot,select.value);
      if(!check.ok){window.alert(check.msg);renderEditor();return;}
      const target=category==="standard"?entry.dowDwarfRunes.standard:entry.dowDwarfRunes.champion[category];
      const next=[...target]; while(next.length<3)next.push(""); next[slot]=select.value||"";
      if(category==="standard")entry.dowDwarfRunes.standard=next.filter(Boolean);else entry.dowDwarfRunes.champion[category]=next.filter(Boolean);
      renderEditor();
    }));
  };

  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isDoW() && state.draft && isDwarfMercs(getUnit(state.draft.sectionKey,state.draft.unitId))) {
      const r=ensure(state.draft);
      if (r.standard.length && state.draft.magicBanner) {
        window.alert("A Dwarf regiment cannot carry both a conventional magic banner and a runic standard.");
        return;
      }
      if (usedChampionRuneItem(state.draft) && state.draft.champion?.magicItems?.length) {
        window.alert("The Dwarf Champion's runic item uses his single magic-item allowance.");
        return;
      }
    }
    return oldSaveEditor();
  };

  const oldDescribeEntry = describeEntry;
  describeEntry = function(entry) {
    let text=oldDescribeEntry(entry);
    const unit=getUnit(entry.sectionKey,entry.unitId);
    if(!isDoW()||!isDwarfMercs(unit)||!entry.dowDwarfRunes)return text;
    const r=ensure(entry), additions=[];
    for(const key of ["weapon","armour","talisman"])if(r.champion[key].length)additions.push(`Champion ${humanise(key)} runes: ${r.champion[key].map(id=>runeById(id)?.name||id).join(", ")}`);
    if(r.standard.length)additions.push(`Runic Standard: ${r.standard.map(id=>runeById(id)?.name||id).join(", ")}`);
    return additions.length?(text==="Base configuration"?additions.join(" · "):`${text} · ${additions.join(" · ")}`):text;
  };

  const oldRosterPadNotes = rosterPadNotes;
  rosterPadNotes = function(entry,unit) {
    const notes=oldRosterPadNotes(entry,unit);
    if(!isDoW()||!isDwarfMercs(unit)||!entry.dowDwarfRunes)return notes;
    const r=ensure(entry);
    for(const key of ["weapon","armour","talisman"])if(r.champion[key].length)notes.push(`${unit.champion?.name||"Dwarf Champion"} runic ${key}: ${r.champion[key].map(id=>runeById(id)?.name||id).join(", ")}`);
    if(r.standard.length)notes.push(`Runic Standard: ${r.standard.map(id=>runeById(id)?.name||id).join(", ")}`);
    return [...new Set(notes)];
  };
})();
