(() => {
  const STYLE_ID = "whrAutoModalCloseStyles";
  const BUTTON_CLASS = "whr-auto-modal-close";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      dialog { position: relative; }
      .${BUTTON_CLASS} {
        position: absolute;
        top: 14px;
        right: 14px;
        z-index: 20;
        width: 36px;
        height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        color: #5e554a;
        background: #fffdf8;
        border: 1px solid #d8cfbf;
        border-radius: 50%;
        font: 400 24px/1 Arial, Helvetica, sans-serif;
        cursor: pointer;
      }
      .${BUTTON_CLASS}:hover {
        color: #7b211b;
        background: #f5eee4;
        border-color: #bcae9a;
      }
      .${BUTTON_CLASS}:focus-visible {
        outline: 3px solid rgba(176,138,59,.25);
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  function hasExistingClose(dialog) {
    const buttons = [...dialog.querySelectorAll("button")];
    return buttons.some(button => {
      const aria = (button.getAttribute("aria-label") || "").trim().toLowerCase();
      const title = (button.getAttribute("title") || "").trim().toLowerCase();
      const text = (button.textContent || "").trim().toLowerCase();
      return aria.includes("close") || title.includes("close") || ["×", "✕", "✖", "x"].includes(text);
    });
  }

  function enhanceDialog(dialog) {
    if (!(dialog instanceof HTMLDialogElement)) return;
    if (dialog.dataset.whrAutoCloseProcessed === "1") return;
    dialog.dataset.whrAutoCloseProcessed = "1";

    if (dialog.hasAttribute("data-no-auto-close") || hasExistingClose(dialog)) return;

    const close = document.createElement("button");
    close.type = "button";
    close.className = BUTTON_CLASS;
    close.setAttribute("aria-label", "Close dialog");
    close.setAttribute("title", "Close");
    close.textContent = "×";
    close.addEventListener("click", () => dialog.close());
    dialog.prepend(close);
  }

  function scan(root = document) {
    if (root instanceof HTMLDialogElement) enhanceDialog(root);
    root.querySelectorAll?.("dialog").forEach(enhanceDialog);
  }

  ensureStyles();
  scan();

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node instanceof Element) scan(node);
      });
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
