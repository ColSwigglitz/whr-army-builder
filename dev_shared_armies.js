(() => {
  let currentUser = null;
  let viewingSharedArmy = false;
  let sharedArmiesCache = [];

  function installStyles() {
    if (document.getElementById("whrSharedArmiesStyles")) return;
    const style = document.createElement("style");
    style.id = "whrSharedArmiesStyles";
    style.textContent = `
      .shared-armies-dialog { width:min(1040px,95vw); border:0; padding:0; border-radius:10px; box-shadow:0 18px 60px rgba(0,0,0,.28); }
      .shared-armies-dialog::backdrop { background:rgba(0,0,0,.58); }
      .shared-armies-card { background:#fff; min-height:320px; max-height:86vh; display:flex; flex-direction:column; }
      .shared-armies-header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 22px 14px; }
      .shared-armies-header h2 { margin:2px 0 0; }
      .shared-armies-tools { display:grid; grid-template-columns:minmax(220px,1.6fr) minmax(150px,.9fr) minmax(150px,.9fr) minmax(140px,.8fr); gap:10px; padding:0 22px 16px; border-bottom:1px solid #dfe3e7; }
      .shared-filter { display:grid; gap:5px; font-size:11px; font-weight:800; color:#56616b; }
      .shared-filter input,.shared-filter select { width:100%; box-sizing:border-box; min-height:38px; border:1px solid #b8c0c8; border-radius:5px; background:#fff; padding:7px 9px; font:inherit; color:#26323d; }
      .shared-armies-summary { padding:12px 22px 0; color:#66717b; font-size:12px; }
      .shared-armies-list { overflow:auto; padding:14px 22px 24px; display:grid; gap:12px; }
      .shared-army-card { border:1px solid #d8dee5; border-left:4px solid #7b211b; border-radius:8px; padding:16px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:18px; align-items:center; background:#fff; }
      .shared-army-topline { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
      .shared-army-name { font-weight:900; font-size:17px; color:#2f2521; }
      .shared-army-faction { display:inline-block; padding:2px 7px; border-radius:999px; background:#f3eee7; color:#65473a; border:1px solid #d7c7b8; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:.04em; }
      .shared-army-meta { margin-top:7px; color:#616a73; font-size:12px; line-height:1.5; }
      .shared-army-owner { font-weight:850; color:#423832; }
      .shared-army-points { margin-top:9px; display:flex; gap:8px; flex-wrap:wrap; }
      .shared-stat { display:inline-flex; align-items:center; gap:4px; padding:4px 8px; border-radius:5px; background:#f6f7f8; border:1px solid #dde2e6; font-size:11px; font-weight:800; color:#44505b; }
      .shared-army-yours { display:inline-block; padding:2px 7px; border-radius:999px; background:#eef3ff; color:#294c8a; border:1px solid #b8c8e6; font-size:10px; font-weight:900; letter-spacing:.04em; text-transform:uppercase; }
      .shared-army-view { min-height:36px; padding:8px 13px; border:1px solid #7b211b; border-radius:5px; background:#7b211b; color:#fff; font-weight:800; cursor:pointer; white-space:nowrap; }
      .shared-army-view:hover { background:#651a16; }
      .shared-armies-empty { padding:30px 12px; text-align:center; color:#626b74; }
      .shared-view-banner { margin:14px 18px 0; padding:10px 14px; border:1px solid #d6b56c; border-left:5px solid #9a6a10; border-radius:6px; background:#fff8e8; color:#513d16; font-weight:750; }
      .shared-readonly-mode .unit-browser { display:none !important; }
      .shared-readonly-mode .builder-layout { grid-template-columns:minmax(0,1fr) !important; }
      .shared-readonly-mode #saveRosterBtn,.shared-readonly-mode #newRosterBtn,.shared-readonly-mode #savedRostersBtn,.shared-readonly-mode #clearArmyBtn { display:none !important; }
      .shared-readonly-mode #roster button { display:none !important; }
      @media (max-width:760px){ .shared-armies-tools{grid-template-columns:1fr 1fr}.shared-army-card{grid-template-columns:1fr}.shared-army-view{width:100%} }
      @media (max-width:520px){ .shared-armies-tools{grid-template-columns:1fr} }
    `;
    document.head.appendChild(style);
  }

  function escape(value) {
    return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function buildDialog() {
    if (document.getElementById("sharedArmiesDialog")) return document.getElementById("sharedArmiesDialog");
    const dialog = document.createElement("dialog");
    dialog.id = "sharedArmiesDialog";
    dialog.className = "shared-armies-dialog";
    dialog.innerHTML = `
      <div class="shared-armies-card">
        <div class="shared-armies-header">
          <div><p class="eyebrow">Community</p><h2>Shared Armies</h2></div>
          <button id="sharedArmiesCloseBtn" class="icon-button" type="button" aria-label="Close">×</button>
        </div>
        <div class="shared-armies-tools">
          <label class="shared-filter">Search<input id="sharedArmySearch" type="search" placeholder="Army or player…" autocomplete="off"></label>
          <label class="shared-filter">Player<select id="sharedPlayerFilter"><option value="">All players</option></select></label>
          <label class="shared-filter">Army book<select id="sharedFactionFilter"><option value="">All armies</option></select></label>
          <label class="shared-filter">Points<select id="sharedPointsFilter"><option value="">Any size</option><option value="1000">Up to 1,000</option><option value="1500">Up to 1,500</option><option value="2000">Up to 2,000</option><option value="2001">Over 2,000</option></select></label>
        </div>
        <div id="sharedArmiesSummary" class="shared-armies-summary"></div>
        <div id="sharedArmiesList" class="shared-armies-list"></div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector("#sharedArmiesCloseBtn").onclick = () => dialog.close();
    dialog.addEventListener("cancel", e => { e.preventDefault(); dialog.close(); });
    ["sharedArmySearch","sharedPlayerFilter","sharedFactionFilter","sharedPointsFilter"].forEach(id => {
      dialog.querySelector(`#${id}`)?.addEventListener(id === "sharedArmySearch" ? "input" : "change", renderFilteredArmies);
    });
    return dialog;
  }

  function installLandingButton() {
    const actions = document.querySelector("#landingArmiesPanel .landing-armies-actions");
    if (!actions || document.getElementById("landingSharedArmiesBtn")) return;
    const btn = document.createElement("button");
    btn.id = "landingSharedArmiesBtn";
    btn.className = "landing-armies-button secondary";
    btn.type = "button";
    btn.textContent = "⚔ Shared Armies";
    btn.hidden = !currentUser;
    btn.addEventListener("click", openSharedArmies);
    actions.appendChild(btn);
  }

  function updateUi() {
    installLandingButton();
    const btn = document.getElementById("landingSharedArmiesBtn");
    if (btn) btn.hidden = !currentUser;
  }

  async function getSharedArmies() {
    const { data, error } = await window.whrSupabase
      .from("army_lists")
      .select("id,owner_id,name,army_id,faction_id,faction_name,points_limit,total_points,roster_data,visibility,updated_at")
      .eq("visibility", "shared")
      .order("updated_at", { ascending:false });
    if (error) throw error;
    const rows = data || [];
    const ownerIds = [...new Set(rows.map(r => r.owner_id).filter(Boolean))];
    const names = new Map();
    if (ownerIds.length) {
      const profiles = await window.whrSupabase.from("profiles").select("id,display_name").in("id", ownerIds);
      if (!profiles.error) for (const p of profiles.data || []) names.set(p.id, p.display_name);
    }
    return rows.map(row => ({ ...row, ownerName:names.get(row.owner_id) || "WHR Player", isOwnArmy:row.owner_id === currentUser.id }));
  }

  function populateFilters(armies) {
    const dialog = buildDialog();
    const player = dialog.querySelector("#sharedPlayerFilter");
    const faction = dialog.querySelector("#sharedFactionFilter");
    const players = [...new Set(armies.map(a => a.ownerName).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const factions = [...new Set(armies.map(a => a.faction_name || "Unknown Army"))].sort((a,b)=>a.localeCompare(b));
    player.innerHTML = `<option value="">All players</option>${players.map(v=>`<option value="${escape(v)}">${escape(v)}</option>`).join("")}`;
    faction.innerHTML = `<option value="">All armies</option>${factions.map(v=>`<option value="${escape(v)}">${escape(v)}</option>`).join("")}`;
  }

  function filteredArmies() {
    const dialog = buildDialog();
    const search = (dialog.querySelector("#sharedArmySearch")?.value || "").trim().toLowerCase();
    const player = dialog.querySelector("#sharedPlayerFilter")?.value || "";
    const faction = dialog.querySelector("#sharedFactionFilter")?.value || "";
    const points = dialog.querySelector("#sharedPointsFilter")?.value || "";
    return sharedArmiesCache.filter(row => {
      const haystack = `${row.name || ""} ${row.ownerName || ""} ${row.faction_name || ""}`.toLowerCase();
      if (search && !haystack.includes(search)) return false;
      if (player && row.ownerName !== player) return false;
      if (faction && (row.faction_name || "Unknown Army") !== faction) return false;
      const size = Number(row.points_limit || 0);
      if (points === "1000" && size > 1000) return false;
      if (points === "1500" && size > 1500) return false;
      if (points === "2000" && size > 2000) return false;
      if (points === "2001" && size <= 2000) return false;
      return true;
    });
  }

  function renderFilteredArmies() {
    const dialog = buildDialog();
    const list = dialog.querySelector("#sharedArmiesList");
    const summary = dialog.querySelector("#sharedArmiesSummary");
    const armies = filteredArmies();
    summary.textContent = `${armies.length} of ${sharedArmiesCache.length} shared ${sharedArmiesCache.length === 1 ? "army" : "armies"}`;
    if (!armies.length) {
      list.innerHTML = `<div class="shared-armies-empty"><strong>No matching shared armies.</strong><div style="margin-top:6px">Try changing the search or filters.</div></div>`;
      return;
    }
    list.innerHTML = armies.map(row => {
      const when = row.updated_at ? new Date(row.updated_at).toLocaleString() : "";
      const yours = row.isOwnArmy ? `<span class="shared-army-yours">Your army</span>` : "";
      return `<article class="shared-army-card"><div><div class="shared-army-topline"><span class="shared-army-name">${escape(row.name || "Unnamed Army")}</span>${yours}<span class="shared-army-faction">${escape(row.faction_name || "Unknown Army")}</span></div><div class="shared-army-meta">by <span class="shared-army-owner">${escape(row.ownerName)}</span>${when ? ` · Updated ${escape(when)}` : ""}</div><div class="shared-army-points"><span class="shared-stat">List ${Number(row.total_points || 0)} pts</span><span class="shared-stat">Limit ${Number(row.points_limit || 0)} pts</span></div></div><button class="shared-army-view" type="button" data-view-shared-army="${escape(row.id)}">View Army</button></article>`;
    }).join("");
    list.querySelectorAll("[data-view-shared-army]").forEach(btn => btn.addEventListener("click", () => viewSharedArmy(btn.dataset.viewSharedArmy)));
  }

  async function openSharedArmies() {
    if (!currentUser) { document.getElementById("devSignInBtn")?.click(); return; }
    const dialog = buildDialog();
    const list = dialog.querySelector("#sharedArmiesList");
    dialog.querySelector("#sharedArmiesSummary").textContent = "";
    list.innerHTML = `<div class="shared-armies-empty">Loading shared armies…</div>`;
    dialog.showModal();
    try {
      sharedArmiesCache = await getSharedArmies();
      populateFilters(sharedArmiesCache);
      dialog.querySelector("#sharedArmySearch").value = "";
      dialog.querySelector("#sharedPointsFilter").value = "";
      if (!sharedArmiesCache.length) {
        dialog.querySelector("#sharedArmiesSummary").textContent = "0 shared armies";
        list.innerHTML = `<div class="shared-armies-empty"><strong>No shared armies yet.</strong><div style="margin-top:6px">When a player marks an army as Shared, it will appear here.</div></div>`;
        return;
      }
      renderFilteredArmies();
    } catch (error) {
      console.error("Could not load shared armies", error);
      list.innerHTML = `<div class="shared-armies-empty"><strong>Could not load shared armies.</strong><div style="margin-top:6px">${escape(error?.message || "Unknown error")}</div></div>`;
    }
  }

  async function fetchSharedArmy(id) {
    const { data, error } = await window.whrSupabase.from("army_lists").select("id,owner_id,name,army_id,faction_id,faction_name,points_limit,total_points,roster_data,visibility,updated_at").eq("id", id).eq("visibility", "shared").single();
    if (error) throw error;
    let ownerName = "WHR Player";
    const profile = await window.whrSupabase.from("profiles").select("display_name").eq("id", data.owner_id).maybeSingle();
    if (!profile.error && profile.data?.display_name) ownerName = profile.data.display_name;
    return { ...data, ownerName };
  }

  function clearReadOnly() {
    if (!viewingSharedArmy) return;
    viewingSharedArmy = false;
    document.body.classList.remove("shared-readonly-mode");
    document.getElementById("sharedViewBanner")?.remove();
    if (els?.rosterName) els.rosterName.disabled = false;
    if (els?.pointsLimit) els.pointsLimit.disabled = false;
  }

  function enableReadOnly(ownerName) {
    viewingSharedArmy = true;
    document.body.classList.add("shared-readonly-mode");
    if (els?.rosterName) els.rosterName.disabled = true;
    if (els?.pointsLimit) els.pointsLimit.disabled = true;
    document.getElementById("sharedViewBanner")?.remove();
    const banner = document.createElement("div");
    banner.id = "sharedViewBanner";
    banner.className = "shared-view-banner";
    banner.textContent = `Read-only shared army · owned by ${ownerName}. You can view and print this list, but only its owner can change it.`;
    document.querySelector("#builderScreen .app-header")?.insertAdjacentElement("afterend", banner);
  }

  async function viewSharedArmy(id) {
    try {
      const row = await fetchSharedArmy(id);
      const snapshot = row.roster_data || {};
      const armyId = snapshot.armyId || row.army_id || row.faction_id;
      const army = state.armyManifest?.armies?.find(a => a.id === armyId && a.available);
      if (!army) { alert("The army book needed to display this shared list is not available."); return; }
      DATA_URL = `./data/${army.dataFile}`;
      const response = await fetch(DATA_URL, { cache:"no-store" });
      if (!response.ok) throw new Error(`Could not load ${DATA_URL}`);
      state.data = await response.json(); state.selectedArmyId = armyId; buildIndexes(); state.currentSaveId = null;
      state.rosterName = snapshot.name || row.name || "Shared Army";
      state.pointsLimit = Number(snapshot.pointsLimit || row.points_limit || 2000);
      state.roster = clone(snapshot.roster || []); state.generalEntryId = snapshot.generalEntryId || null;
      els.factionName.textContent = state.data.faction?.name || row.faction_name || army.name;
      els.rosterName.value = state.rosterName; els.pointsLimit.value = state.pointsLimit;
      buildDialog().close(); els.armySelectionScreen.hidden = true; els.builderScreen.hidden = false;
      renderUnitBrowser(); renderArmy(); enableReadOnly(row.ownerName); window.scrollTo({ top:0, behavior:"instant" });
    } catch (error) {
      console.error("Could not view shared army", error);
      alert(`Could not open this shared army: ${error?.message || "Unknown error"}`);
    }
  }

  function blockReadOnlyEdits(event) {
    if (!viewingSharedArmy) return;
    const target = event.target.closest?.("#roster button,#saveRosterBtn,#newRosterBtn,#savedRostersBtn,#clearArmyBtn");
    if (!target) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
  }

  async function initialise() {
    installStyles(); buildDialog();
    document.addEventListener("click", blockReadOnlyEdits, true);
    const previousSelectArmy = selectArmy;
    selectArmy = async function(armyId) { clearReadOnly(); return previousSelectArmy(armyId); };
    document.getElementById("backToArmiesBtn")?.addEventListener("click", clearReadOnly);
    const { data } = await window.whrSupabase.auth.getUser(); currentUser = data?.user || null; updateUi();
    window.whrSupabase.auth.onAuthStateChange((_event, session) => { currentUser = session?.user || null; updateUi(); if (!currentUser) clearReadOnly(); });
  }

  let attempts = 0;
  const wait = setInterval(() => {
    attempts++;
    if (window.whrSupabase && document.getElementById("landingArmiesPanel")) { clearInterval(wait); initialise(); }
    else if (attempts > 120) clearInterval(wait);
  }, 100);
})();
