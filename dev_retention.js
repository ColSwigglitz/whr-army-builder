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
