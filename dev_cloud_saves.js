(() => {
  let currentUser = null;
  let initialised = false;

  function snapshotToRow(snapshot) {
    return {
      id: snapshot.id,
      owner_id: currentUser.id,
      name: snapshot.name,
      army_id: snapshot.armyId || null,
      faction_id: snapshot.factionId || null,
      faction_name: snapshot.factionName || null,
      points_limit: Number(snapshot.pointsLimit || 2000),
      total_points: Number(snapshot.totalPoints || 0),
      roster_data: snapshot,
      updated_at: snapshot.updatedAt || new Date().toISOString()
    };
  }

  function rowToSnapshot(row) {
    const snapshot = row?.roster_data && typeof row.roster_data === "object"
      ? clone(row.roster_data)
      : {};

    snapshot.id = row.id;
    snapshot.name = snapshot.name || row.name || "Unnamed Army";
    snapshot.armyId = snapshot.armyId || row.army_id || null;
    snapshot.factionId = snapshot.factionId || row.faction_id || null;
    snapshot.factionName = snapshot.factionName || row.faction_name || "Unknown Army";
    snapshot.pointsLimit = Number(snapshot.pointsLimit || row.points_limit || 2000);
    snapshot.totalPoints = Number(snapshot.totalPoints || row.total_points || 0);
    snapshot.updatedAt = row.updated_at || snapshot.updatedAt || null;
    snapshot.visibility = row.visibility || "private";
    return snapshot;
  }

  async function refreshCurrentUser() {
    if (!window.whrSupabase) {
      currentUser = null;
      return null;
    }

    const { data, error } = await window.whrSupabase.auth.getUser();
    if (error) {
      currentUser = null;
      return null;
    }
    currentUser = data?.user || null;
    return currentUser;
  }

  async function saveCloudRoster() {
    if (!currentUser || !window.whrSupabase) return;

    const snapshot = makeRosterSnapshot();
    els.saveRosterBtn.disabled = true;
    els.saveRosterBtn.textContent = "Saving…";

    try {
      const { error } = await window.whrSupabase
        .from("army_lists")
        .upsert(snapshotToRow(snapshot), { onConflict: "id" });

      if (error) throw error;

      state.currentSaveId = snapshot.id;
      showToast(`Saved "${snapshot.name}" to your account`);
    } catch (error) {
      console.error("Cloud roster save failed", error);
      const missingTable = /army_lists|relation .* does not exist|schema cache/i.test(error?.message || "");
      window.alert(missingTable
        ? "Cloud saving is not configured yet. The army_lists table needs to be created in Supabase."
        : `Could not save this army to your account: ${error?.message || "Unknown error"}`);
    } finally {
      els.saveRosterBtn.disabled = false;
      els.saveRosterBtn.textContent = "Save";
    }
  }

  async function getCloudRosters() {
    if (!currentUser || !window.whrSupabase) return [];

    const { data, error } = await window.whrSupabase
      .from("army_lists")
      .select("id,name,army_id,faction_id,faction_name,points_limit,total_points,roster_data,visibility,updated_at")
      .eq("owner_id", currentUser.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(rowToSnapshot);
  }

  async function openCloudSavedRosters() {
    els.savedRostersList.innerHTML = `<div class="saved-roster-empty">Loading your cloud-saved armies…</div>`;
    els.savedRostersDialog.showModal();

    try {
      const rosters = await getCloudRosters();
      renderCloudSavedRosters(rosters);
    } catch (error) {
      console.error("Could not load cloud rosters", error);
      els.savedRostersList.innerHTML = `
        <div class="saved-roster-empty">
          <strong>Could not load your account armies.</strong>
          <div style="margin-top:6px;">${escapeHtml(error?.message || "Unknown error")}</div>
        </div>
      `;
    }
  }

  function renderCloudSavedRosters(rosters) {
    if (!rosters.length) {
      els.savedRostersList.innerHTML = `
        <div class="saved-roster-empty">
          <strong>No cloud-saved armies yet.</strong>
          <div style="margin-top:6px;">Use Save in the top bar to save the current army to your WHR Army Builder account.</div>
        </div>
      `;
      return;
    }

    els.savedRostersList.innerHTML = rosters.map(roster => {
      const when = roster.updatedAt ? new Date(roster.updatedAt).toLocaleString() : "";
      return `
        <article class="saved-roster-card">
          <div>
            <div class="saved-roster-name">${escapeHtml(roster.name || "Unnamed Army")}</div>
            <div class="saved-roster-meta">
              ${escapeHtml(roster.factionName || "Unknown Army")} ·
              ${formatPoints(roster.totalPoints || 0)} / ${formatPoints(roster.pointsLimit || 0)} pts
              ${when ? ` · Saved ${escapeHtml(when)}` : ""}
              · Account
            </div>
          </div>
          <div class="saved-roster-actions">
            <button class="load-roster-button" type="button" data-cloud-load-roster="${escapeHtml(roster.id)}">Load</button>
            <button class="delete-roster-button" type="button" data-cloud-delete-roster="${escapeHtml(roster.id)}">Delete</button>
          </div>
        </article>
      `;
    }).join("");
  }

  async function fetchCloudRoster(id) {
    const { data, error } = await window.whrSupabase
      .from("army_lists")
      .select("id,name,army_id,faction_id,faction_name,points_limit,total_points,roster_data,visibility,updated_at")
      .eq("id", id)
      .eq("owner_id", currentUser.id)
      .single();

    if (error) throw error;
    return rowToSnapshot(data);
  }

  async function loadCloudRoster(id) {
    let roster;
    try {
      roster = await fetchCloudRoster(id);
    } catch (error) {
      console.error("Could not fetch cloud roster", error);
      window.alert(`Could not load this army from your account: ${error?.message || "Unknown error"}`);
      return;
    }

    if (state.roster.length) {
      const ok = window.confirm(`Load "${roster.name}"? Any unsaved changes to the current army will be lost.`);
      if (!ok) return;
    }

    const armyId = roster.armyId || roster.factionId || "empire";
    const army = state.armyManifest?.armies?.find(a => a.id === armyId);

    if (!army?.available) {
      window.alert(`The army data required for "${roster.name}" is not currently available.`);
      return;
    }

    try {
      DATA_URL = `./data/${army.dataFile}`;
      const response = await fetch(DATA_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load ${DATA_URL}`);

      state.data = await response.json();
      state.selectedArmyId = armyId;
      buildIndexes();

      state.currentSaveId = roster.id;
      state.rosterName = roster.name || `My ${state.data.faction?.name || army.name} Army`;
      state.pointsLimit = Number(roster.pointsLimit || 2000);
      state.roster = clone(roster.roster || []);
      state.generalEntryId = roster.generalEntryId || null;

      els.factionName.textContent = state.data.faction?.name || army.name;
      els.rosterName.value = state.rosterName;
      els.pointsLimit.value = state.pointsLimit;

      els.savedRostersDialog.close();
      els.armySelectionScreen.hidden = true;
      els.builderScreen.hidden = false;

      renderUnitBrowser();
      renderArmy();
      showToast(`Loaded "${state.rosterName}" from your account`);
    } catch (error) {
      console.error(error);
      window.alert(`Could not load the army data for "${roster.name}".`);
    }
  }

  async function deleteCloudRoster(id) {
    let roster;
    try {
      roster = await fetchCloudRoster(id);
    } catch (error) {
      window.alert(`Could not find this saved army: ${error?.message || "Unknown error"}`);
      return;
    }

    if (!window.confirm(`Delete the cloud-saved roster "${roster.name}"?`)) return;

    const { error } = await window.whrSupabase
      .from("army_lists")
      .delete()
      .eq("id", id)
      .eq("owner_id", currentUser.id);

    if (error) {
      window.alert(`Could not delete this army: ${error.message}`);
      return;
    }

    if (state.currentSaveId === id) state.currentSaveId = null;
    showToast(`Deleted "${roster.name}" from your account`);
    await openCloudSavedRosters();
  }

  function interceptCloudActions(event) {
    if (!currentUser) return;

    const saveButton = event.target.closest?.("#saveRosterBtn");
    if (saveButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      saveCloudRoster();
      return;
    }

    const savedButton = event.target.closest?.("#savedRostersBtn");
    if (savedButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openCloudSavedRosters();
      return;
    }

    const loadButton = event.target.closest?.("[data-cloud-load-roster]");
    if (loadButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      loadCloudRoster(loadButton.dataset.cloudLoadRoster);
      return;
    }

    const deleteButton = event.target.closest?.("[data-cloud-delete-roster]");
    if (deleteButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      deleteCloudRoster(deleteButton.dataset.cloudDeleteRoster);
    }
  }

  async function initialiseCloudSaves() {
    if (initialised || !window.whrSupabase) return;
    initialised = true;

    await refreshCurrentUser();
    window.whrSupabase.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      if (!currentUser) state.currentSaveId = null;
    });

    document.addEventListener("click", interceptCloudActions, true);

    window.whrCloudSaves = {
      save: saveCloudRoster,
      list: getCloudRosters,
      load: loadCloudRoster,
      delete: deleteCloudRoster,
      currentUser: () => currentUser
    };
  }

  if (window.whrSupabase) initialiseCloudSaves();
  else {
    let attempts = 0;
    const wait = window.setInterval(() => {
      attempts += 1;
      if (window.whrSupabase) {
        window.clearInterval(wait);
        initialiseCloudSaves();
      } else if (attempts > 100) {
        window.clearInterval(wait);
        console.warn("Cloud save layer could not find the Supabase client.");
      }
    }, 100);
  }
})();
