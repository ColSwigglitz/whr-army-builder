(() => {
  const terrainSequence = ["lowland","lowland","highland","lowland","river","lowland","coast","sea"];
  const terrainNames = { lowland:"Lowlands", highland:"Highlands", river:"River Valley", coast:"Coastal", sea:"Sea", unexplored:"Unexplored" };

  const state = { selected:null, scale:0.88, x:0, y:0, dragging:false, dragStart:null, generated:false };

  function injectEntry() {
    const content = document.querySelector("#armySelectionScreen .selection-content");
    if (!content || document.getElementById("mightyEmpiresCard")) return;
    const section = document.createElement("section");
    section.className = "campaign-entry";
    section.innerHTML = `
      <div class="campaign-entry-header">
        <div><p class="eyebrow">Campaigns</p><h2>Campaign Types</h2></div>
        <p>Run a persistent map campaign alongside your WHR armies.</p>
      </div>
      <button id="mightyEmpiresCard" class="campaign-card" type="button">
        <span class="campaign-card-mark" aria-hidden="true">⬡</span>
        <span><h3>Mighty Empires</h3><p>Explore, conquer and defend a persistent hex-based fantasy realm.</p></span>
        <span class="campaign-card-action">Open Campaign →</span>
      </button>`;
    const armyCards = document.getElementById("armyCards");
    armyCards?.parentNode?.insertBefore(section, armyCards.nextSibling);
    document.getElementById("mightyEmpiresCard")?.addEventListener("click", openCampaign);
  }

  function injectScreen() {
    if (document.getElementById("mightyEmpiresScreen")) return;
    const screen = document.createElement("section");
    screen.id = "mightyEmpiresScreen";
    screen.className = "campaign-screen";
    screen.hidden = true;
    screen.innerHTML = `
      <header class="campaign-header">
        <div class="campaign-brand">
          <button id="campaignBackBtn" class="campaign-button" type="button" aria-label="Back to army selection">←</button>
          <div><h1>Mighty Empires</h1><p>WHR Campaign Prototype</p></div>
        </div>
        <div class="campaign-header-actions">
          <button id="campaignRegenerateBtn" class="campaign-button" type="button">Generate New Map</button>
          <button id="campaignRevealBtn" class="campaign-button" type="button">Reveal / Hide Hexes</button>
        </div>
      </header>
      <div class="campaign-layout">
        <div id="campaignMapShell" class="campaign-map-shell" aria-label="Mighty Empires campaign map">
          <div id="campaignMap" class="campaign-map"></div>
          <div class="campaign-map-controls">
            <button id="campaignZoomIn" type="button" aria-label="Zoom in">+</button>
            <button id="campaignZoomOut" type="button" aria-label="Zoom out">−</button>
            <button id="campaignResetView" type="button" aria-label="Reset view">⌂</button>
          </div>
        </div>
        <aside class="campaign-sidebar">
          <p class="eyebrow">Selected Hex</p>
          <div id="campaignHexDetails" class="campaign-empty">Select a hex to inspect its campaign data.</div>
          <div class="campaign-tip">Prototype controls: drag the map to pan, use the mouse wheel or +/- buttons to zoom, and click a hex to inspect it. Terrain is provisional CSS artwork while we build the proper tile library.</div>
        </aside>
      </div>`;
    document.body.appendChild(screen);
    wireScreen();
  }

  function generateMap() {
    const map = document.getElementById("campaignMap");
    if (!map) return;
    map.innerHTML = "";
    state.selected = null;
    const cols = 9, rows = 9, w = 92, h = 106, xStep = w * 0.75, yStep = h;
    for (let q = 0; q < cols; q++) {
      for (let r = 0; r < rows; r++) {
        if ((q === 0 || q === cols - 1) && (r < 1 || r > rows - 2)) continue;
        const edge = q >= 7;
        let terrain = edge ? (q === 8 ? "sea" : "coast") : terrainSequence[(q * 5 + r * 3 + (q+r)%4) % 6];
        if (q === 6 && (r === 2 || r === 3 || r === 4)) terrain = "river";
        if (q >= 7 && r === 4) terrain = "coast";
        const explored = Math.abs(q - 4) <= 1 && Math.abs(r - 4) <= 1;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `campaign-hex ${explored ? terrain : "unexplored"}`;
        button.dataset.q = q;
        button.dataset.r = r;
        button.dataset.terrain = terrain;
        button.dataset.explored = explored ? "true" : "false";
        button.dataset.owner = (q === 4 && r === 4) ? "Player Realm" : "Unclaimed";
        button.dataset.feature = (q === 4 && r === 4) ? "Capital" : ((q+r)%11===0 ? "Village" : "None");
        button.style.left = `${q * xStep}px`;
        button.style.top = `${r * yStep + (q % 2 ? h / 2 : 0)}px`;
        button.innerHTML = `<span class="hex-label">${q},${r}</span>`;
        button.addEventListener("click", e => { e.stopPropagation(); selectHex(button); });
        map.appendChild(button);
      }
    }
    state.generated = true;
    resetView();
    renderDetails(null);
  }

  function selectHex(hex) {
    document.querySelectorAll(".campaign-hex.selected").forEach(el => el.classList.remove("selected"));
    hex.classList.add("selected");
    state.selected = hex;
    renderDetails(hex);
  }

  function renderDetails(hex) {
    const details = document.getElementById("campaignHexDetails");
    if (!details) return;
    if (!hex) { details.className = "campaign-empty"; details.textContent = "Select a hex to inspect its campaign data."; return; }
    const explored = hex.dataset.explored === "true";
    details.className = "";
    details.innerHTML = `
      <h2>Hex ${hex.dataset.q}, ${hex.dataset.r}</h2>
      <dl>
        <dt>Status</dt><dd>${explored ? "Explored" : "Unknown"}</dd>
        <dt>Terrain</dt><dd>${explored ? terrainNames[hex.dataset.terrain] : "Unknown"}</dd>
        <dt>Feature</dt><dd>${explored ? hex.dataset.feature : "Unknown"}</dd>
        <dt>Owner</dt><dd>${explored ? hex.dataset.owner : "Unknown"}</dd>
      </dl>
      ${explored ? "" : `<button id="campaignScoutBtn" class="campaign-button" type="button">Scout Hex</button>`}`;
    document.getElementById("campaignScoutBtn")?.addEventListener("click", () => scoutHex(hex));
  }

  function scoutHex(hex) {
    hex.dataset.explored = "true";
    hex.classList.remove("unexplored");
    hex.classList.add(hex.dataset.terrain);
    renderDetails(hex);
  }

  function revealToggle() {
    document.querySelectorAll(".campaign-hex").forEach(hex => {
      const isHidden = hex.classList.contains("unexplored");
      if (isHidden) { hex.classList.remove("unexplored"); hex.classList.add(hex.dataset.terrain); }
      else if (hex.dataset.explored !== "true") { hex.classList.remove(hex.dataset.terrain); hex.classList.add("unexplored"); }
    });
  }

  function applyTransform() {
    const map = document.getElementById("campaignMap");
    if (map) map.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale}) translate(-310px,-480px)`;
  }
  function zoom(delta) { state.scale = Math.max(.45, Math.min(1.8, state.scale + delta)); applyTransform(); }
  function resetView() { state.scale = .88; state.x = 0; state.y = 0; applyTransform(); }

  function wireScreen() {
    document.getElementById("campaignBackBtn")?.addEventListener("click", closeCampaign);
    document.getElementById("campaignRegenerateBtn")?.addEventListener("click", generateMap);
    document.getElementById("campaignRevealBtn")?.addEventListener("click", revealToggle);
    document.getElementById("campaignZoomIn")?.addEventListener("click", () => zoom(.12));
    document.getElementById("campaignZoomOut")?.addEventListener("click", () => zoom(-.12));
    document.getElementById("campaignResetView")?.addEventListener("click", resetView);
    const shell = document.getElementById("campaignMapShell");
    shell?.addEventListener("wheel", e => { e.preventDefault(); zoom(e.deltaY < 0 ? .08 : -.08); }, { passive:false });
    shell?.addEventListener("pointerdown", e => { state.dragging = true; state.dragStart = { x:e.clientX, y:e.clientY, ox:state.x, oy:state.y }; shell.classList.add("dragging"); shell.setPointerCapture(e.pointerId); });
    shell?.addEventListener("pointermove", e => { if (!state.dragging || !state.dragStart) return; state.x = state.dragStart.ox + e.clientX - state.dragStart.x; state.y = state.dragStart.oy + e.clientY - state.dragStart.y; applyTransform(); });
    shell?.addEventListener("pointerup", () => { state.dragging = false; state.dragStart = null; shell.classList.remove("dragging"); });
  }

  function openCampaign() {
    injectScreen();
    document.getElementById("armySelectionScreen").hidden = true;
    const screen = document.getElementById("mightyEmpiresScreen");
    screen.hidden = false;
    if (!state.generated) generateMap();
  }
  function closeCampaign() {
    document.getElementById("mightyEmpiresScreen").hidden = true;
    document.getElementById("armySelectionScreen").hidden = false;
  }

  function init() { injectEntry(); injectScreen(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
