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
        <p id="devAuthIntro" class="dev-auth-intro">Sign in to access your account. Cloud army storage and sharing will be added next.</p>
        <label class="dev-auth-field">Email address
          <input id="devAuthEmail" type="email" autocomplete="email" required>
        </label>
        <label class="dev-auth-field">Password
          <input id="devAuthPassword" type="password" autocomplete="current-password" minlength="8" required>
        </label>
        <div id="devAuthMessage" class="dev-auth-message" aria-live="polite"></div>
        <div class="dev-auth-actions">
          <button id="devAuthCancel" class="dev-auth-button dev-auth-button-secondary" type="button">Cancel</button>
          <button id="devAuthSubmit" class="dev-auth-button" type="submit">Sign in</button>
        </div>
        <p class="dev-auth-switch"><span id="devAuthSwitchText">Don't have an account?</span> <button id="devAuthSwitch" type="button">Create one</button></p>
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
      email: dialog.querySelector("#devAuthEmail"),
      password: dialog.querySelector("#devAuthPassword"),
      message: dialog.querySelector("#devAuthMessage"),
      cancel: dialog.querySelector("#devAuthCancel"),
      submit: dialog.querySelector("#devAuthSubmit"),
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
      ui.title.textContent = signingUp ? "Create account" : "Sign in";
      ui.intro.textContent = signingUp
        ? "Create a free WHR Army Builder account. Your account will later hold cloud-saved and shared armies."
        : "Sign in to access your account. Cloud army storage and sharing will be added next.";
      ui.submit.textContent = signingUp ? "Create account" : "Sign in";
      ui.switchText.textContent = signingUp ? "Already have an account?" : "Don't have an account?";
      ui.switchButton.textContent = signingUp ? "Sign in" : "Create one";
      ui.password.autocomplete = signingUp ? "new-password" : "current-password";
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

      const { data } = await client.auth.getSession();
      renderSession(data?.session || null);

      client.auth.onAuthStateChange((_event, session) => {
        renderSession(session);
      });
    } catch (error) {
      ui.status.textContent = "Account service unavailable";
      ui.signIn.disabled = true;
      console.error("WHR auth initialisation failed", error);
      return;
    }

    ui.signIn.addEventListener("click", () => {
      setMode("signin");
      ui.form.reset();
      ui.dialog.showModal();
      ui.email.focus();
    });

    ui.cancel.addEventListener("click", () => ui.dialog.close());

    ui.switchButton.addEventListener("click", () => {
      setMode(mode === "signin" ? "signup" : "signin");
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
      setMessage();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
