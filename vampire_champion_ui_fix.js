// Make Vampire Counts alternative regimental champions visible before the champion is enabled.
(() => {
  const ARMY_ID = "vampire_counts";
  const choices = {
    zombies: [
      ["wight", "Wight Champion", 25],
      ["vampire_thrall", "Vampire Thrall", 60],
      ["wraith", "Wraith Champion", 50]
    ],
    skeleton_warriors: [
      ["wight", "Wight Champion", 35],
      ["vampire_thrall", "Vampire Thrall", 70],
      ["wraith", "Wraith Champion", 60]
    ],
    skeleton_horsemen: [
      ["wight", "Wight Champion", 50],
      ["vampire_thrall", "Mounted Vampire Thrall", 80],
      ["wraith", "Mounted Wraith Champion", 70]
    ],
    wight_guardsmen: [
      ["wight", "Wight Champion", 35],
      ["vampire_thrall", "Vampire Thrall", 70],
      ["wraith", "Wraith Champion", 60]
    ],
    wight_knights: [
      ["wight", "Wight Champion", 50],
      ["vampire_thrall", "Mounted Vampire Thrall", 80],
      ["wraith", "Mounted Wraith Champion", 70]
    ]
  };

  const previousRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    let html = previousRenderRegimentEditor(entry, unit);
    if (state.data?.faction?.id !== ARMY_ID || entry.champion?.selected) return html;

    const unitChoices = choices[unit?.id];
    if (!unitChoices || String(html).includes("data-vc-champion-type")) return html;

    const selected = entry.champion?.choiceId || unitChoices[0][0];
    const selector = `
      <section class="editor-section">
        <h3 class="editor-section-title">Champion Type</h3>
        <div class="dialog-field">
          <label for="edit-vc-champion-type">Regimental champion</label>
          <select id="edit-vc-champion-type" data-vc-champion-type>
            ${unitChoices.map(([id, name, cost]) => `
              <option value="${escapeHtml(id)}" ${selected === id ? "selected" : ""}>
                ${escapeHtml(name)} (+${formatPoints(cost)} pts)
              </option>
            `).join("")}
          </select>
          <div class="field-hint">Choose the champion type, then enable the champion below.</div>
        </div>
      </section>`;

    return selector + html;
  };
})();
