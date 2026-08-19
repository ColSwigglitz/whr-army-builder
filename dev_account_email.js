(() => {
  function normaliseEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function ensureEmailControls() {
    const dialog = document.getElementById("devAccountSettingsDialog");
    if (!dialog || dialog.dataset.whrEmailControls === "1") return;
    dialog.dataset.whrEmailControls = "1";

    const form = dialog.querySelector("form");
    const displayNameField = dialog.querySelector("#devSettingsDisplayName")?.closest("label");
    if (!form || !displayNameField) return;

    const wrap = document.createElement("div");
    wrap.id = "devSettingsEmailSection";
    wrap.innerHTML = `
      <hr style="margin:22px 0">
      <h3>Email address</h3>
      <p class="dev-auth-intro">Change the email address used to sign in to WHR Army Builder. You will need to confirm the new address before the change is completed.</p>
      <label class="dev-auth-field">Current email address
        <input id="devSettingsCurrentEmail" type="email" readonly>
      </label>
      <label class="dev-auth-field">New email address
        <input id="devSettingsNewEmail" type="email" autocomplete="email">
      </label>
      <div id="devSettingsEmailMessage" class="dev-auth-message" aria-live="polite"></div>
      <div class="dev-auth-actions">
        <button id="devSettingsEmailSave" class="dev-auth-button" type="button">Change email address</button>
      </div>
    `;

    const privacyLink = [...form.querySelectorAll("p")].find(p => p.querySelector('a[href="privacy.html"]'));
    (privacyLink || displayNameField).after(wrap);

    wrap.querySelector("#devSettingsEmailSave").addEventListener("click", async () => {
      const message = wrap.querySelector("#devSettingsEmailMessage");
      const current = normaliseEmail(wrap.querySelector("#devSettingsCurrentEmail").value);
      const next = normaliseEmail(wrap.querySelector("#devSettingsNewEmail").value);
      message.textContent = "";
      message.classList.remove("success");

      if (!next) {
        message.textContent = "Enter a new email address.";
        return;
      }
      if (next === current) {
        message.textContent = "That is already the email address on this account.";
        return;
      }

      const button = wrap.querySelector("#devSettingsEmailSave");
      button.disabled = true;
      try {
        const { error } = await window.whrSupabase.auth.updateUser({ email: next });
        if (error) throw error;
        message.textContent = "Confirmation email sent. Follow the link in the email to complete the change.";
        message.classList.add("success");
        wrap.querySelector("#devSettingsNewEmail").value = "";
      } catch (error) {
        message.textContent = error?.message || "Unable to change email address.";
      } finally {
        button.disabled = false;
      }
    });
  }

  async function populateEmail() {
    ensureEmailControls();
    const input = document.getElementById("devSettingsCurrentEmail");
    if (!input || !window.whrSupabase) return;
    const { data } = await window.whrSupabase.auth.getUser();
    input.value = data?.user?.email || "";
  }

  function init() {
    ensureEmailControls();

    const settingsButton = document.getElementById("devAccountSettingsBtn");
    if (settingsButton) settingsButton.addEventListener("click", () => setTimeout(populateEmail, 0));

    const observer = new MutationObserver(() => ensureEmailControls());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
