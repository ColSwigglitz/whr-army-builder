(() => {
  let currentUser = null;
  let viewingSharedArmy = false;

  function installStyles() {
    if (document.getElementById("whrSharedArmiesStyles")) return;
    const style = document.createElement("style");
    style.id = "whrSharedArmiesStyles";
    style.textContent = `
      .shared-armies-dialog { width:min(920px,94vw); border:0; padding:0; border-radius:10px; box-shadow:0 18px 60px rgba(0,0,0,.28); }
      .shared-armies-dialog::backdrop { background:rgba(0,0,0,.58); }
      .shared-armies-card { background:#fff; min-height:260px; max-height:82vh; display:flex; flex-direction:column; }
      .shared-armies-header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 22px; border-bottom:1px solid #dfe3e7; }
      .shared-armies-header h2 { margin:2px 0 0; }
      .shared-armies-list { overflow:auto; padding:18px 22px 24px; display:grid; gap:12px; }
      .shared-army-card { border:1px solid #d8dee5; border-left:4px solid #7b211b; border-radius:8px; padding:15px 16px; display:flex; align-items:center; justify-content:space-between; gap:18px; background:#fff; }
      .shared-army-name { font-weight:900; font-size:16px; }
      .shared-army-meta { margin-top:5px; color:#616a73; font-size:12px; line-height:1.45; }
      .shared-army-owner { font-weight:800; color:#423832; }
      .shared-army-yours { display:inline-block; margin-left:7px; padding:2px 7px; border-radius:999px; background:#eef3ff; color:#294c8a; border:1px solid #b8c8e6; font-size:10px; font-weight:900; letter-spacing:.04em; text-transform:uppercase; vertical-align:middle; }
      .shared-army-view { min-height:34px; padding:7px 12px; border:1px solid #7b211b; border-radius:5px; background:#7b211b; color:#fff; font-weight:800; cursor:pointer; white-space:nowrap; }
      .shared-army-view:hover { background:#651a16; }
      .shared-armies-empty { padding:30px 12px; text-align:center; color:#626b74; }
      .shared-view-banner { margin:14px 18px 0; padding:10px 14px; border:1px solid #d6b56c; border-left:5px solid #9a6a10; border-radius:6px; background:#fff8e8; color:#513d16; font-weight:750; }
      .shared-readonly-mode .unit-browser { display:none !important; }
      .shared-readonly-mode .builder-layout { grid-template-columns:minmax(0,1fr) !important; }
      .shared-readonly-mode #saveRosterBtn,
      .shared-readonly-mode #newRosterBtn,
      .shared-readonly-mode #savedRostersBtn,
      .shared-readonly-mode #clearArmyBtn { display:none !important; }
      .shared-readonly-mode #roster button { display:none !important; }
      @media (max-width:700px){ .shared-army-card{align-items:stretch;flex-direction:column}.shared-army-view{width:100%} }
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
        <div id="sharedArmiesList" class="shared-armies-list"></div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector("#sharedArmiesCloseBtn").onclick = () => dialog.close();
    dialog.addEventListener("cancel", e => { e.preventDefault(); dialog.close(); });
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
    return rows.map(row => ({
      ...row,
      ownerName:names.get(row.owner_id) || "WHR Player",
      isOwnArmy: row.owner_id === currentUser.id
    }));
  }

  async function openSharedArmies() {
    if (!currentUser) { document.getElementById("devSignInBtn")?.click(); return; }
    const dialog = buildDialog();
    const list = dialog.querySelector("#sharedArmiesList");
    list.innerHTML = `<div class="shared-armies-empty">Loading shared armies…</div>`;
    dialog.showModal();
    try {
      const armies = await getSharedArmies();
      if (!armies.length) {
        list.innerHTML = `<div class="shared-armies-empty"><strong>No shared armies yet.</strong><div style="margin-top:6px">When a player marks an army as Shared, it will appear here.</div></div>`;
        return;
      }
      list.innerHTML = armies.map(row => {
        const when = row.updated_at ? new Date(row.updated_at).toLocaleString() : "";
        const yours = row.isOwnArmy ? `<span class="shared-army-yours">Your army</span>` : "";
        return `<article class="shared-army-card"><div><div class="shared-army-name">${escape(row.name || "Unnamed Army")}${yours}</div><div class="shared-army-meta"><span class="shared-army-owner">${escape(row.ownerName)}</span> · ${escape(row.faction_name || "Unknown Army")} · ${Number(row.total_points || 0)} / ${Number(row.points_limit || 0)} pts${when ? ` · Updated ${escape(when)}` : ""}</div></div><button class="shared-army-view" type="button" data-view-shared-army="${escape(row.id)}">View Army</button></article>`;
      }).join("");
      list.querySelectorAll("[data-view-shared-army]").forEach(btn => btn.addEventListener("click", () => viewSharedArmy(btn.dataset.viewSharedArmy)));
    } catch (error) {
      console.error("Could not load shared armies", error);
      list.innerHTML = `<div class="shared-armies-empty"><strong>Could not load shared armies.</strong><div style="margin-top:6px">${escape(error?.message || "Unknown error")}</div></div>`;
    }
  }

  async function fetchSharedArmy(id) {
    const { data, error } = await window.whrSupabase
      .from("army_lists")
      .select("id,owner_id,name,army_id,faction_id,faction_name,points_limit,total_points,roster_data,visibility,updated_at")
      .eq("id", id)
      .eq("visibility", "shared")
      .single();
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
      state.data = await response.json();
      state.selectedArmyId = armyId;
      buildIndexes();
      state.currentSaveId = null;
      state.rosterName = snapshot.name || row.name || "Shared Army";
      state.pointsLimit = Number(snapshot.pointsLimit || row.points_limit || 2000);
      state.roster = clone(snapshot.roster || []);
      state.generalEntryId = snapshot.generalEntryId || null;

      els.factionName.textContent = state.data.faction?.name || row.faction_name || army.name;
      els.rosterName.value = state.rosterName;
      els.pointsLimit.value = state.pointsLimit;
      buildDialog().close();
      els.armySelectionScreen.hidden = true;
      els.builderScreen.hidden = false;
      renderUnitBrowser();
      renderArmy();
      enableReadOnly(row.ownerName);
      window.scrollTo({ top:0, behavior:"instant" });
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

    const { data } = await window.whrSupabase.auth.getUser();
    currentUser = data?.user || null;
    updateUi();
    window.whrSupabase.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      updateUi();
      if (!currentUser) clearReadOnly();
    });
  }

  let attempts = 0;
  const wait = setInterval(() => {
    attempts++;
    if (window.whrSupabase && document.getElementById("landingArmiesPanel")) { clearInterval(wait); initialise(); }
    else if (attempts > 120) clearInterval(wait);
  }, 100);
})();
