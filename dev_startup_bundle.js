// GENERATED FILE - DO NOT EDIT DIRECTLY.
// Built by tools/build_dev_bundle.py as dev_startup_bundle.js.

/* ===== BEGIN app.js ===== */
const ARMIES_URL = "./data/armies.json";
let DATA_URL = null;

const state = {
  data: null,
  roster: [],
  pointsLimit: 2000,
  editingEntryId: null,
  draft: null,
  rosterName: "My Empire Army",
  currentSaveId: null,
  armyManifest: null,
  selectedArmyId: null
};

const SAVED_ROSTERS_KEY = "whr_army_builder_saved_rosters_v1";

const els = {
  armySelectionScreen: document.getElementById("armySelectionScreen"),
  builderScreen: document.getElementById("builderScreen"),
  armyCards: document.getElementById("armyCards"),
  backToArmiesBtn: document.getElementById("backToArmiesBtn"),
  factionName: document.getElementById("factionName"),
  armyTitle: document.getElementById("armyTitle"),
  rosterName: document.getElementById("rosterName"),
  pointsLimit: document.getElementById("pointsLimit"),
  armyTotal: document.getElementById("armyTotal"),
  unitSearch: document.getElementById("unitSearch"),
  unitBrowser: document.getElementById("unitBrowser"),
  roster: document.getElementById("roster"),
  armyStatus: document.getElementById("armyStatus"),
  clearArmyBtn: document.getElementById("clearArmyBtn"),
  newRosterBtn: document.getElementById("newRosterBtn"),
  saveRosterBtn: document.getElementById("saveRosterBtn"),
  savedRostersBtn: document.getElementById("savedRostersBtn"),
  printRosterBtn: document.getElementById("printRosterBtn"),
  savedRostersDialog: document.getElementById("savedRostersDialog"),
  savedRostersCloseBtn: document.getElementById("savedRostersCloseBtn"),
  savedRostersList: document.getElementById("savedRostersList"),
  toast: document.getElementById("toast"),
  editDialog: document.getElementById("editDialog"),
  editForm: document.getElementById("editForm"),
  dialogSection: document.getElementById("dialogSection"),
  dialogUnitName: document.getElementById("dialogUnitName"),
  dialogContent: document.getElementById("dialogContent"),
  dialogTotal: document.getElementById("dialogTotal"),
  dialogCloseBtn: document.getElementById("dialogCloseBtn"),
  dialogCancelBtn: document.getElementById("dialogCancelBtn")
};

const sectionConfig = [
  { key: "characters", label: "Characters" },
  { key: "regiments", label: "Regiments" },
  { key: "warMachines", label: "War Machines" },
  { key: "specialCharacters", label: "Special Characters" }
];

