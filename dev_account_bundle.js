// GENERATED FILE - DO NOT EDIT DIRECTLY.
// Built by tools/build_dev_bundle.py as dev_account_bundle.js.

/* ===== BEGIN dev_auth.js ===== */
(() => {
  const SUPABASE_URL = "https://gpsnavbubbsvsjowhwjx.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_RvaSdBuEvXBsLm60hpKCdA_X6GNawDF";

  function loadSupabase() {
    return new Promise((resolve, reject) => {
      if (window.supabase?.createClient) return resolve(window.supabase);
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.onload = () => resolve(window.supabase);
      script.onerror = () => reject(new Error("Unable to load Supabase client."));
      document.head.appendChild(script);
    });
  }

  function buildAccountUi() {
    const bar = document.createElement("div");
    bar.className = "dev-account-bar";
    bar.innerHTML = `
      <span id="devAccountStatus" class="dev-account-status">Account: <strong>Not signed in</strong></span>
      <button id="devSignInBtn" class="dev-auth-button" type="button">Sign in / Create account</button>
      <button id="devSignOutBtn" class="dev-auth-button dev-auth-button-secondary" type="button" hidden>Sign out</button>
    `;

    const developmentBanner = document.querySelector(".development-banner");
    if (developmentBanner) developmentBanner.insertAdjacentElement("afterend", bar);
    else document.body.prepend(bar);

    const dialog = document.createElement("dialog");
    dialog.id = "devAuthDialog";
    dialog.className = "dev-auth-dialog";
    dialog.innerHTML = `
      <form id="devAuthForm" class="dev-auth-card">
        <h2 id="devAuthTitle">Sign in</h2>
        <p id="devAuthIntro" class="dev-auth-intro">Sign in to access your WHR Army Builder account.</p>

        <label id="devAuthEmailField" class="dev-auth-field">Email address
          <input id="devAuthEmail" type="email" autocomplete="email" required>
        </label>

        <label id="devAuthPasswordField" class="dev-auth-field">Password
          <input id="devAuthPassword" type="password" autocomplete="current-password" minlength="8" required>
        </label>

        <label id="devAuthConfirmPasswordField" class="dev-auth-field" hidden>Confirm new password
          <input id="devAuthConfirmPassword" type="password" autocomplete="new-password" minlength="8">
        </label>

        <div id="devAuthMessage" class="dev-auth-message" aria-live="polite"></div>

        <div class="dev-auth-actions">
          <button id="devAuthCancel" class="dev-auth-button dev-auth-button-secondary" type="button">Cancel</button>
          <button id="devAuthSubmit" class="dev-auth-button" type="submit">Sign in</button>
        </div>

        <p id="devAuthForgotRow" class="dev-auth-switch">
          <button id="devAuthForgot" type="button">Forgot your password?</button>
        </p>

        <p id="devAuthSwitchRow" class="dev-auth-switch">
          <span id="devAuthSwitchText">Don't have an account?</span>
          <button id="devAuthSwitch" type="button">Create one</button>
        </p>
      </form>
    `;
    document.body.appendChild(dialog);

    return {
      bar,
      dialog,
      status: bar.querySelector("#devAccountStatus"),
      signIn: bar.querySelector("#devSignInBtn"),
      signOut: bar.querySelector("#devSignOutBtn"),
      form: dialog.querySelector("#devAuthForm"),
      title: dialog.querySelector("#devAuthTitle"),
      intro: dialog.querySelector("#devAuthIntro"),
      emailField: dialog.querySelector("#devAuthEmailField"),
      email: dialog.querySelector("#devAuthEmail"),
      passwordField: dialog.querySelector("#devAuthPasswordField"),
      password: dialog.querySelector("#devAuthPassword"),
      confirmPasswordField: dialog.querySelector("#devAuthConfirmPasswordField"),
      confirmPassword: dialog.querySelector("#devAuthConfirmPassword"),
      message: dialog.querySelector("#devAuthMessage"),
      cancel: dialog.querySelector("#devAuthCancel"),
      submit: dialog.querySelector("#devAuthSubmit"),
      forgotRow: dialog.querySelector("#devAuthForgotRow"),
      forgotButton: dialog.querySelector("#devAuthForgot"),
      switchRow: dialog.querySelector("#devAuthSwitchRow"),
      switchButton: dialog.querySelector("#devAuthSwitch"),
      switchText: dialog.querySelector("#devAuthSwitchText")
    };
  }

  async function initialise() {
    const ui = buildAccountUi();
    let mode = "signin";
    let client;

    function setMessage(text = "", success = false) {
      ui.message.textContent = text;
      ui.message.classList.toggle("success", success);
    }

    function setMode(nextMode) {
      mode = nextMode;

      const signingUp = mode === "signup";
      const requestingRecovery = mode === "forgot";
      const settingNewPassword = mode === "recovery";

      ui.emailField.hidden = settingNewPassword;
      ui.email.required = !settingNewPassword;

      ui.passwordField.hidden = requestingRecovery;
      ui.password.required = !requestingRecovery;
      ui.password.autocomplete = signingUp || settingNewPassword ? "new-password" : "current-password";
      ui.passwordField.firstChild.textContent = settingNewPassword ? "New password\n          " : "Password\n          ";

      ui.confirmPasswordField.hidden = !settingNewPassword;
      ui.confirmPassword.required = settingNewPassword;

      ui.forgotRow.hidden = mode !== "signin";
      ui.switchRow.hidden = settingNewPassword;

      if (signingUp) {
        ui.title.textContent = "Create account";
        ui.intro.textContent = "Create a free WHR Army Builder account to save armies online, share lists and join campaigns.";
        ui.submit.textContent = "Create account";
        ui.switchText.textContent = "Already have an account?";
        ui.switchButton.textContent = "Sign in";
      } else if (requestingRecovery) {
        ui.title.textContent = "Reset password";
        ui.intro.textContent = "Enter your email address and we'll send you a secure link to choose a new password.";
        ui.submit.textContent = "Send reset email";
        ui.switchText.textContent = "Remembered your password?";
        ui.switchButton.textContent = "Back to sign in";
      } else if (settingNewPassword) {
        ui.title.textContent = "Choose a new password";
        ui.intro.textContent = "Enter your new password twice to finish recovering your WHR Army Builder account.";
        ui.submit.textContent = "Update password";
      } else {
        ui.title.textContent = "Sign in";
        ui.intro.textContent = "Sign in to access your WHR Army Builder account.";
        ui.submit.textContent = "Sign in";
        ui.switchText.textContent = "Don't have an account?";
        ui.switchButton.textContent = "Create one";
      }

      setMessage();
    }

    function renderSession(session) {
      const email = session?.user?.email;
      if (email) {
        ui.status.innerHTML = `Signed in as <span class="dev-account-email"></span>`;
        ui.status.querySelector(".dev-account-email").textContent = email;
        ui.signIn.hidden = true;
        ui.signOut.hidden = false;
      } else {
        ui.status.innerHTML = "Account: <strong>Not signed in</strong>";
        ui.signIn.hidden = false;
        ui.signOut.hidden = true;
      }
    }

    function openRecoveryDialog() {
      ui.form.reset();
      setMode("recovery");
      if (!ui.dialog.open) ui.dialog.showModal();
      ui.password.focus();
    }

    try {
      const library = await loadSupabase();
      client = library.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      window.whrSupabase = client;

      client.auth.onAuthStateChange((event, session) => {
        renderSession(session);
        if (event === "PASSWORD_RECOVERY") {
          setTimeout(openRecoveryDialog, 0);
        }
      });

      const { data } = await client.auth.getSession();
      renderSession(data?.session || null);
    } catch (error) {
      ui.status.textContent = "Account service unavailable";
      ui.signIn.disabled = true;
      console.error("WHR auth initialisation failed", error);
      return;
    }

    ui.signIn.addEventListener("click", () => {
      ui.form.reset();
      setMode("signin");
      ui.dialog.showModal();
      ui.email.focus();
    });

    ui.cancel.addEventListener("click", () => ui.dialog.close());

    ui.forgotButton.addEventListener("click", () => {
      const existingEmail = ui.email.value.trim();
      ui.form.reset();
      if (existingEmail) ui.email.value = existingEmail;
      setMode("forgot");
      ui.email.focus();
    });

    ui.switchButton.addEventListener("click", () => {
      if (mode === "signup" || mode === "forgot") setMode("signin");
      else setMode("signup");
    });

    ui.signOut.addEventListener("click", async () => {
      ui.signOut.disabled = true;
      const { error } = await client.auth.signOut();
      ui.signOut.disabled = false;
      if (error) alert(`Unable to sign out: ${error.message}`);
    });

    ui.form.addEventListener("submit", async event => {
      event.preventDefault();
      setMessage();
      ui.submit.disabled = true;

      const email = ui.email.value.trim();
      const password = ui.password.value;

      try {
        if (mode === "signup") {
          const redirectUrl = `${window.location.origin}${window.location.pathname}`;
          const { data, error } = await client.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectUrl }
          });
          if (error) throw error;

          if (data?.session) {
            setMessage("Account created and signed in.", true);
            setTimeout(() => ui.dialog.close(), 650);
          } else {
            setMessage("Account created. Check your email for the confirmation link, then return here to sign in.", true);
          }
        } else if (mode === "forgot") {
          const redirectUrl = `${window.location.origin}${window.location.pathname}`;
          const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
          if (error) throw error;

          setMessage("If an account exists for that email address, a password reset email has been sent.", true);
        } else if (mode === "recovery") {
          const confirmPassword = ui.confirmPassword.value;
          if (password.length < 8) throw new Error("Your new password must be at least 8 characters long.");
          if (password !== confirmPassword) throw new Error("The two passwords do not match.");

          const { error } = await client.auth.updateUser({ password });
          if (error) throw error;

          setMessage("Password updated successfully. Your account is ready to use.", true);
          setTimeout(() => ui.dialog.close(), 1100);
        } else {
          const { error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
          setMessage("Signed in successfully.", true);
          setTimeout(() => ui.dialog.close(), 450);
        }
      } catch (error) {
        setMessage(error?.message || "Account request failed.");
      } finally {
        ui.submit.disabled = false;
      }
    });

    ui.dialog.addEventListener("close", () => {
      ui.form.reset();
      setMode("signin");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
;
/* ===== END dev_auth.js ===== */

/* ===== BEGIN dev_auth_getuser_dedupe.js ===== */
// Dev performance guard: collapse bursts of identical Supabase auth.getUser()
// calls made by independently loaded account/campaign extensions.
(() => {
  let attempts = 0;

  function install() {
    const client = window.whrSupabase;
    if (!client?.auth?.getUser) return false;
    if (client.auth.__whrGetUserDeduped) return true;

    const originalGetUser = client.auth.getUser.bind(client.auth);
    let inFlight = null;
    let lastResult = null;
    let lastResultAt = 0;
    const CACHE_MS = 1500;

    client.auth.getUser = async function(...args) {
      const now = Date.now();
      if (!args.length && lastResult && now - lastResultAt < CACHE_MS) return lastResult;
      if (!args.length && inFlight) return inFlight;

      const request = originalGetUser(...args);
      if (args.length) return request;

      inFlight = Promise.resolve(request)
        .then(result => {
          lastResult = result;
          lastResultAt = Date.now();
          return result;
        })
        .finally(() => { inFlight = null; });

      return inFlight;
    };

    client.auth.__whrGetUserDeduped = true;
    client.auth.onAuthStateChange(() => {
      lastResult = null;
      lastResultAt = 0;
      inFlight = null;
    });
    return true;
  }

  if (install()) return;
  const timer = setInterval(() => {
    attempts += 1;
    if (install() || attempts > 200) clearInterval(timer);
  }, 25);
})();
;
/* ===== END dev_auth_getuser_dedupe.js ===== */

/* ===== BEGIN dev_cloud_visibility_preserve.js ===== */
(() => {
  const client = window.whrSupabase;
  if (!client || client.__whrVisibilityPreservePatch) return;

  const originalFrom = client.from.bind(client);

  client.from = function(table) {
    const builder = originalFrom(table);
    if (table !== "army_lists" || !builder?.upsert) return builder;

    const originalUpsert = builder.upsert.bind(builder);

    builder.upsert = async function(values, options) {
      async function preserveVisibility(row) {
        if (!row || typeof row !== "object" || row.visibility != null || !row.id) return row;

        const { data, error } = await originalFrom("army_lists")
          .select("visibility")
          .eq("id", row.id)
          .maybeSingle();

        if (!error && data?.visibility) {
          return { ...row, visibility: data.visibility };
        }

        // New armies remain private by default.
        return { ...row, visibility: "private" };
      }

      const patchedValues = Array.isArray(values)
        ? await Promise.all(values.map(preserveVisibility))
        : await preserveVisibility(values);

      return originalUpsert(patchedValues, options);
    };

    return builder;
  };

  client.__whrVisibilityPreservePatch = true;
})();
;
/* ===== END dev_cloud_visibility_preserve.js ===== */

/* ===== BEGIN dev_cloud_saves.js ===== */
(() => {
  let currentUser = null;
  let initialised = false;
  const rosterCache = new Map();
  const armyDataCache = new Map();

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
    const snapshot = row?.roster_data && typeof row.roster_data === "object" ? clone(row.roster_data) : {};
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
    els.savedRostersBtn.title = currentUser ? "View armies saved to your WHR Army Builder account" : "View armies saved in this browser";
  }

  function setSavedDialogHeading(title, eyebrow) {
    const header = els.savedRostersDialog?.querySelector(".dialog-header");
    const heading = header?.querySelector("h2");
    const kicker = header?.querySelector(".eyebrow");
    if (heading) heading.textContent = title;
    if (kicker) kicker.textContent = eyebrow;
  }

  async function refreshCurrentUser() {
    if (!window.whrSupabase) { currentUser = null; updateCloudUi(); return null; }
    const { data, error } = await window.whrSupabase.auth.getUser();
    if (error) { currentUser = null; updateCloudUi(); return null; }
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
      const { error } = await window.whrSupabase.from("army_lists").upsert(snapshotToRow(snapshot), { onConflict: "id" });
      if (error) throw error;
      rosterCache.set(snapshot.id, clone(snapshot));
      state.currentSaveId = snapshot.id;
      showToast(`Saved "${snapshot.name}" to your account`);
    } catch (error) {
      console.error("Cloud roster save failed", error);
      const missingTable = /army_lists|relation .* does not exist|schema cache/i.test(error?.message || "");
      window.alert(missingTable ? "Cloud saving is not configured yet. The army_lists table needs to be created in Supabase." : `Could not save this army to your account: ${error?.message || "Unknown error"}`);
    } finally {
      els.saveRosterBtn.disabled = false;
      els.saveRosterBtn.textContent = "Save";
    }
  }

  async function getCloudRosters() {
    if (!currentUser || !window.whrSupabase) return [];
    const { data, error } = await window.whrSupabase.from("army_lists").select("id,name,army_id,faction_id,faction_name,points_limit,total_points,roster_data,visibility,updated_at").eq("owner_id", currentUser.id).order("updated_at", { ascending: false });
    if (error) throw error;
    const rosters = (data || []).map(rowToSnapshot);
    rosterCache.clear();
    rosters.forEach(roster => rosterCache.set(roster.id, clone(roster)));
    return rosters;
  }

  async function openCloudSavedRosters() {
    setSavedDialogHeading("My Armies", "Cloud Armies");
    els.savedRostersList.innerHTML = `<div class="saved-roster-empty">Loading your cloud-saved armies…</div>`;
    els.savedRostersDialog.showModal();
    try { renderCloudSavedRosters(await getCloudRosters()); }
    catch (error) {
      console.error("Could not load cloud rosters", error);
      els.savedRostersList.innerHTML = `<div class="saved-roster-empty"><strong>Could not load your account armies.</strong><div style="margin-top:6px;">${escapeHtml(error?.message || "Unknown error")}</div></div>`;
    }
  }

  function visibilityLabel(roster) {
    return roster.visibility === "shared" ? `<span class="cloud-visibility shared" title="Other signed-in WHR Army Builder users can view this army">Shared</span>` : `<span class="cloud-visibility private" title="Only you can view this army">Private</span>`;
  }

  function renderCloudSavedRosters(rosters) {
    if (!rosters.length) {
      els.savedRostersList.innerHTML = `<div class="saved-roster-empty"><strong>No cloud-saved armies yet.</strong><div style="margin-top:6px;">Use Save in the top bar to save the current army to your WHR Army Builder account.</div></div>`;
      return;
    }
    els.savedRostersList.innerHTML = rosters.map(roster => {
      const when = roster.updatedAt ? new Date(roster.updatedAt).toLocaleString() : "";
      const shared = roster.visibility === "shared";
      return `<article class="saved-roster-card cloud-roster-card"><div><div class="saved-roster-name">${escapeHtml(roster.name || "Unnamed Army")} ${visibilityLabel(roster)}</div><div class="saved-roster-meta">${escapeHtml(roster.factionName || "Unknown Army")} · ${formatPoints(roster.totalPoints || 0)} / ${formatPoints(roster.pointsLimit || 0)} pts${when ? ` · Saved ${escapeHtml(when)}` : ""} · ☁ Cloud saved</div><div class="cloud-visibility-help">${shared ? "Shared armies can be viewed by other signed-in users." : "Private armies are visible only to you."}</div></div><div class="saved-roster-actions"><button class="load-roster-button" type="button" data-cloud-load-roster="${escapeHtml(roster.id)}">Load</button><button class="cloud-visibility-button" type="button" data-cloud-toggle-visibility="${escapeHtml(roster.id)}" data-current-visibility="${shared ? "shared" : "private"}">${shared ? "Make Private" : "Share Army"}</button><button class="delete-roster-button" type="button" data-cloud-delete-roster="${escapeHtml(roster.id)}">Delete</button></div></article>`;
    }).join("");
  }

  async function fetchCloudRoster(id) {
    if (rosterCache.has(id)) return clone(rosterCache.get(id));
    const { data, error } = await window.whrSupabase.from("army_lists").select("id,name,army_id,faction_id,faction_name,points_limit,total_points,roster_data,visibility,updated_at").eq("id", id).eq("owner_id", currentUser.id).single();
    if (error) throw error;
    const roster = rowToSnapshot(data);
    rosterCache.set(id, clone(roster));
    return roster;
  }

  async function getArmyData(army) {
    const key = army.dataFile;
    if (armyDataCache.has(key)) return clone(armyDataCache.get(key));
    const url = `./data/${army.dataFile}`;
    const response = await fetch(url, { cache: "default" });
    if (!response.ok) throw new Error(`Could not load ${url}`);
    const data = await response.json();
    armyDataCache.set(key, clone(data));
    return data;
  }

  async function loadCloudRoster(id) {
    const loadButton = document.querySelector(`[data-cloud-load-roster="${CSS.escape(id)}"]`);
    const originalLabel = loadButton?.textContent || "Load";
    if (loadButton) { loadButton.disabled = true; loadButton.textContent = "Loading…"; }
    try {
      const roster = await fetchCloudRoster(id);
      if (state.roster.length && !window.confirm(`Load "${roster.name}"? Any unsaved changes to the current army will be lost.`)) return;
      const armyId = roster.armyId || roster.factionId || "empire";
      const army = state.armyManifest?.armies?.find(a => a.id === armyId);
      if (!army?.available) { window.alert(`The army data required for "${roster.name}" is not currently available.`); return; }

      state.data = await getArmyData(army);
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
      console.error("Could not load cloud roster", error);
      window.alert(`Could not load this army from your account: ${error?.message || "Unknown error"}`);
    } finally {
      if (loadButton?.isConnected) { loadButton.disabled = false; loadButton.textContent = originalLabel; }
    }
  }

  async function toggleCloudRosterVisibility(id, currentVisibility) {
    if (!currentUser || !window.whrSupabase) return;
    const nextVisibility = currentVisibility === "shared" ? "private" : "shared";
    const { error } = await window.whrSupabase.from("army_lists").update({ visibility: nextVisibility, updated_at: new Date().toISOString() }).eq("id", id).eq("owner_id", currentUser.id);
    if (error) { console.error("Could not update army visibility", error); window.alert(`Could not change army visibility: ${error.message}`); return; }
    rosterCache.delete(id);
    showToast(nextVisibility === "shared" ? "Army is now shared with other users" : "Army is now private");
    await openCloudSavedRosters();
  }

  async function deleteCloudRoster(id) {
    let roster;
    try { roster = await fetchCloudRoster(id); }
    catch (error) { window.alert(`Could not find this saved army: ${error?.message || "Unknown error"}`); return; }
    if (!window.confirm(`Delete the cloud-saved roster "${roster.name}"?`)) return;
    const { error } = await window.whrSupabase.from("army_lists").delete().eq("id", id).eq("owner_id", currentUser.id);
    if (error) { window.alert(`Could not delete this army: ${error.message}`); return; }
    rosterCache.delete(id);
    if (state.currentSaveId === id) state.currentSaveId = null;
    showToast(`Deleted "${roster.name}" from your account`);
    await openCloudSavedRosters();
  }

  function interceptCloudActions(event) {
    if (!currentUser) return;
    const saveButton = event.target.closest?.("#saveRosterBtn");
    if (saveButton) { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); saveCloudRoster(); return; }
    const savedButton = event.target.closest?.("#savedRostersBtn");
    if (savedButton) { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); openCloudSavedRosters(); return; }
    const loadButton = event.target.closest?.("[data-cloud-load-roster]");
    if (loadButton) { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); loadCloudRoster(loadButton.dataset.cloudLoadRoster); return; }
    const visibilityButton = event.target.closest?.("[data-cloud-toggle-visibility]");
    if (visibilityButton) { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); toggleCloudRosterVisibility(visibilityButton.dataset.cloudToggleVisibility, visibilityButton.dataset.currentVisibility); return; }
    const deleteButton = event.target.closest?.("[data-cloud-delete-roster]");
    if (deleteButton) { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); deleteCloudRoster(deleteButton.dataset.cloudDeleteRoster); }
  }

  function installCloudStyles() {
    if (document.getElementById("whrCloudSaveStyles")) return;
    const style = document.createElement("style");
    style.id = "whrCloudSaveStyles";
    style.textContent = `.cloud-visibility{display:inline-block;margin-left:7px;padding:2px 7px;border-radius:999px;font-size:10px;line-height:1.4;font-weight:900;letter-spacing:.04em;text-transform:uppercase;vertical-align:middle}.cloud-visibility.private{background:#eceff3;color:#444;border:1px solid #cfd5dc}.cloud-visibility.shared{background:#e8f6ec;color:#216b35;border:1px solid #a8d6b4}.cloud-visibility-help{margin-top:5px;color:#69727d;font-size:11px}.cloud-visibility-button{min-height:32px;padding:6px 10px;border:1px solid #9aa6b2;border-radius:5px;background:#fff;color:#26323d;font-weight:750;cursor:pointer}.cloud-visibility-button:hover{background:#f1f4f6}`;
    document.head.appendChild(style);
  }

  async function initialiseCloudSaves() {
    if (initialised || !window.whrSupabase) return;
    initialised = true;
    installCloudStyles();
    await refreshCurrentUser();
    window.whrSupabase.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      if (!currentUser) { state.currentSaveId = null; rosterCache.clear(); }
      updateCloudUi();
    });
    document.addEventListener("click", interceptCloudActions, true);
    window.whrCloudSaves = { save: saveCloudRoster, list: getCloudRosters, load: loadCloudRoster, delete: deleteCloudRoster, setVisibility: toggleCloudRosterVisibility, currentUser: () => currentUser };
  }

  if (window.whrSupabase) initialiseCloudSaves();
  else {
    let attempts = 0;
    const wait = window.setInterval(() => {
      attempts += 1;
      if (window.whrSupabase) { window.clearInterval(wait); initialiseCloudSaves(); }
      else if (attempts > 100) window.clearInterval(wait);
    }, 100);
  }
})();
;
/* ===== END dev_cloud_saves.js ===== */

