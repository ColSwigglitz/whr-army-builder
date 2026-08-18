(() => {
  const esc = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  async function currentUser() {
    const { data } = await window.whrSupabase.auth.getUser();
    return data?.user || null;
  }

  async function campaign(campaignId) {
    const { data, error } = await window.whrSupabase
      .from("campaigns")
      .select("id,owner_id,campaign_type_id,name")
      .eq("id", campaignId)
      .single();
    if (error) throw error;
    return data;
  }

  async function members(campaignId) {
    const { data, error } = await window.whrSupabase
      .from("campaign_members")
      .select("user_id,role")
      .eq("campaign_id", campaignId);
    if (error) throw error;
    const ids = (data || []).map(row => row.user_id);
    let names = new Map();
    if (ids.length) {
      const { data: profiles } = await window.whrSupabase.from("profiles")
        .select("id,display_name")
        .in("id", ids);
      names = new Map((profiles || []).map(p => [p.id,p.display_name]));
    }
    return (data || []).map(row => ({ ...row, display_name:names.get(row.user_id) || "WHR Player" }));
  }

  function buildDialog() {
    let dialog = document.getElementById("serverRandomTerritoryDialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "serverRandomTerritoryDialog";
    dialog.className = "campaign-dialog";
    dialog.innerHTML = `<div class="campaign-shell"><div class="campaign-header"><div><p class="eyebrow">Territories</p><h2>Generate Random Territory</h2></div><button class="icon-button" type="button" data-close>×</button></div><div class="campaign-content" data-body></div></div>`;
    document.body.appendChild(dialog);
    dialog.querySelector("[data-close]").onclick = () => dialog.close();
    return dialog;
  }

  async function openServerRandom(panel) {
    const campaignId = panel?.dataset.territoryPanel;
    if (!campaignId) return;
    const [c,user,memberRows] = await Promise.all([campaign(campaignId),currentUser(),members(campaignId)]);
    if (!user || c.campaign_type_id !== "phoenix_games") return;
    const isOwner = c.owner_id === user.id;
    const member = memberRows.some(m => m.user_id === user.id);
    if (!member) return;

    const dialog = buildDialog();
    const body = dialog.querySelector("[data-body]");
    body.innerHTML = `<div class="campaign-form">
      ${isOwner ? `<label>Assign to<select id="serverRandomTerritoryOwner">${memberRows.map(m => `<option value="${esc(m.user_id)}">${esc(m.display_name)}</option>`).join("")}</select><small>As campaign owner, you can generate a random territory for any campaign member.</small></label>` : `<div class="campaign-message">This random territory will be assigned to you.</div>`}
      <div class="campaign-message"><strong>Secure random draw:</strong> the territory type, Lost Valley children, and any variable territory value are selected inside Supabase. The browser cannot choose or alter the result.</div>
      <div class="dev-auth-message" data-message></div>
      <div class="campaign-form-actions"><button class="campaign-button secondary" type="button" data-cancel>Cancel</button><button class="campaign-button" type="button" data-confirm>Generate Territory</button></div>
    </div>`;
    body.querySelector("[data-cancel]").onclick = () => dialog.close();
    body.querySelector("[data-confirm]").onclick = async event => {
      const button = event.currentTarget;
      const message = body.querySelector("[data-message]");
      button.disabled = true;
      message.textContent = "Generating securely…";
      try {
        const ownerId = isOwner ? body.querySelector("#serverRandomTerritoryOwner").value : user.id;
        const { error } = await window.whrSupabase.rpc("whr_generate_random_campaign_territory", {
          p_campaign_id:campaignId,
          p_owner_id:ownerId
        });
        if (error) throw error;
        dialog.close();
        showToast("Random territory generated");
        await window.whrCampaignTerritories?.refresh?.();
      } catch (error) {
        message.textContent = error?.message || "Could not generate territory";
      } finally {
        button.disabled = false;
      }
    };
    dialog.showModal();
  }

  // Capture before the older UI listener. This intentionally replaces only
  // random generation; owner-specific creation, transfer, delete and value
  // overrides continue through their existing controls.
  window.addEventListener("click", event => {
    const button = event.target.closest?.("button");
    if (!button) return;
    const label = (button.textContent || "").trim();
    if (label !== "Generate / Assign Territory" && label !== "Generate Territory for Me") return;
    const panel = button.closest("[data-territory-panel]");
    if (!panel) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openServerRandom(panel).catch(error => {
      console.error("Secure territory generation failed", error);
      alert(error?.message || "Could not open territory generator");
    });
  }, true);
})();