let equipmentById = new Map();
let magicById = new Map();
let mountById = new Map();
let profileById = new Map();

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatPoints(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function humanise(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function sectionLabel(key) {
  return sectionConfig.find(x => x.key === key)?.label || humanise(key);
}

function getUnit(sectionKey, unitId) {
  return state.data.faction[sectionKey].find(u => u.id === unitId);
}

function getEquipmentName(id) {
  return equipmentById.get(id)?.name || humanise(id);
}

function getMagicItem(id) {
  return magicById.get(id);
}

function getMountName(id) {
  return mountById.get(id)?.name || humanise(id);
}

function getBaseCostLabel(unit) {
  return unit.points?.type === "per_model"
    ? `${formatPoints(unit.points.value)} / model`
    : `${formatPoints(unit.points?.value || 0)} pts`;
}

function getDefaultSize(unit) {
  if (unit.points?.type !== "per_model") return 1;
  const minModels = Number(unit.size?.minimum || 5);
  const minPoints = Number(state.data.globalArmyRules?.minimumRegimentModelPoints || 50);
  const base = Number(unit.points.value || 1);
  return Math.max(minModels, Math.ceil(minPoints / base));
}

function getCommandDefaults(unit) {
  const c = unit.command || {};
  if (!c.useGlobalDefaults) {
    return {
      musician: c.musician?.allowed === false ? false : Boolean(c.musician?.default),
      standardBearer: c.standardBearer?.allowed === false ? false : Boolean(c.standardBearer?.default)
    };
  }

  const tags = unit.tags || [];
  let template = state.data.globalArmyRules.command.normalRegiment;

  if (tags.includes("fast_cavalry")) template = state.data.globalArmyRules.command.fastCavalry;
  if (unit.unitType === "monstrous_regiment") template = state.data.globalArmyRules.command.monstrousRegiment;

  return {
    musician: template.musician?.allowed === false ? false : Boolean(template.musician?.default),
    standardBearer: tags.includes("skirmisher")
      ? false
      : (template.standardBearer?.allowed === false ? false : Boolean(template.standardBearer?.default))
  };
}

function createEntry(sectionKey, unit) {
  return {
    id: makeId(),
    sectionKey,
    unitId: unit.id,
    size: getDefaultSize(unit),
    mount: null,
    equipmentSelections: {},
    extraEquipment: {},
    optionSelections: {},
    command: getCommandDefaults(unit),
    champion: {
      selected: false,
      magicItems: []
    },
    magicItems: [],
    magicBanner: null
  };
}

function addUnit(sectionKey, unitId) {
  const unit = getUnit(sectionKey, unitId);
  if (!unit) return;

  state.roster.push(createEntry(sectionKey, unit));
  renderArmy();
}

function costFromDefinition(cost, size = 1) {
  if (cost == null) return 0;
  if (typeof cost === "number") return cost;

  if (cost.type === "per_model") {
    return Number(cost.value || 0) * Number(size || 0);
  }

  return Number(cost.value ?? cost.base ?? 0);
}

function optionSelectedValue(entry, option) {
  return entry.optionSelections?.[option.id];
}

function calculateOptionCost(entry, unit, option) {
  const selected = optionSelectedValue(entry, option);
  if (selected == null || selected === false || selected === "") return 0;

  if (option.type === "quantity") {
    return Number(selected || 0) * Number(option.cost?.value || 0);
  }

  if (option.type === "choice_group") {
    const choice = (option.choices || []).find(x =>
      (typeof x === "string" ? x : x.id) === selected
    );

    if (choice && typeof choice === "object") {
      return costFromDefinition(choice.cost, entry.size);
    }

    return typeof option.cost === "number"
      ? option.cost
      : costFromDefinition(option.cost, entry.size);
  }

  return costFromDefinition(option.cost, entry.size);
}

function selectedPerModelOptionCost(entry, unit) {
  return (unit.options || []).reduce((sum, option) => {
    const selected = optionSelectedValue(entry, option);
    if (!selected) return sum;

    if (option.type === "choice_group") {
      const choice = (option.choices || []).find(x =>
        (typeof x === "string" ? x : x.id) === selected
      );
      if (choice && typeof choice === "object" && choice.cost?.type === "per_model") {
        return sum + Number(choice.cost.value || 0);
      }
      if (option.cost?.type === "per_model") return sum + Number(option.cost.value || 0);
      return sum;
    }

    if (option.cost?.type === "per_model") {
      return sum + Number(option.cost.value || 0);
    }

    return sum;
  }, 0);
}

function calculateChampionCost(entry, unit) {
  if (!entry.champion?.selected || !unit.champion) return 0;

  const championCost = unit.champion.cost || {};
  let total = Number(championCost.base || championCost.value || 0);

  if (championCost.add?.type === "unit_model_cost") {
    total += Number(unit.points?.value || 0);
    total += selectedPerModelOptionCost(entry, unit);
  }

  total += (entry.champion.magicItems || []).reduce(
    (sum, id) => sum + Number(getMagicItem(id)?.cost || 0), 0
  );

  return total;
}

function getCommandDefinition(unit, key) {
  const own = unit.command || {};
  if (!own.useGlobalDefaults) return own[key] || {};

  const tags = unit.tags || [];
  let template = state.data.globalArmyRules.command.normalRegiment;
  if (tags.includes("fast_cavalry")) template = state.data.globalArmyRules.command.fastCavalry;
  if (unit.unitType === "monstrous_regiment") template = state.data.globalArmyRules.command.monstrousRegiment;

  if (key === "standardBearer" && tags.includes("skirmisher")) {
    return { allowed: false };
  }

  return template[key] || {};
}

function calculateEntry(entry) {
  const unit = getUnit(entry.sectionKey, entry.unitId);
  if (!unit) return 0;

  let total = unit.points?.type === "per_model"
    ? Number(unit.points.value || 0) * Number(entry.size || 0)
    : Number(unit.points?.value || 0);

  // Character equipment groups.
  for (const group of unit.equipmentOptions || []) {
    const selected = entry.equipmentSelections?.[group.id];
    if (selected) {
      total += typeof group.cost === "number"
        ? Number(group.cost)
        : costFromDefinition(group.cost, entry.size);
    }
  }

  // Mount.
  if (entry.mount) {
    const mount = (unit.mountOptions || []).find(m => m.mountId === entry.mount);
    total += Number(mount?.cost || 0);
  }

  // Generic unit options.
  for (const option of unit.options || []) {
    total += calculateOptionCost(entry, unit, option);
  }

  // Command.
  if (entry.command?.musician) {
    total += Number(getCommandDefinition(unit, "musician").cost || 0);
  }
  if (entry.command?.standardBearer) {
    total += Number(getCommandDefinition(unit, "standardBearer").cost || 0);
  }

  // Champion + champion magic items.
  total += calculateChampionCost(entry, unit);

  // Character/special-character magic items.
  total += (entry.magicItems || []).reduce(
    (sum, id) => sum + Number(getMagicItem(id)?.cost || 0), 0
  );

  // Magic banner.
  if (entry.magicBanner) {
    total += Number(getMagicItem(entry.magicBanner)?.cost || 0);
  }

  return total;
}

function calculateArmyTotal() {
  return state.roster.reduce((sum, entry) => sum + calculateEntry(entry), 0);
}

function calculateRegimentPoints() {
  let total = 0;
  const seenByUnit = {};

  for (const entry of state.roster) {
    const unit = getUnit(entry.sectionKey, entry.unitId);
    if (!unit) continue;

    seenByUnit[unit.id] = (seenByUnit[unit.id] || 0) + 1;
    const instanceNumber = seenByUnit[unit.id];

    if (entry.sectionKey === "regiments") {
      // Champion points normally do NOT count towards Regiments.
      total += calculateEntry(entry) - calculateChampionCost(entry, unit);
      continue;
    }

    const compositionRule = unit.composition?.rules?.find(
      rule => rule.when?.instanceNumber === instanceNumber && rule.category === "regiments"
    );

    if (compositionRule) total += calculateEntry(entry);
  }

  return total;
}


function armyMonogram(name) {
  const words = String(name || "").replace(/^the\s+/i, "").split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map(word => word[0]).join("").toUpperCase() || "WHR";
}

async function loadArmyManifest() {
  const response = await fetch(ARMIES_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${ARMIES_URL} (${response.status})`);
  state.armyManifest = await response.json();
}

function renderArmySelection() {
  const armies = state.armyManifest?.armies || [];

  els.armyCards.innerHTML = armies.map(army => `
    <button
      type="button"
      class="army-card ${army.available ? "available" : "unavailable"}"
      data-army-id="${escapeHtml(army.id)}"
      ${army.available ? "" : "disabled"}
    >
      <div class="army-card-top">
        <div class="army-card-monogram">${escapeHtml(armyMonogram(army.name))}</div>
        <span class="army-card-badge">${escapeHtml(army.badge || (army.available ? "Available" : "Coming Soon"))}</span>
      </div>
      <div class="army-card-body">
        <h3>${escapeHtml(army.name)}</h3>
        ${army.subtitle ? `<div class="army-card-subtitle">${escapeHtml(army.subtitle)}</div>` : ""}
        <p class="army-card-description">${escapeHtml(army.description || "")}</p>
        ${army.available ? `<div class="army-card-action">Build this army →</div>` : ""}
      </div>
    </button>
  `).join("") || `<div class="army-card-loading">No army books are configured.</div>`;

  els.armyCards.querySelectorAll("[data-army-id]").forEach(button => {
    button.addEventListener("click", () => selectArmy(button.dataset.armyId));
  });
}

async function selectArmy(armyId) {
  const army = state.armyManifest?.armies?.find(a => a.id === armyId && a.available);
  if (!army) return;

  DATA_URL = `./data/${army.dataFile}`;

  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${DATA_URL} (${response.status})`);

    state.data = await response.json();
    state.selectedArmyId = armyId;
    state.roster = [];
    state.currentSaveId = null;
    state.rosterName = `My ${state.data.faction?.name || army.name} Army`;

    buildIndexes();

    els.factionName.textContent = state.data.faction?.name || army.name;
    els.rosterName.value = state.rosterName;
    els.pointsLimit.value = state.pointsLimit;
    els.armyTitle.textContent = state.rosterName;

    els.armySelectionScreen.hidden = true;
    els.builderScreen.hidden = false;

    renderUnitBrowser();
    renderArmy();
    window.scrollTo({ top: 0, behavior: "instant" });
  } catch (error) {
    console.error(error);
    window.alert(`Could not load ${army.name}.`);
  }
}

function showArmySelection() {
  if (state.roster.length) {
    const ok = window.confirm("Return to army selection? Any unsaved changes to the current army will be lost.");
    if (!ok) return;
  }

  state.roster = [];
  state.data = null;
  state.selectedArmyId = null;
  state.currentSaveId = null;

  els.builderScreen.hidden = true;
  els.armySelectionScreen.hidden = false;
  renderArmySelection();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderUnitBrowser() {
  const search = els.unitSearch.value.trim().toLowerCase();
  const faction = state.data.faction;

  els.unitBrowser.innerHTML = sectionConfig.map(section => {
    const units = (faction[section.key] || []).filter(u =>
      u.name.toLowerCase().includes(search)
    );

    if (!units.length) return "";

    return `
      <section class="unit-section">
        <h3>${escapeHtml(section.label)}</h3>
        ${units.map(unit => `
          <button class="unit-choice" type="button"
            data-section="${section.key}" data-unit-id="${escapeHtml(unit.id)}">
            <span>
              <span class="unit-choice-name">${escapeHtml(unit.name)}</span>
              <span class="unit-choice-meta">Add now, configure in your roster</span>
            </span>
            <span class="unit-choice-cost">${escapeHtml(getBaseCostLabel(unit))}</span>
          </button>
        `).join("")}
      </section>
    `;
  }).join("") || `<div class="loading">No matching choices.</div>`;

  els.unitBrowser.querySelectorAll(".unit-choice").forEach(button => {
    button.addEventListener("click", () => addUnit(button.dataset.section, button.dataset.unitId));
  });
}

function describeEntry(entry) {
  const unit = getUnit(entry.sectionKey, entry.unitId);
  const parts = [];

  if (unit.points?.type === "per_model") {
    parts.push(`${entry.size} models`);
  }

  if (entry.mount) parts.push(getMountName(entry.mount));

  for (const group of unit.equipmentOptions || []) {
    const selected = entry.equipmentSelections?.[group.id];
    if (selected) parts.push(getEquipmentName(selected));

    for (const extra of group.alsoMayTake || []) {
      if (entry.extraEquipment?.[extra]) parts.push(getEquipmentName(extra));
    }
  }

  for (const option of unit.options || []) {
    const selected = entry.optionSelections?.[option.id];
    if (selected == null || selected === false || selected === "" || selected === 0) continue;

    if (option.type === "quantity") {
      parts.push(`${selected} ${humanise(option.id)}`);
    } else if (option.type === "choice_group") {
      parts.push(humanise(selected));
    } else {
      parts.push(humanise(option.id));
    }
  }

  if (entry.champion?.selected && unit.champion) {
    parts.push(unit.champion.name);
  }

  if (entry.magicItems?.length) {
    parts.push(entry.magicItems.map(id => getMagicItem(id)?.name || id).join(", "));
  }

  if (entry.champion?.magicItems?.length) {
    parts.push(`Champion: ${entry.champion.magicItems.map(id => getMagicItem(id)?.name || id).join(", ")}`);
  }

  if (entry.magicBanner) {
    parts.push(getMagicItem(entry.magicBanner)?.name || entry.magicBanner);
  }

  return parts.length ? parts.join(" · ") : "Base configuration";
}

function renderArmy() {
  const total = calculateArmyTotal();
  els.armyTotal.textContent = formatPoints(total);
  els.armyTitle.textContent = state.rosterName || `${state.data.faction?.name || "The Empire"} Army`;
  renderArmyStatus(total);

  if (!state.roster.length) {
    els.roster.innerHTML = `
      <div class="empty-state">
        <h3>Your army is empty</h3>
        <p>Choose a unit from the army book. Once added, use <strong>Edit</strong> to configure it.</p>
      </div>
    `;
    return;
  }

  els.roster.innerHTML = sectionConfig.map(section => {
    const entries = state.roster.filter(e => e.sectionKey === section.key);
    if (!entries.length) return "";

    return `
      <section class="roster-section">
        <h3 class="roster-section-title">${escapeHtml(section.label)}</h3>
        ${entries.map(entry => {
          const unit = getUnit(entry.sectionKey, entry.unitId);
          return `
            <article class="roster-card">
              <div class="roster-card-main">
                <div class="roster-card-name">
                  <span>${escapeHtml(unit.name)}</span>
                  <span class="roster-card-points">${formatPoints(calculateEntry(entry))} pts</span>
                </div>
                <div class="roster-card-summary">${escapeHtml(describeEntry(entry))}</div>
              </div>
              <div class="roster-card-actions">
                <button class="edit-button" type="button" data-edit="${entry.id}">Edit</button>
                <button class="remove-button" type="button" data-remove="${entry.id}"
                  aria-label="Remove ${escapeHtml(unit.name)}">×</button>
              </div>
            </article>
          `;
        }).join("")}
      </section>
    `;
  }).join("");

  els.roster.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => openEditor(button.dataset.edit));
  });

  els.roster.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => {
      state.roster = state.roster.filter(e => e.id !== button.dataset.remove);
      renderArmy();
    });
  });
}