/* ===== BEGIN dev_landing_armies.js ===== */
(() => {
  let currentUser = null;
  let initialised = false;

  function installStyles() {
    if (document.getElementById("whrLandingArmiesStyles")) return;
    const style = document.createElement("style");
    style.id = "whrLandingArmiesStyles";
    style.textContent = `
      .landing-armies-panel {
        margin: 0 0 28px;
        padding: 20px 22px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 22px;
        border: 1px solid #d8dee5;
        border-left: 5px solid #7b211b;
        border-radius: 10px;
        background: #fff;
        box-shadow: 0 5px 18px rgba(0,0,0,.06);
      }
      .landing-armies-copy { min-width: 0; }
      .landing-armies-copy .eyebrow { margin-bottom: 4px; }
      .landing-armies-copy h2 { margin: 0 0 7px; }
      .landing-armies-copy p:last-child { margin-bottom: 0; color: #616a73; }
      .landing-armies-actions { display: flex; gap: 9px; flex-wrap: wrap; flex: 0 0 auto; }
      .landing-armies-button {
        min-height: 42px;
        padding: 9px 15px;
        border: 1px solid #7b211b;
        border-radius: 6px;
        background: #7b211b;
        color: #fff;
        font: inherit;
        font-weight: 850;
        cursor: pointer;
      }
      .landing-armies-button:hover { background: #651a16; }
      .landing-armies-button.secondary {
        border-color: #aab3bd;
        background: #fff;
        color: #28323c;
      }
      .landing-armies-button.secondary:hover { background: #f4f6f8; }
      .landing-account-state {
        display: inline-block;
        margin-left: 7px;
        padding: 2px 7px;
        border-radius: 999px;
        background: #e8f6ec;
        color: #216b35;
        border: 1px solid #a8d6b4;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .04em;
        text-transform: uppercase;
        vertical-align: middle;
      }
      @media (max-width: 700px) {
        .landing-armies-panel { align-items: stretch; flex-direction: column; }
        .landing-armies-actions { width: 100%; }
        .landing-armies-button { flex: 1 1 auto; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureDialogAvailableEverywhere() {
    const dialog = document.getElementById("savedRostersDialog");
    if (dialog && dialog.parentElement !== document.body) {
      document.body.appendChild(dialog);
    }
  }

  function buildPanel() {
    if (document.getElementById("landingArmiesPanel")) return document.getElementById("landingArmiesPanel");
    const selectionContent = document.querySelector("#armySelectionScreen .selection-content");
    if (!selectionContent) return null;

    const panel = document.createElement("section");
    panel.id = "landingArmiesPanel";
    panel.className = "landing-armies-panel";
    panel.setAttribute("aria-labelledby", "landingArmiesTitle");
    panel.innerHTML = `
      <div class="landing-armies-copy">
        <p class="eyebrow">Your Account</p>
        <h2 id="landingArmiesTitle">My Armies</h2>
        <p id="landingArmiesDescription">Sign in to load and manage armies saved to your WHR Army Builder account.</p>
      </div>
      <div class="landing-armies-actions">
        <button id="landingMyArmiesBtn" class="landing-armies-button" type="button">My Armies</button>
        <button id="landingSignInBtn" class="landing-armies-button secondary" type="button">Sign in / Create account</button>
      </div>
    `;

    selectionContent.prepend(panel);

    panel.querySelector("#landingMyArmiesBtn").addEventListener("click", () => {
      if (!currentUser) {
        document.getElementById("devSignInBtn")?.click();
        return;
      }
      // Re-use the cloud-save layer's existing action path so the landing page
      // and in-builder My Armies view always behave identically.
      document.getElementById("savedRostersBtn")?.click();
    });

    panel.querySelector("#landingSignInBtn").addEventListener("click", () => {
      document.getElementById("devSignInBtn")?.click();
    });

    return panel;
  }

  function renderPanel() {
    const panel = buildPanel();
    if (!panel) return;
    const description = panel.querySelector("#landingArmiesDescription");
    const myArmies = panel.querySelector("#landingMyArmiesBtn");
    const signIn = panel.querySelector("#landingSignInBtn");

    if (currentUser) {
      const email = currentUser.email || "your account";
      description.innerHTML = `Signed in as <strong></strong><span class="landing-account-state">Cloud enabled</span>. Load, share, make private or delete your saved armies here.`;
      description.querySelector("strong").textContent = email;
      myArmies.textContent = "☁ My Armies";
      signIn.hidden = true;
    } else {
      description.textContent = "Sign in to load and manage armies saved to your WHR Army Builder account. You can still build armies without an account.";
      myArmies.textContent = "Sign in to view My Armies";
      signIn.hidden = true;
    }
  }

  async function refreshUser() {
    if (!window.whrSupabase) {
      currentUser = null;
      renderPanel();
      return;
    }
    const { data } = await window.whrSupabase.auth.getUser();
    currentUser = data?.user || null;
    renderPanel();
  }

  async function initialise() {
    if (initialised) return;
    initialised = true;
    installStyles();
    ensureDialogAvailableEverywhere();
    buildPanel();
    await refreshUser();

    window.whrSupabase?.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      renderPanel();
    });
  }

  if (window.whrSupabase) initialise();
  else {
    let attempts = 0;
    const wait = window.setInterval(() => {
      attempts += 1;
      if (window.whrSupabase) {
        window.clearInterval(wait);
        initialise();
      } else if (attempts > 100) {
        window.clearInterval(wait);
      }
    }, 100);
  }
})();
;
/* ===== END dev_landing_armies.js ===== */

/* ===== BEGIN dev_privacy_account.js ===== */
(() => {
  let currentUser = null;

  function safeName(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function addPrivacyLinks() {
    if (document.getElementById("devPrivacyLinks")) return;
    const bar = document.querySelector(".dev-account-bar");
    if (!bar) return;
    const wrap = document.createElement("span");
    wrap.id = "devPrivacyLinks";
    wrap.style.cssText = "display:inline-flex;gap:10px;align-items:center;margin-right:auto";
    wrap.innerHTML = `<a href="privacy.html" style="color:inherit;font-weight:700">Privacy</a><button id="devAccountSettingsBtn" type="button" class="dev-auth-button dev-auth-button-secondary" hidden>Account settings</button>`;
    bar.prepend(wrap);
  }

  function addSignupFields() {
    const form = document.getElementById("devAuthForm");
    const emailLabel = document.getElementById("devAuthEmail")?.closest("label");
    if (!form || !emailLabel || document.getElementById("devDisplayNameField")) return;
    const label = document.createElement("label");
    label.id = "devDisplayNameField";
    label.className = "dev-auth-field";
    label.hidden = true;
    label.innerHTML = `Display name <input id="devAuthDisplayName" type="text" minlength="3" maxlength="30" autocomplete="nickname"><small style="display:block;margin-top:4px;font-weight:400">Shown to other users instead of your email address.</small>`;
    emailLabel.before(label);

    const actions = form.querySelector(".dev-auth-actions");
    const notice = document.createElement("p");
    notice.id = "devSignupPrivacyNotice";
    notice.hidden = true;
    notice.style.cssText = "font-size:12px;line-height:1.45";
    notice.innerHTML = `By creating an account, you request the WHR Army Builder account service and acknowledge the <a href="privacy.html" target="_blank" rel="noopener">Privacy Notice</a>.`;
    actions.before(notice);
  }

  function syncSignupMode() {
    const title = document.getElementById("devAuthTitle");
    const field = document.getElementById("devDisplayNameField");
    const input = document.getElementById("devAuthDisplayName");
    const notice = document.getElementById("devSignupPrivacyNotice");
    const signup = title?.textContent === "Create account";
    if (field) field.hidden = !signup;
    if (input) input.required = signup;
    if (notice) notice.hidden = !signup;
  }

  async function ensureProfile(user) {
    if (!user || !window.whrSupabase) return;
    const { data } = await window.whrSupabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
    if (data?.display_name) return data.display_name;
    const metadataName = safeName(user.user_metadata?.display_name);
    if (!metadataName) return null;
    const { error } = await window.whrSupabase.from("profiles").upsert({ id: user.id, display_name: metadataName, updated_at: new Date().toISOString() });
    if (error) console.warn("Could not create profile yet", error);
    return metadataName;
  }

  function buildSettingsDialog() {
    if (document.getElementById("devAccountSettingsDialog")) return;
    const dialog = document.createElement("dialog");
    dialog.id = "devAccountSettingsDialog";
    dialog.className = "dev-auth-dialog";
    dialog.innerHTML = `<form class="dev-auth-card" method="dialog"><h2>Account settings</h2><p class="dev-auth-intro">Manage the public name associated with your account and your privacy choices.</p><label class="dev-auth-field">Display name<input id="devSettingsDisplayName" type="text" minlength="3" maxlength="30" required></label><div id="devSettingsMessage" class="dev-auth-message" aria-live="polite"></div><p><a href="privacy.html" target="_blank" rel="noopener">Read the Privacy Notice</a></p><div class="dev-auth-actions"><button id="devSettingsClose" class="dev-auth-button dev-auth-button-secondary" type="button">Close</button><button id="devSettingsSave" class="dev-auth-button" type="button">Save display name</button></div><hr style="margin:22px 0"><h3>Delete account</h3><p>This permanently deletes your WHR Army Builder application data. For security, deletion of the Supabase authentication identity itself requires a server-side/admin action; until that endpoint is added, this button signs you out after deleting your application data and gives you instructions to request final auth-account deletion.</p><button id="devDeleteAccountBtn" class="dev-auth-button" type="button" style="background:#7b211b">Delete my application data</button></form>`;
    document.body.appendChild(dialog);

    dialog.querySelector("#devSettingsClose").onclick = () => dialog.close();
    dialog.querySelector("#devSettingsSave").onclick = async () => {
      const name = safeName(dialog.querySelector("#devSettingsDisplayName").value);
      const msg = dialog.querySelector("#devSettingsMessage");
      if (name.length < 3 || name.length > 30) { msg.textContent = "Display name must be 3–30 characters."; return; }
      const { error } = await window.whrSupabase.from("profiles").upsert({ id: currentUser.id, display_name: name, updated_at: new Date().toISOString() });
      if (error) { msg.textContent = error.code === "23505" ? "That display name is already in use." : error.message; return; }
      await window.whrSupabase.auth.updateUser({ data: { display_name: name } });
      msg.textContent = "Display name saved."; msg.classList.add("success");
    };
    dialog.querySelector("#devDeleteAccountBtn").onclick = async () => {
      if (!currentUser) return;
      if (!confirm("Delete all WHR Army Builder cloud armies and profile data for this account? This cannot be undone.")) return;
      const uid = currentUser.id;
      const armies = await window.whrSupabase.from("army_lists").delete().eq("owner_id", uid);
      if (armies.error) { alert(`Could not delete armies: ${armies.error.message}`); return; }
      const profile = await window.whrSupabase.from("profiles").delete().eq("id", uid);
      if (profile.error) { alert(`Could not delete profile: ${profile.error.message}`); return; }
      await window.whrSupabase.auth.signOut();
      dialog.close();
      alert("Your WHR Army Builder application data has been deleted and you have been signed out. During development, contact the project owner if you also want the underlying authentication identity removed immediately.");
    };
  }

  async function openSettings() {
    if (!currentUser) return;
    buildSettingsDialog();
    const dialog = document.getElementById("devAccountSettingsDialog");
    const { data } = await window.whrSupabase.from("profiles").select("display_name").eq("id", currentUser.id).maybeSingle();
    dialog.querySelector("#devSettingsDisplayName").value = data?.display_name || currentUser.user_metadata?.display_name || "";
    dialog.querySelector("#devSettingsMessage").textContent = "";
    dialog.showModal();
  }

  async function init() {
    if (!window.whrSupabase) return;
    addPrivacyLinks(); addSignupFields(); buildSettingsDialog();
    const title = document.getElementById("devAuthTitle");
    if (title) new MutationObserver(syncSignupMode).observe(title, { childList: true, characterData: true, subtree: true });
    syncSignupMode();

    // Capture signup before the original handler so the chosen public name is
    // included in auth metadata. The existing auth handler still performs signup.
    document.getElementById("devAuthForm")?.addEventListener("submit", async () => {
      if (document.getElementById("devAuthTitle")?.textContent !== "Create account") return;
      const name = safeName(document.getElementById("devAuthDisplayName")?.value);
      if (name) sessionStorage.setItem("whrPendingDisplayName", name);
    }, true);

    document.getElementById("devAccountSettingsBtn")?.addEventListener("click", openSettings);

    const applyUser = async user => {
      currentUser = user || null;
      const settings = document.getElementById("devAccountSettingsBtn");
      if (settings) settings.hidden = !currentUser;
      if (!currentUser) return;
      const pending = sessionStorage.getItem("whrPendingDisplayName");
      if (pending && !currentUser.user_metadata?.display_name) {
        await window.whrSupabase.auth.updateUser({ data: { display_name: pending } });
        currentUser.user_metadata = { ...(currentUser.user_metadata || {}), display_name: pending };
        sessionStorage.removeItem("whrPendingDisplayName");
      }
      await ensureProfile(currentUser);
    };

    const { data } = await window.whrSupabase.auth.getUser();
    await applyUser(data?.user);
    window.whrSupabase.auth.onAuthStateChange((_event, session) => { setTimeout(() => applyUser(session?.user), 0); });
  }

  let attempts = 0;
  const wait = setInterval(() => {
    attempts++;
    if (window.whrSupabase) { clearInterval(wait); init(); }
    else if (attempts > 100) clearInterval(wait);
  }, 100);
})();
;
/* ===== END dev_privacy_account.js ===== */

/* ===== BEGIN dev_retention.js ===== */
(() => {
  let lastTouch = 0;

  async function markActive() {
    if (!window.whrSupabase) return;
    const now = Date.now();
    // Avoid unnecessary writes when multiple auth events fire during page load.
    if (now - lastTouch < 60_000) return;
    lastTouch = now;
    const { error } = await window.whrSupabase.rpc("mark_current_user_active");
    if (error && !/mark_current_user_active/i.test(error.message || "")) {
      console.warn("Could not update account activity", error);
    }
  }

  async function updateSettingsRetentionInfo() {
    const dialog = document.getElementById("devAccountSettingsDialog");
    if (!dialog || dialog.querySelector("#devRetentionInfo")) return;
    const info = document.createElement("div");
    info.id = "devRetentionInfo";
    info.style.cssText = "margin:16px 0;padding:12px 14px;background:#f7f2e7;border-left:4px solid #c99c3c;font-size:12px;line-height:1.5";
    info.innerHTML = `<strong>Inactive-account retention</strong><br>To avoid retaining account data indefinitely, accounts that have not been used for 18 months are scheduled for deletion. We will send a warning first and give you 30 days to sign in. Signing in cancels the pending deletion.`;
    const privacyLink = [...dialog.querySelectorAll("p")].find(p => p.querySelector('a[href="privacy.html"]'));
    if (privacyLink) privacyLink.after(info);
  }

  async function init() {
    if (!window.whrSupabase) return;
    const { data } = await window.whrSupabase.auth.getSession();
    if (data?.session?.user) await markActive();

    window.whrSupabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        setTimeout(markActive, 0);
      }
    });

    const settingsButton = document.getElementById("devAccountSettingsBtn");
    settingsButton?.addEventListener("click", () => setTimeout(updateSettingsRetentionInfo, 0));
  }

  let attempts = 0;
  const wait = setInterval(() => {
    attempts++;
    if (window.whrSupabase) { clearInterval(wait); init(); }
    else if (attempts > 100) clearInterval(wait);
  }, 100);
})();
;
/* ===== END dev_retention.js ===== */

/* ===== BEGIN dev_shared_armies.js ===== */
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
;
/* ===== END dev_shared_armies.js ===== */
