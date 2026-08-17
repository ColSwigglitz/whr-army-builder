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
