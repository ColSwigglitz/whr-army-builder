// Keep the Roster Pad screen controls in their own row so they never cover
// the army-name box. The existing printable sheet itself is left unchanged.
(() => {
  const button = document.getElementById('printRosterBtn');
  if (!button || typeof exportPrintableRoster !== 'function') return;

  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const originalOpen = window.open;
    let rosterWindow = null;

    window.open = function(...args) {
      rosterWindow = originalOpen.apply(window, args);
      return rosterWindow;
    };

    try {
      exportPrintableRoster();
    } finally {
      window.open = originalOpen;
    }

    if (!rosterWindow || !rosterWindow.document) return;

    const applyLayoutFix = () => {
      const doc = rosterWindow.document;
      if (!doc.head || doc.getElementById('whr-roster-pad-layout-fix')) return;

      const style = doc.createElement('style');
      style.id = 'whr-roster-pad-layout-fix';
      style.textContent = `
        .print-controls {
          position: static !important;
          width: min(277mm, calc(100% - 28px));
          margin: 12px auto 8px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
        }

        @media (max-width: 760px) {
          .print-controls {
            width: calc(100% - 20px);
            margin: 10px auto 7px;
          }
        }

        @media print {
          .print-controls { display: none !important; }
        }
      `;
      doc.head.appendChild(style);
    };

    applyLayoutFix();
    rosterWindow.addEventListener('load', applyLayoutFix, { once: true });
  }, true);
})();