function renderArmyStatus(total) {
  const remaining = state.pointsLimit - total;
  const regimentPoints = calculateRegimentPoints();
  const regimentPercentage = state.pointsLimit > 0 ? regimentPoints / state.pointsLimit * 100 : 0;

  els.armyStatus.innerHTML = `
    <div class="status-grid">
      <div class="status-card ${remaining >= 0 ? "good" : "bad"}">
        <span>${remaining >= 0 ? "Points remaining" : "Points over"}</span>
        <strong>${formatPoints(Math.abs(remaining))}</strong>
      </div>
      <div class="status-card ${regimentPercentage >= 50 ? "good" : "warn"}">
        <span>Regiment points</span>
        <strong>${formatPoints(regimentPoints)}</strong>
      </div>
      <div class="status-card ${regimentPercentage >= 50 ? "good" : "warn"}">
        <span>Regiment allocation</span>
        <strong>${formatPoints(regimentPercentage)}%</strong>
      </div>
    </div>
  `;
}

function openEditor(entryId) {
  const entry = state.roster.find(e => e.id === entryId);
  if (!entry) return;

  state.editingEntryId = entryId;
  state.draft = clone(entry);

  const unit = getUnit(entry.sectionKey, entry.unitId);
  els.dialogSection.textContent = sectionLabel(entry.sectionKey);
  els.dialogUnitName.textContent = unit.name;

  renderEditor();
  els.editDialog.showModal();
}

function closeEditor() {
  state.editingEntryId = null;
  state.draft = null;
  els.editDialog.close();
}

function renderEditor() {
  const entry = state.draft;
  const unit = getUnit(entry.sectionKey, entry.unitId);

  let html = "";

  if (entry.sectionKey === "characters" || entry.sectionKey === "specialCharacters") {
    html += renderCharacterEditor(entry, unit);
  } else if (entry.sectionKey === "regiments") {
    html += renderRegimentEditor(entry, unit);
  } else if (entry.sectionKey === "warMachines") {
    html += renderWarMachineEditor(entry, unit);
  }

  els.dialogContent.innerHTML = html;
  wireEditorControls();
  updateDialogTotal();
}

function renderCharacterEditor(entry, unit) {
  let html = "";

  if ((unit.mountOptions || []).length) {
    html += `
      <section class="editor-section">
        <h3 class="editor-section-title">Mount</h3>
        <div class="dialog-field">
          <label for="edit-mount">Mount</label>
          <select id="edit-mount" data-field="mount">
            <option value="">None</option>
            ${unit.mountOptions.map(m => `
              <option value="${escapeHtml(m.mountId)}" ${entry.mount === m.mountId ? "selected" : ""}>
                ${escapeHtml(getMountName(m.mountId))}${Number(m.cost || 0) ? ` (+${formatPoints(m.cost)} pts)` : " (free)"}
              </option>
            `).join("")}
          </select>
        </div>
      </section>
    `;
  }

  if ((unit.equipmentOptions || []).length) {
    html += `<section class="editor-section"><h3 class="editor-section-title">Equipment</h3>`;

    for (const group of unit.equipmentOptions) {
      html += `
        <div class="dialog-field">
          <label>${escapeHtml(humanise(group.id))}</label>
          <select data-equipment-group="${escapeHtml(group.id)}">
            <option value="">None / Hand weapon</option>
            ${(group.choices || []).map(choice => `
              <option value="${escapeHtml(choice)}"
                ${entry.equipmentSelections?.[group.id] === choice ? "selected" : ""}>
                ${escapeHtml(getEquipmentName(choice))}
                ${Number(group.cost || 0) ? ` (+${formatPoints(group.cost)} pts)` : ""}
              </option>
            `).join("")}
          </select>
        </div>
      `;

      for (const extra of group.alsoMayTake || []) {
        html += `
          <label class="check-row">
            <input type="checkbox" data-extra-equipment="${escapeHtml(extra)}"
              ${entry.extraEquipment?.[extra] ? "checked" : ""}>
            <span class="check-row-content">
              <span class="check-row-title"><span>${escapeHtml(getEquipmentName(extra))}</span><span>Free</span></span>
            </span>
          </label>
        `;
      }
    }

    html += `</section>`;
  }

  html += renderMagicItemEditor(entry, unit, "character");

  if (unit.rules?.length) {
    html += `
      <section class="editor-section">
        <h3 class="editor-section-title">Rules</h3>
        ${unit.rules.map(rule => `<div class="dialog-note">${escapeHtml(rule)}</div>`).join("")}
      </section>
    `;
  }

  return html;
}

function renderRegimentEditor(entry, unit) {
  let html = `
    <section class="editor-section">
      <h3 class="editor-section-title">Unit Size</h3>
      <div class="dialog-field">
        <label for="edit-size">Number of models</label>
        <input id="edit-size" type="number" min="${unit.size?.minimum || 5}" step="1"
          value="${entry.size}" data-field="size">
        <div class="field-hint">
          Base cost: ${formatPoints(unit.points?.value || 0)} pts per model.
          Normal regiments must contain at least ${unit.size?.minimum || 5} models and 50 points of models.
        </div>
      </div>
    </section>
  `;

  if ((unit.options || []).length) {
    html += `
      <section class="editor-section">
        <h3 class="editor-section-title">Options</h3>
        ${renderUnitOptions(entry, unit)}
      </section>
    `;
  }

  html += renderCommandEditor(entry, unit);

  if (unit.champion) {
    html += `
      <section class="editor-section">
        <h3 class="editor-section-title">Champion</h3>
        <label class="check-row">
          <input type="checkbox" data-champion-toggle
            ${entry.champion?.selected ? "checked" : ""}>
          <span class="check-row-content">
            <span class="check-row-title">
              <span>${escapeHtml(unit.champion.name)}</span>
              <span>${formatChampionBaseCost(unit.champion)}</span>
            </span>
            <span class="check-row-sub">Counts towards the regiment's model count but normally towards Characters for army composition.</span>
          </span>
        </label>
        ${entry.champion?.selected ? renderMagicItemEditor(entry, unit, "champion") : ""}
      </section>
    `;
  }

  if (entry.command?.standardBearer && unit.magicBanner?.allowed) {
    html += renderMagicBannerEditor(entry, unit);
  }

  return html;
}

function renderWarMachineEditor(entry, unit) {
  let html = `
    <section class="editor-section">
      <h3 class="editor-section-title">Base Configuration</h3>
      <div class="dialog-note">${escapeHtml(getBaseCostLabel(unit))}</div>
    </section>
  `;

  if ((unit.options || []).length) {
    html += `
      <section class="editor-section">
        <h3 class="editor-section-title">Options</h3>
        ${renderUnitOptions(entry, unit)}
      </section>
    `;
  }

  if (unit.sourceNotes?.length) {
    html += `
      <section class="editor-section">
        <h3 class="editor-section-title">Source Note</h3>
        ${unit.sourceNotes.map(n => `<div class="warning-box">${escapeHtml(n)}</div>`).join("")}
      </section>
    `;
  }

  return html;
}

function renderUnitOptions(entry, unit) {
  return (unit.options || []).map(option => {
    const selected = entry.optionSelections?.[option.id];

    if (option.type === "quantity") {
      return `
        <div class="dialog-field">
          <label>${escapeHtml(humanise(option.id))}</label>
          <input type="number" min="${option.minimum ?? 0}" max="${option.maximum ?? 99}" step="1"
            value="${Number(selected || 0)}" data-option-quantity="${escapeHtml(option.id)}">
          <div class="field-hint">${formatOptionCost(option.cost)}</div>
        </div>
      `;
    }

    if (option.type === "choice_group") {
      return `
        <div class="dialog-field">
          <label>${escapeHtml(humanise(option.id))}</label>
          <select data-option-choice="${escapeHtml(option.id)}">
            <option value="">None</option>
            ${(option.choices || []).map(choice => {
              const id = typeof choice === "string" ? choice : choice.id;
              const name = typeof choice === "string" ? getEquipmentName(choice) : humanise(choice.id);
              const cost = typeof choice === "object" ? formatOptionCost(choice.cost) : formatOptionCost(option.cost);
              return `<option value="${escapeHtml(id)}" ${selected === id ? "selected" : ""}>
                ${escapeHtml(name)}${cost ? ` (${escapeHtml(cost)})` : ""}
              </option>`;
            }).join("")}
          </select>
        </div>
      `;
    }

    return `
      <label class="check-row">
        <input type="checkbox" data-option-toggle="${escapeHtml(option.id)}" ${selected ? "checked" : ""}>
        <span class="check-row-content">
          <span class="check-row-title">
            <span>${escapeHtml(humanise(option.id))}</span>
            <span>${escapeHtml(formatOptionCost(option.cost))}</span>
          </span>
          ${option.rules ? `<span class="check-row-sub">${escapeHtml(option.rules)}</span>` : ""}
        </span>
      </label>
    `;
  }).join("");
}

