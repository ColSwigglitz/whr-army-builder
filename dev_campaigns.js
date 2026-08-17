(() => {
  let currentUser = null;
  let campaignTypes = [];
  let myCampaigns = [];
  let publicCampaigns = [];
  let myInvites = [];
  let selectedCampaign = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function installStyles() {
    if (document.getElementById("whrCampaignStyles")) return;
    const style = document.createElement("style");
    style.id = "whrCampaignStyles";
    style.textContent = `
      .campaign-dialog { width:min(1080px,96vw); border:0; padding:0; border-radius:10px; box-shadow:0 18px 60px rgba(0,0,0,.3); }
      .campaign-dialog::backdrop { background:rgba(0,0,0,.58); }
      .campaign-shell { background:#fff; min-height:420px; max-height:88vh; display:flex; flex-direction:column; }
      .campaign-header { display:flex; justify-content:space-between; align-items:center; gap:18px; padding:20px 22px; border-bottom:1px solid #dfe3e7; }
      .campaign-header h2 { margin:2px 0 0; }
      .campaign-toolbar { padding:16px 22px; border-bottom:1px solid #e6e9ec; display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
      .campaign-toolbar input,.campaign-toolbar select,.campaign-form input,.campaign-form select,.campaign-form textarea { font:inherit; border:1px solid #bcc5cf; border-radius:5px; padding:9px 10px; box-sizing:border-box; }
      .campaign-toolbar input { min-width:250px; flex:1 1 280px; }
      .campaign-tabs { display:flex; gap:6px; flex-wrap:wrap; }
      .campaign-tab { border:1px solid #bcc5cf; background:#fff; border-radius:5px; padding:8px 12px; font-weight:800; cursor:pointer; }
      .campaign-tab.active { background:#7b211b; border-color:#7b211b; color:#fff; }
      .campaign-content { padding:20px 22px 26px; overflow:auto; display:grid; gap:14px; }
      .campaign-card { border:1px solid #d8dee5; border-left:4px solid #7b211b; border-radius:8px; padding:16px; background:#fff; display:flex; justify-content:space-between; gap:18px; align-items:flex-start; }
      .campaign-card h3 { margin:0 0 4px; }
      .campaign-meta { color:#66717c; font-size:12px; margin-top:6px; }
      .campaign-description { margin-top:10px; line-height:1.45; color:#3d454d; }
      .campaign-badge { display:inline-block; margin-left:6px; border-radius:999px; padding:2px 7px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:.04em; vertical-align:middle; }
      .campaign-badge.public { background:#e8f6ec; color:#216b35; border:1px solid #a8d6b4; }
      .campaign-badge.private { background:#eceff3; color:#444; border:1px solid #cfd5dc; }
      .campaign-badge.owner { background:#fff2d6; color:#76520d; border:1px solid #dec17a; }
      .campaign-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
      .campaign-button { min-height:34px; padding:7px 11px; border:1px solid #7b211b; background:#7b211b; color:#fff; border-radius:5px; font-weight:800; cursor:pointer; }
      .campaign-button.secondary { background:#fff; color:#303942; border-color:#aab3bd; }
      .campaign-button.danger { background:#7b211b; color:#fff; }
      .campaign-empty { text-align:center; padding:34px 18px; color:#66717c; }
      .campaign-form { display:grid; gap:14px; }
      .campaign-form label { display:grid; gap:5px; font-weight:800; }
      .campaign-form small { font-weight:400; color:#69727b; }
      .campaign-form textarea { min-height:100px; resize:vertical; }
      .campaign-form-actions { display:flex; justify-content:flex-end; gap:9px; margin-top:4px; }
      .campaign-subpanel { border:1px solid #dce1e6; border-radius:8px; padding:15px; margin-top:14px; }
      .campaign-subpanel h3 { margin:0 0 10px; }
      .campaign-person-row,.campaign-request-row { display:flex; justify-content:space-between; gap:15px; align-items:flex-start; padding:11px 0; border-top:1px solid #edf0f2; }
      .campaign-person-row:first-of-type,.campaign-request-row:first-of-type { border-top:0; }
      .campaign-message { margin-top:5px; padding:8px 10px; background:#f6f7f8; border-radius:5px; font-size:12px; white-space:pre-wrap; }
      .campaign-detail-title { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
      .campaign-search-results { display:grid; gap:8px; max-height:220px; overflow:auto; margin-top:8px; }
      @media(max-width:720px){ .campaign-card,.campaign-person-row,.campaign-request-row{flex-direction:column}.campaign-actions{justify-content:flex-start;width:100%}.campaign-button{flex:1 1 auto}.campaign-toolbar{align-items:stretch}.campaign-tabs{width:100%}.campaign-tab{flex:1 1 auto} }
    `;
    document.head.appendChild(style);
  }

  function installLandingButton() {
    const actions = document.querySelector("#landingArmiesPanel .landing-armies-actions");
    if (!actions || document.getElementById("landingCampaignsBtn")) return;
    const button = document.createElement("button");
    button.id = "landingCampaignsBtn";
    button.className = "landing-armies-button secondary";
    button.type = "button";
    button.textContent = "🏰 Campaigns";
    button.hidden = !currentUser;
    button.addEventListener("click", () => openCampaignHub("mine"));
    actions.appendChild(button);
  }

  function updateLandingButton() {
    installLandingButton();
    const button = document.getElementById("landingCampaignsBtn");
    if (!button) return;
    button.hidden = !currentUser;
    const pending = myInvites.filter(i => i.status === "pending").length;
    button.textContent = pending ? `🏰 Campaigns (${pending} invite${pending === 1 ? "" : "s"})` : "🏰 Campaigns";
  }

  function buildHub() {
    if (document.getElementById("campaignHubDialog")) return document.getElementById("campaignHubDialog");
    const dialog = document.createElement("dialog");
    dialog.id = "campaignHubDialog";
    dialog.className = "campaign-dialog";
    dialog.innerHTML = `
      <div class="campaign-shell">
        <div class="campaign-header">
          <div><p class="eyebrow">Campaign Manager</p><h2>Campaigns</h2></div>
          <button id="campaignHubClose" class="icon-button" type="button" aria-label="Close">×</button>
        </div>
        <div class="campaign-toolbar">
          <div class="campaign-tabs">
            <button class="campaign-tab active" type="button" data-campaign-tab="mine">My Campaigns</button>
            <button class="campaign-tab" type="button" data-campaign-tab="find">Find Campaigns</button>
            <button class="campaign-tab" type="button" data-campaign-tab="invites">Invites</button>
          </div>
          <button id="campaignCreateBtn" class="campaign-button" type="button">Create Campaign</button>
        </div>
        <div id="campaignHubContent" class="campaign-content"></div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector("#campaignHubClose").onclick = () => dialog.close();
    dialog.querySelector("#campaignCreateBtn").onclick = openCreateDialog;
    dialog.querySelectorAll("[data-campaign-tab]").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.campaignTab)));
    return dialog;
  }

  function buildFormDialog() {
    if (document.getElementById("campaignFormDialog")) return document.getElementById("campaignFormDialog");
    const dialog = document.createElement("dialog");
    dialog.id = "campaignFormDialog";
    dialog.className = "campaign-dialog";
    dialog.innerHTML = `<div class="campaign-shell"><div class="campaign-header"><div><p class="eyebrow" id="campaignFormEyebrow">Campaign</p><h2 id="campaignFormTitle">Create Campaign</h2></div><button id="campaignFormClose" class="icon-button" type="button">×</button></div><div id="campaignFormContent" class="campaign-content"></div></div>`;
    document.body.appendChild(dialog);
    dialog.querySelector("#campaignFormClose").onclick = () => dialog.close();
    return dialog;
  }

  async function loadCampaignTypes() {
    const { data, error } = await window.whrSupabase.from("campaign_types").select("id,name,description,active").eq("active", true).order("name");
    if (error) throw error;
    campaignTypes = data || [];
  }

  async function loadMyCampaigns() {
    const { data: memberships, error: memberError } = await window.whrSupabase.from("campaign_members").select("campaign_id,role,joined_at").eq("user_id", currentUser.id);
    if (memberError) throw memberError;
    const ids = [...new Set((memberships || []).map(m => m.campaign_id))];
    if (!ids.length) { myCampaigns = []; return; }
    const { data, error } = await window.whrSupabase.from("campaigns").select("id,campaign_type_id,owner_id,name,description,visibility,created_at,updated_at").in("id", ids).order("updated_at", { ascending:false });
    if (error) throw error;
    const roleMap = new Map((memberships || []).map(m => [m.campaign_id, m.role]));
    myCampaigns = (data || []).map(c => ({ ...c, membershipRole: roleMap.get(c.id) || "member" }));
  }

  async function loadPublicCampaigns() {
    const { data, error } = await window.whrSupabase.from("campaigns").select("id,campaign_type_id,owner_id,name,description,visibility,created_at,updated_at").eq("visibility", "public").order("updated_at", { ascending:false });
    if (error) throw error;
    publicCampaigns = data || [];
  }

  async function loadMyInvites() {
    const { data, error } = await window.whrSupabase.from("campaign_invites").select("id,campaign_id,invited_user_id,invited_by,message,status,created_at,responded_at").eq("invited_user_id", currentUser.id).order("created_at", { ascending:false });
    if (error) throw error;
    myInvites = data || [];
  }

  async function refreshData() {
    await Promise.all([loadCampaignTypes(), loadMyCampaigns(), loadPublicCampaigns(), loadMyInvites()]);
    updateLandingButton();
  }

  function typeName(id) {
    return campaignTypes.find(t => t.id === id)?.name || id || "Campaign";
  }

  async function getProfiles(ids) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return new Map();
    const { data } = await window.whrSupabase.from("profiles").select("id,display_name").in("id", unique);
    return new Map((data || []).map(p => [p.id, p.display_name]));
  }

  async function renderMine() {
    const content = document.getElementById("campaignHubContent");
    if (!myCampaigns.length) {
      content.innerHTML = `<div class="campaign-empty"><strong>You aren't in any campaigns yet.</strong><div style="margin-top:7px">Create one, find a public campaign, or accept an invite.</div></div>`;
      return;
    }
    const names = await getProfiles(myCampaigns.map(c => c.owner_id));
    content.innerHTML = myCampaigns.map(c => `
      <article class="campaign-card">
        <div>
          <h3>${escapeHtml(c.name)}<span class="campaign-badge ${c.visibility}">${escapeHtml(c.visibility)}</span>${c.owner_id === currentUser.id ? '<span class="campaign-badge owner">Owner</span>' : ''}</h3>
          <div class="campaign-meta">${escapeHtml(typeName(c.campaign_type_id))} · Owner: ${escapeHtml(names.get(c.owner_id) || "WHR Player")}</div>
          ${c.description ? `<div class="campaign-description">${escapeHtml(c.description)}</div>` : ""}
        </div>
        <div class="campaign-actions"><button class="campaign-button" type="button" data-open-campaign="${escapeHtml(c.id)}">Open</button></div>
      </article>`).join("");
    bindOpenCampaigns(content);
  }

  async function renderFind() {
    const content = document.getElementById("campaignHubContent");
    const myIds = new Set(myCampaigns.map(c => c.id));
    const { data: apps } = await window.whrSupabase.from("campaign_applications").select("campaign_id,status").eq("applicant_id", currentUser.id);
    const pendingApps = new Set((apps || []).filter(a => a.status === "pending").map(a => a.campaign_id));
    const names = await getProfiles(publicCampaigns.map(c => c.owner_id));

    content.innerHTML = `
      <div class="campaign-toolbar" style="padding:0 0 10px;border:0"><input id="campaignSearchInput" type="search" placeholder="Search public campaigns by name, description or owner…"><select id="campaignTypeFilter"><option value="">All campaign types</option>${campaignTypes.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join("")}</select></div>
      <div id="campaignSearchList" style="display:grid;gap:14px"></div>`;

    const render = () => {
      const q = content.querySelector("#campaignSearchInput").value.trim().toLowerCase();
      const type = content.querySelector("#campaignTypeFilter").value;
      const filtered = publicCampaigns.filter(c => {
        const hay = `${c.name} ${c.description} ${names.get(c.owner_id) || ""}`.toLowerCase();
        return (!q || hay.includes(q)) && (!type || c.campaign_type_id === type);
      });
      const list = content.querySelector("#campaignSearchList");
      if (!filtered.length) { list.innerHTML = `<div class="campaign-empty">No public campaigns match your search.</div>`; return; }
      list.innerHTML = filtered.map(c => {
        const member = myIds.has(c.id);
        const pending = pendingApps.has(c.id);
        return `<article class="campaign-card"><div><h3>${escapeHtml(c.name)}<span class="campaign-badge public">Public</span></h3><div class="campaign-meta">${escapeHtml(typeName(c.campaign_type_id))} · Owner: ${escapeHtml(names.get(c.owner_id) || "WHR Player")}</div>${c.description ? `<div class="campaign-description">${escapeHtml(c.description)}</div>` : ""}</div><div class="campaign-actions">${member ? `<button class="campaign-button" data-open-campaign="${escapeHtml(c.id)}">Open</button>` : pending ? `<button class="campaign-button secondary" disabled>Application pending</button>` : c.owner_id === currentUser.id ? `<button class="campaign-button" data-open-campaign="${escapeHtml(c.id)}">Open</button>` : `<button class="campaign-button" data-apply-campaign="${escapeHtml(c.id)}">Apply to Join</button>`}</div></article>`;
      }).join("");
      bindOpenCampaigns(list);
      list.querySelectorAll("[data-apply-campaign]").forEach(btn => btn.onclick = () => openApplicationDialog(btn.dataset.applyCampaign));
    };
    content.querySelector("#campaignSearchInput").addEventListener("input", render);
    content.querySelector("#campaignTypeFilter").addEventListener("change", render);
    render();
  }

  async function renderInvites() {
    const content = document.getElementById("campaignHubContent");
    const campaignIds = [...new Set(myInvites.map(i => i.campaign_id))];
    let campaignMap = new Map();
    if (campaignIds.length) {
      const { data } = await window.whrSupabase.from("campaigns").select("id,name,campaign_type_id,owner_id,visibility").in("id", campaignIds);
      campaignMap = new Map((data || []).map(c => [c.id, c]));
    }
    const names = await getProfiles(myInvites.map(i => i.invited_by));
    const pending = myInvites.filter(i => i.status === "pending");
    if (!pending.length) { content.innerHTML = `<div class="campaign-empty"><strong>No pending campaign invites.</strong></div>`; return; }
    content.innerHTML = pending.map(i => {
      const c = campaignMap.get(i.campaign_id);
      return `<article class="campaign-card"><div><h3>${escapeHtml(c?.name || "Campaign")}</h3><div class="campaign-meta">${escapeHtml(typeName(c?.campaign_type_id))} · Invited by ${escapeHtml(names.get(i.invited_by) || "WHR Player")}</div>${i.message ? `<div class="campaign-message">${escapeHtml(i.message)}</div>` : ""}</div><div class="campaign-actions"><button class="campaign-button" data-invite-response="accepted" data-invite-id="${escapeHtml(i.id)}">Accept</button><button class="campaign-button secondary" data-invite-response="declined" data-invite-id="${escapeHtml(i.id)}">Decline</button></div></article>`;
    }).join("");
    content.querySelectorAll("[data-invite-response]").forEach(btn => btn.onclick = () => respondToInvite(btn.dataset.inviteId, btn.dataset.inviteResponse));
  }

  function bindOpenCampaigns(root) {
    root.querySelectorAll("[data-open-campaign]").forEach(btn => btn.onclick = () => openCampaignDetail(btn.dataset.openCampaign));
  }

  async function switchTab(tab) {
    const hub = buildHub();
    hub.querySelectorAll("[data-campaign-tab]").forEach(b => b.classList.toggle("active", b.dataset.campaignTab === tab));
    const content = hub.querySelector("#campaignHubContent");
    content.innerHTML = `<div class="campaign-empty">Loading…</div>`;
    try {
      await refreshData();
      if (tab === "mine") await renderMine();
      else if (tab === "find") await renderFind();
      else await renderInvites();
    } catch (error) {
      console.error("Campaign tab failed", error);
      content.innerHTML = `<div class="campaign-empty"><strong>Could not load campaigns.</strong><div style="margin-top:7px">${escapeHtml(error?.message || "Unknown error")}</div></div>`;
    }
  }

  async function openCampaignHub(tab = "mine") {
    if (!currentUser) { document.getElementById("devSignInBtn")?.click(); return; }
    const hub = buildHub();
    if (!hub.open) hub.showModal();
    await switchTab(tab);
  }

  function openCreateDialog() {
    const dialog = buildFormDialog();
    dialog.querySelector("#campaignFormTitle").textContent = "Create Campaign";
    dialog.querySelector("#campaignFormEyebrow").textContent = "New Campaign";
    const content = dialog.querySelector("#campaignFormContent");
    content.innerHTML = `<form id="createCampaignForm" class="campaign-form"><label>Campaign type<select id="createCampaignType" required>${campaignTypes.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join("")}</select><small>Only Phoenix Games is available for now. The system supports additional campaign types later.</small></label><label>Campaign name<input id="createCampaignName" type="text" minlength="3" maxlength="80" required placeholder="e.g. Black Country Campaign 2026"></label><label>Short description<textarea id="createCampaignDescription" maxlength="500" placeholder="Tell players what this campaign is about…"></textarea><small>Maximum 500 characters.</small></label><label>Visibility<select id="createCampaignVisibility"><option value="private">Private — invite only</option><option value="public">Public — searchable and open to applications</option></select></label><div id="createCampaignMessage" class="dev-auth-message"></div><div class="campaign-form-actions"><button class="campaign-button secondary" type="button" data-close-form>Cancel</button><button class="campaign-button" type="submit">Create Campaign</button></div></form>`;
    content.querySelector("[data-close-form]").onclick = () => dialog.close();
    content.querySelector("#createCampaignForm").onsubmit = createCampaign;
    dialog.showModal();
  }

  async function createCampaign(event) {
    event.preventDefault();
    const dialog = buildFormDialog();
    const message = dialog.querySelector("#createCampaignMessage");
    message.textContent = "Creating…";
    const row = {
      campaign_type_id: dialog.querySelector("#createCampaignType").value,
      owner_id: currentUser.id,
      name: dialog.querySelector("#createCampaignName").value.trim(),
      description: dialog.querySelector("#createCampaignDescription").value.trim(),
      visibility: dialog.querySelector("#createCampaignVisibility").value
    };
    const { data, error } = await window.whrSupabase.from("campaigns").insert(row).select("id").single();
    if (error) { message.textContent = error.message; return; }
    dialog.close();
    await refreshData();
    await openCampaignDetail(data.id);
  }

  function openApplicationDialog(campaignId) {
    const c = publicCampaigns.find(x => x.id === campaignId);
    const dialog = buildFormDialog();
    dialog.querySelector("#campaignFormEyebrow").textContent = "Join Campaign";
    dialog.querySelector("#campaignFormTitle").textContent = c?.name || "Apply to Join";
    const content = dialog.querySelector("#campaignFormContent");
    content.innerHTML = `<form id="campaignApplyForm" class="campaign-form"><p>Send the campaign owner a short note explaining why you'd like to join.</p><label>Message to owner<textarea id="campaignApplyMessage" maxlength="500" placeholder="I'd like to join because…"></textarea><small>Maximum 500 characters.</small></label><div id="campaignApplyStatus" class="dev-auth-message"></div><div class="campaign-form-actions"><button class="campaign-button secondary" type="button" data-close-form>Cancel</button><button class="campaign-button" type="submit">Send Application</button></div></form>`;
    content.querySelector("[data-close-form]").onclick = () => dialog.close();
    content.querySelector("#campaignApplyForm").onsubmit = async e => {
      e.preventDefault();
      const status = content.querySelector("#campaignApplyStatus");
      status.textContent = "Sending…";
      const { error } = await window.whrSupabase.from("campaign_applications").insert({ campaign_id:campaignId, applicant_id:currentUser.id, message:content.querySelector("#campaignApplyMessage").value.trim() });
      if (error) { status.textContent = error.message; return; }
      dialog.close();
      await openCampaignHub("find");
    };
    dialog.showModal();
  }

  async function openCampaignDetail(campaignId) {
    const { data:c, error } = await window.whrSupabase.from("campaigns").select("id,campaign_type_id,owner_id,name,description,visibility,created_at,updated_at").eq("id", campaignId).single();
    if (error) { alert(`Could not open campaign: ${error.message}`); return; }
    selectedCampaign = c;
    const dialog = buildFormDialog();
    dialog.querySelector("#campaignFormEyebrow").textContent = typeName(c.campaign_type_id);
    dialog.querySelector("#campaignFormTitle").textContent = c.name;
    const content = dialog.querySelector("#campaignFormContent");
    const isOwner = c.owner_id === currentUser.id;
    const names = await getProfiles([c.owner_id]);

    const { data: members } = await window.whrSupabase.from("campaign_members").select("campaign_id,user_id,role,joined_at").eq("campaign_id", c.id).order("joined_at");
    const memberNames = await getProfiles((members || []).map(m => m.user_id));

    content.innerHTML = `<div><div class="campaign-detail-title"><h2 style="margin:0">${escapeHtml(c.name)}</h2><span class="campaign-badge ${c.visibility}">${escapeHtml(c.visibility)}</span>${isOwner ? '<span class="campaign-badge owner">Owner</span>' : ''}</div><div class="campaign-meta">${escapeHtml(typeName(c.campaign_type_id))} · Owner: ${escapeHtml(names.get(c.owner_id) || "WHR Player")}</div>${c.description ? `<div class="campaign-description">${escapeHtml(c.description)}</div>` : ""}</div><section class="campaign-subpanel"><h3>Members (${(members || []).length})</h3>${(members || []).map(m => `<div class="campaign-person-row"><div><strong>${escapeHtml(memberNames.get(m.user_id) || "WHR Player")}</strong>${m.role === "owner" ? '<span class="campaign-badge owner">Owner</span>' : ''}</div></div>`).join("") || '<div class="campaign-empty">No members yet.</div>'}</section>${isOwner ? '<section id="campaignOwnerControls"></section>' : ''}`;

    if (isOwner) await renderOwnerControls(c, content.querySelector("#campaignOwnerControls"));
    dialog.showModal();
  }

  async function renderOwnerControls(campaign, root) {
    const { data: apps } = await window.whrSupabase.from("campaign_applications").select("id,campaign_id,applicant_id,message,status,created_at").eq("campaign_id", campaign.id).eq("status", "pending").order("created_at");
    const applicantNames = await getProfiles((apps || []).map(a => a.applicant_id));
    const { data: invites } = await window.whrSupabase.from("campaign_invites").select("id,campaign_id,invited_user_id,message,status,created_at").eq("campaign_id", campaign.id).eq("status", "pending").order("created_at");
    const inviteNames = await getProfiles((invites || []).map(i => i.invited_user_id));

    root.innerHTML = `<section class="campaign-subpanel"><h3>Join Applications (${(apps || []).length})</h3>${(apps || []).map(a => `<div class="campaign-request-row"><div><strong>${escapeHtml(applicantNames.get(a.applicant_id) || "WHR Player")}</strong>${a.message ? `<div class="campaign-message">${escapeHtml(a.message)}</div>` : ""}</div><div class="campaign-actions"><button class="campaign-button" data-app-decision="accepted" data-app-id="${escapeHtml(a.id)}">Accept</button><button class="campaign-button secondary" data-app-decision="denied" data-app-id="${escapeHtml(a.id)}">Deny</button></div></div>`).join("") || '<div class="campaign-empty">No pending applications.</div>'}</section><section class="campaign-subpanel"><h3>Invite a User</h3><div class="campaign-form"><label>Find user by display name<input id="campaignInviteSearch" type="search" placeholder="Start typing a display name…"></label><div id="campaignInviteResults" class="campaign-search-results"></div><label>Optional invite message<textarea id="campaignInviteMessage" maxlength="500" placeholder="Come join our campaign…"></textarea></label></div></section><section class="campaign-subpanel"><h3>Pending Invites (${(invites || []).length})</h3>${(invites || []).map(i => `<div class="campaign-person-row"><div><strong>${escapeHtml(inviteNames.get(i.invited_user_id) || "WHR Player")}</strong>${i.message ? `<div class="campaign-message">${escapeHtml(i.message)}</div>` : ""}</div></div>`).join("") || '<div class="campaign-empty">No pending invites.</div>'}</section>`;

    root.querySelectorAll("[data-app-decision]").forEach(btn => btn.onclick = () => decideApplication(btn.dataset.appId, btn.dataset.appDecision, campaign.id));
    const search = root.querySelector("#campaignInviteSearch");
    const results = root.querySelector("#campaignInviteResults");
    let timer;
    search.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const q = search.value.trim();
        if (q.length < 2) { results.innerHTML = ""; return; }
        const { data, error } = await window.whrSupabase.from("profiles").select("id,display_name").ilike("display_name", `%${q}%`).limit(12);
        if (error) { results.innerHTML = `<div class="campaign-empty">${escapeHtml(error.message)}</div>`; return; }
        const candidates = (data || []).filter(p => p.id !== currentUser.id);
        results.innerHTML = candidates.map(p => `<div class="campaign-person-row"><strong>${escapeHtml(p.display_name)}</strong><button class="campaign-button" type="button" data-invite-user="${escapeHtml(p.id)}">Invite</button></div>`).join("") || `<div class="campaign-empty">No users found.</div>`;
        results.querySelectorAll("[data-invite-user]").forEach(btn => btn.onclick = () => sendInvite(campaign.id, btn.dataset.inviteUser, root.querySelector("#campaignInviteMessage").value.trim()));
      }, 250);
    });
  }

  async function decideApplication(applicationId, decision, campaignId) {
    const { error } = await window.whrSupabase.rpc("whr_decide_campaign_application", { p_application_id:applicationId, p_decision:decision });
    if (error) { alert(`Could not ${decision === "accepted" ? "accept" : "deny"} application: ${error.message}`); return; }
    await refreshData();
    await openCampaignDetail(campaignId);
  }

  async function sendInvite(campaignId, invitedUserId, message) {
    const { error } = await window.whrSupabase.from("campaign_invites").insert({ campaign_id:campaignId, invited_user_id:invitedUserId, invited_by:currentUser.id, message });
    if (error) { alert(`Could not send invite: ${error.message}`); return; }
    alert("Campaign invite sent.");
    await openCampaignDetail(campaignId);
  }

  async function respondToInvite(inviteId, response) {
    const { error } = await window.whrSupabase.rpc("whr_respond_campaign_invite", { p_invite_id:inviteId, p_response:response });
    if (error) { alert(`Could not ${response} invite: ${error.message}`); return; }
    await refreshData();
    await openCampaignHub(response === "accepted" ? "mine" : "invites");
  }

  async function initialise() {
    installStyles(); buildHub(); buildFormDialog();
    const { data } = await window.whrSupabase.auth.getUser();
    currentUser = data?.user || null;
    if (currentUser) {
      try { await refreshData(); } catch (error) { console.warn("Campaign foundation not ready yet", error); }
    }
    updateLandingButton();
    window.whrSupabase.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      if (currentUser) setTimeout(() => refreshData().catch(() => {}), 0);
      else { myCampaigns = []; publicCampaigns = []; myInvites = []; }
      updateLandingButton();
    });
  }

  let attempts = 0;
  const wait = setInterval(() => {
    attempts++;
    if (window.whrSupabase && document.getElementById("landingArmiesPanel")) {
      clearInterval(wait);
      initialise();
    } else if (attempts > 150) clearInterval(wait);
  }, 100);
})();
