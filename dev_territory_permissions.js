(() => {
  let enhancing = false;

  const esc = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  async function getUser() {
    const { data } = await window.whrSupabase.auth.getUser();
    return data?.user || null;
  }

  async function getCampaign(campaignId) {
    const { data, error } = await window.whrSupabase
      .from("campaigns")
      .select("id,owner_id,name,campaign_type_id")
      .eq("id", campaignId)
      .single();
    if (error) throw error;
    return data;
  }

  async function getMembers(campaignId) {
    const { data: memberships, error } = await window.whrSupabase
      .from("campaign_members")
      .select("user_id,role")
      .eq("campaign_id", campaignId);
    if (error) throw error;
    const ids = (memberships || []).map(m => m.user_id);
    let names = new Map();
    if (ids.length) {
      const { data: profiles } = await window.whrSupabase
        .from("profiles")
        .select("id,display_name")
        .in("id", ids);
      names = new Map((profiles || []).map(p => [p.id, p.display_name]));
    }
    return (memberships || []).map(m => ({
      ...m,
      display_name: names.get(m.user_id) || "WHR Player"
    }));
  }

  async function getTypes() {
    const { data, error } = await window.whrSupabase
      .from("territory_types")
      .select("id,name,description,effect_kind,value_min,value_max,value_step,sort_order")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    return data || [];
  }

  async function getTerritories(campaignId) {
    const { data, error } = await window.whrSupabase
      .from("campaign_territories")
      .select("id,campaign_id,territory_type_id,owner_id,effect_value,parent_territory_id,counts_toward_limit,locked_to_parent,created_at,acquired_at")
      .eq("campaign_id", campaignId)
      .order("created_at");
    if (error) throw error;
    return data || [];
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function buildDialog() {
    let dialog = document.getElementById("territoryPermissionDialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "territoryPermissionDialog";
    dialog.className = "campaign-dialog";
    dialog.innerHTML = `
      <div class="campaign-shell">
        <div class="campaign-header">
          <div><p class="eyebrow">Territories</p><h2 id="territoryPermissionTitle">Territory</h2></div>
          <button id="territoryPermissionClose" class="icon-button" type="button">×</button>
        </div>
        <div id="territoryPermissionBody" class="campaign-content"></div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector("#territoryPermissionClose").onclick = () => dialog.close();
    return dialog;
  }

  function messageBox(body) {
    let msg = body.querySelector(".territory-admin-message");
    if (!msg) {
      msg = document.createElement("div");
      msg.className = "campaign-message territory-admin-message";
      msg.hidden = true;
      body.appendChild(msg);
    }
    return msg;
  }

  async function refreshEverything() {
    await window.whrCampaignTerritories?.refresh?.();
  }

  async function generateTerritory(campaign, user, members, types, isOwner) {
    const dialog = buildDialog();
    dialog.querySelector("#territoryPermissionTitle").textContent = "Generate Territory";
    const body = dialog.querySelector("#territoryPermissionBody");
    body.innerHTML = `
      <div class="campaign-form">
        ${isOwner ? `<label>Assign to<select id="territoryGenerateOwner">${members.map(m => `<option value="${esc(m.user_id)}">${esc(m.display_name)}</option>`).join("")}</select><small>The campaign owner may generate a territory for any campaign member.</small></label>` : `<div class="campaign-message">This territory will be generated for you. Players cannot generate territories directly for another member.</div>`}
        <div class="campaign-message">The territory type is generated randomly. Variable bonuses such as Roads, Passes and Mountains are also generated once and stored on the territory.</div>
        <div class="campaign-form-actions"><button type="button" class="campaign-button secondary" data-cancel>Cancel</button><button type="button" class="campaign-button" data-confirm>Generate Territory</button></div>
      </div>`;
    const msg = messageBox(body);
    body.querySelector("[data-cancel]").onclick = () => dialog.close();
    body.querySelector("[data-confirm]").onclick = async event => {
      const button = event.currentTarget;
      button.disabled = true;
      msg.hidden = true;
      try {
        const ownerId = isOwner ? body.querySelector("#territoryGenerateOwner").value : user.id;
        const type = randomItem(types);
        if (!type) throw new Error("No territory types are available.");
        if (type.id === "lost_valley") {
          const childTypes = types.filter(t => t.id !== "lost_valley");
          const child1 = randomItem(childTypes);
          const child2 = randomItem(childTypes);
          const { error } = await window.whrSupabase.rpc("whr_create_lost_valley", {
            p_campaign_id: campaign.id,
            p_owner_id: ownerId,
            p_child_type_1: child1.id,
            p_child_type_2: child2.id
          });
          if (error) throw error;
        } else {
          const { error } = await window.whrSupabase.rpc("whr_create_campaign_territory", {
            p_campaign_id: campaign.id,
            p_territory_type_id: type.id,
            p_owner_id: ownerId,
            p_effect_value: null,
            p_parent_territory_id: null
          });
          if (error) throw error;
        }
        dialog.close();
        showToast(`Generated ${type.name}`);
        await refreshEverything();
      } catch (error) {
        msg.hidden = false;
        msg.textContent = error?.message || "Could not generate territory";
      } finally {
        button.disabled = false;
      }
    };
    dialog.showModal();
  }

  async function transferTerritory(campaign, row, members) {
    const choices = members.filter(m => m.user_id !== row.owner_id);
    if (!choices.length) {
      alert("There is no other campaign member to transfer this territory to.");
      return;
    }
    const dialog = buildDialog();
    dialog.querySelector("#territoryPermissionTitle").textContent = "Transfer Territory";
    const body = dialog.querySelector("#territoryPermissionBody");
    body.innerHTML = `
      <div class="campaign-form">
        <label>New owner<select id="territoryTransferOwner">${choices.map(m => `<option value="${esc(m.user_id)}">${esc(m.display_name)}</option>`).join("")}</select></label>
        <label>Reason <input id="territoryTransferReason" maxlength="200" placeholder="Optional"></label>
        <small>If this is a Lost Valley, both attached territories move with it.</small>
        <div class="campaign-form-actions"><button type="button" class="campaign-button secondary" data-cancel>Cancel</button><button type="button" class="campaign-button" data-confirm>Transfer</button></div>
      </div>`;
    const msg = messageBox(body);
    body.querySelector("[data-cancel]").onclick = () => dialog.close();
    body.querySelector("[data-confirm]").onclick = async event => {
      const button = event.currentTarget;
      button.disabled = true;
      msg.hidden = true;
      try {
        const { error } = await window.whrSupabase.rpc("whr_transfer_campaign_territory", {
          p_territory_id: row.id,
          p_to_owner_id: body.querySelector("#territoryTransferOwner").value,
          p_reason: body.querySelector("#territoryTransferReason").value.trim()
        });
        if (error) throw error;
        dialog.close();
        showToast("Territory transferred");
        await refreshEverything();
      } catch (error) {
        msg.hidden = false;
        msg.textContent = error?.message || "Could not transfer territory";
      } finally {
        button.disabled = false;
      }
    };
    dialog.showModal();
  }

  async function editTerritoryValue(row, type) {
    const min = Number(type.value_min);
    const max = Number(type.value_max);
    const step = Number(type.value_step || 1);
    const options = [];
    for (let value = min; value <= max; value += step) options.push(value);

    const dialog = buildDialog();
    dialog.querySelector("#territoryPermissionTitle").textContent = `Change ${type.name} Value`;
    const body = dialog.querySelector("#territoryPermissionBody");
    body.innerHTML = `
      <div class="campaign-form">
        <label>Fixed territory value<select id="territoryOverrideValue">${options.map(value => `<option value="${value}" ${Number(row.effect_value) === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>
        <div class="campaign-message">Campaign-owner override. The new value remains attached to this territory when it changes hands.</div>
        <div class="campaign-form-actions"><button type="button" class="campaign-button secondary" data-cancel>Cancel</button><button type="button" class="campaign-button" data-confirm>Save Value</button></div>
      </div>`;
    const msg = messageBox(body);
    body.querySelector("[data-cancel]").onclick = () => dialog.close();
    body.querySelector("[data-confirm]").onclick = async event => {
      const button = event.currentTarget;
      button.disabled = true;
      msg.hidden = true;
      try {
        const { error } = await window.whrSupabase.rpc("whr_update_campaign_territory_value", {
          p_territory_id: row.id,
          p_effect_value: Number(body.querySelector("#territoryOverrideValue").value)
        });
        if (error) throw error;
        dialog.close();
        showToast(`${type.name} value updated`);
        await refreshEverything();
      } catch (error) {
        msg.hidden = false;
        msg.textContent = error?.message || "Could not update territory value";
      } finally {
        button.disabled = false;
      }
    };
    dialog.showModal();
  }

  async function deleteTerritory(row, typeName) {
    if (!confirm(`Delete ${typeName}?${row.territory_type_id === "lost_valley" ? " Its two attached territories will also be deleted." : ""}`)) return;
    const { error } = await window.whrSupabase.rpc("whr_delete_campaign_territory", { p_territory_id: row.id });
    if (error) {
      alert(error.message || "Could not delete territory");
      return;
    }
    showToast(`${typeName} deleted`);
    await refreshEverything();
  }

  async function enhancePanel(panel) {
    if (enhancing || !panel || panel.dataset.permissionsEnhanced === "true") return;
    enhancing = true;
    try {
      const campaignId = panel.dataset.territoryPanel;
      if (!campaignId || !window.whrSupabase) return;

      const [campaign, user, members, types, territories] = await Promise.all([
        getCampaign(campaignId), getUser(), getMembers(campaignId), getTypes(), getTerritories(campaignId)
      ]);
      if (!user || campaign.campaign_type_id !== "phoenix_games") return;
      const member = members.some(m => m.user_id === user.id);
      if (!member) return;
      const isOwner = campaign.owner_id === user.id;
      const typeMap = new Map(types.map(t => [t.id, t]));
      const nameMap = new Map(members.map(m => [m.user_id, m.display_name]));
      const roots = territories.filter(t => !t.parent_territory_id);
      const children = territories.filter(t => t.parent_territory_id);

      // Replace the old campaign-owner-only controls with the new permission model.
      panel.querySelectorAll("[data-add-territory],[data-transfer-territory]").forEach(el => { el.hidden = true; });

      const heading = panel.querySelector("h3")?.parentElement?.parentElement || panel.firstElementChild;
      const generateButton = document.createElement("button");
      generateButton.type = "button";
      generateButton.className = "campaign-button";
      generateButton.textContent = isOwner ? "Generate / Assign Territory" : "Generate Territory for Me";
      generateButton.addEventListener("click", () => generateTerritory(campaign, user, members, types, isOwner));
      if (heading) heading.appendChild(generateButton);
      else panel.prepend(generateButton);

      const manage = document.createElement("section");
      manage.className = "territory-admin-manager";
      manage.style.cssText = "margin-top:16px;border-top:1px solid #e4e7ea;padding-top:14px";
      const manageable = roots.filter(row => isOwner || row.owner_id === user.id);
      manage.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <div><strong>${isOwner ? "Campaign Owner Controls" : "My Territory Controls"}</strong><div class="campaign-meta">${isOwner ? "Generate and assign territories for any player, transfer or delete any territory, and override variable values." : "Generate territories for yourself and transfer any territory you own to another campaign member."}</div></div>
        </div>
        <div style="display:grid;gap:8px;margin-top:10px">
          ${manageable.length ? manageable.map(row => {
            const type = typeMap.get(row.territory_type_id);
            const variable = type?.value_min != null;
            const childRows = children.filter(c => c.parent_territory_id === row.id);
            return `<div class="campaign-person-row" data-admin-territory="${esc(row.id)}">
              <div><strong>${esc(type?.name || row.territory_type_id)}</strong><div class="campaign-meta">Owner: ${esc(nameMap.get(row.owner_id) || "Unassigned")}${row.effect_value != null ? ` · Value ${esc(row.effect_value)}` : ""}</div>${childRows.length ? `<div class="campaign-meta">Lost Valley: ${childRows.map(child => { const ct=typeMap.get(child.territory_type_id); return `${ct?.name || child.territory_type_id}${child.effect_value != null ? ` (${child.effect_value})` : ""}`; }).join(" + ")}</div>` : ""}</div>
              <div class="campaign-actions">
                <button class="campaign-button secondary" type="button" data-admin-transfer="${esc(row.id)}">Transfer</button>
                ${isOwner && variable ? `<button class="campaign-button secondary" type="button" data-admin-value="${esc(row.id)}">Change Value</button>` : ""}
                ${isOwner ? `<button class="campaign-button danger" type="button" data-admin-delete="${esc(row.id)}">Delete</button>` : ""}
              </div>
            </div>${isOwner ? childRows.map(child => { const ct=typeMap.get(child.territory_type_id); return `<div class="campaign-person-row" style="padding-left:20px"><div><strong>↳ ${esc(ct?.name || child.territory_type_id)}</strong><div class="campaign-meta">Locked to Lost Valley${child.effect_value != null ? ` · Value ${esc(child.effect_value)}` : ""}</div></div><div class="campaign-actions">${ct?.value_min != null ? `<button class="campaign-button secondary" type="button" data-admin-value="${esc(child.id)}">Change Value</button>` : ""}</div></div>`; }).join("") : ""}`;
          }).join("") : `<div class="campaign-empty" style="padding:16px">${isOwner ? "No territories have been generated yet." : "You do not currently own any territories."}</div>`}
        </div>`;
      panel.appendChild(manage);

      const territoryMap = new Map(territories.map(t => [t.id, t]));
      manage.querySelectorAll("[data-admin-transfer]").forEach(button => {
        const row = territoryMap.get(button.dataset.adminTransfer);
        button.addEventListener("click", () => transferTerritory(campaign, row, members));
      });
      manage.querySelectorAll("[data-admin-value]").forEach(button => {
        const row = territoryMap.get(button.dataset.adminValue);
        const type = typeMap.get(row?.territory_type_id);
        button.addEventListener("click", () => editTerritoryValue(row, type));
      });
      manage.querySelectorAll("[data-admin-delete]").forEach(button => {
        const row = territoryMap.get(button.dataset.adminDelete);
        const type = typeMap.get(row?.territory_type_id);
        button.addEventListener("click", () => deleteTerritory(row, type?.name || "territory"));
      });

      panel.dataset.permissionsEnhanced = "true";
    } catch (error) {
      console.error("Could not enhance territory permissions", error);
    } finally {
      enhancing = false;
    }
  }

  function scan() {
    document.querySelectorAll("[data-territory-panel]").forEach(panel => enhancePanel(panel));
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList:true, subtree:true });
  setInterval(scan, 500);
  scan();
})();
