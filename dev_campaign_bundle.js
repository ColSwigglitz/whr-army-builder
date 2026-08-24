// GENERATED FILE - DO NOT EDIT DIRECTLY.
// Built by tools/build_dev_bundle.py as dev_campaign_bundle.js.

/* ===== BEGIN campaign.js ===== */
(() => {
  const terrainSequence = ["lowland","lowland","highland","lowland","river","lowland","coast","sea"];
  const terrainNames = { lowland:"Lowlands", highland:"Highlands", river:"River Valley", coast:"Coastal", sea:"Sea", unexplored:"Unexplored" };

  const state = { selected:null, scale:0.88, x:0, y:0, dragging:false, dragStart:null, generated:false };

  function injectEntry() {
    const content = document.querySelector("#armySelectionScreen .selection-content");
    if (!content || document.getElementById("mightyEmpiresCard")) return;
    const section = document.createElement("section");
    section.className = "campaign-entry";
    section.innerHTML = `
      <div class="campaign-entry-header">
        <div><p class="eyebrow">Campaigns</p><h2>Campaign Types</h2></div>
        <p>Run a persistent map campaign alongside your WHR armies.</p>
      </div>
      <button id="mightyEmpiresCard" class="campaign-card" type="button">
        <span class="campaign-card-mark" aria-hidden="true">⬡</span>
        <span><h3>Mighty Empires</h3><p>Explore, conquer and defend a persistent hex-based fantasy realm.</p></span>
        <span class="campaign-card-action">Open Campaign →</span>
      </button>`;
    const armyCards = document.getElementById("armyCards");
    armyCards?.parentNode?.insertBefore(section, armyCards.nextSibling);
    document.getElementById("mightyEmpiresCard")?.addEventListener("click", openCampaign);
  }

  function injectScreen() {
    if (document.getElementById("mightyEmpiresScreen")) return;
    const screen = document.createElement("section");
    screen.id = "mightyEmpiresScreen";
    screen.className = "campaign-screen";
    screen.hidden = true;
    screen.innerHTML = `
      <header class="campaign-header">
        <div class="campaign-brand">
          <button id="campaignBackBtn" class="campaign-button" type="button" aria-label="Back to army selection">←</button>
          <div><h1>Mighty Empires</h1><p>WHR Campaign Prototype</p></div>
        </div>
        <div class="campaign-header-actions">
          <button id="campaignRegenerateBtn" class="campaign-button" type="button">Generate New Map</button>
          <button id="campaignRevealBtn" class="campaign-button" type="button">Reveal / Hide Hexes</button>
        </div>
      </header>
      <div class="campaign-layout">
        <div id="campaignMapShell" class="campaign-map-shell" aria-label="Mighty Empires campaign map">
          <div id="campaignMap" class="campaign-map"></div>
          <div class="campaign-map-controls">
            <button id="campaignZoomIn" type="button" aria-label="Zoom in">+</button>
            <button id="campaignZoomOut" type="button" aria-label="Zoom out">−</button>
            <button id="campaignResetView" type="button" aria-label="Reset view">⌂</button>
          </div>
        </div>
        <aside class="campaign-sidebar">
          <p class="eyebrow">Selected Hex</p>
          <div id="campaignHexDetails" class="campaign-empty">Select a hex to inspect its campaign data.</div>
          <div class="campaign-tip">Prototype controls: drag the map to pan, use the mouse wheel or +/- buttons to zoom, and click a hex to inspect it. Terrain is provisional CSS artwork while we build the proper tile library.</div>
        </aside>
      </div>`;
    document.body.appendChild(screen);
    wireScreen();
  }

  function generateMap() {
    const map = document.getElementById("campaignMap");
    if (!map) return;
    map.innerHTML = "";
    state.selected = null;
    const cols = 9, rows = 9, w = 92, h = 106, xStep = w * 0.75, yStep = h;
    for (let q = 0; q < cols; q++) {
      for (let r = 0; r < rows; r++) {
        if ((q === 0 || q === cols - 1) && (r < 1 || r > rows - 2)) continue;
        const edge = q >= 7;
        let terrain = edge ? (q === 8 ? "sea" : "coast") : terrainSequence[(q * 5 + r * 3 + (q+r)%4) % 6];
        if (q === 6 && (r === 2 || r === 3 || r === 4)) terrain = "river";
        if (q >= 7 && r === 4) terrain = "coast";
        const explored = Math.abs(q - 4) <= 1 && Math.abs(r - 4) <= 1;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `campaign-hex ${explored ? terrain : "unexplored"}`;
        button.dataset.q = q;
        button.dataset.r = r;
        button.dataset.terrain = terrain;
        button.dataset.explored = explored ? "true" : "false";
        button.dataset.owner = (q === 4 && r === 4) ? "Player Realm" : "Unclaimed";
        button.dataset.feature = (q === 4 && r === 4) ? "Capital" : ((q+r)%11===0 ? "Village" : "None");
        button.style.left = `${q * xStep}px`;
        button.style.top = `${r * yStep + (q % 2 ? h / 2 : 0)}px`;
        button.innerHTML = `<span class="hex-label">${q},${r}</span>`;
        button.addEventListener("click", e => { e.stopPropagation(); selectHex(button); });
        map.appendChild(button);
      }
    }
    state.generated = true;
    resetView();
    renderDetails(null);
  }

  function selectHex(hex) {
    document.querySelectorAll(".campaign-hex.selected").forEach(el => el.classList.remove("selected"));
    hex.classList.add("selected");
    state.selected = hex;
    renderDetails(hex);
  }

  function renderDetails(hex) {
    const details = document.getElementById("campaignHexDetails");
    if (!details) return;
    if (!hex) { details.className = "campaign-empty"; details.textContent = "Select a hex to inspect its campaign data."; return; }
    const explored = hex.dataset.explored === "true";
    details.className = "";
    details.innerHTML = `
      <h2>Hex ${hex.dataset.q}, ${hex.dataset.r}</h2>
      <dl>
        <dt>Status</dt><dd>${explored ? "Explored" : "Unknown"}</dd>
        <dt>Terrain</dt><dd>${explored ? terrainNames[hex.dataset.terrain] : "Unknown"}</dd>
        <dt>Feature</dt><dd>${explored ? hex.dataset.feature : "Unknown"}</dd>
        <dt>Owner</dt><dd>${explored ? hex.dataset.owner : "Unknown"}</dd>
      </dl>
      ${explored ? "" : `<button id="campaignScoutBtn" class="campaign-button" type="button">Scout Hex</button>`}`;
    document.getElementById("campaignScoutBtn")?.addEventListener("click", () => scoutHex(hex));
  }

  function scoutHex(hex) {
    hex.dataset.explored = "true";
    hex.classList.remove("unexplored");
    hex.classList.add(hex.dataset.terrain);
    renderDetails(hex);
  }

  function revealToggle() {
    document.querySelectorAll(".campaign-hex").forEach(hex => {
      const isHidden = hex.classList.contains("unexplored");
      if (isHidden) { hex.classList.remove("unexplored"); hex.classList.add(hex.dataset.terrain); }
      else if (hex.dataset.explored !== "true") { hex.classList.remove(hex.dataset.terrain); hex.classList.add("unexplored"); }
    });
  }

  function applyTransform() {
    const map = document.getElementById("campaignMap");
    if (map) map.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale}) translate(-310px,-480px)`;
  }
  function zoom(delta) { state.scale = Math.max(.45, Math.min(1.8, state.scale + delta)); applyTransform(); }
  function resetView() { state.scale = .88; state.x = 0; state.y = 0; applyTransform(); }

  function wireScreen() {
    document.getElementById("campaignBackBtn")?.addEventListener("click", closeCampaign);
    document.getElementById("campaignRegenerateBtn")?.addEventListener("click", generateMap);
    document.getElementById("campaignRevealBtn")?.addEventListener("click", revealToggle);
    document.getElementById("campaignZoomIn")?.addEventListener("click", () => zoom(.12));
    document.getElementById("campaignZoomOut")?.addEventListener("click", () => zoom(-.12));
    document.getElementById("campaignResetView")?.addEventListener("click", resetView);
    const shell = document.getElementById("campaignMapShell");
    shell?.addEventListener("wheel", e => { e.preventDefault(); zoom(e.deltaY < 0 ? .08 : -.08); }, { passive:false });
    shell?.addEventListener("pointerdown", e => { state.dragging = true; state.dragStart = { x:e.clientX, y:e.clientY, ox:state.x, oy:state.y }; shell.classList.add("dragging"); shell.setPointerCapture(e.pointerId); });
    shell?.addEventListener("pointermove", e => { if (!state.dragging || !state.dragStart) return; state.x = state.dragStart.ox + e.clientX - state.dragStart.x; state.y = state.dragStart.oy + e.clientY - state.dragStart.y; applyTransform(); });
    shell?.addEventListener("pointerup", () => { state.dragging = false; state.dragStart = null; shell.classList.remove("dragging"); });
  }

  function openCampaign() {
    injectScreen();
    document.getElementById("armySelectionScreen").hidden = true;
    const screen = document.getElementById("mightyEmpiresScreen");
    screen.hidden = false;
    if (!state.generated) generateMap();
  }
  function closeCampaign() {
    document.getElementById("mightyEmpiresScreen").hidden = true;
    document.getElementById("armySelectionScreen").hidden = false;
  }

  function init() { injectEntry(); injectScreen(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
;
/* ===== END campaign.js ===== */

/* ===== BEGIN dev_campaigns.js ===== */
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
;
/* ===== END dev_campaigns.js ===== */

/* ===== BEGIN dev_campaign_armies.js ===== */
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
;
/* ===== END dev_campaign_armies.js ===== */

/* ===== BEGIN dev_campaign_territories.js ===== */
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
;
/* ===== END dev_campaign_territories.js ===== */

/* ===== BEGIN dev_territory_permissions.js ===== */
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
;
/* ===== END dev_territory_permissions.js ===== */

/* ===== BEGIN dev_territory_random_server.js ===== */
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
;
/* ===== END dev_territory_random_server.js ===== */

/* ===== BEGIN dev_territory_specific_create.js ===== */
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
;
/* ===== END dev_territory_specific_create.js ===== */

/* ===== BEGIN dev_campaign_delete.js ===== */
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
;
/* ===== END dev_campaign_delete.js ===== */

/* ===== BEGIN dev_campaign_dialog_guard.js ===== */
// Prevent campaign-detail extensions from leaking into reused campaign forms.
(() => {
  function cleanNonDetailCampaignForm() {
    const dialog = document.getElementById("campaignFormDialog");
    if (!dialog?.open) return;
    const content = dialog.querySelector("#campaignFormContent");
    if (!content) return;

    // The campaign form dialog is reused for create/apply/detail views. Territory
    // extensions remember the last opened campaign, so without this guard they
    // can re-insert the previous campaign's panels when the dialog is later used
    // to create a new campaign or submit an application.
    const isNonDetailForm = Boolean(
      content.querySelector("#createCampaignForm") ||
      content.querySelector("#campaignApplyForm")
    );
    if (!isNonDetailForm) return;

    content.querySelectorAll("[data-territory-panel], .territory-admin-manager").forEach(el => el.remove());
  }

  document.addEventListener("click", event => {
    if (event.target.closest?.("#campaignCreateBtn")) {
      // Run after dev_campaigns.js has replaced the shared dialog content.
      setTimeout(cleanNonDetailCampaignForm, 0);
      setTimeout(cleanNonDetailCampaignForm, 100);
    }
  }, true);

  const observer = new MutationObserver(cleanNonDetailCampaignForm);
  observer.observe(document.body, { childList:true, subtree:true });
  setInterval(cleanNonDetailCampaignForm, 300);
})();
;
/* ===== END dev_campaign_dialog_guard.js ===== */

/* ===== BEGIN dev_mighty_empires_manual_builder_v3.js ===== */
// Mighty Empires manual map builder v3 (Dev only)
(() => {
  const GRID_COLS=15, GRID_ROWS=15, W=104, H=90, XSTEP=78;
  const SHEET_ROOT='https://www.fysh.org/~katie/wargames/downloads/mighty_empires/';
  const CENTRES=[[84,71],[327,71],[206,142],[84,213],[327,213],[206,284],[84,355],[327,355],[206,426],[84,497],[327,497],[206,568],[84,639],[327,639]];
  const ASSETS=[];

  const addSheet=(prefix,label,terrain,file,start,count,indices=null)=>{
    const picks=indices || Array.from({length:count},(_,i)=>i);
    picks.forEach((centreIndex,j)=>{
      const [cx,cy]=CENTRES[centreIndex];
      const n=start+j;
      ASSETS.push({id:`${prefix}-${String(n).padStart(2,'0')}`,name:`${label} ${String(n).padStart(2,'0')}`,terrain,sheet:`${SHEET_ROOT}${file}`,cx,cy,limit:1});
    });
  };

  addSheet('coastal','Coastal','coastal','Costal1.jpg',1,14);
  addSheet('coastal','Coastal','coastal','Costal2.jpg',15,14);
  addSheet('highland','Highland','highland','highland1.jpg',1,14);
  addSheet('highland','Highland','highland','highland2.jpg',15,8,Array.from({length:8},(_,i)=>i));
  addSheet('lowland','Lowland','lowland','lowlands1.jpg',1,14);
  addSheet('lowland','Lowland','lowland','lowlands2.jpg',15,14);
  addSheet('lowland','Lowland','lowland','lowlands3.jpg',29,6,[0,2,3,5,6,9]);
  addSheet('river','River Valley','river_valley','rivervalley1.jpg',1,14);
  addSheet('river','River Valley','river_valley','rivervalley2.jpg',15,12,Array.from({length:12},(_,i)=>i));
  ASSETS.push({id:'sea-01',name:'Sea',terrain:'sea',sheet:`${SHEET_ROOT}sea.jpg`,cx:84,cy:71,limit:28,rotatable:false});

  // Keep the five already-proven local prototype assets for their first variants.
  const local={
    'coastal-01':'assets/mighty-empires/tiles/coastal/coastal-01.webp',
    'highland-01':'assets/mighty-empires/tiles/highland/highland-01.webp',
    'lowland-01':'assets/mighty-empires/tiles/lowland/lowland-01.webp',
    'river-01':'assets/mighty-empires/tiles/river-valley/river-01.webp',
    'sea-01':'assets/mighty-empires/tiles/sea/sea-01.webp'
  };
  ASSETS.forEach(a=>{if(local[a.id])a.src=local[a.id];});
  const byAsset=new Map(ASSETS.map(a=>[a.id,a]));
  const categories=[['coastal','Coastal'],['highland','Highland'],['lowland','Lowland'],['river_valley','River Valley'],['sea','Sea']];
  const state={campaign:null,user:null,rows:[],selectedAsset:null,selectedHex:null,movingId:null,busy:false,category:'coastal'};

  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const isOwner=()=>state.campaign&&state.user&&state.campaign.owner_id===state.user.id;
  const usage=id=>state.rows.filter(r=>r.terrain_variant===id).length;
  const rowAt=(q,r)=>state.rows.find(x=>x.q===q&&x.r===r);

  function tileMarkup(a,rotation=0,cls=''){
    if(!a)return '';
    if(a.src)return `<img class="${cls}" src="${a.src}" alt="${esc(a.name)}" style="transform:rotate(${rotation}deg)">`;
    // The original source sheets are 504x713. View only the exact 164x142 tile crop,
    // then scale the complete crop into the hex. This avoids the old CSS-sprite renderer.
    const x=a.cx-82,y=a.cy-71;
    return `<svg class="${cls}" viewBox="${x} ${y} 164 142" preserveAspectRatio="xMidYMid slice" aria-label="${esc(a.name)}" style="transform:rotate(${rotation}deg)"><image href="${a.sheet}" x="0" y="0" width="504" height="713"/></svg>`;
  }

  function styles(){
    if(document.getElementById('meManualV3Styles'))return;
    const s=document.createElement('style');s.id='meManualV3Styles';s.textContent=`
      .me3-dialog{width:min(1540px,98vw);height:min(940px,95vh);border:0;border-radius:12px;padding:0;box-shadow:0 22px 70px rgba(0,0,0,.38)}
      .me3-dialog::backdrop{background:rgba(0,0,0,.62)}.me3-shell{height:100%;display:flex;flex-direction:column;background:#f4f1e8}
      .me3-header{display:flex;justify-content:space-between;gap:16px;align-items:center;background:#0d1d12;color:#fff;padding:14px 18px;border-bottom:3px solid #7b211b}.me3-header h2{margin:2px 0 0;color:#fff}.me3-header p{margin:4px 0 0;color:#d8e0da}.me3-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
      .me3-btn{border:1px solid #aeb7af;background:#fff;color:#263027;border-radius:6px;padding:9px 12px;font-weight:800;cursor:pointer}.me3-btn.primary{background:#8f261e;border-color:#8f261e;color:#fff}.me3-btn:disabled{opacity:.45;cursor:not-allowed}
      .me3-body{flex:1;min-height:0;display:grid;grid-template-columns:300px 1fr 300px}.me3-tray,.me3-inspector{background:#fff;padding:15px;overflow:auto}.me3-tray{border-right:1px solid #d9ddd8}.me3-inspector{border-left:1px solid #d9ddd8}
      .me3-help{font-size:13px;color:#606963;line-height:1.4;margin:7px 0 12px}.me3-tabs{display:flex;gap:5px;overflow:auto;padding-bottom:7px;margin-bottom:8px}.me3-tab{white-space:nowrap;border:1px solid #c9ceca;background:#f4f5f3;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:800}.me3-tab.active{background:#16261a;color:#fff;border-color:#16261a}
      .me3-assets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.me3-asset{border:2px solid transparent;border-radius:8px;background:#f5f5f2;padding:6px;cursor:pointer;text-align:left;min-width:0}.me3-asset.selected{border-color:#8f261e;background:#fff6f3}.me3-asset:disabled{opacity:.42;cursor:not-allowed}.me3-thumb{width:100%;aspect-ratio:240/208;display:block;overflow:hidden}.me3-thumb img,.me3-thumb svg{width:100%;height:100%;display:block;object-fit:contain;transform-origin:50% 50%}.me3-asset strong{display:block;font-size:11px;margin-top:4px}.me3-asset small{font-size:10px;color:#68716b}
      .me3-workspace{position:relative;overflow:auto;background:#b8cdd1;background-image:radial-gradient(rgba(255,255,255,.28) 1px,transparent 1px);background-size:18px 18px}.me3-canvas{position:relative;width:${(GRID_COLS-1)*XSTEP+W+80}px;height:${GRID_ROWS*H+45+80}px;margin:28px auto}
      .me3-slot{position:absolute;width:${W}px;height:${H}px;padding:0;border:1px dashed rgba(43,70,61,.3);background:rgba(255,255,255,.11);clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);cursor:pointer;overflow:hidden}.me3-slot:hover{background:rgba(255,255,255,.25)}.me3-slot.occupied{border:0;background:transparent}.me3-slot.active{filter:drop-shadow(0 0 4px #7b211b)}.me3-slot img,.me3-slot svg{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:fill;transform-origin:50% 50%;pointer-events:none}.me3-coord{position:absolute;inset:auto 0 6px;text-align:center;font-size:9px;color:rgba(0,0,0,.45);pointer-events:none}.me3-slot.occupied .me3-coord{display:none}
      .me3-empty{padding:26px 12px;color:#64706a;text-align:center}.me3-preview{width:210px;aspect-ratio:240/208;margin:8px auto 15px;overflow:hidden}.me3-preview img,.me3-preview svg{width:100%;height:100%;display:block;object-fit:contain;transform-origin:50% 50%}.me3-inspector dl{display:grid;grid-template-columns:90px 1fr;gap:8px;margin:14px 0}.me3-inspector dt{font-weight:800}.me3-inspector dd{margin:0}.me3-inspector-actions{display:grid;gap:8px}.me3-count{font-size:12px;color:#67716b;margin-top:10px}
      @media(max-width:850px){.me3-dialog{width:100vw;height:100vh;max-width:none;max-height:none;border-radius:0}.me3-header{align-items:flex-start}.me3-header h2{font-size:22px}.me3-actions{max-width:58%}.me3-btn{padding:8px 10px}.me3-body{grid-template-columns:1fr;grid-template-rows:auto minmax(470px,1fr) auto}.me3-tray{border-right:0;border-bottom:1px solid #d9ddd8;max-height:255px}.me3-assets{grid-template-columns:repeat(4,minmax(86px,1fr));overflow:auto}.me3-asset{min-width:86px}.me3-inspector{border-left:0;border-top:1px solid #d9ddd8;max-height:280px}}
    `;document.head.appendChild(s);
  }

  async function getUser(){const {data,error}=await window.whrSupabase.auth.getUser();if(error)throw error;return data?.user||null;}
  async function getCampaign(id){const {data,error}=await window.whrSupabase.from('campaigns').select('id,owner_id,name,campaign_type_id').eq('id',id).single();if(error)throw error;return data;}
  async function loadRows(){const {data,error}=await window.whrSupabase.from('mighty_empire_hexes').select('id,campaign_id,q,r,terrain_type,terrain_variant,rotation,special_state').eq('campaign_id',state.campaign.id).order('q').order('r');if(error)throw error;state.rows=data||[];}

  function dialog(){let d=document.getElementById('mightyEmpiresManualDialogV3');if(d)return d;styles();d=document.createElement('dialog');d.id='mightyEmpiresManualDialogV3';d.className='me3-dialog';d.innerHTML=`<div class="me3-shell"><header class="me3-header"><div><div class="eyebrow">Mighty Empires · Manual Builder</div><h2 id="me3Name">Campaign</h2><p id="me3Meta">15 × 15 build area · full tile library</p></div><div class="me3-actions"><button id="me3Clear" class="me3-btn" type="button">Clear Map</button><button id="me3Reload" class="me3-btn" type="button">Reload</button><button id="me3Close" class="me3-btn" type="button">Close</button></div></header><div id="me3Body" class="me3-body"></div></div>`;document.body.appendChild(d);d.querySelector('#me3Close').onclick=()=>d.close();d.querySelector('#me3Reload').onclick=reload;d.querySelector('#me3Clear').onclick=clearMap;return d;}

  function renderTray(){const tray=document.getElementById('me3Tray');if(!tray)return;const filtered=ASSETS.filter(a=>a.terrain===state.category);tray.innerHTML=`<div class="eyebrow">Tile Tray</div><h3 style="margin:2px 0 5px">Tile library</h3><div class="me3-tabs">${categories.map(([id,label])=>`<button class="me3-tab ${state.category===id?'active':''}" data-cat="${id}" type="button">${label}</button>`).join('')}</div><div class="me3-assets">${filtered.map(a=>{const remaining=Math.max(0,a.limit-usage(a.id));return `<button class="me3-asset ${state.selectedAsset===a.id?'selected':''}" data-asset="${a.id}" type="button" ${(!isOwner()||remaining===0)?'disabled':''}><span class="me3-thumb">${tileMarkup(a)}</span><strong>${esc(a.name)}</strong><small>${remaining} remaining</small></button>`}).join('')}</div><div class="me3-count">${ASSETS.length-1} individual land tiles + 28 Sea tiles. Build area: ${GRID_COLS} × ${GRID_ROWS}.</div>`;tray.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{state.category=b.dataset.cat;state.selectedAsset=null;renderTray();renderInspector();});tray.querySelectorAll('[data-asset]').forEach(b=>b.onclick=()=>{state.selectedAsset=b.dataset.asset;state.selectedHex=null;state.movingId=null;renderTray();renderBoard();renderInspector();});}

  function renderBoard(){const board=document.getElementById('me3Board');if(!board)return;board.innerHTML='';for(let q=0;q<GRID_COLS;q++)for(let r=0;r<GRID_ROWS;r++){const row=rowAt(q,r);const b=document.createElement('button');b.type='button';b.className=`me3-slot${row?' occupied':''}${state.selectedHex?.id===row?.id?' active':''}`;b.style.left=`${q*XSTEP+20}px`;b.style.top=`${r*H+(q%2?H/2:0)+10}px`;if(row){const a=byAsset.get(row.terrain_variant);b.innerHTML=a?`${tileMarkup(a,Number(row.rotation)||0)}<span class="me3-coord">${q},${r}</span>`:`<span>Unknown tile</span>`;}else b.innerHTML=`<span class="me3-coord">${q},${r}</span>`;b.onclick=()=>slotClick(q,r,row);board.appendChild(b);}}

  function renderInspector(){const p=document.getElementById('me3Inspector');if(!p)return;if(state.movingId){const row=state.rows.find(r=>r.id===state.movingId),a=row&&byAsset.get(row.terrain_variant);p.innerHTML=`<div class="eyebrow">Move Tile</div><h3>${esc(a?.name||'Tile')}</h3><p class="me3-help">Tap an empty hex to move this tile there.</p><button id="me3CancelMove" class="me3-btn" type="button">Cancel Move</button>`;p.querySelector('#me3CancelMove').onclick=()=>{state.movingId=null;renderInspector();};return;}const row=state.selectedHex;if(!row){const a=byAsset.get(state.selectedAsset);p.innerHTML=a?`<div class="eyebrow">Selected Tile</div><h3>${esc(a.name)}</h3><div class="me3-preview">${tileMarkup(a)}</div><p class="me3-help">Tap an empty position on the map to place it.</p>`:`<div class="eyebrow">Map Builder</div><div class="me3-empty">Choose a tile from the tray or select a placed tile.</div>`;return;}const a=byAsset.get(row.terrain_variant);p.innerHTML=`<div class="eyebrow">Placed Tile</div><h3>${esc(a?.name||row.terrain_variant)}</h3>${a?`<div class="me3-preview">${tileMarkup(a,Number(row.rotation)||0)}</div>`:''}<dl><dt>Position</dt><dd>${row.q}, ${row.r}</dd><dt>Rotation</dt><dd>${Number(row.rotation)||0}°</dd></dl>${isOwner()?`<div class="me3-inspector-actions">${a?.rotatable===false?'':`<button id="me3Rotate" class="me3-btn primary" type="button">Rotate 60°</button>`}<button id="me3Move" class="me3-btn" type="button">Move Tile</button><button id="me3Remove" class="me3-btn" type="button">Remove Tile</button></div>`:''}`;p.querySelector('#me3Rotate')?.addEventListener('click',rotateSelected);p.querySelector('#me3Move')?.addEventListener('click',()=>{state.movingId=row.id;renderInspector();});p.querySelector('#me3Remove')?.addEventListener('click',removeSelected);}

  function render(){const d=dialog();d.querySelector('#me3Name').textContent=state.campaign?.name||'Mighty Empires';d.querySelector('#me3Meta').textContent=`${state.rows.length} placed tiles · 15 × 15 build area · ${isOwner()?'Campaign owner':'Player'}`;d.querySelector('#me3Body').innerHTML='<aside id="me3Tray" class="me3-tray"></aside><section class="me3-workspace"><div id="me3Board" class="me3-canvas"></div></section><aside id="me3Inspector" class="me3-inspector"></aside>';d.querySelector('#me3Clear').hidden=!isOwner();renderTray();renderBoard();renderInspector();}
  function renderAll(){render();}

  async function slotClick(q,r,row){if(row){state.selectedHex=row;state.selectedAsset=null;state.movingId=null;renderBoard();renderTray();renderInspector();return;}if(!isOwner()||state.busy)return;if(state.movingId){const moving=state.rows.find(x=>x.id===state.movingId);if(!moving)return;state.busy=true;try{const {error}=await window.whrSupabase.from('mighty_empire_hexes').update({q,r,updated_at:new Date().toISOString()}).eq('id',moving.id);if(error)throw error;moving.q=q;moving.r=r;state.selectedHex=moving;state.movingId=null;renderAll();}catch(e){alert(`Unable to move tile: ${e.message||e}`);}finally{state.busy=false;}return;}const a=byAsset.get(state.selectedAsset);if(!a||usage(a.id)>=a.limit)return;state.busy=true;try{const payload={campaign_id:state.campaign.id,q,r,terrain_type:a.terrain,terrain_variant:a.id,rotation:0,settlement_type:null,owner_id:null,razed:false,under_siege:false,special_state:{manual_builder:true,tile_id:a.id,map_cols:GRID_COLS,map_rows:GRID_ROWS},updated_at:new Date().toISOString()};const {data,error}=await window.whrSupabase.from('mighty_empire_hexes').insert(payload).select('id,campaign_id,q,r,terrain_type,terrain_variant,rotation,special_state').single();if(error)throw error;state.rows.push(data);state.selectedHex=data;state.selectedAsset=null;renderAll();}catch(e){alert(`Unable to place tile: ${e.message||e}`);}finally{state.busy=false;}}

  async function rotateSelected(){const row=state.selectedHex,a=row&&byAsset.get(row.terrain_variant);if(!row||!a||a.rotatable===false||state.busy)return;state.busy=true;try{const rotation=((Number(row.rotation)||0)+60)%360;const {error}=await window.whrSupabase.from('mighty_empire_hexes').update({rotation,updated_at:new Date().toISOString()}).eq('id',row.id);if(error)throw error;row.rotation=rotation;renderBoard();renderInspector();}catch(e){alert(`Unable to rotate tile: ${e.message||e}`);}finally{state.busy=false;}}
  async function removeSelected(){const row=state.selectedHex;if(!row||state.busy)return;if(!confirm('Remove this tile from the map?'))return;state.busy=true;try{const {error}=await window.whrSupabase.from('mighty_empire_hexes').delete().eq('id',row.id);if(error)throw error;state.rows=state.rows.filter(x=>x.id!==row.id);state.selectedHex=null;renderAll();}catch(e){alert(`Unable to remove tile: ${e.message||e}`);}finally{state.busy=false;}}
  async function clearMap(){if(!isOwner()||!state.campaign||state.busy)return;if(!confirm('Clear every tile from this Mighty Empires map?'))return;state.busy=true;try{const {error}=await window.whrSupabase.from('mighty_empire_hexes').delete().eq('campaign_id',state.campaign.id);if(error)throw error;state.rows=[];state.selectedHex=null;state.selectedAsset=null;state.movingId=null;renderAll();}catch(e){alert(`Unable to clear map: ${e.message||e}`);}finally{state.busy=false;}}
  async function reload(){if(!state.campaign||state.busy)return;state.busy=true;try{await loadRows();state.selectedHex=null;state.movingId=null;renderAll();}catch(e){alert(`Unable to reload map: ${e.message||e}`);}finally{state.busy=false;}}

  async function openCampaign(id){try{document.getElementById('mightyEmpiresManualDialog')?.close?.();const d=dialog();state.user=await getUser();if(!state.user)throw new Error('Sign in to open this campaign.');state.campaign=await getCampaign(id);state.rows=[];state.selectedAsset=null;state.selectedHex=null;state.movingId=null;state.category='coastal';await loadRows();render();document.getElementById('campaignHubDialog')?.close?.();if(!d.open)d.showModal();}catch(e){console.error('Mighty Empires v3 failed',e);alert(`Unable to open Mighty Empires: ${e.message||e}`);}}

  window.whrOpenMightyEmpires=openCampaign;
  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-open-campaign]');const card=b?.closest?.('.campaign-card');if(!b?.dataset?.openCampaign||!card?.textContent?.includes('Mighty Empires'))return;e.preventDefault();e.stopImmediatePropagation();openCampaign(b.dataset.openCampaign);},true);
})();
;
/* ===== END dev_mighty_empires_manual_builder_v3.js ===== */

/* ===== BEGIN dev_mighty_empires_tray_scroll.js ===== */
// Mighty Empires tile tray scrolling fix (Dev only)
(() => {
  const id='me3TrayScrollFix';
  document.getElementById(id)?.remove();
  const s=document.createElement('style');
  s.id=id;
  s.textContent=`
    .me3-tray{min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}
    .me3-tabs{flex:0 0 auto!important;}
    .me3-assets{min-height:0!important;flex:1 1 auto!important;overflow-y:scroll!important;overflow-x:hidden!important;overscroll-behavior:contain;scrollbar-gutter:stable both-edges;padding-right:6px;}
    .me3-assets::-webkit-scrollbar{width:12px;}
    .me3-assets::-webkit-scrollbar-thumb{background:#8f9690;border-radius:999px;border:3px solid #fff;}
    .me3-assets::-webkit-scrollbar-track{background:#ecefea;}
    @media(max-width:850px){
      .me3-tray{height:290px!important;max-height:290px!important;}
      .me3-assets{display:grid!important;grid-template-columns:repeat(3,minmax(86px,1fr))!important;align-content:start!important;overflow-y:scroll!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;}
    }
  `;
  document.head.appendChild(s);
})();
;
/* ===== END dev_mighty_empires_tray_scroll.js ===== */

/* ===== BEGIN dev_mighty_empires_map_scroll.js ===== */
// Mighty Empires map scrolling/panning fix (Dev only)
(() => {
  const id='me3MapScrollFix';
  if(document.getElementById(id)) return;
  const s=document.createElement('style');
  s.id=id;
  s.textContent=`
    .me3-workspace{
      min-width:0;
      min-height:0;
      overflow:auto!important;
      overscroll-behavior:contain;
      -webkit-overflow-scrolling:touch;
      touch-action:pan-x pan-y;
      scrollbar-gutter:stable both-edges;
    }
    .me3-canvas{
      flex:none;
      max-width:none!important;
      max-height:none!important;
    }
    .me3-workspace::-webkit-scrollbar{width:12px;height:12px;}
    .me3-workspace::-webkit-scrollbar-thumb{background:#7b817d;border-radius:10px;border:3px solid #b8cdd1;}
    .me3-workspace::-webkit-scrollbar-track{background:#b8cdd1;}
    @media(max-width:850px){
      .me3-workspace{
        width:100%;
        height:100%;
        overflow:auto!important;
        touch-action:pan-x pan-y;
      }
    }
  `;
  document.head.appendChild(s);
})();
;
/* ===== END dev_mighty_empires_map_scroll.js ===== */

/* ===== BEGIN dev_modal_close.js ===== */
(() => {
  const STYLE_ID = "whrAutoModalCloseStyles";
  const BUTTON_CLASS = "whr-auto-modal-close";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      dialog { position: relative; }
      .${BUTTON_CLASS} {
        position: absolute;
        top: 14px;
        right: 14px;
        z-index: 20;
        width: 36px;
        height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        color: #5e554a;
        background: #fffdf8;
        border: 1px solid #d8cfbf;
        border-radius: 50%;
        font: 400 24px/1 Arial, Helvetica, sans-serif;
        cursor: pointer;
      }
      .${BUTTON_CLASS}:hover {
        color: #7b211b;
        background: #f5eee4;
        border-color: #bcae9a;
      }
      .${BUTTON_CLASS}:focus-visible {
        outline: 3px solid rgba(176,138,59,.25);
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  function hasExistingClose(dialog) {
    const buttons = [...dialog.querySelectorAll("button")];
    return buttons.some(button => {
      const aria = (button.getAttribute("aria-label") || "").trim().toLowerCase();
      const title = (button.getAttribute("title") || "").trim().toLowerCase();
      const text = (button.textContent || "").trim().toLowerCase();
      return aria.includes("close") || title.includes("close") || ["×", "✕", "✖", "x"].includes(text);
    });
  }

  function enhanceDialog(dialog) {
    if (!(dialog instanceof HTMLDialogElement)) return;
    if (dialog.dataset.whrAutoCloseProcessed === "1") return;
    dialog.dataset.whrAutoCloseProcessed = "1";

    if (dialog.hasAttribute("data-no-auto-close") || hasExistingClose(dialog)) return;

    const close = document.createElement("button");
    close.type = "button";
    close.className = BUTTON_CLASS;
    close.setAttribute("aria-label", "Close dialog");
    close.setAttribute("title", "Close");
    close.textContent = "×";
    close.addEventListener("click", () => dialog.close());
    dialog.prepend(close);
  }

  function scan(root = document) {
    if (root instanceof HTMLDialogElement) enhanceDialog(root);
    root.querySelectorAll?.("dialog").forEach(enhanceDialog);
  }

  ensureStyles();
  scan();

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node instanceof Element) scan(node);
      });
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (!document.querySelector('script[data-whr-account-email]')) {
    const accountEmailScript = document.createElement("script");
    accountEmailScript.src = "dev_account_email.js?v=1";
    accountEmailScript.async = false;
    accountEmailScript.dataset.whrAccountEmail = "1";
    document.body.appendChild(accountEmailScript);
  }
})();
;
/* ===== END dev_modal_close.js ===== */
