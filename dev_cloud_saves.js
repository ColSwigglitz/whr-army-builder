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

  function updateCloudUi() {
    if (!els.savedRostersBtn) return;
    els.savedRostersBtn.textContent = currentUser ? "My Armies" : "Saved Rosters";
    els.savedRostersBtn.title = currentUser
      ? "View armies saved to your WHR Army Builder account"
      : "View armies saved in this browser";
  }

  function setSavedDialogHeading(title, eyebrow) {
    const header = els.savedRostersDialog?.querySelector(".dialog-header");
    const heading = header?.querySelector("h2");
    const kicker = header?.querySelector(".eyebrow");
    if (heading) heading.textContent = title;
    if (kicker) kicker.textContent = eyebrow;
  }

  async function refreshCurrentUser() {
    if (!window.whrSupabase) {
      currentUser = null;
      updateCloudUi();
      return null;
    }

    const { data, error } = await window.whrSupabase.auth.getUser();
    if (error) {
      currentUser = null;
      updateCloudUi();
      return null;
    }
    currentUser = data?.user || null;
    updateCloudUi();
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
    setSavedDialogHeading("My Armies", "Cloud Armies");
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

  function visibilityLabel(roster) {
    return roster.visibility === "shared"
      ? `<span class="cloud-visibility shared" title="Other signed-in WHR Army Builder users can view this army">Shared</span>`
      : `<span class="cloud-visibility private" title="Only you can view this army">Private</span>`;
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
      const shared = roster.visibility === "shared";
      return `
        <article class="saved-roster-card cloud-roster-card">
          <div>
            <div class="saved-roster-name">${escapeHtml(roster.name || "Unnamed Army")} ${visibilityLabel(roster)}</div>
            <div class="saved-roster-meta">
              ${escapeHtml(roster.factionName || "Unknown Army")} ·
              ${formatPoints(roster.totalPoints || 0)} / ${formatPoints(roster.pointsLimit || 0)} pts
              ${when ? ` · Saved ${escapeHtml(when)}` : ""}
              · ☁ Cloud saved
            </div>
            <div class="cloud-visibility-help">
              ${shared
                ? "Shared armies can be viewed by other signed-in users."
                : "Private armies are visible only to you."}
            </div>
          </div>
          <div class="saved-roster-actions">
            <button class="load-roster-button" type="button" data-cloud-load-roster="${escapeHtml(roster.id)}">Load</button>
            <button class="cloud-visibility-button" type="button" data-cloud-toggle-visibility="${escapeHtml(roster.id)}" data-current-visibility="${shared ? "shared" : "private"}">${shared ? "Make Private" : "Share Army"}</button>
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

  async function toggleCloudRosterVisibility(id, currentVisibility) {
    if (!currentUser || !window.whrSupabase) return;
    const nextVisibility = currentVisibility === "shared" ? "private" : "shared";

    const { error } = await window.whrSupabase
      .from("army_lists")
      .update({
        visibility: nextVisibility,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("owner_id", currentUser.id);

    if (error) {
      console.error("Could not update army visibility", error);
      window.alert(`Could not change army visibility: ${error.message}`);
      return;
    }

    showToast(nextVisibility === "shared"
      ? "Army is now shared with other users"
      : "Army is now private");
    await openCloudSavedRosters();
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

    const visibilityButton = event.target.closest?.("[data-cloud-toggle-visibility]");
    if (visibilityButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      toggleCloudRosterVisibility(
        visibilityButton.dataset.cloudToggleVisibility,
        visibilityButton.dataset.currentVisibility
      );
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

  function installCloudStyles() {
    if (document.getElementById("whrCloudSaveStyles")) return;
    const style = document.createElement("style");
    style.id = "whrCloudSaveStyles";
    style.textContent = `
      .cloud-visibility {
        display: inline-block;
        margin-left: 7px;
        padding: 2px 7px;
        border-radius: 999px;
        font-size: 10px;
        line-height: 1.4;
        font-weight: 900;
        letter-spacing: .04em;
        text-transform: uppercase;
        vertical-align: middle;
      }
      .cloud-visibility.private { background: #eceff3; color: #444; border: 1px solid #cfd5dc; }
      .cloud-visibility.shared { background: #e8f6ec; color: #216b35; border: 1px solid #a8d6b4; }
      .cloud-visibility-help { margin-top: 5px; color: #69727d; font-size: 11px; }
      .cloud-visibility-button {
        min-height: 32px;
        padding: 6px 10px;
        border: 1px solid #9aa6b2;
        border-radius: 5px;
        background: #fff;
        color: #26323d;
        font-weight: 750;
        cursor: pointer;
      }
      .cloud-visibility-button:hover { background: #f1f4f6; }
    `;
    document.head.appendChild(style);
  }

  async function initialiseCloudSaves() {
    if (initialised || !window.whrSupabase) return;
    initialised = true;

    installCloudStyles();
    await refreshCurrentUser();
    window.whrSupabase.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      if (!currentUser) state.currentSaveId = null;
      updateCloudUi();
    });

    document.addEventListener("click", interceptCloudActions, true);

    window.whrCloudSaves = {
      save: saveCloudRoster,
      list: getCloudRosters,
      load: loadCloudRoster,
      delete: deleteCloudRoster,
      setVisibility: toggleCloudRosterVisibility,
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