function formatOptionCost(cost) {
  if (!cost) return "";
  if (typeof cost === "number") return cost ? `+${formatPoints(cost)} pts` : "Free";
  if (cost.type === "per_model") return `+${formatPoints(cost.value)} / model`;
  const value = Number(cost.value ?? cost.base ?? 0);
  return value ? `${value > 0 ? "+" : ""}${formatPoints(value)} pts` : "Free";
}

function formatChampionBaseCost(champion) {
  const cost = champion.cost || {};
  if (cost.add?.type === "unit_model_cost") {
    return `${formatPoints(cost.base || 0)} + one trooper`;
  }
  return `${formatPoints(cost.value || cost.base || 0)} pts`;
}

function renderCommandEditor(entry, unit) {
  const musician = getCommandDefinition(unit, "musician");
  const standard = getCommandDefinition(unit, "standardBearer");

  return `
    <section class="editor-section">
      <h3 class="editor-section-title">Command</h3>
      ${musician.allowed === false ? "" : `
        <label class="check-row">
          <input type="checkbox" data-command="musician" ${entry.command?.musician ? "checked" : ""}>
          <span class="check-row-content">
            <span class="check-row-title">
              <span>Musician</span>
              <span>${Number(musician.cost || 0) ? `+${formatPoints(musician.cost)} pts` : "Free"}</span>
            </span>
          </span>
        </label>
      `}
      ${standard.allowed === false ? "" : `
        <label class="check-row">
          <input type="checkbox" data-command="standardBearer" ${entry.command?.standardBearer ? "checked" : ""}>
          <span class="check-row-content">
            <span class="check-row-title">
              <span>Standard Bearer</span>
              <span>${Number(standard.cost || 0) ? `+${formatPoints(standard.cost)} pts` : "Free"}</span>
            </span>
          </span>
        </label>
      `}
    </section>
  `;
}

function getAllowedMagicItems(unit, context) {
  let settings;

  if (context === "champion") {
    settings = unit.champion?.magicItems;
  } else {
    settings = unit.magicItems;
  }

  if (!settings) return [];

  const pools = settings.allowedPools || ["common", "empire"];
  const categories = settings.allowedCategories || [
    "magic_weapon", "magic_armour", "enchanted_item", "arcane_item", "familiar"
  ];

  const result = [];

  if (pools.includes("common")) result.push(...state.data.commonMagicItems);
  if (pools.includes("empire")) result.push(...state.data.factionMagicItems);

  return result.filter(item => categories.includes(item.category));
}

function getMagicMaximum(unit, context) {
  if (context === "champion") {
    return Number(unit.champion?.magicItems?.maximum || 0);
  }

  return Number(unit.magicItems?.maximum ?? unit.magicItems?.additionalMaximum ?? 0);
}

function selectedMagicIds(entry, context) {
  return context === "champion"
    ? (entry.champion?.magicItems || [])
    : (entry.magicItems || []);
}

function magicItemUsedElsewhere(itemId, contextEntryId, context) {
  for (const entry of state.roster) {
    if (entry.id === contextEntryId) continue;
    if ((entry.magicItems || []).includes(itemId)) return true;
    if ((entry.champion?.magicItems || []).includes(itemId)) return true;
    if (entry.magicBanner === itemId) return true;
  }
  return false;
}

function renderMagicItemEditor(entry, unit, context) {
  const max = getMagicMaximum(unit, context);
  if (!max) return "";

  const selected = selectedMagicIds(entry, context);
  const items = getAllowedMagicItems(unit, context);
  const contextKey = context === "champion" ? "champion" : "character";

  return `
    <div class="${context === "champion" ? "" : "editor-section"} magic-editor" data-magic-context="${contextKey}">
      <div class="magic-header">
        <h3 class="editor-section-title" style="margin:0;">Magic Items</h3>
        <span class="magic-counter">${selected.length} / ${max}</span>
      </div>

      <input class="magic-search" type="search" placeholder="Search magic items…" data-magic-search="${contextKey}">

      <div class="magic-list" data-magic-list="${contextKey}">
        ${renderMagicList(items, selected, max, entry.id, contextKey)}
      </div>

      <div class="field-hint">
        The list is taken from the common and Empire magic-item pools allowed by this character.
        Army-wide duplicate items are disabled.
      </div>
    </div>
  `;
}

function renderMagicList(items, selected, max, entryId, context) {
  const categoryOrder = ["magic_weapon","magic_armour","enchanted_item","arcane_item","familiar","magic_banner"];
  const labels = {
    magic_weapon:"Magic Weapons",
    magic_armour:"Magic Armour",
    enchanted_item:"Enchanted Items",
    arcane_item:"Arcane Items",
    familiar:"Familiars",
    magic_banner:"Magic Banners"
  };

  return categoryOrder.map(category => {
    const categoryItems = items.filter(i => i.category === category);
    if (!categoryItems.length) return "";

    return `
      <div class="magic-category">${labels[category] || humanise(category)}</div>
      ${categoryItems.map(item => {
        const checked = selected.includes(item.id);
        const used = magicItemUsedElsewhere(item.id, entryId, context);
        return `
          <label class="magic-item-row" data-magic-name="${escapeHtml(item.name.toLowerCase())}">
            <input type="checkbox"
              data-magic-item="${escapeHtml(item.id)}"
              data-magic-context="${context}"
              ${checked ? "checked" : ""}
              ${used && !checked ? "disabled" : ""}>
            <span>
              <span class="magic-item-name">${escapeHtml(item.name)}</span>
              ${item.rules ? `<span class="magic-item-rules">${escapeHtml(item.rules)}</span>` : ""}
            </span>
            <span class="magic-item-cost">${formatPoints(item.cost)} pts</span>
          </label>
        `;
      }).join("")}
    `;
  }).join("");
}

function renderMagicBannerEditor(entry, unit) {
  const banners = [
    ...state.data.commonMagicItems.filter(i => i.category === "magic_banner"),
    ...state.data.factionMagicItems.filter(i => i.category === "magic_banner")
  ];

  return `
    <section class="editor-section">
      <h3 class="editor-section-title">Magic Banner</h3>
      <div class="dialog-field">
        <label>Banner</label>
        <select data-magic-banner>
          <option value="">None</option>
          ${banners.map(item => {
            const used = magicItemUsedElsewhere(item.id, entry.id, "banner");
            return `
              <option value="${escapeHtml(item.id)}"
                ${entry.magicBanner === item.id ? "selected" : ""}
                ${used && entry.magicBanner !== item.id ? "disabled" : ""}>
                ${escapeHtml(item.name)} (${formatPoints(item.cost)} pts)
              </option>
            `;
          }).join("")}
        </select>
      </div>
    </section>
  `;
}

