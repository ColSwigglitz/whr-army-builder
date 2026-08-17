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
