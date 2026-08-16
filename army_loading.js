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