function wireEditorControls() {
  const entry = state.draft;
  const unit = getUnit(entry.sectionKey, entry.unitId);

  els.dialogContent.querySelectorAll("[data-field]").forEach(control => {
    control.addEventListener("change", () => {
      if (control.dataset.field === "mount") entry.mount = control.value || null;
      if (control.dataset.field === "size") {
        const min = Number(unit.size?.minimum || 1);
        entry.size = Math.max(min, Math.floor(Number(control.value || min)));
        control.value = entry.size;
      }
      updateDialogTotal();
    });
  });

  els.dialogContent.querySelectorAll("[data-equipment-group]").forEach(select => {
    select.addEventListener("change", () => {
      entry.equipmentSelections[select.dataset.equipmentGroup] = select.value || null;
      updateDialogTotal();
    });
  });

  els.dialogContent.querySelectorAll("[data-extra-equipment]").forEach(check => {
    check.addEventListener("change", () => {
      entry.extraEquipment[check.dataset.extraEquipment] = check.checked;
      updateDialogTotal();
    });
  });

  els.dialogContent.querySelectorAll("[data-option-toggle]").forEach(check => {
    check.addEventListener("change", () => {
      entry.optionSelections[check.dataset.optionToggle] = check.checked;
      updateDialogTotal();
    });
  });

  els.dialogContent.querySelectorAll("[data-option-choice]").forEach(select => {
    select.addEventListener("change", () => {
      entry.optionSelections[select.dataset.optionChoice] = select.value || null;
      updateDialogTotal();
    });
  });

  els.dialogContent.querySelectorAll("[data-option-quantity]").forEach(input => {
    input.addEventListener("change", () => {
      entry.optionSelections[input.dataset.optionQuantity] = Math.max(
        Number(input.min || 0),
        Math.min(Number(input.max || 99), Math.floor(Number(input.value || 0)))
      );
      input.value = entry.optionSelections[input.dataset.optionQuantity];
      updateDialogTotal();
    });
  });

  els.dialogContent.querySelectorAll("[data-command]").forEach(check => {
    check.addEventListener("change", () => {
      entry.command[check.dataset.command] = check.checked;

      // Magic banner disappears if the standard bearer is removed.
      if (check.dataset.command === "standardBearer" && !check.checked) {
        entry.magicBanner = null;
        renderEditor();
      } else if (check.dataset.command === "standardBearer") {
        renderEditor();
      } else {
        updateDialogTotal();
      }
    });
  });

  const championToggle = els.dialogContent.querySelector("[data-champion-toggle]");
  if (championToggle) {
    championToggle.addEventListener("change", () => {
      entry.champion.selected = championToggle.checked;
      if (!championToggle.checked) entry.champion.magicItems = [];
      renderEditor();
    });
  }

  const magicBanner = els.dialogContent.querySelector("[data-magic-banner]");
  if (magicBanner) {
    magicBanner.addEventListener("change", () => {
      entry.magicBanner = magicBanner.value || null;
      updateDialogTotal();
    });
  }

  wireMagicEditors();
}

function wireMagicEditors() {
  const entry = state.draft;
  const unit = getUnit(entry.sectionKey, entry.unitId);

  els.dialogContent.querySelectorAll("[data-magic-item]").forEach(check => {
    check.addEventListener("change", () => {
      const context = check.dataset.magicContext;
      const target = context === "champion" ? entry.champion.magicItems : entry.magicItems;
      const max = getMagicMaximum(unit, context);

      if (check.checked) {
        if (target.length >= max) {
          check.checked = false;
          window.alert(`This model may take a maximum of ${max} magic item${max === 1 ? "" : "s"}.`);
          return;
        }

        const item = getMagicItem(check.dataset.magicItem);

        // One magic weapon.
        if (item?.category === "magic_weapon" &&
            target.some(id => getMagicItem(id)?.category === "magic_weapon")) {
          check.checked = false;
          window.alert("A character may only carry one magic weapon.");
          return;
        }

        target.push(check.dataset.magicItem);
      } else {
        const idx = target.indexOf(check.dataset.magicItem);
        if (idx >= 0) target.splice(idx, 1);
      }

      renderEditor();
    });
  });

  els.dialogContent.querySelectorAll("[data-magic-search]").forEach(search => {
    search.addEventListener("input", () => {
      const context = search.dataset.magicSearch;
      const query = search.value.trim().toLowerCase();
      const list = els.dialogContent.querySelector(`[data-magic-list="${context}"]`);

      list.querySelectorAll(".magic-item-row").forEach(row => {
        row.style.display = !query || row.dataset.magicName.includes(query) ? "" : "none";
      });

      list.querySelectorAll(".magic-category").forEach(category => {
        category.style.display = "";
      });
    });
  });
}

function updateDialogTotal() {
  els.dialogTotal.textContent = `${formatPoints(calculateEntry(state.draft))} pts`;

  const counters = els.dialogContent.querySelectorAll(".magic-editor");
  counters.forEach(editor => {
    const context = editor.dataset.magicContext;
    const unit = getUnit(state.draft.sectionKey, state.draft.unitId);
    const selected = selectedMagicIds(state.draft, context);
    const max = getMagicMaximum(unit, context);
    const counter = editor.querySelector(".magic-counter");
    if (counter) counter.textContent = `${selected.length} / ${max}`;
  });
}

function saveEditor() {
  const index = state.roster.findIndex(e => e.id === state.editingEntryId);
  if (index < 0 || !state.draft) return;

  state.roster[index] = clone(state.draft);
  closeEditor();
  renderArmy();
}


function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2200);
}

