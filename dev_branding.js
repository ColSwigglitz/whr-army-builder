// Development branding layer for the new Warhammer Renaissance Army Builder identity.
(() => {
  const FULL_LOGO = "assets/branding/whr-logo-full.webp";
  const EMBLEM = "assets/branding/whr-emblem.webp";
  const FAVICON = "assets/branding/icons/favicon.ico";
  const ICON_32 = "assets/branding/icons/favicon-32.png";

  function ensureFavicon() {
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.href = FAVICON;

    let png = document.querySelector('link[rel="icon"][type="image/png"]');
    if (!png) {
      png = document.createElement("link");
      png.rel = "icon";
      png.type = "image/png";
      png.sizes = "32x32";
      document.head.appendChild(png);
    }
    png.href = ICON_32;
  }

  function applyPageBranding() {
    const selectionMark = document.querySelector(".selection-mark");
    if (selectionMark && !selectionMark.querySelector("img")) {
      selectionMark.innerHTML = `<img src="${FULL_LOGO}" alt="Warhammer Renaissance Army Builder">`;
      selectionMark.classList.add("whr-full-logo-mark");
    }

    const heroKicker = document.querySelector(".selection-hero .selection-kicker");
    const heroTitle = document.querySelector(".selection-hero > h1");
    if (heroKicker) heroKicker.classList.add("whr-branding-hidden");
    if (heroTitle) heroTitle.classList.add("whr-branding-hidden");

    const brandMark = document.querySelector(".brand-mark");
    if (brandMark && !brandMark.querySelector("img")) {
      brandMark.innerHTML = `<img src="${EMBLEM}" alt="" aria-hidden="true">`;
      brandMark.classList.add("whr-emblem-mark");
    }
  }

  const style = document.createElement("style");
  style.textContent = `
    .whr-branding-hidden {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0,0,0,0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }

    .selection-mark.whr-full-logo-mark {
      width: min(560px, 82vw) !important;
      height: auto !important;
      padding: 0 !important;
      margin: 0 auto 18px !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      display: block !important;
    }

    .selection-mark.whr-full-logo-mark img {
      display: block;
      width: 100%;
      height: auto;
      object-fit: contain;
    }

    .brand-mark.whr-emblem-mark {
      width: 52px !important;
      height: 52px !important;
      min-width: 52px !important;
      padding: 0 !important;
      overflow: hidden;
      border: 0 !important;
      background: #050505 !important;
      display: flex !important;
      align-items: center;
      justify-content: center;
    }

    .brand-mark.whr-emblem-mark img {
      width: 44px;
      height: 44px;
      object-fit: contain;
      display: block;
    }

    @media (max-width: 640px) {
      .selection-mark.whr-full-logo-mark {
        width: min(430px, 90vw) !important;
        margin-bottom: 12px !important;
      }
      .brand-mark.whr-emblem-mark {
        width: 44px !important;
        height: 44px !important;
        min-width: 44px !important;
      }
      .brand-mark.whr-emblem-mark img {
        width: 38px;
        height: 38px;
      }
    }
  `;
  document.head.appendChild(style);

  ensureFavicon();
  applyPageBranding();

  // Re-apply after UI renders that replace landing/header content.
  const observer = new MutationObserver(() => applyPageBranding());
  observer.observe(document.body, { childList: true, subtree: true });

  // The Roster Pad opens in a new window. Decorate that window after its HTML is written.
  const nativeOpen = window.open.bind(window);
  window.open = function(...args) {
    const win = nativeOpen(...args);
    if (!win) return win;

    let attempts = 0;
    const decorate = () => {
      attempts += 1;
      try {
        const doc = win.document;
        const header = doc?.querySelector?.(".sheet-header");
        if (header && !header.querySelector(".whr-roster-logo")) {
          const title = header.querySelector(".sheet-title");
          if (title) {
            const wrapper = doc.createElement("div");
            wrapper.className = "whr-roster-brand";
            wrapper.innerHTML = `<img class="whr-roster-logo" src="${new URL(EMBLEM, window.location.href).href}" alt="Warhammer Renaissance"><span>WARHAMMER ROSTER SHEET</span>`;
            title.replaceWith(wrapper);

            const printStyle = doc.createElement("style");
            printStyle.textContent = `
              .whr-roster-brand { display:flex; align-items:center; gap:8mm; font-family:Georgia,\"Times New Roman\",serif; font-size:20pt; font-weight:900; letter-spacing:-.02em; }
              .whr-roster-logo { width:20mm; height:20mm; object-fit:contain; background:#000; }
              @media print { .whr-roster-logo { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
            `;
            doc.head.appendChild(printStyle);
          }
          return;
        }
      } catch (error) {
        // Cross-origin windows are ignored; the Roster Pad is same-origin/about:blank.
      }
      if (attempts < 20 && !win.closed) setTimeout(decorate, 50);
    };
    setTimeout(decorate, 0);
    return win;
  };
})();
