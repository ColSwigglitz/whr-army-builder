(() => {
  let currentUser = null;
  let lastOpenedCampaignId = null;
  let busy = false;

  const esc = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  async function getUser() {
    const { data } = await window.whrSupabase.auth.getUser();
    currentUser = data?.user || null;
    return currentUser;
  }

  async function getOwnedCampaign(campaignId) {
    const user = currentUser || await getUser();
    if (!user || !campaignId) return null;
    const { data, error } = await window.whrSupabase
      .from("campaigns")
      .select("id,name,owner_id,campaign_type_id")
      .eq("id", campaignId)
      .maybeSingle();
    if (error) throw error;
    return data?.owner_id === user.id ? data : null;
  }

  function buildDeleteDialog() {
    let dialog = document.getElementById("campaignDeleteDialog");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "campaignDeleteDialog";
    dialog.className = "campaign-dialog";
    dialog.innerHTML = `
      <div class="campaign-shell" style="min-height:0">
        <div class="campaign-header">
          <div><p class="eyebrow">Danger Zone</p><h2>Delete Campaign</h2></div>
          <button class="icon-button" type="button" data-delete-close aria-label="Close">×</button>
        </div>
        <div class="campaign-content">
          <div class="campaign-message" style="border-left:4px solid #8f211b;padding:14px 16px">
            <strong>This permanently deletes the campaign and all data belonging to it.</strong>
            <div style="margin-top:7px">This includes campaign memberships, applications, invites, campaign armies, territories, Lost Valley children, transfer history and territory value history. This cannot be undone.</div>
          </div>
          <div id="campaignDeleteBody"></div>
        </div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector("[data-delete-close]").onclick = () => dialog.close();
    return dialog;
  }

  async function openDeleteDialog(campaignId) {
    if (busy) return;
    let campaign;
    try {
      campaign = await getOwnedCampaign(campaignId);
    } catch (error) {
      alert(error?.message || "Could not load campaign");
      return;
    }
    if (!campaign) {
      alert("Only the campaign owner can delete this campaign.");
      return;
    }

    const dialog = buildDeleteDialog();
    const body = dialog.querySelector("#campaignDeleteBody");
    body.innerHTML = `
      <div class="campaign-form">
        <p>To confirm deletion, type the campaign name exactly as shown:</p>
        <div style="font-weight:900;font-size:1.05rem">${esc(campaign.name)}</div>
        <label>Campaign name
          <input id="campaignDeleteConfirmName" type="text" autocomplete="off" spellcheck="false" placeholder="Type the campaign name">
        </label>
        <div id="campaignDeleteMessage" class="dev-auth-message"></div>
        <div class="campaign-form-actions">
          <button type="button" class="campaign-button secondary" data-delete-cancel>Cancel</button>
          <button type="button" class="campaign-button danger" data-delete-confirm disabled>Delete Campaign Permanently</button>
        </div>
      </div>`;

    const input = body.querySelector("#campaignDeleteConfirmName");
    const confirm = body.querySelector("[data-delete-confirm]");
    const message = body.querySelector("#campaignDeleteMessage");
    body.querySelector("[data-delete-cancel]").onclick = () => dialog.close();

    const sync = () => {
      confirm.disabled = input.value !== campaign.name || busy;
    };
    input.addEventListener("input", sync);
    sync();

    confirm.onclick = async () => {
      if (input.value !== campaign.name || busy) return;
      busy = true;
      confirm.disabled = true;
      input.disabled = true;
      message.textContent = "Deleting campaign…";
      try {
        const { error } = await window.whrSupabase.rpc("whr_delete_campaign", {
          p_campaign_id: campaign.id,
          p_confirm_name: input.value
        });
        if (error) throw error;

        dialog.close();
        const detail = document.getElementById("campaignFormDialog");
        if (detail?.open) detail.close();
        lastOpenedCampaignId = null;
        if (typeof showToast === "function") showToast(`Deleted ${campaign.name}`);

        // Refresh the already-open campaign hub if present. Its tab handler
        // reloads campaign data from Supabase, so deleted rows disappear at once.
        const mineTab = document.querySelector('[data-campaign-tab="mine"]');
        if (mineTab) mineTab.click();
      } catch (error) {
        message.textContent = error?.message || "Could not delete campaign";
      } finally {
        busy = false;
        input.disabled = false;
        sync();
      }
    };

    dialog.showModal();
    setTimeout(() => input.focus(), 0);
  }

  async function enhanceCampaignCards() {
    const user = currentUser || await getUser();
    if (!user) return;
    const cards = document.querySelectorAll("#campaignHubContent .campaign-card");
    for (const card of cards) {
      if (card.dataset.deleteEnhanced === "true") continue;
      const open = card.querySelector("[data-open-campaign]");
      if (!open?.dataset.openCampaign) continue;
      const campaign = await getOwnedCampaign(open.dataset.openCampaign).catch(() => null);
      card.dataset.deleteEnhanced = "true";
      if (!campaign) continue;
      const actions = card.querySelector(".campaign-actions");
      if (!actions) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "campaign-button danger";
      button.textContent = "Delete";
      button.dataset.deleteCampaign = campaign.id;
      button.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        openDeleteDialog(campaign.id);
      };
      actions.appendChild(button);
    }
  }

  async function enhanceOpenCampaign() {
    const dialog = document.getElementById("campaignFormDialog");
    const content = document.getElementById("campaignFormContent");
    if (!dialog?.open || !content || !lastOpenedCampaignId) return;
    if (content.querySelector("[data-campaign-delete-zone]")) return;
    if (content.querySelector("#createCampaignForm") || content.querySelector("#campaignApplyForm")) return;

    const campaign = await getOwnedCampaign(lastOpenedCampaignId).catch(() => null);
    if (!campaign) return;

    const zone = document.createElement("section");
    zone.className = "campaign-subpanel";
    zone.dataset.campaignDeleteZone = campaign.id;
    zone.style.borderColor = "#cf9b97";
    zone.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap">
        <div><h3 style="margin:0 0 5px">Danger Zone</h3><div class="campaign-meta">Permanently delete this campaign and all campaign data.</div></div>
        <button class="campaign-button danger" type="button" data-delete-current-campaign>Delete Campaign</button>
      </div>`;
    zone.querySelector("[data-delete-current-campaign]").onclick = () => openDeleteDialog(campaign.id);
    content.appendChild(zone);
  }

  function scan() {
    enhanceCampaignCards().catch(() => {});
    enhanceOpenCampaign().catch(() => {});
  }

  window.addEventListener("click", event => {
    const open = event.target.closest?.("[data-open-campaign]");
    if (open?.dataset.openCampaign) {
      lastOpenedCampaignId = open.dataset.openCampaign;
      setTimeout(scan, 100);
      setTimeout(scan, 400);
    }
  }, true);

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList:true, subtree:true });

  let attempts = 0;
  const wait = setInterval(async () => {
    attempts++;
    if (window.whrSupabase && document.getElementById("campaignHubDialog")) {
      clearInterval(wait);
      await getUser();
      window.whrSupabase.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        setTimeout(scan, 0);
      });
      scan();
    } else if (attempts > 150) clearInterval(wait);
  }, 100);
})();
