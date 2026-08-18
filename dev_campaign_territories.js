(() => {
  const BASE_PHOENIX = {
    pointsLimit: 1500,
    wizardSlots: [1],
    magicItemCaps: [50],
    otherCharacters: 1
  };

  let viewedCampaignId = null;
  let activeCampaignId = null;
  let activeUserId = null;
  let activeTerritories = [];
  let territoryTypes = [];
  let loadingEffects = false;
  let effectsLoaded = false;
  let panelToken = 0;

  const esc = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const CHARACTER_SECTIONS = new Set(["characters", "specialCharacters"]);

  function territoryType(id) {
    return territoryTypes.find(t => t.id === id) || null;
  }

  function typeName(id) {
    return territoryType(id)?.name || id || "Territory";
  }

  function territoryValueText(row) {
    const kind = territoryType(row.territory_type_id)?.effect_kind;
    const value = Number(row.effect_value || 0);
    if (kind === "army_points") return `+${value} army points`;
    if (kind === "large_monsters") return `+${value} large monster${value === 1 ? "" : "s"}`;
    if (kind === "war_machines") return `+${value} war machine${value === 1 ? "" : "s"}`;
    return "";
  }

  function calculateEffects(rows = activeTerritories) {
    const effects = {
      pointsLimit: BASE_PHOENIX.pointsLimit,
      pointsBonus: 0,
      wizardSlots: [...BASE_PHOENIX.wizardSlots],
      magicItemCaps: [...BASE_PHOENIX.magicItemCaps],
      villageChampionSlots: 0,
      townFlexibleSlots: 0,
      largeMonsterBonus: 0,
      warMachineBonus: 0,
      territoryCount: rows.filter(r => r.counts_toward_limit).length
    };

    for (const row of rows) {
      switch (row.territory_type_id) {
        case "wizards_tower": effects.wizardSlots.push(1); break;
        case "sacred_grove": effects.wizardSlots.push(2); break;
        case "shrine": effects.wizardSlots.push(3); effects.magicItemCaps.push(50); break;
        case "temple": effects.wizardSlots.push(4); effects.magicItemCaps.push(75); break;
        case "village": effects.villageChampionSlots += 1; break;
        case "town": effects.townFlexibleSlots += 3; break;
        case "trade_route": effects.magicItemCaps.push(50); break;
        case "silver_mine": effects.magicItemCaps.push(75,75,75); break;
        case "gold_mine": effects.magicItemCaps.push(100,100,100); break;
        case "treasure_hoard": effects.magicItemCaps.push(Infinity,Infinity,Infinity,Infinity,Infinity); break;
        case "road":
        case "bridge":
        case "pass": effects.pointsBonus += Number(row.effect_value || 0); break;
        case "mountains": effects.largeMonsterBonus += Number(row.effect_value || 0); break;
        case "forest": effects.warMachineBonus += Number(row.effect_value || 0); break;
      }
    }
    effects.pointsLimit += effects.pointsBonus;
    return effects;
  }

  function currentEffects() {
    return calculateEffects(activeTerritories);
  }

  function applyEffectsToCampaignRules() {
    const api = window.whrCampaignArmies;
    const campaign = api?.activeCampaign?.();
    const rules = api?.rules?.();
    if (!campaign || campaign.campaign_type_id !== "phoenix_games" || !rules || campaign.id !== activeCampaignId) return;

    const fx = currentEffects();
    rules.pointsLimit = fx.pointsLimit;
    rules.maxWizards = fx.wizardSlots.length;
    rules.maxWizardLevel = Math.max(...fx.wizardSlots);
    rules.maxOtherCharacters = BASE_PHOENIX.otherCharacters + fx.townFlexibleSlots;
    rules.maxMagicItems = fx.magicItemCaps.length;
    rules.maxMagicItemCost = fx.magicItemCaps.some(v => v === Infinity) ? Infinity : Math.max(...fx.magicItemCaps);

    if (state?.campaignContext?.id === campaign.id) {
      state.pointsLimit = fx.pointsLimit;
      if (els?.pointsLimit) {
        els.pointsLimit.value = fx.pointsLimit;
        els.pointsLimit.disabled = true;
        els.pointsLimit.title = `Phoenix Games base 1500 points${fx.pointsBonus ? ` + ${fx.pointsBonus} from territories` : ""}.`;
      }
    }
  }

  function unitFor(entry) {
    try { return entry ? getUnit(entry.sectionKey, entry.unitId) : null; }
    catch { return null; }
  }

  function unitIdentity(unit) {
    return [unit?.id,unit?.name,unit?.profileId,...(unit?.tags || []),...(unit?.rules || [])].filter(Boolean).join(" ").toLowerCase();
  }

  function explicitWizardLevel(unit) {
    const candidates = [unit?.wizardLevel,unit?.magicLevel,unit?.wizard?.level,unit?.wizard?.baseLevel];
    for (const value of candidates) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) return n;
    }
    const match = unitIdentity(unit).match(/(?:level\s*([1-4])\s*(?:wizard|mage|shaman|sorcerer)|(?:wizard|mage|shaman|sorcerer)\s*(?:level\s*)?([1-4]))/i);
    return match ? Number(match[1] || match[2]) : null;
  }

  function wizardLevel(entry) {
    const unit = unitFor(entry);
    const selected = Number(entry?.wizardLevels || 0);
    if (selected > 0) return selected;
    const explicit = explicitWizardLevel(unit);
    if (explicit) return explicit;
    const tags = (unit?.tags || []).map(t => String(t).toLowerCase());
    if (tags.some(tag => /wizard|mage|shaman|sorcerer/.test(tag))) return 1;
    return /\b(wizard|shaman|mage|sorcerer|necromancer|spellcaster)\b/.test(unitIdentity(unit)) && !unit?.wizardUpgrade ? 1 : 0;
  }

  function selectedOptionText(entry, unit) {
    const bits = [];
    for (const option of unit?.options || []) {
      const selected = entry?.optionSelections?.[option.id];
      if (!selected) continue;
      bits.push(option.id,option.name,option.label,option.rules,selected);
    }
    return bits.filter(Boolean).join(" ").toLowerCase();
  }

  function isBsb(entry, unit) {
    const text = `${unitIdentity(unit)} ${selectedOptionText(entry,unit)}`;
    return /\bbsb\b|battle standard bearer/.test(text);
  }

  function isHeroOrBsb(entry, unit) {
    if (isBsb(entry,unit)) return true;
    const tags = (unit?.tags || []).map(t => String(t).toLowerCase());
    if (tags.some(tag => tag === "hero" || tag.includes("hero_level") || tag === "hero_character")) return true;
    const text = unitIdentity(unit);
    return /\b(hero|captain|thane|noble|chieftain|paladin|wight lord|champion of chaos|exalted champion)\b/.test(text);
  }

  function selectedMagicItems(roster = state.roster) {
    const items = [];
    for (const entry of roster || []) {
      for (const id of entry.magicItems || []) items.push({ id, cost:Number(getMagicItem(id)?.cost || 0) });
      for (const id of entry.champion?.magicItems || []) items.push({ id, cost:Number(getMagicItem(id)?.cost || 0) });
      if (entry.magicBanner) items.push({ id:entry.magicBanner, cost:Number(getMagicItem(entry.magicBanner)?.cost || 0) });
    }
    return items;
  }

  function territoryValidationErrors() {
    const campaign = window.whrCampaignArmies?.activeCampaign?.();
    if (!campaign || campaign.campaign_type_id !== "phoenix_games") return [];
    if (!effectsLoaded || campaign.id !== activeCampaignId) return ["Territory bonuses are still loading. Please wait a moment before saving."];

    const fx = currentEffects();
    const errors = [];
    const characters = state.roster.filter(e => CHARACTER_SECTIONS.has(e.sectionKey));
    const wizards = characters.map(entry => ({ entry,unit:unitFor(entry),level:wizardLevel(entry) })).filter(x => x.level > 0);
    const availableWizardSlots = [...fx.wizardSlots].sort((a,b) => b-a);
    const usedWizardLevels = wizards.map(w => w.level).sort((a,b) => b-a);
    if (usedWizardLevels.length > availableWizardSlots.length) {
      errors.push(`Your territories provide ${availableWizardSlots.length} Wizard slot${availableWizardSlots.length === 1 ? "" : "s"}, but the army contains ${usedWizardLevels.length} Wizards.`);
    } else {
      for (let i=0;i<usedWizardLevels.length;i++) {
        if (usedWizardLevels[i] > availableWizardSlots[i]) {
          errors.push(`Wizard levels do not fit your territory allowances. Available slots: ${availableWizardSlots.map(l => `Level ${l}`).join(", ")}.`);
          break;
        }
      }
    }

    const nonWizards = characters.filter(entry => wizardLevel(entry) === 0);
    let baselineEntry = nonWizards.find(entry => entry.id === state.generalEntryId) || nonWizards[0] || null;
    const extraCharacters = nonWizards.filter(entry => entry !== baselineEntry);
    const invalidExtra = extraCharacters.filter(entry => !isHeroOrBsb(entry,unitFor(entry)));
    if (invalidExtra.length) {
      errors.push(`Additional Town character slots may only be used by Heroes or Battle Standard Bearers: ${invalidExtra.map(e => unitFor(e)?.name || "Character").join(", ")}.`);
    }
    const extraHeroSlotsUsed = extraCharacters.length;
    if (extraHeroSlotsUsed > fx.townFlexibleSlots) {
      errors.push(`Towns provide ${fx.townFlexibleSlots} additional Champion/Hero/BSB slot${fx.townFlexibleSlots === 1 ? "" : "s"}; ${extraHeroSlotsUsed} are currently used by additional characters.`);
    }

    const championCount = state.roster.filter(entry => entry.champion?.selected).length;
    const townSlotsRemaining = Math.max(0,fx.townFlexibleSlots - extraHeroSlotsUsed);
    const championAllowance = fx.villageChampionSlots + townSlotsRemaining;
    if (championCount > championAllowance) {
      errors.push(`The army contains ${championCount} unit Champion${championCount === 1 ? "" : "s"}, but your Villages and unused Town slots currently allow ${championAllowance}.`);
    }

    const items = selectedMagicItems().sort((a,b) => b.cost-a.cost);
    const caps = [...fx.magicItemCaps].sort((a,b) => b-a);
    if (items.length > caps.length) {
      errors.push(`Your territories allow ${caps.length} magic item${caps.length === 1 ? "" : "s"}, but the army contains ${items.length}.`);
    } else {
      for (let i=0;i<items.length;i++) {
        if (items[i].cost > caps[i]) {
          const capText = caps.map(c => c === Infinity ? "unlimited" : `${c} pts`).join(", ");
          errors.push(`Magic-item values do not fit your available allowances. Current item limits: ${capText}.`);
          break;
        }
      }
    }

    return [...new Set(errors)];
  }

  function territoryRulesStatusHtml() {
    const campaign = window.whrCampaignArmies?.activeCampaign?.();
    if (!campaign || campaign.campaign_type_id !== "phoenix_games") return "";
    if (!effectsLoaded) return `<div class="general-status"><strong>Territories:</strong> loading your campaign territory bonuses…</div>`;
    const fx = currentEffects();
    const errors = territoryValidationErrors();
    const wizardText = fx.wizardSlots.map(l => `L${l}`).join(", ");
    const capText = fx.magicItemCaps.map(c => c === Infinity ? "∞" : c).join(", ");
    const bonuses = [
      `${fx.territoryCount}/12 territories`,
      `${fx.pointsLimit} pts`,
      `Wizard slots ${wizardText}`,
      `Magic items ${capText} pts`,
      `${fx.villageChampionSlots} Village Champion slot${fx.villageChampionSlots === 1 ? "" : "s"}`,
      `${fx.townFlexibleSlots} Town flexible slot${fx.townFlexibleSlots === 1 ? "" : "s"}`,
      fx.largeMonsterBonus ? `+${fx.largeMonsterBonus} large monsters` : "",
      fx.warMachineBonus ? `+${fx.warMachineBonus} war machines` : ""
    ].filter(Boolean).join(" · ");
    return `<div class="general-status ${errors.length ? "" : "good"}"><strong>Territory rules:</strong> ${esc(bonuses)}${errors.length ? `<ul style="margin:6px 0 0 18px">${errors.map(e => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}</div>`;
  }

  async function loadTerritoryTypes() {
    if (territoryTypes.length) return;
    const { data,error } = await window.whrSupabase.from("territory_types").select("id,name,description,effect_kind,value_min,value_max,value_step,sort_order").eq("active",true).order("sort_order");
    if (error) throw error;
    territoryTypes = data || [];
  }

  async function loadActiveTerritories(campaignId,userId) {
    loadingEffects = true;
    effectsLoaded = false;
    try {
      await loadTerritoryTypes();
      const { data,error } = await window.whrSupabase
        .from("campaign_territories")
        .select("id,campaign_id,territory_type_id,owner_id,effect_value,parent_territory_id,counts_toward_limit,locked_to_parent,created_at,acquired_at")
        .eq("campaign_id",campaignId)
        .eq("owner_id",userId);
      if (error) throw error;
      activeTerritories = data || [];
      activeCampaignId = campaignId;
      activeUserId = userId;
      effectsLoaded = true;
      applyEffectsToCampaignRules();
      if (state?.data) renderArmy();
    } catch (error) {
      console.error("Could not load territory effects",error);
      activeTerritories = [];
      effectsLoaded = false;
    } finally {
      loadingEffects = false;
    }
  }

  async function refreshActiveContext() {
    if (!window.whrCampaignArmies || !window.whrSupabase) return;
    const campaign = window.whrCampaignArmies.activeCampaign?.();
    const { data } = await window.whrSupabase.auth.getUser();
    const user = data?.user || null;
    if (!campaign || campaign.campaign_type_id !== "phoenix_games" || !user) {
      activeCampaignId = null; activeUserId = null; activeTerritories = []; effectsLoaded = false;
      return;
    }
    if (campaign.id !== activeCampaignId || user.id !== activeUserId) {
      await loadActiveTerritories(campaign.id,user.id);
    } else {
      applyEffectsToCampaignRules();
    }
  }

  function installStyles() {
    if (document.getElementById("campaignTerritoryStyles")) return;
    const style = document.createElement("style");
    style.id = "campaignTerritoryStyles";
    style.textContent = `
      .territory-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-top:12px}.territory-player{border:1px solid #dce1e6;border-radius:7px;padding:12px}.territory-player h4{margin:0 0 8px}.territory-card{padding:9px 10px;border-top:1px solid #edf0f2}.territory-card:first-of-type{border-top:0}.territory-card-child{margin-left:15px;border-left:3px solid #d8c18d;background:#fffaf0}.territory-value{font-size:11px;color:#7b211b;font-weight:800;margin-top:3px}.territory-dialog{width:min(650px,94vw);border:0;border-radius:9px;padding:0;box-shadow:0 18px 60px rgba(0,0,0,.3)}.territory-dialog::backdrop{background:rgba(0,0,0,.55)}.territory-dialog-card{background:#fff;padding:22px;display:grid;gap:14px}.territory-dialog-card h2{margin:0}.territory-field{display:grid;gap:5px;font-weight:800}.territory-field select,.territory-field input{font:inherit;padding:9px;border:1px solid #bcc5cf;border-radius:5px}.territory-actions{display:flex;justify-content:flex-end;gap:8px}.territory-help{font-size:12px;color:#69727b;line-height:1.45}.territory-child-list{margin-top:6px}
    `;
    document.head.appendChild(style);
  }

  async function fetchCampaignMembers(campaignId) {
    const { data:members,error } = await window.whrSupabase.from("campaign_members").select("user_id,role").eq("campaign_id",campaignId);
    if (error) throw error;
    const ids = (members || []).map(m => m.user_id);
    let profiles = [];
    if (ids.length) {
      const result = await window.whrSupabase.from("profiles").select("id,display_name").in("id",ids);
      profiles = result.data || [];
    }
    const names = new Map(profiles.map(p => [p.id,p.display_name]));
    return (members || []).map(m => ({...m,display_name:names.get(m.user_id) || "WHR Player"}));
  }

  function buildTerritoryDialog() {
    let dialog = document.getElementById("campaignTerritoryDialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "campaignTerritoryDialog";
    dialog.className = "territory-dialog";
    dialog.innerHTML = `<form class="territory-dialog-card" method="dialog"><div><p class="eyebrow">Phoenix Games</p><h2 id="territoryDialogTitle">Add Territory</h2></div><div id="territoryDialogBody"></div><div id="territoryDialogMessage" class="campaign-message" hidden></div><div class="territory-actions"><button id="territoryDialogCancel" type="button" class="campaign-button secondary">Cancel</button><button id="territoryDialogConfirm" type="button" class="campaign-button">Add Territory</button></div></form>`;
    document.body.appendChild(dialog);
    dialog.querySelector("#territoryDialogCancel").onclick = () => dialog.close();
    return dialog;
  }

  async function openAddTerritory(campaign) {
    const dialog = buildTerritoryDialog();
    await loadTerritoryTypes();
    const members = await fetchCampaignMembers(campaign.id);
    dialog.querySelector("#territoryDialogTitle").textContent = "Add Territory";
    const body = dialog.querySelector("#territoryDialogBody");
    body.innerHTML = `<div style="display:grid;gap:14px"><label class="territory-field">Player<select id="territoryOwnerSelect">${members.map(m => `<option value="${esc(m.user_id)}">${esc(m.display_name)}</option>`).join("")}</select></label><label class="territory-field">Territory<select id="territoryTypeSelect">${territoryTypes.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("")}</select></label><div id="territoryDynamicHelp" class="territory-help"></div><div id="lostValleyChildren" hidden><label class="territory-field">Lost Valley territory 1<select id="lostValleyChild1">${territoryTypes.filter(t => t.id!=="lost_valley").map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("")}</select></label><label class="territory-field" style="margin-top:10px">Lost Valley territory 2<select id="lostValleyChild2">${territoryTypes.filter(t => t.id!=="lost_valley").map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("")}</select></label></div></div>`;
    const select = body.querySelector("#territoryTypeSelect");
    const updateHelp = () => {
      const type = territoryType(select.value);
      body.querySelector("#territoryDynamicHelp").textContent = `${type?.description || ""}${type?.value_min != null ? ` A value between ${type.value_min} and ${type.value_max} is generated now and permanently stored on this territory.` : ""}`;
      body.querySelector("#lostValleyChildren").hidden = select.value !== "lost_valley";
    };
    select.onchange = updateHelp; updateHelp();
    const message = dialog.querySelector("#territoryDialogMessage"); message.hidden=true; message.textContent="";
    const confirm = dialog.querySelector("#territoryDialogConfirm"); confirm.textContent="Add Territory";
    confirm.onclick = async () => {
      confirm.disabled=true; message.hidden=true;
      try {
        const owner = body.querySelector("#territoryOwnerSelect").value;
        if (select.value === "lost_valley") {
          const c1 = body.querySelector("#lostValleyChild1").value;
          const c2 = body.querySelector("#lostValleyChild2").value;
          const { error } = await window.whrSupabase.rpc("whr_create_lost_valley",{p_campaign_id:campaign.id,p_owner_id:owner,p_child_type_1:c1,p_child_type_2:c2});
          if (error) throw error;
        } else {
          const { error } = await window.whrSupabase.rpc("whr_create_campaign_territory",{p_campaign_id:campaign.id,p_territory_type_id:select.value,p_owner_id:owner,p_effect_value:null,p_parent_territory_id:null});
          if (error) throw error;
        }
        dialog.close();
        showToast("Territory added");
        await renderTerritoryPanel(true);
        if (campaign.id===activeCampaignId && owner===activeUserId) await loadActiveTerritories(campaign.id,owner);
      } catch(error) {
        message.hidden=false; message.textContent=error?.message || "Could not add territory";
      } finally { confirm.disabled=false; }
    };
    dialog.showModal();
  }

  async function transferTerritory(campaign,row,members) {
    const choices = members.filter(m => m.user_id !== row.owner_id);
    if (!choices.length) { alert("There is no other campaign member to transfer this territory to."); return; }
    const dialog = buildTerritoryDialog();
    dialog.querySelector("#territoryDialogTitle").textContent = `Transfer ${typeName(row.territory_type_id)}`;
    const body = dialog.querySelector("#territoryDialogBody");
    body.innerHTML = `<div style="display:grid;gap:14px"><label class="territory-field">New owner<select id="territoryTransferOwner">${choices.map(m => `<option value="${esc(m.user_id)}">${esc(m.display_name)}</option>`).join("")}</select></label><label class="territory-field">Reason (optional)<input id="territoryTransferReason" maxlength="200" placeholder="Battle result, trade, campaign event…"></label><div class="territory-help">The territory's fixed value moves with it. If this is a Lost Valley, both attached territories move with the valley.</div></div>`;
    const message=dialog.querySelector("#territoryDialogMessage"); message.hidden=true;
    const confirm=dialog.querySelector("#territoryDialogConfirm"); confirm.textContent="Transfer";
    confirm.onclick=async()=>{
      confirm.disabled=true;
      try {
        const toOwner=body.querySelector("#territoryTransferOwner").value;
        const reason=body.querySelector("#territoryTransferReason").value.trim();
        const { error }=await window.whrSupabase.rpc("whr_transfer_campaign_territory",{p_territory_id:row.id,p_to_owner_id:toOwner,p_reason:reason});
        if(error) throw error;
        dialog.close(); showToast("Territory transferred"); await renderTerritoryPanel(true);
        const campaignActive=window.whrCampaignArmies?.activeCampaign?.();
        if(campaignActive?.id===campaign.id && activeUserId) await loadActiveTerritories(campaign.id,activeUserId);
      } catch(error) { message.hidden=false; message.textContent=error?.message || "Could not transfer territory"; }
      finally { confirm.disabled=false; }
    };
    dialog.showModal();
  }

  async function renderTerritoryPanel(force=false) {
    const token=++panelToken;
    const campaignId=viewedCampaignId;
    const content=document.getElementById("campaignFormContent");
    const dialog=document.getElementById("campaignFormDialog");
    if(!campaignId || !content || !dialog?.open) return;
    if(force) content.querySelector(`[data-territory-panel="${campaignId}"]`)?.remove();
    if(content.querySelector(`[data-territory-panel="${campaignId}"]`)) return;

    try {
      await loadTerritoryTypes();
      const [{data:campaign,error:campaignError},{data:userData},members] = await Promise.all([
        window.whrSupabase.from("campaigns").select("id,campaign_type_id,owner_id,name").eq("id",campaignId).single(),
        window.whrSupabase.auth.getUser(),
        fetchCampaignMembers(campaignId)
      ]);
      if(campaignError) throw campaignError;
      const user=userData?.user;
      if(!user || campaign.campaign_type_id!=="phoenix_games" || token!==panelToken) return;
      if(!members.some(m=>m.user_id===user.id)) return;

      const {data:rows,error}=await window.whrSupabase.from("campaign_territories").select("id,campaign_id,territory_type_id,owner_id,effect_value,parent_territory_id,counts_toward_limit,locked_to_parent,created_at,acquired_at").eq("campaign_id",campaignId).order("created_at");
      if(error) throw error;
      const roots=(rows||[]).filter(r=>!r.parent_territory_id);
      const childrenByParent=new Map();
      for(const row of (rows||[]).filter(r=>r.parent_territory_id)) {
        if(!childrenByParent.has(row.parent_territory_id)) childrenByParent.set(row.parent_territory_id,[]);
        childrenByParent.get(row.parent_territory_id).push(row);
      }
      const panel=document.createElement("section"); panel.className="campaign-subpanel"; panel.dataset.territoryPanel=campaignId;
      const isOwner=campaign.owner_id===user.id;
      const memberBlocks=members.map(member=>{
        const owned=roots.filter(r=>r.owner_id===member.user_id);
        return `<div class="territory-player"><h4>${esc(member.display_name)} <span class="campaign-meta">${owned.length}/12</span></h4>${owned.length?owned.map(row=>{
          const children=childrenByParent.get(row.id)||[];
          const value=territoryValueText(row);
          return `<div class="territory-card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><strong>${esc(typeName(row.territory_type_id))}</strong>${value?`<div class="territory-value">${esc(value)}</div>`:""}</div>${isOwner?`<button class="campaign-button secondary" type="button" data-transfer-territory="${esc(row.id)}">Transfer</button>`:""}</div>${children.length?`<div class="territory-child-list">${children.map(child=>`<div class="territory-card territory-card-child"><strong>${esc(typeName(child.territory_type_id))}</strong>${territoryValueText(child)?`<div class="territory-value">${esc(territoryValueText(child))}</div>`:""}<div class="campaign-meta">Locked to Lost Valley</div></div>`).join("")}</div>`:""}</div>`;
        }).join(""):`<div class="campaign-meta">No territories yet.</div>`}</div>`;
      }).join("");
      panel.innerHTML=`<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h3 style="margin:0 0 4px">Territories</h3><div class="campaign-meta">Players begin with 3 territories and may own up to 12. Lost Valley children stay attached to the valley and do not count separately.</div></div>${isOwner?`<button class="campaign-button" type="button" data-add-territory>Add Territory</button>`:""}</div><div class="territory-grid">${memberBlocks}</div>`;
      content.prepend(panel);
      panel.querySelector("[data-add-territory]")?.addEventListener("click",()=>openAddTerritory(campaign));
      panel.querySelectorAll("[data-transfer-territory]").forEach(button=>{
        const row=roots.find(r=>r.id===button.dataset.transferTerritory);
        button.addEventListener("click",()=>transferTerritory(campaign,row,members));
      });
    } catch(error) {
      console.error("Could not render territories",error);
      if(content.querySelector(`[data-territory-panel="${campaignId}"]`)) return;
      const panel=document.createElement("section"); panel.className="campaign-subpanel"; panel.dataset.territoryPanel=campaignId;
      panel.innerHTML=`<h3>Territories</h3><div class="campaign-message">Territory storage is not configured yet. Run supabase/007_campaign_territories.sql. ${esc(error?.message || "")}</div>`;
      content.prepend(panel);
    }
  }

  function installHooks() {
    installStyles();
    window.addEventListener("click",event=>{
      const open=event.target.closest?.("[data-open-campaign]");
      if(open?.dataset.openCampaign){ viewedCampaignId=open.dataset.openCampaign; setTimeout(renderTerritoryPanel,100); setTimeout(renderTerritoryPanel,350); }
    },true);

    // Detailed territory validation runs after the base Phoenix validation. The
    // base rule object is expanded to the broad territory limits; this guard
    // enforces the exact wizard slots, magic-item caps and Town/Village pool.
    window.addEventListener("click",event=>{
      if(!event.target.closest?.("#saveRosterBtn")) return;
      const campaign=window.whrCampaignArmies?.activeCampaign?.();
      if(!campaign || campaign.campaign_type_id!=="phoenix_games") return;
      const errors=territoryValidationErrors();
      if(!errors.length) return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      alert(`This campaign army cannot be saved yet:\n\n${errors.map(e=>`• ${e}`).join("\n")}`);
    },true);

    const previousRenderArmyStatus=renderArmyStatus;
    renderArmyStatus=function(total){
      applyEffectsToCampaignRules();
      previousRenderArmyStatus(total);
      const extra=territoryRulesStatusHtml();
      if(extra) els.armyStatus.insertAdjacentHTML("beforeend",extra);
    };

    const observer=new MutationObserver(()=>{
      const dialog=document.getElementById("campaignFormDialog");
      if(dialog?.open && viewedCampaignId) setTimeout(renderTerritoryPanel,0);
    });
    observer.observe(document.body,{childList:true,subtree:true});

    setInterval(refreshActiveContext,350);
  }

  function initialise() {
    installHooks();
    window.whrCampaignTerritories={
      effects:currentEffects,
      validate:territoryValidationErrors,
      refresh:async()=>{
        if(activeCampaignId&&activeUserId) await loadActiveTerritories(activeCampaignId,activeUserId);
        if(viewedCampaignId) await renderTerritoryPanel(true);
      }
    };
  }

  let attempts=0;
  const wait=setInterval(()=>{
    attempts++;
    if(window.whrCampaignArmies && window.whrSupabase){ clearInterval(wait); initialise(); }
    else if(attempts>120) clearInterval(wait);
  },100);
})();
