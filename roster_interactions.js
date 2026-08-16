// Generic roster interactions: duplicate configured regiments and reorder them by drag/drop.
(() => {
  let dragState = null;
  let touchState = null;

  function clearMagicDuplicates(entry) {
    const removed = Boolean(
      entry.magicBanner ||
      (entry.magicItems || []).length ||
      (entry.champion?.magicItems || []).length
    );

    entry.magicBanner = null;
    entry.magicItems = [];
    if (entry.champion) entry.champion.magicItems = [];
    return removed;
  }

  function duplicateRegiment(entryId) {
    const source = state.roster.find(entry => entry.id === entryId);
    if (!source || source.sectionKey !== "regiments") return;

    // Go through the final wrapped addUnit implementation first. This preserves
    // faction-specific 0-1, prerequisite and other construction guards.
    const idsBefore = new Set(state.roster.map(entry => entry.id));
    addUnit(source.sectionKey, source.unitId);

    const added = state.roster.find(entry => !idsBefore.has(entry.id));
    if (!added) return; // A faction rule blocked the duplicate and already explained why.

    const copy = clone(source);
    copy.id = added.id;

    // WHR magic items and magic banners are army-unique. Copy all mundane
    // configuration, command and champion settings, but never manufacture a
    // second copy of a unique magic item/banner.
    const omittedUniqueMagic = clearMagicDuplicates(copy);

    const addedIndex = state.roster.findIndex(entry => entry.id === added.id);
    if (addedIndex >= 0) state.roster.splice(addedIndex, 1);

    const sourceIndex = state.roster.findIndex(entry => entry.id === source.id);
    state.roster.splice(sourceIndex + 1, 0, copy);

    renderArmy();
    showToast(omittedUniqueMagic
      ? "Regiment copied; unique magic items/banner were not duplicated"
      : "Regiment copied");
  }

  function reorderWithinSection(draggedId, targetId, before) {
    if (!draggedId || !targetId || draggedId === targetId) return;

    const dragged = state.roster.find(entry => entry.id === draggedId);
    const target = state.roster.find(entry => entry.id === targetId);
    if (!dragged || !target || dragged.sectionKey !== target.sectionKey) return;

    const ordered = state.roster.filter(entry =>
      entry.sectionKey === dragged.sectionKey && entry.id !== draggedId
    );
    const targetIndex = ordered.findIndex(entry => entry.id === targetId);
    if (targetIndex < 0) return;

    ordered.splice(targetIndex + (before ? 0 : 1), 0, dragged);

    let cursor = 0;
    state.roster = state.roster.map(entry =>
      entry.sectionKey === dragged.sectionKey ? ordered[cursor++] : entry
    );

    renderArmy();
    showToast("Regiment order updated");
  }

  function clearDropMarkers() {
    els.roster.querySelectorAll(".roster-card-drop-before, .roster-card-drop-after, .roster-card-dragging")
      .forEach(card => card.classList.remove(
        "roster-card-drop-before",
        "roster-card-drop-after",
        "roster-card-dragging"
      ));
  }

  function markDropTarget(card, clientY) {
    els.roster.querySelectorAll(".roster-card-drop-before, .roster-card-drop-after")
      .forEach(other => other.classList.remove("roster-card-drop-before", "roster-card-drop-after"));

    if (!card) return null;
    const rect = card.getBoundingClientRect();
    const before = clientY < rect.top + rect.height / 2;
    card.classList.add(before ? "roster-card-drop-before" : "roster-card-drop-after");
    return before;
  }

  function wireDesktopDrag(card, handle, entry) {
    handle.draggable = true;

    handle.addEventListener("dragstart", event => {
      dragState = { id: entry.id, sectionKey: entry.sectionKey };
      card.classList.add("roster-card-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", entry.id);
    });

    handle.addEventListener("dragend", () => {
      dragState = null;
      clearDropMarkers();
    });

    card.addEventListener("dragover", event => {
      if (!dragState || dragState.sectionKey !== entry.sectionKey || dragState.id === entry.id) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      markDropTarget(card, event.clientY);
    });

    card.addEventListener("drop", event => {
      if (!dragState || dragState.sectionKey !== entry.sectionKey || dragState.id === entry.id) return;
      event.preventDefault();
      const before = markDropTarget(card, event.clientY);
      const draggedId = dragState.id;
      dragState = null;
      clearDropMarkers();
      reorderWithinSection(draggedId, entry.id, before);
    });
  }

  function wirePointerDrag(card, handle, entry) {
    handle.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" || event.button !== 0) return;
      event.preventDefault();
      touchState = {
        id: entry.id,
        sectionKey: entry.sectionKey,
        pointerId: event.pointerId,
        targetId: null,
        before: true
      };
      handle.setPointerCapture?.(event.pointerId);
      card.classList.add("roster-card-dragging");
    });

    handle.addEventListener("pointermove", event => {
      if (!touchState || touchState.pointerId !== event.pointerId) return;
      event.preventDefault();
      const targetCard = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".roster-card[data-entry-id]");
      if (!targetCard || targetCard.dataset.entryId === touchState.id || targetCard.dataset.sectionKey !== touchState.sectionKey) {
        touchState.targetId = null;
        clearDropMarkers();
        card.classList.add("roster-card-dragging");
        return;
      }
      touchState.targetId = targetCard.dataset.entryId;
      touchState.before = markDropTarget(targetCard, event.clientY);
      card.classList.add("roster-card-dragging");
    });

    const finish = event => {
      if (!touchState || touchState.pointerId !== event.pointerId) return;
      const completed = touchState;
      touchState = null;
      try { handle.releasePointerCapture?.(event.pointerId); } catch (_) {}
      clearDropMarkers();
      if (completed.targetId) reorderWithinSection(completed.id, completed.targetId, completed.before);
    };

    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
  }

  function decorateRegimentCards() {
    if (!state.data || !els.roster || !state.roster.length) return;

    const regimentSection = [...els.roster.querySelectorAll(".roster-section")]
      .find(section => section.querySelector(".roster-section-title")?.textContent.trim() === "Regiments");
    if (!regimentSection) return;

    const entries = state.roster.filter(entry => entry.sectionKey === "regiments");
    const cards = [...regimentSection.querySelectorAll(".roster-card")];

    cards.forEach((card, index) => {
      const entry = entries[index];
      if (!entry) return;

      card.dataset.entryId = entry.id;
      card.dataset.sectionKey = entry.sectionKey;

      const actions = card.querySelector(".roster-card-actions");
      if (!actions) return;

      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "roster-drag-handle";
      handle.setAttribute("aria-label", "Drag to reorder regiment");
      handle.title = "Drag to reorder";
      handle.textContent = "↕";
      actions.prepend(handle);

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "duplicate-button";
      copyButton.textContent = "Copy";
      copyButton.title = "Duplicate this regiment";
      copyButton.addEventListener("click", () => duplicateRegiment(entry.id));

      const editButton = actions.querySelector("[data-edit]");
      if (editButton) editButton.insertAdjacentElement("afterend", copyButton);
      else actions.append(copyButton);

      wireDesktopDrag(card, handle, entry);
      wirePointerDrag(card, handle, entry);
    });
  }

  const previousRenderArmy = renderArmy;
  renderArmy = function() {
    const result = previousRenderArmy.apply(this, arguments);
    decorateRegimentCards();
    return result;
  };

  // Expose tiny hooks for browser regression tests.
  window.whrDuplicateRegiment = duplicateRegiment;
  window.whrReorderRosterEntry = reorderWithinSection;
})();