function getSavedRosters() {
  try {
    const raw = localStorage.getItem(SAVED_ROSTERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read saved rosters", error);
    return [];
  }
}

function writeSavedRosters(rosters) {
  localStorage.setItem(SAVED_ROSTERS_KEY, JSON.stringify(rosters));
}

function makeRosterSnapshot() {
  return {
    id: state.currentSaveId || makeId(),
    name: (state.rosterName || "Unnamed Army").trim() || "Unnamed Army",
    factionId: state.data.faction?.id || state.selectedArmyId,
    factionName: state.data.faction?.name || "Unknown Army",
    armyId: state.selectedArmyId,
    dataFile: state.armyManifest?.armies?.find(a => a.id === state.selectedArmyId)?.dataFile || null,
    pointsLimit: state.pointsLimit,
    roster: clone(state.roster),
    totalPoints: calculateArmyTotal(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1
  };
}

function saveRoster() {
  const snapshot = makeRosterSnapshot();
  const rosters = getSavedRosters();
  const existingIndex = rosters.findIndex(r => r.id === snapshot.id);

  if (existingIndex >= 0) {
    rosters[existingIndex] = snapshot;
  } else {
    rosters.unshift(snapshot);
  }

  writeSavedRosters(rosters);
  state.currentSaveId = snapshot.id;
  showToast(`Saved "${snapshot.name}"`);
}

function newRoster() {
  if (state.roster.length) {
    const ok = window.confirm("Start a new roster? Any unsaved changes to the current army will be lost.");
    if (!ok) return;
  }

  state.roster = [];
  state.pointsLimit = 2000;
  state.rosterName = `My ${state.data?.faction?.name || "Army"} Army`;
  state.currentSaveId = null;

  els.pointsLimit.value = state.pointsLimit;
  els.rosterName.value = state.rosterName;
  renderArmy();
  showToast("New roster started");
}

function openSavedRosters() {
  renderSavedRosters();
  els.savedRostersDialog.showModal();
}

function renderSavedRosters() {
  const rosters = getSavedRosters()
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

  if (!rosters.length) {
    els.savedRostersList.innerHTML = `
      <div class="saved-roster-empty">
        <strong>No saved rosters yet.</strong>
        <div style="margin-top:6px;">Use Save in the top bar to keep the current army in this browser.</div>
      </div>
    `;
    return;
  }

  els.savedRostersList.innerHTML = rosters.map(roster => {
    const when = roster.updatedAt ? new Date(roster.updatedAt).toLocaleString() : "";
    return `
      <article class="saved-roster-card">
        <div>
          <div class="saved-roster-name">${escapeHtml(roster.name || "Unnamed Army")}</div>
          <div class="saved-roster-meta">
            ${escapeHtml(roster.factionName || "The Empire")} ·
            ${formatPoints(roster.totalPoints || 0)} / ${formatPoints(roster.pointsLimit || 0)} pts
            ${when ? ` · Saved ${escapeHtml(when)}` : ""}
          </div>
        </div>
        <div class="saved-roster-actions">
          <button class="load-roster-button" type="button" data-load-roster="${escapeHtml(roster.id)}">Load</button>
          <button class="delete-roster-button" type="button" data-delete-roster="${escapeHtml(roster.id)}">Delete</button>
        </div>
      </article>
    `;
  }).join("");

  els.savedRostersList.querySelectorAll("[data-load-roster]").forEach(button => {
    button.addEventListener("click", () => loadRoster(button.dataset.loadRoster));
  });

  els.savedRostersList.querySelectorAll("[data-delete-roster]").forEach(button => {
    button.addEventListener("click", () => deleteRoster(button.dataset.deleteRoster));
  });
}

async function loadRoster(id) {
  const roster = getSavedRosters().find(r => r.id === id);
  if (!roster) return;

  if (state.roster.length) {
    const ok = window.confirm(`Load "${roster.name}"? Any unsaved changes to the current army will be lost.`);
    if (!ok) return;
  }

  const armyId = roster.armyId || roster.factionId || "empire";
  const army = state.armyManifest?.armies?.find(a => a.id === armyId);

  if (!army?.available) {
    window.alert(`The army data required for "${roster.name}" is not currently available.`);
    return;
  }

  try {
    DATA_URL = `./data/${army.dataFile}`;
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${DATA_URL}`);

    state.data = await response.json();
    state.selectedArmyId = armyId;
    buildIndexes();

    state.currentSaveId = roster.id;
    state.rosterName = roster.name || `My ${state.data.faction?.name || army.name} Army`;
    state.pointsLimit = Number(roster.pointsLimit || 2000);
    state.roster = clone(roster.roster || []);

    els.factionName.textContent = state.data.faction?.name || army.name;
    els.rosterName.value = state.rosterName;
    els.pointsLimit.value = state.pointsLimit;

    els.savedRostersDialog.close();
    els.armySelectionScreen.hidden = true;
    els.builderScreen.hidden = false;

    renderUnitBrowser();
    renderArmy();
    showToast(`Loaded "${state.rosterName}"`);
  } catch (error) {
    console.error(error);
    window.alert(`Could not load the army data for "${roster.name}".`);
  }
}

function deleteRoster(id) {
  const rosters = getSavedRosters();
  const roster = rosters.find(r => r.id === id);
  if (!roster) return;

  if (!window.confirm(`Delete the saved roster "${roster.name}"?`)) return;

  writeSavedRosters(rosters.filter(r => r.id !== id));

  if (state.currentSaveId === id) {
    state.currentSaveId = null;
  }

  renderSavedRosters();
  showToast(`Deleted "${roster.name}"`);
}

function getSelectedEquipmentIds(entry, unit) {
  const ids = new Set(unit.equipment || unit.defaultEquipment || []);

  for (const group of unit.equipmentOptions || []) {
    const selected = entry.equipmentSelections?.[group.id];
    if (selected) ids.add(selected);

    for (const extra of group.alsoMayTake || []) {
      if (entry.extraEquipment?.[extra]) ids.add(extra);
    }
  }

  for (const option of unit.options || []) {
    const selected = entry.optionSelections?.[option.id];
    if (selected == null || selected === false || selected === "" || selected === 0) continue;

    if (option.type === "choice_group") {
      const choice = (option.choices || []).find(c => (typeof c === "string" ? c : c.id) === selected);
      if (choice && typeof choice === "object") {
        for (const removed of choice.removesEquipment || []) ids.delete(removed);
        for (const added of choice.addsEquipment || []) ids.add(added);
      }
    } else {
      for (const removed of option.removesEquipment || []) ids.delete(removed);
      for (const added of option.addsEquipment || []) ids.add(added);
    }
  }

  return [...ids];
}

function calculatePrintedArmourSave(entry, unit) {
  const equipment = getSelectedEquipmentIds(entry, unit);

  // Base mundane armour. This is deliberately conservative; magical armour
  // effects remain in Notes unless represented by ordinary armour equipment.
  let save = null;

  if (equipment.includes("full_plate_armour")) save = 4;
  else if (equipment.includes("heavy_armour")) save = 5;
  else if (equipment.includes("light_armour")) save = 6;

  if (equipment.includes("shield")) {
    save = save == null ? 6 : Math.max(2, save - 1);
  }

  const mountId = entry.mount;
  const isMounted = Boolean(mountId) || unit.unitType === "cavalry" ||
    (unit.tags || []).includes("fast_cavalry");

  if (isMounted) {
    save = save == null ? 6 : Math.max(2, save - 1);
  }

  if (equipment.includes("barding")) {
    save = save == null ? 6 : Math.max(2, save - 1);
  }

  return save == null ? "–" : `${save}+`;
}

function profileForUnit(unit) {
  return profileById.get(unit.profileId) || null;
}

function profileStat(profile, key) {
  const value = profile?.stats?.[key];
  return value == null ? "–" : String(value);
}

function printableUnitName(entry, unit) {
  if (unit.points?.type === "per_model") {
    return `${entry.size} ${unit.name}`;
  }
  return unit.name;
}

function optionPrintLabel(entry, unit, option) {
  const selected = entry.optionSelections?.[option.id];
  if (selected == null || selected === false || selected === "" || selected === 0) return null;

  if (option.type === "quantity") {
    return `${humanise(option.id)}: ${selected}`;
  }

  if (option.type === "choice_group") {
    const choice = (option.choices || []).find(c => (typeof c === "string" ? c : c.id) === selected);
    const label = typeof choice === "object"
      ? (choice.label || humanise(choice.id))
      : getEquipmentName(selected);
    return label;
  }

  return option.label || humanise(option.id);
}

function rosterPadNotes(entry, unit) {
  const notes = [];
  const equipmentIds = getSelectedEquipmentIds(entry, unit);

  for (const id of equipmentIds) {
    notes.push(getEquipmentName(id));
  }

  if (entry.mount) {
    notes.push(`Mounted on ${getMountName(entry.mount)}`);

    const mount = (unit.mountOptions || []).find(m => m.mountId === entry.mount);
    for (const free of mount?.freeOptions || []) {
      if (!equipmentIds.includes(free)) notes.push(getEquipmentName(free));
    }
    for (const added of mount?.addsEquipment || []) {
      notes.push(getEquipmentName(added));
    }
  }

  for (const option of unit.options || []) {
    const label = optionPrintLabel(entry, unit, option);
    if (label) notes.push(label);
  }

  if (entry.command?.musician) notes.push("Musician");
  if (entry.command?.standardBearer) notes.push("Standard Bearer");

  if (entry.champion?.selected && unit.champion) {
    notes.push(unit.champion.name);
    for (const itemId of entry.champion.magicItems || []) {
      const item = getMagicItem(itemId);
      if (item) notes.push(`${item.name}${item.rules ? ` — ${item.rules}` : ""}`);
    }
  }

  if (entry.magicBanner) {
    const item = getMagicItem(entry.magicBanner);
    if (item) notes.push(`${item.name}${item.rules ? ` — ${item.rules}` : ""}`);
  }

  for (const itemId of entry.magicItems || []) {
    const item = getMagicItem(itemId);
    if (item) notes.push(`${item.name}${item.rules ? ` — ${item.rules}` : ""}`);
  }

  // Built-in equipment/magic items on special characters are part of their printed roster entry.
  for (const itemId of unit.fixedMagicItems || []) {
    const item = getMagicItem(itemId) ||
      (state.data.faction.specialCharacterOnlyItems || []).find(i => i.id === itemId);
    if (item) notes.push(`${item.name}${item.rules ? ` — ${item.rules}` : ""}`);
  }

  for (const eq of unit.fixedEquipment || []) {
    notes.push(getEquipmentName(eq));
  }

  for (const rule of unit.rules || []) {
    notes.push(rule);
  }

  // Avoid duplicate note lines while preserving order.
  return notes.filter((value, index, array) =>
    value && array.findIndex(x => String(x).toLowerCase() === String(value).toLowerCase()) === index
  );
}

function rosterPadProfileCells(profile) {
  return `
    <td class="stat">${escapeHtml(profileStat(profile, "M"))}</td>
    <td class="stat">${escapeHtml(profileStat(profile, "WS"))}</td>
    <td class="stat">${escapeHtml(profileStat(profile, "BS"))}</td>
    <td class="stat">${escapeHtml(profileStat(profile, "S"))}</td>
    <td class="stat">${escapeHtml(profileStat(profile, "T"))}</td>
    <td class="stat">${escapeHtml(profileStat(profile, "W"))}</td>
    <td class="stat">${escapeHtml(profileStat(profile, "I"))}</td>
    <td class="stat">${escapeHtml(profileStat(profile, "A"))}</td>
    <td class="stat">${escapeHtml(profileStat(profile, "Ld"))}</td>
  `;
}

function rosterPadNotesInline(notes) {
  if (!notes?.length) return "";
  return notes.map(note => escapeHtml(note)).join("; ");
}

function rosterPadMountRow(entry, unit) {
  if (!entry.mount) return "";

  const mount = mountById.get(entry.mount);
  if (!mount || mount.displayProfileOnRoster === false) return "";

  const profile = profileById.get(mount.profileId);
  if (!profile) return "";

  const mountNotes = [];

  for (const rule of mount.rules || []) {
    mountNotes.push(humanise(rule));
  }

  const selectedMount = (unit.mountOptions || []).find(m => m.mountId === entry.mount);

  for (const option of selectedMount?.freeOptions || []) {
    mountNotes.push(getEquipmentName(option));
  }

  for (const option of selectedMount?.addsEquipment || []) {
    mountNotes.push(getEquipmentName(option));
  }

  return `
    <tr class="mount-row">
      <td class="unit-cell mount-name">↳ ${escapeHtml(mount.name)}</td>
      ${rosterPadProfileCells(profile)}
      <td class="save">–</td>
      <td class="notes-cell mount-notes">${rosterPadNotesInline(mountNotes.length ? mountNotes : ["Mount"])}</td>
      <td class="points-cell"></td>
    </tr>
  `;
}

function rosterPadChampionRow(entry, unit) {
  if (!entry.champion?.selected || !unit.champion?.profileId) return "";

  const profile = profileById.get(unit.champion.profileId);
  if (!profile) return "";

  const championNotes = [];
  championNotes.push("Unit Champion");

  for (const itemId of entry.champion.magicItems || []) {
    const item = getMagicItem(itemId);
    if (item) championNotes.push(`${item.name}${item.rules ? ` — ${item.rules}` : ""}`);
  }

  return `
    <tr class="champion-row">
      <td class="unit-cell champion-name">↳ ${escapeHtml(unit.champion.name)}</td>
      ${rosterPadProfileCells(profile)}
      <td class="save">${escapeHtml(calculatePrintedArmourSave(entry, unit))}</td>
      <td class="notes-cell champion-notes">${rosterPadNotesInline(championNotes)}</td>
      <td class="points-cell"></td>
    </tr>
  `;
}

function rosterPadUnitMountRow(entry, unit) {
  const unitMount = unit.unitMount;
  if (!unitMount?.mountId) return "";

  const mount = mountById.get(unitMount.mountId);
  if (!mount) return "";

  const profile = profileById.get(mount.profileId);
  if (!profile) return "";

  const notes = [];
  for (const equipment of unitMount.equipment || []) {
    notes.push(getEquipmentName(equipment));
  }
  for (const rule of mount.rules || []) {
    notes.push(humanise(rule));
  }

  const label = unit.points?.type === "per_model"
    ? `${entry.size} ${unitMount.name || mount.name}`
    : (unitMount.name || mount.name);

  return `
    <tr class="unit-mount-row">
      <td class="unit-cell unit-mount-name">↳ ${escapeHtml(label)}</td>
      ${rosterPadProfileCells(profile)}
      <td class="save">–</td>
      <td class="notes-cell unit-mount-notes">${rosterPadNotesInline(notes.length ? notes : ["Mounts"])}</td>
      <td class="points-cell"></td>
    </tr>
  `;
}

function resolveWarMachineCrew(entry, unit) {
  if (!unit.crew) return null;

  let crew = {
    baseCount: Number(unit.crew.baseCount || 0),
    profileId: unit.crew.profileId,
    name: unit.crew.name || "Crew"
  };

  for (const conditional of unit.crew.conditionalCrew || []) {
    if (entry.optionSelections?.[conditional.whenOptionSelected]) {
      crew = {
        baseCount: Number(conditional.baseCount || 0),
        profileId: conditional.profileId,
        name: conditional.name || "Crew"
      };
    }
  }

  if (unit.crew.extraCrewOptionId) {
    crew.baseCount += Number(entry.optionSelections?.[unit.crew.extraCrewOptionId] || 0);
  }

  return crew;
}

function rosterPadWarMachineCrewRow(entry, unit) {
  if (entry.sectionKey !== "warMachines") return "";

  const crew = resolveWarMachineCrew(entry, unit);
  if (!crew?.profileId || crew.baseCount <= 0) return "";

  const profile = profileById.get(crew.profileId);
  if (!profile) return "";

  const label = crew.baseCount === 1
    ? crew.name.replace(/s$/, "")
    : `${crew.baseCount} ${crew.name}`;

  const notes = ["Crew"];

  if (unit.crew?.extraCrewOptionId) {
    const extra = Number(entry.optionSelections?.[unit.crew.extraCrewOptionId] || 0);
    if (extra > 0) notes.push(`${extra} extra crew`);
  }

  return `
    <tr class="crew-row">
      <td class="unit-cell crew-name">↳ ${escapeHtml(label)}</td>
      ${rosterPadProfileCells(profile)}
      <td class="save">–</td>
      <td class="notes-cell crew-notes">${rosterPadNotesInline(notes)}</td>
      <td class="points-cell"></td>
    </tr>
  `;
}

function rosterPadRow(entry) {
  const unit = getUnit(entry.sectionKey, entry.unitId);
  const profile = profileForUnit(unit);
  const notes = rosterPadNotes(entry, unit);

  const unitRow = `
    <tr>
      <td class="unit-cell">${escapeHtml(printableUnitName(entry, unit))}</td>
      ${rosterPadProfileCells(profile)}
      <td class="save">${escapeHtml(calculatePrintedArmourSave(entry, unit))}</td>
      <td class="notes-cell">${rosterPadNotesInline(notes)}</td>
      <td class="points-cell">${formatPoints(calculateEntry(entry))}</td>
    </tr>
  `;

  return unitRow
    + rosterPadChampionRow(entry, unit)
    + rosterPadUnitMountRow(entry, unit)
    + rosterPadMountRow(entry, unit)
    + rosterPadWarMachineCrewRow(entry, unit);
}

function exportPrintableRoster() {
  if (!state.roster.length) {
    window.alert("Add some units before creating a roster pad.");
    return;
  }

  const total = calculateArmyTotal();
  const regimentPoints = calculateRegimentPoints();
  const regimentPercent = state.pointsLimit ? regimentPoints / state.pointsLimit * 100 : 0;

  const rows = state.roster.map(rosterPadRow).join("");

  const printable = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(state.rosterName)} - Warhammer Roster Sheet</title>
<style>
  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    color: #111;
    background: #fff;
    font-family: "Times New Roman", Times, serif;
  }

  body {
    width: 100%;
  }

  .sheet {
    min-height: 276mm;
    padding: 3mm 3mm 2mm;
    border: 1px solid #c9c9c9;
    background:
      linear-gradient(rgba(255,255,255,.985), rgba(255,255,255,.985)),
      repeating-linear-gradient(45deg, #f4f4f1 0, #f4f4f1 1px, transparent 1px, transparent 5px);
  }

  .sheet-header {
    display: grid;
    grid-template-columns: 1fr 85mm;
    gap: 8mm;
    align-items: end;
    margin: 0 1mm 2.5mm;
  }

  .sheet-title {
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 20pt;
    font-weight: 900;
    letter-spacing: -.02em;
    white-space: nowrap;
  }

  .army-name-box {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 3mm;
    align-items: center;
    font-size: 9pt;
    font-weight: 700;
  }

  .army-name-value {
    min-height: 8mm;
    padding: 1.5mm 2mm;
    border: .35mm solid #222;
    font-size: 11pt;
    font-weight: 400;
  }

  table.roster-pad {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    border: .5mm solid #111;
  }

  table.roster-pad th,
  table.roster-pad td {
    border: .25mm solid #222;
  }

  table.roster-pad th {
    padding: 1.2mm .6mm;
    background: #f7f7f7;
    font-size: 7.5pt;
    font-weight: 700;
    text-align: center;
    line-height: 1;
  }

  table.roster-pad td {
    padding: 1.6mm 1mm;
    vertical-align: top;
    font-size: 7.6pt;
    line-height: 1.18;
  }

  .col-unit { width: 38mm; }
  .col-stat { width: 7.2mm; }
  .col-save { width: 9mm; }
  .col-notes { width: auto; }
  .col-points { width: 19mm; }

  .unit-cell {
    font-weight: 700;
    text-transform: uppercase;
    word-break: normal;
  }

  .stat, .save, .points-cell {
    text-align: center;
  }

  .notes-cell {
    font-size: 7.2pt !important;
    line-height: 1.28 !important;
    overflow-wrap: anywhere;
  }

  .points-cell {
    font-weight: 700;
    font-size: 8.5pt !important;
  }

  .mount-row td,
  .champion-row td,
  .unit-mount-row td,
  .crew-row td {
    background: #fafafa;
    border-top: 0 !important;
  }

  .mount-name,
  .champion-name,
  .unit-mount-name,
  .crew-name {
    padding-left: 4mm !important;
    font-weight: 700;
    text-transform: none;
    font-style: italic;
  }

  .mount-notes,
  .champion-notes,
  .unit-mount-notes,
  .crew-notes {
    color: #444;
    font-style: italic;
  }

  tbody tr {
    break-inside: avoid;
  }

  .total-row td {
    height: 10mm;
    vertical-align: middle !important;
    font-size: 13pt !important;
    font-weight: 900;
  }

  .total-label {
    text-align: right;
    letter-spacing: .02em;
  }

  .sheet-footer {
    margin: 2.5mm 1mm 0;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6mm;
    align-items: end;
    color: #555;
    font-size: 6.5pt;
  }

  .summary-line {
    font-weight: 700;
  }

  .print-controls {
    position: fixed;
    right: 14px;
    top: 14px;
    z-index: 10;
    display: flex;
    gap: 7px;
    font-family: Arial, sans-serif;
  }

  .print-controls button {
    padding: 8px 11px;
    border: 1px solid #333;
    border-radius: 4px;
    background: #fff;
    color: #111;
    font: 700 12px Arial, sans-serif;
    cursor: pointer;
  }

  @media print {
    .print-controls { display: none !important; }
    .sheet { border-color: #ddd; }
  }
</style>
</head>
<body>
<div class="print-controls">
  <button onclick="window.print()">Print / Save PDF</button>
  <button onclick="window.close()">Close</button>
</div>

<main class="sheet">
  <header class="sheet-header">
    <h1 class="sheet-title">WARHAMMER ROSTER SHEET</h1>
    <div class="army-name-box">
      <span>ARMY:</span>
      <div class="army-name-value">${escapeHtml(state.rosterName || "Unnamed Army")}</div>
    </div>
  </header>

  <table class="roster-pad">
    <colgroup>
      <col class="col-unit">
      <col class="col-stat"><col class="col-stat"><col class="col-stat"><col class="col-stat">
      <col class="col-stat"><col class="col-stat"><col class="col-stat"><col class="col-stat"><col class="col-stat">
      <col class="col-save">
      <col class="col-notes">
      <col class="col-points">
    </colgroup>
    <thead>
      <tr>
        <th>Models/Unit</th>
        <th>M</th>
        <th>WS</th>
        <th>BS</th>
        <th>S</th>
        <th>T</th>
        <th>W</th>
        <th>I</th>
        <th>A</th>
        <th>Ld</th>
        <th>Save</th>
        <th>Notes</th>
        <th>Points Value</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="12" class="total-label">TOTAL</td>
        <td class="points-cell">${formatPoints(total)}</td>
      </tr>
    </tbody>
  </table>

  <footer class="sheet-footer">
    <div>
      <div class="summary-line">${escapeHtml(state.data.faction?.name || "The Empire")} · ${formatPoints(total)} / ${formatPoints(state.pointsLimit)} pts · Regiments ${formatPoints(regimentPoints)} pts (${formatPoints(regimentPercent)}%)</div>
      <div>Warhammer Renaissance roster generated from the user's army list.</div>
    </div>
    <div>WHR ARMY BUILDER</div>
  </footer>
</main>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    window.alert("The roster pad was blocked by your browser. Allow pop-ups for this site and try again.");
    return;
  }

  win.document.open();
  win.document.write(printable);
  win.document.close();
}

function buildIndexes() {
  equipmentById = new Map((state.data.equipment || []).map(x => [x.id, x]));
  magicById = new Map([
    ...(state.data.commonMagicItems || []),
    ...(state.data.factionMagicItems || [])
  ].map(x => [x.id, x]));
  mountById = new Map((state.data.mounts || []).map(x => [x.id, x]));
  profileById = new Map((state.data.profiles || []).map(x => [x.id, x]));
}

function wireEvents() {
  els.backToArmiesBtn.addEventListener("click", showArmySelection);
  els.unitSearch.addEventListener("input", renderUnitBrowser);

  els.rosterName.addEventListener("input", () => {
    state.rosterName = els.rosterName.value;
    els.armyTitle.textContent = state.rosterName || `${state.data?.faction?.name || "The Empire"} Army`;
  });

  els.newRosterBtn.addEventListener("click", newRoster);
  els.saveRosterBtn.addEventListener("click", saveRoster);
  els.savedRostersBtn.addEventListener("click", openSavedRosters);
  els.printRosterBtn.addEventListener("click", exportPrintableRoster);

  els.savedRostersCloseBtn.addEventListener("click", () => els.savedRostersDialog.close());
  els.savedRostersDialog.addEventListener("cancel", event => {
    event.preventDefault();
    els.savedRostersDialog.close();
  });

  els.pointsLimit.addEventListener("input", () => {
    state.pointsLimit = Math.max(1, Number(els.pointsLimit.value || 1));
    renderArmy();
  });

  els.clearArmyBtn.addEventListener("click", () => {
    if (!state.roster.length) return;
    if (!window.confirm("Clear every unit from this army?")) return;
    state.roster = [];
    renderArmy();
  });

  els.dialogCloseBtn.addEventListener("click", closeEditor);
  els.dialogCancelBtn.addEventListener("click", closeEditor);

  els.editForm.addEventListener("submit", event => {
    event.preventDefault();
    saveEditor();
  });

  els.editDialog.addEventListener("cancel", event => {
    event.preventDefault();
    closeEditor();
  });
}

async function init() {
  wireEvents();

  try {
    await loadArmyManifest();
    renderArmySelection();

    els.armySelectionScreen.hidden = false;
    els.builderScreen.hidden = true;
  } catch (error) {
    console.error(error);
    els.armyCards.innerHTML = `
      <div class="error-box">
        <strong>Could not load the army list.</strong><br><br>
        Run this project through a local web server rather than opening
        <code>index.html</code> directly with <code>file://</code>.
      </div>
    `;
  }
}

init();
;
/* ===== END app.js ===== */

/* ===== BEGIN dev_startup_gate.js ===== */
// Keep army selection responsive while the heavier army rules bundle loads.
(() => {
  let resolveArmyFeatures;
  let rejectArmyFeatures;

  window.whrArmyFeaturesReady = new Promise((resolve, reject) => {
    resolveArmyFeatures = resolve;
    rejectArmyFeatures = reject;
  });
  window.whrResolveArmyFeatures = resolveArmyFeatures;
  window.whrRejectArmyFeatures = rejectArmyFeatures;

  if (typeof selectArmy === "function") {
    const previousSelectArmy = selectArmy;
    selectArmy = async function(armyId) {
      await window.whrArmyFeaturesReady;
      return previousSelectArmy(armyId);
    };
  }

  if (typeof loadRoster === "function") {
    const previousLoadRoster = loadRoster;
    loadRoster = async function(id) {
      await window.whrArmyFeaturesReady;
      return previousLoadRoster(id);
    };
  }
})();
;
/* ===== END dev_startup_gate.js ===== */

/* ===== BEGIN army_loading.js ===== */
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

// Tomb Kings Skeleton Light Chariots are regiment entries, so their crew and
// draught animals are not picked up by the generic war-machine/mount renderers.
(() => {
  const isSkeletonLightChariot = (entry, unit) =>
    state.data?.faction?.id === "tomb_kings" &&
    entry?.sectionKey === "regiments" &&
    unit?.id === "skeleton_light_chariots";

  const previousUnitMountRow = rosterPadUnitMountRow;
  rosterPadUnitMountRow = function(entry, unit) {
    let html = previousUnitMountRow(entry, unit);
    if (!isSkeletonLightChariot(entry, unit)) return html;

    html += previousUnitMountRow(entry, {
      ...unit,
      unitMount: {
        mountId: "undead_steed",
        name: "2 Undead Steeds per chariot",
        quantity: 2,
        equipment: []
      }
    });
    return html;
  };

  const previousCrewRow = rosterPadWarMachineCrewRow;
  rosterPadWarMachineCrewRow = function(entry, unit) {
    const html = previousCrewRow(entry, unit);
    if (!isSkeletonLightChariot(entry, unit)) return html;

    const profile = profileById.get("skeleton");
    if (!profile) return html;

    return html + `
      <tr class="crew-row">
        <td class="unit-cell crew-name">↳ 2 Skeleton Warrior crew per chariot</td>
        ${rosterPadProfileCells(profile)}
        <td class="save">5+</td>
        <td class="notes-cell crew-notes">${rosterPadNotesInline(["Light armour", "Spear", "Shield", "Bow", "Asp Arrows"])}</td>
        <td class="points-cell"></td>
      </tr>
    `;
  };
})();
;
/* ===== END army_loading.js ===== */

/* ===== BEGIN dev_runtime_loader.js ===== */
// Stable Dev runtime overrides.
// All JavaScript dependencies are now assembled by tools/build_dev_bundle.py
// into explicit core/account/campaign bundles. Do not dynamically inject
// application scripts from here.
(() => {
  const previousArmyMonogram = armyMonogram;
  armyMonogram = function(name) {
    const cleaned = String(name || "").replace(/^the\s+/i, "").trim();
    const ampersandMatch = cleaned.match(/^([^\s&]+)\s*&\s*([^\s&]+)/);
    if (ampersandMatch) {
      return `${ampersandMatch[1][0]}&${ampersandMatch[2][0]}`.toUpperCase();
    }
    return previousArmyMonogram(name);
  };
  if (state.armyManifest) renderArmySelection();

  const previousAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let items = previousAllowedMagicItems(unit, context) || [];
    if (typeof window.whrMagicItemEligibleForBearer === "function") {
      items = items.filter(item => window.whrMagicItemEligibleForBearer(item, unit, context));
    }
    const selectedIds = context === "champion"
      ? (state.draft?.champion?.magicItems || [])
      : (state.draft?.magicItems || []);
    const selectedArmour = selectedIds.find(id => getMagicItem(id)?.category === "magic_armour");
    if (selectedArmour) {
      items = items.filter(item => item.category !== "magic_armour" || item.id === selectedArmour);
    }
    return [...new Map(items.map(item => [item.id, item])).values()];
  };

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!state.data) return;
    if (typeof window.whrApplyEffectiveRegimentMinimums === "function") {
      window.whrApplyEffectiveRegimentMinimums();
    }
    renderUnitBrowser();
    renderArmy();
  };
})();
;
/* ===== END dev_runtime_loader.js ===== */

/* ===== BEGIN dev_branding.js ===== */
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
;
/* ===== END dev_branding.js ===== */
