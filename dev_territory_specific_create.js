(() => {
  const esc = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function buildDialog() {
    let dialog = document.getElementById("specificTerritoryDialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "specificTerritoryDialog";
    dialog.className = "campaign-dialog";
    dialog.innerHTML = `
      <div class="campaign-shell">
        <div class="campaign-header">
          <div><p class="eyebrow">Campaign Owner</p><h2>Create Specific Territory</h2></div>
          <button class="icon-button" type="button" data-close>×</button>
        </div>
        <div id="specificTerritoryBody" class="campaign-content"></div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector("[data-close]").onclick = () => dialog.close();
    return dialog;
  }

  async function getContext(panel) {
    const campaignId = panel.dataset.territoryPanel;
    const [{ data: campaign, error: campaignError }, { data: userData }, { data: memberships, error: memberError }, { data: types, error: typeError }] = await Promise.all([
      window.whrSupabase.from("campaigns").select("id,owner_id,name,campaign_type_id").eq("id", campaignId).single(),
      window.whrSupabase.auth.getUser(),
      window.whrSupabase.from("campaign_members").select("user_id,role").eq("campaign_id", campaignId),
      window.whrSupabase.from("territory_types").select("id,name,description,value_min,value_max,value_step,sort_order").eq("active", true).order("sort_order")
    ]);
    if (campaignError) throw campaignError;
    if (memberError) throw memberError;
    if (typeError) throw typeError;
    const user = userData?.user;
    if (!user || campaign.owner_id !== user.id || campaign.campaign_type_id !== "phoenix_games") return null;

    const ids = (memberships || []).map(m => m.user_id);
    let names = new Map();
    if (ids.length) {
      const { data: profiles } = await window.whrSupabase.from("profiles").select("id,display_name").in("id", ids);
      names = new Map((profiles || []).map(p => [p.id, p.display_name]));
    }

    return {
      campaign,
      members: (memberships || []).map(m => ({ ...m, display_name: names.get(m.user_id) || "WHR Player" })),
      types: types || []
    };
  }

  function valueOptions(type, selected = null) {
    if (type?.value_min == null) return "";
    const min = Number(type.value_min);
    const max = Number(type.value_max);
    const step = Number(type.value_step || 1);
    const values = [];
    for (let v = min; v <= max; v += step) values.push(v);
    return values.map(v => `<option value="${v}" ${Number(selected) === v ? "selected" : ""}>${v}</option>`).join("");
  }

  async function openSpecificTerritory(panel) {
    const ctx = await getContext(panel);
    if (!ctx) return;
    const { campaign, members, types } = ctx;
    const dialog = buildDialog();
    const body = dialog.querySelector("#specificTerritoryBody");
    const typeMap = new Map(types.map(t => [t.id, t]));
    const childTypes = types.filter(t => t.id !== "lost_valley");

    body.innerHTML = `
      <div class="campaign-form">
        <label>Assign to
          <select id="specificTerritoryOwner">${members.map(m => `<option value="${esc(m.user_id)}">${esc(m.display_name)}</option>`).join("")}</select>
          <small>Campaign owners may create and assign territories directly to any campaign member.</small>
        </label>
        <label>Territory
          <select id="specificTerritoryType">${types.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("")}</select>
        </label>
        <div id="specificTerritoryDescription" class="campaign-message"></div>
        <label id="specificTerritoryValueWrap" hidden>Fixed value
          <select id="specificTerritoryValue"></select>
          <small>This value is stored on the territory and remains with it if ownership changes.</small>
        </label>
        <section id="specificLostValleyFields" class="campaign-subpanel" hidden>
          <h3>Lost Valley territories</h3>
          <p class="campaign-meta">Choose the two territories permanently attached to this Lost Valley.</p>
          <label>Attached territory 1
            <select id="specificLostChild1">${childTypes.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("")}</select>
          </label>
          <label id="specificLostChildValue1Wrap" hidden>Territory 1 fixed value
            <select id="specificLostChildValue1"></select>
          </label>
          <label>Attached territory 2
            <select id="specificLostChild2">${childTypes.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("")}</select>
          </label>
          <label id="specificLostChildValue2Wrap" hidden>Territory 2 fixed value
            <select id="specificLostChildValue2"></select>
          </label>
        </section>
        <div id="specificTerritoryMessage" class="campaign-message" hidden></div>
        <div class="campaign-form-actions">
          <button type="button" class="campaign-button secondary" data-cancel>Cancel</button>
          <button type="button" class="campaign-button" data-create>Create Territory</button>
        </div>
      </div>`;

    const territorySelect = body.querySelector("#specificTerritoryType");
    const desc = body.querySelector("#specificTerritoryDescription");
    const valueWrap = body.querySelector("#specificTerritoryValueWrap");
    const valueSelect = body.querySelector("#specificTerritoryValue");
    const valleyFields = body.querySelector("#specificLostValleyFields");

    const updateMain = () => {
      const type = typeMap.get(territorySelect.value);
      desc.textContent = type?.description || "";
      const variable = type?.value_min != null;
      valueWrap.hidden = !variable;
      valueSelect.innerHTML = variable ? valueOptions(type, type.value_min) : "";
      valleyFields.hidden = territorySelect.value !== "lost_valley";
    };

    function updateChild(which) {
      const select = body.querySelector(`#specificLostChild${which}`);
      const wrap = body.querySelector(`#specificLostChildValue${which}Wrap`);
      const value = body.querySelector(`#specificLostChildValue${which}`);
      const type = typeMap.get(select.value);
      const variable = type?.value_min != null;
      wrap.hidden = !variable;
      value.innerHTML = variable ? valueOptions(type, type.value_min) : "";
    }

    territorySelect.onchange = updateMain;
    body.querySelector("#specificLostChild1").onchange = () => updateChild(1);
    body.querySelector("#specificLostChild2").onchange = () => updateChild(2);
    updateMain();
    updateChild(1);
    updateChild(2);

    body.querySelector("[data-cancel]").onclick = () => dialog.close();
    body.querySelector("[data-create]").onclick = async event => {
      const button = event.currentTarget;
      const msg = body.querySelector("#specificTerritoryMessage");
      button.disabled = true;
      msg.hidden = true;
      try {
        const ownerId = body.querySelector("#specificTerritoryOwner").value;
        const typeId = territorySelect.value;
        if (typeId === "lost_valley") {
          const childType1 = typeMap.get(body.querySelector("#specificLostChild1").value);
          const childType2 = typeMap.get(body.querySelector("#specificLostChild2").value);
          const childValue1 = childType1?.value_min != null ? Number(body.querySelector("#specificLostChildValue1").value) : null;
          const childValue2 = childType2?.value_min != null ? Number(body.querySelector("#specificLostChildValue2").value) : null;
          const { error } = await window.whrSupabase.rpc("whr_create_lost_valley_manual", {
            p_campaign_id: campaign.id,
            p_owner_id: ownerId,
            p_child_type_1: childType1.id,
            p_child_value_1: childValue1,
            p_child_type_2: childType2.id,
            p_child_value_2: childValue2
          });
          if (error) throw error;
        } else {
          const type = typeMap.get(typeId);
          const fixedValue = type?.value_min != null ? Number(valueSelect.value) : null;
          const { error } = await window.whrSupabase.rpc("whr_create_campaign_territory", {
            p_campaign_id: campaign.id,
            p_territory_type_id: typeId,
            p_owner_id: ownerId,
            p_effect_value: fixedValue,
            p_parent_territory_id: null
          });
          if (error) throw error;
        }
        dialog.close();
        showToast("Specific territory created");
        await window.whrCampaignTerritories?.refresh?.();
      } catch (error) {
        msg.hidden = false;
        msg.textContent = error?.message || "Could not create territory";
      } finally {
        button.disabled = false;
      }
    };

    dialog.showModal();
  }

  async function enhance(panel) {
    if (!panel || panel.dataset.specificTerritoryEnhanced === "true") return;
    try {
      const ctx = await getContext(panel);
      if (!ctx) return;
      const heading = panel.querySelector("h3")?.parentElement?.parentElement || panel.firstElementChild;
      if (!heading) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "campaign-button secondary";
      button.textContent = "Create Specific Territory";
      button.style.marginLeft = "8px";
      button.addEventListener("click", () => openSpecificTerritory(panel));
      heading.appendChild(button);
      panel.dataset.specificTerritoryEnhanced = "true";
    } catch (error) {
      console.error("Could not add specific-territory control", error);
    }
  }

  function scan() {
    document.querySelectorAll("[data-territory-panel]").forEach(enhance);
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList:true, subtree:true });
  setInterval(scan, 500);
  scan();
})();
