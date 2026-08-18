(() => {
  const CHARACTER_SECTIONS = new Set(["characters", "specialCharacters"]);
  const CAMPAIGN_RULES = {
    phoenix_games: {
      label: "Phoenix Games",
      pointsLimit: 1500,
      maxWizards: 1,
      maxWizardLevel: 1,
      maxOtherCharacters: 1,
      requireGeneral: true,
      maxMagicItems: 1,
      maxMagicItemCost: 50
    }
  };

  let viewedCampaignId = null;
  let activeCampaign = null;
  let preservingCampaignSelection = false;
  let panelRenderToken = 0;

  const html = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function rulesForCampaign(campaign = activeCampaign) {
    return campaign ? CAMPAIGN_RULES[campaign.campaign_type_id] || null : null;
  }

  function isCampaignArmy() {
    return Boolean(activeCampaign && rulesForCampaign());
  }

  function unitForEntry(entry) {
    try { return entry ? getUnit(entry.sectionKey, entry.unitId) : null; }
    catch { return null; }
  }

  function wizardText(unit) {
    return [
      unit?.id,
      unit?.name,
      unit?.profileId,
      ...(unit?.tags || []),
      ...(unit?.rules || [])
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function explicitWizardLevel(unit) {
    const candidates = [unit?.wizardLevel, unit?.magicLevel, unit?.wizard?.level, unit?.wizard?.baseLevel];
    for (const value of candidates) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) return n;
    }
    const text = wizardText(unit);
    const match = text.match(/(?:level\s*([1-4])\s*(?:wizard|mage|shaman|sorcerer)|(?:wizard|mage|shaman|sorcerer)\s*(?:level\s*)?([1-4]))/i);
    return match ? Number(match[1] || match[2]) : null;
  }

  function looksLikeWizard(unit, entry = null) {
    if (!unit) return false;
    const selectedLevels = Number(entry?.wizardLevels || 0);
    if (selectedLevels > 0) return true;

    // A wizardUpgrade is optional unless the unit is also explicitly tagged or
    // described as a wizard. This matters for Vampire characters that may buy magic levels.
    const tags = (unit.tags || []).map(x => String(x).toLowerCase());
    if (tags.some(tag => tag === "wizard" || tag.includes("wizard") || tag === "shaman" || tag === "mage" || tag === "sorcerer")) return true;
    if (explicitWizardLevel(unit)) return true;

    const text = wizardText(unit);
    return /\b(wizard|shaman|mage|sorcerer|necromancer|spellcaster)\b/.test(text) && !unit.wizardUpgrade;
  }

  function entryWizardLevel(entry, unit = unitForEntry(entry)) {
    const selected = Number(entry?.wizardLevels || 0);
    if (selected > 0) return selected;
    const explicit = explicitWizardLevel(unit);
    if (explicit) return explicit;
    return looksLikeWizard(unit, entry) ? 1 : 0;
  }

  function characterBreakdown(roster = state.roster) {
    const chars = roster.filter(e => CHARACTER_SECTIONS.has(e.sectionKey));
    const wizards = [];
    const others = [];
    for (const entry of chars) {
      const unit = unitForEntry(entry);
      if (entryWizardLevel(entry, unit) > 0) wizards.push({ entry, unit, level: entryWizardLevel(entry, unit) });
      else others.push({ entry, unit });
    }
    return { chars, wizards, others };
  }

  function selectedMagicItems(roster = state.roster) {
    const found = [];
    for (const entry of roster) {
      for (const id of entry.magicItems || []) found.push({ id, entry, source: "character" });
      for (const id of entry.champion?.magicItems || []) found.push({ id, entry, source: "champion" });
      if (entry.magicBanner) found.push({ id: entry.magicBanner, entry, source: "banner" });
    }
    return found;
  }

  function draftMagicItems() {
    const entry = state.draft;
    if (!entry) return [];
    const items = [];
    for (const id of entry.magicItems || []) items.push({ id, entry, source: "character" });
    for (const id of entry.champion?.magicItems || []) items.push({ id, entry, source: "champion" });
    if (entry.magicBanner) items.push({ id: entry.magicBanner, entry, source: "banner" });
    return items;
  }

  function validationErrors(roster = state.roster, includeDraft = false) {
    const rules = rulesForCampaign();
    if (!rules) return [];
    const errors = [];
    const total = calculateArmyTotal();
    if (total > rules.pointsLimit) errors.push(`Army is ${formatPoints(total - rules.pointsLimit)} points over the ${rules.pointsLimit} point campaign limit.`);

    let workingRoster = roster;
    if (includeDraft && state.draft && state.editingEntryId) {
      workingRoster = roster.map(e => e.id === state.editingEntryId ? state.draft : e);
    }
    const chars = characterBreakdown(workingRoster);
    if (chars.wizards.length > rules.maxWizards) errors.push(`Phoenix Games armies may include only ${rules.maxWizards} wizard.`);
    if (chars.others.length > rules.maxOtherCharacters) errors.push(`Phoenix Games armies may include only ${rules.maxOtherCharacters} non-wizard character.`);
    for (const wizard of chars.wizards) {
      if (wizard.level > rules.maxWizardLevel) errors.push(`${wizard.unit?.name || "Wizard"} is level ${wizard.level}; campaign wizards may only be level ${rules.maxWizardLevel}.`);
    }
    if (rules.requireGeneral) {
      const selected = state.generalEntryId && workingRoster.some(e => e.id === state.generalEntryId && CHARACTER_SECTIONS.has(e.sectionKey));
      if (!selected) errors.push("A campaign army must include a character selected as its General.");
    }

    const magic = includeDraft && state.draft && state.editingEntryId
      ? selectedMagicItems(workingRoster)
      : selectedMagicItems(roster);
    if (magic.length > rules.maxMagicItems) errors.push(`Phoenix Games armies may take only ${rules.maxMagicItems} magic item in total.`);
    for (const item of magic) {
      const cost = Number(getMagicItem(item.id)?.cost || 0);
      if (cost > rules.maxMagicItemCost) errors.push(`${getMagicItem(item.id)?.name || item.id} costs ${formatPoints(cost)} points; campaign magic items are limited to ${rules.maxMagicItemCost} points.`);
    }
    return [...new Set(errors)];
  }

  function activateCampaign(campaign) {
    activeCampaign = campaign ? {
      id: campaign.id,
      name: campaign.name,
      campaign_type_id: campaign.campaign_type_id
    } : null;
    state.campaignContext = activeCampaign ? { ...activeCampaign } : null;
    applyCampaignBuilderState();
  }

  function clearCampaign() {
    activeCampaign = null;
    state.campaignContext = null;
    const input = els.pointsLimit;
    if (input) {
      input.disabled = false;
      input.title = "";
    }
    document.getElementById("campaignArmyBuilderBanner")?.remove();
  }

  function applyCampaignBuilderState() {
    const rules = rulesForCampaign();
    if (!rules || !state.data) return;
    state.pointsLimit = rules.pointsLimit;
    if (els.pointsLimit) {
      els.pointsLimit.value = rules.pointsLimit;
      els.pointsLimit.disabled = true;
      els.pointsLimit.title = `${rules.label} campaign armies are fixed at ${rules.pointsLimit} points.`;
    }
    installBuilderBanner();
  }

  function installBuilderBanner() {
    if (!isCampaignArmy() || !els.armyStatus) return;
    let banner = document.getElementById("campaignArmyBuilderBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "campaignArmyBuilderBanner";
      banner.style.cssText = "margin:0 0 12px;padding:11px 13px;border:1px solid #d8c18d;border-left:4px solid #7b211b;border-radius:7px;background:#fff8e8;font-size:12px;line-height:1.45";
      els.armyStatus.parentElement?.insertBefore(banner, els.armyStatus);
    }
    const rules = rulesForCampaign();
    banner.innerHTML = `<strong>${html(activeCampaign.name)} — ${html(rules.label)} campaign army</strong><br>${rules.pointsLimit} pts · maximum 1 level 1 wizard · maximum 1 other character · a General is required · maximum 1 magic item costing up to ${rules.maxMagicItemCost} pts.`;
  }

  function campaignStatusHtml() {
    if (!isCampaignArmy()) return "";
    const errors = validationErrors();
    if (!errors.length) return `<div class="general-status good"><strong>Campaign rules:</strong> this army currently satisfies the Phoenix Games campaign restrictions.</div>`;
    return `<div class="general-status"><strong>Campaign rules:</strong><ul style="margin:6px 0 0 18px">${errors.map(e => `<li>${html(e)}</li>`).join("")}</ul></div>`;
  }

  async function fetchCampaign(campaignId) {
    const { data, error } = await window.whrSupabase
      .from("campaigns")
      .select("id,campaign_type_id,owner_id,name,description,visibility")
      .eq("id", campaignId)
      .single();
    if (error) throw error;
    return data;
  }

  async function currentUser() {
    const { data } = await window.whrSupabase.auth.getUser();
    return data?.user || null;
  }

  async function renderCampaignArmyPanel() {
    const token = ++panelRenderToken;
    const campaignId = viewedCampaignId;
    const dialog = document.getElementById("campaignFormDialog");
    const content = document.getElementById("campaignFormContent");
    if (!campaignId || !dialog?.open || !content) return;
    if (content.querySelector(`[data-campaign-army-panel="${campaignId}"]`)) return;

    try {
      const [campaign, user] = await Promise.all([fetchCampaign(campaignId), currentUser()]);
      if (token !== panelRenderToken || !user) return;
      const { data: membership, error: memberError } = await window.whrSupabase
        .from("campaign_members")
        .select("campaign_id,user_id,role")
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (memberError || !membership) return;

      const panel = document.createElement("section");
      panel.className = "campaign-subpanel";
      panel.dataset.campaignArmyPanel = campaignId;
      content.prepend(panel);
      const rules = CAMPAIGN_RULES[campaign.campaign_type_id];
      panel.innerHTML = `<h3>Campaign Armies</h3><div class="campaign-meta">Loading campaign armies…</div>`;

      const { data: armies, error } = await window.whrSupabase
        .from("army_lists")
        .select("id,owner_id,name,faction_name,points_limit,total_points,visibility,updated_at,campaign_id")
        .eq("campaign_id", campaignId)
        .order("updated_at", { ascending:false });
      if (error) throw error;

      const ownerIds = [...new Set((armies || []).map(a => a.owner_id))];
      let names = new Map();
      if (ownerIds.length) {
        const { data: profiles } = await window.whrSupabase.from("profiles").select("id,display_name").in("id", ownerIds);
        names = new Map((profiles || []).map(p => [p.id, p.display_name]));
      }

      const rulesText = rules
        ? `${rules.pointsLimit} pts · 1 level 1 wizard maximum · 1 other character maximum · General required · 1 magic item up to ${rules.maxMagicItemCost} pts`
        : "This campaign type does not yet define army-building rules.";

      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div><h3 style="margin:0 0 4px">Campaign Armies</h3><div class="campaign-meta">${html(rulesText)}</div></div>
          ${rules ? `<button class="campaign-button" type="button" data-create-campaign-army="${html(campaignId)}">Create Army</button>` : ""}
        </div>
        <div style="display:grid;gap:8px;margin-top:12px">
          ${(armies || []).length ? armies.map(army => `
            <div class="campaign-person-row">
              <div><strong>${html(army.name)}</strong><div class="campaign-meta">${html(army.faction_name || "Army")} · ${formatPoints(army.total_points)} / ${formatPoints(army.points_limit)} pts · ${html(names.get(army.owner_id) || "WHR Player")}</div></div>
              <div class="campaign-actions">${army.owner_id === user.id ? `<button class="campaign-button secondary" type="button" data-load-campaign-army="${html(army.id)}">Load / Edit</button>` : `<span class="campaign-meta">Campaign member army</span>`}</div>
            </div>`).join("") : `<div class="campaign-empty" style="padding:18px">No armies have been created for this campaign yet.</div>`}
        </div>`;

      panel.querySelector("[data-create-campaign-army]")?.addEventListener("click", async () => {
        preservingCampaignSelection = true;
        document.getElementById("campaignFormDialog")?.close();
        document.getElementById("campaignHubDialog")?.close();
        showArmySelection();
        activateCampaign(campaign);
        preservingCampaignSelection = false;
        state.currentSaveId = null;
        state.roster = [];
        state.generalEntryId = null;
        showToast(`Choose an army book for ${campaign.name}`);
      });

      panel.querySelectorAll("[data-load-campaign-army]").forEach(button => button.addEventListener("click", async () => {
        activateCampaign(campaign);
        await window.whrCloudSaves?.load(button.dataset.loadCampaignArmy);
        applyCampaignBuilderState();
        renderArmy();
      }));
    } catch (error) {
      console.error("Could not load campaign armies", error);
      const contentNow = document.getElementById("campaignFormContent");
      if (!contentNow || contentNow.querySelector(`[data-campaign-army-panel="${campaignId}"]`)) return;
      const panel = document.createElement("section");
      panel.className = "campaign-subpanel";
      panel.dataset.campaignArmyPanel = campaignId;
      panel.innerHTML = `<h3>Campaign Armies</h3><div class="campaign-message">Campaign army storage is not configured yet. Run supabase/006_campaign_armies.sql. ${html(error?.message || "")}</div>`;
      contentNow.prepend(panel);
    }
  }

  function installObservers() {
    // Capture the campaign id before the campaign manager's own click handler.
    window.addEventListener("click", event => {
      const open = event.target.closest?.("[data-open-campaign]");
      if (open?.dataset.openCampaign) {
        viewedCampaignId = open.dataset.openCampaign;
        setTimeout(renderCampaignArmyPanel, 80);
        setTimeout(renderCampaignArmyPanel, 300);
      }
    }, true);

    const observer = new MutationObserver(() => {
      const dialog = document.getElementById("campaignFormDialog");
      if (dialog?.open && viewedCampaignId) setTimeout(renderCampaignArmyPanel, 0);
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  function installBuilderRules() {
    const previousShowArmySelection = showArmySelection;
    showArmySelection = function() {
      previousShowArmySelection();
      if (!preservingCampaignSelection) clearCampaign();
    };

    const previousSelectArmy = selectArmy;
    selectArmy = async function(armyId) {
      const result = await previousSelectArmy(armyId);
      if (isCampaignArmy()) {
        state.currentSaveId = null;
        state.rosterName = `${activeCampaign.name} — ${state.data?.faction?.name || "Army"}`;
        if (els.rosterName) els.rosterName.value = state.rosterName;
        applyCampaignBuilderState();
        renderArmy();
      }
      return result;
    };

    const previousNewRoster = newRoster;
    newRoster = function() {
      previousNewRoster();
      if (isCampaignArmy()) {
        state.generalEntryId = null;
        applyCampaignBuilderState();
        renderArmy();
      }
    };

    const previousMakeRosterSnapshot = makeRosterSnapshot;
    makeRosterSnapshot = function() {
      const snapshot = previousMakeRosterSnapshot();
      if (isCampaignArmy()) {
        snapshot.campaignId = activeCampaign.id;
        snapshot.campaignName = activeCampaign.name;
        snapshot.campaignTypeId = activeCampaign.campaign_type_id;
        snapshot.pointsLimit = rulesForCampaign().pointsLimit;
        snapshot.schemaVersion = Math.max(3, Number(snapshot.schemaVersion || 1));
      }
      return snapshot;
    };

    const previousAddUnit = addUnit;
    addUnit = function(sectionKey, unitId) {
      if (!isCampaignArmy() || !CHARACTER_SECTIONS.has(sectionKey)) return previousAddUnit(sectionKey, unitId);
      const rules = rulesForCampaign();
      const unit = getUnit(sectionKey, unitId);
      const preview = createEntry(sectionKey, unit);
      const wizard = looksLikeWizard(unit, preview);
      const level = entryWizardLevel(preview, unit);
      const counts = characterBreakdown();
      if (wizard && level > rules.maxWizardLevel) {
        alert(`${unit.name} cannot be selected for a Phoenix Games campaign army because it is above Wizard Level ${rules.maxWizardLevel}.`);
        return;
      }
      if (wizard && counts.wizards.length >= rules.maxWizards) {
        alert("A Phoenix Games campaign army may include only one wizard.");
        return;
      }
      if (!wizard && counts.others.length >= rules.maxOtherCharacters) {
        alert("A Phoenix Games campaign army may include only one non-wizard character.");
        return;
      }
      previousAddUnit(sectionKey, unitId);
    };

    const previousAllowedMagicItems = getAllowedMagicItems;
    getAllowedMagicItems = function(unit, context) {
      let items = previousAllowedMagicItems(unit, context) || [];
      if (!isCampaignArmy()) return items;
      const rules = rulesForCampaign();
      items = items.filter(item => Number(item.cost || 0) <= rules.maxMagicItemCost);

      const outsideCurrent = selectedMagicItems().filter(item => item.entry.id !== state.editingEntryId);
      if (outsideCurrent.length >= rules.maxMagicItems) return [];
      const selectedHere = draftMagicItems();
      if (selectedHere.length >= rules.maxMagicItems) {
        const selectedIds = new Set(selectedHere.map(x => x.id));
        items = items.filter(item => selectedIds.has(item.id));
      }
      return items;
    };

    const previousRenderArmy = renderArmy;
    renderArmy = function() {
      if (isCampaignArmy()) applyCampaignBuilderState();
      previousRenderArmy();
      if (isCampaignArmy()) installBuilderBanner();
    };

    const previousRenderArmyStatus = renderArmyStatus;
    renderArmyStatus = function(total) {
      previousRenderArmyStatus(total);
      if (isCampaignArmy()) els.armyStatus.insertAdjacentHTML("beforeend", campaignStatusHtml());
    };

    // Block invalid character/magic configuration before the normal editor commits it.
    window.addEventListener("submit", event => {
      if (!isCampaignArmy() || event.target?.id !== "editForm") return;
      const errors = validationErrors(state.roster, true);
      if (!errors.length) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      alert(`This change would break the Phoenix Games campaign rules:\n\n${errors.map(e => `• ${e}`).join("\n")}`);
    }, true);

    // Cloud-save interception lives on document capture, so window capture runs
    // first and can prevent an invalid campaign list being persisted.
    window.addEventListener("click", event => {
      if (!isCampaignArmy() || !event.target.closest?.("#saveRosterBtn")) return;
      const errors = validationErrors();
      if (!errors.length) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      alert(`This campaign army cannot be saved yet:\n\n${errors.map(e => `• ${e}`).join("\n")}`);
    }, true);

    els.pointsLimit?.addEventListener("input", () => {
      if (!isCampaignArmy()) return;
      state.pointsLimit = rulesForCampaign().pointsLimit;
      els.pointsLimit.value = state.pointsLimit;
    }, true);
  }

  function initialise() {
    installObservers();
    installBuilderRules();
    window.whrCampaignArmies = {
      activeCampaign: () => activeCampaign,
      rules: () => rulesForCampaign(),
      validate: () => validationErrors(),
      refreshPanel: renderCampaignArmyPanel
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialise, { once:true });
  else initialise();
})();
