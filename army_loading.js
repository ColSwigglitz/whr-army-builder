// Give immediate feedback while larger army books are fetched, inflated and indexed.
(() => {
  if (typeof selectArmy !== 'function') return;

  const overlay = document.createElement('div');
  overlay.className = 'army-loading-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('aria-busy', 'true');
  overlay.innerHTML = `
    <div class="army-loading-card">
      <div class="army-loading-mark" aria-hidden="true">WHR</div>
      <div class="army-loading-spinner" aria-hidden="true"></div>
      <h2 id="armyLoadingTitle">Loading army…</h2>
      <p>Preparing units, equipment, magic items and special rules.</p>
      <p class="army-loading-detail">Larger army books can take a moment.</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const title = overlay.querySelector('#armyLoadingTitle');
  const originalSelectArmy = selectArmy;
  let activeLoad = null;

  function armyName(armyId) {
    return state?.armyManifest?.armies?.find(a => a.id === armyId)?.name || 'army';
  }

  function showLoading(armyId) {
    title.textContent = `Loading ${armyName(armyId)}…`;
    overlay.hidden = false;
    document.body.classList.add('army-is-loading');
    document.querySelectorAll('[data-army-id]').forEach(card => {
      card.setAttribute('aria-disabled', 'true');
    });
  }

  function hideLoading() {
    overlay.hidden = true;
    document.body.classList.remove('army-is-loading');
    document.querySelectorAll('[data-army-id]').forEach(card => {
      card.removeAttribute('aria-disabled');
    });
  }

  function letOverlayPaint() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  selectArmy = async function(armyId) {
    if (activeLoad) return activeLoad;

    showLoading(armyId);
    activeLoad = (async () => {
      try {
        // Yield two frames before beginning the expensive work. This makes the
        // loading state visible even when parsing/indexing is CPU-heavy.
        await letOverlayPaint();
        return await originalSelectArmy(armyId);
      } finally {
        hideLoading();
        activeLoad = null;
      }
    })();

    return activeLoad;
  };
})();

// Vampire Counts units with alternative regimental champions should show the
// champion type immediately. Previously the selector only appeared after the
// default Wight Champion checkbox was enabled, making the alternatives hidden.
(() => {
  const CHAMPION_CHOICES = {
    zombies: [["wight","Wight Champion",25],["vampire_thrall","Vampire Thrall",60],["wraith","Wraith Champion",50]],
    skeleton_warriors: [["wight","Wight Champion",35],["vampire_thrall","Vampire Thrall",70],["wraith","Wraith Champion",60]],
    skeleton_horsemen: [["wight","Wight Champion",50],["vampire_thrall","Mounted Vampire Thrall",80],["wraith","Mounted Wraith Champion",70]],
    wight_guardsmen: [["wight","Wight Champion",35],["vampire_thrall","Vampire Thrall",70],["wraith","Wraith Champion",60]],
    wight_knights: [["wight","Wight Champion",50],["vampire_thrall","Mounted Vampire Thrall",80],["wraith","Mounted Wraith Champion",70]]
  };

  const previousRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = previousRenderRegimentEditor(entry, unit);
    if (state.data?.faction?.id !== "vampire_counts" || entry.champion?.selected) return html;

    const choices = CHAMPION_CHOICES[unit?.id];
    if (!choices || String(html).includes("data-vc-champion-type")) return html;

    const selected = entry.champion?.choiceId || choices[0][0];
    const selector = `
      <section class="editor-section">
        <h3 class="editor-section-title">Champion Type</h3>
        <div class="dialog-field">
          <label for="edit-vc-champion-type">Regimental champion</label>
          <select id="edit-vc-champion-type" data-vc-champion-type>
            ${choices.map(([id, name, cost]) => `<option value="${escapeHtml(id)}" ${selected === id ? "selected" : ""}>${escapeHtml(name)} (+${formatPoints(cost)} pts)</option>`).join("")}
          </select>
          <div class="field-hint">Choose the champion type, then enable the champion below.</div>
        </div>
      </section>`;

    return selector + html;
  };
})();
