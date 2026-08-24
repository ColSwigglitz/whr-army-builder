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