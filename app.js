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

  for (const group of unit.equipmentOptions || []) {
    const selected = entry.equipmentSelections?.[group.id];
    if (selected) {
      total += typeof group.cost === "number"
        ? Number(group.cost)
        : costFromDefinition(group.cost, entry.size);
    }
  }

  if (entry.mount) {
    const mount = (unit.mountOptions || []).find(m => m.mountId === entry.mount);
    total += Number(mount?.cost || 0);
  }

  for (const option of unit.options || []) {
    total += calculateOptionCost(entry, unit, option);
  }

  if (entry.command?.musician) total += Number(getCommandDefinition(unit, "musician").cost || 0);
  if (entry.command?.standardBearer) total += Number(getCommandDefinition(unit, "standardBearer").cost || 0);

  total += calculateChampionCost(entry, unit);
  total += (entry.magicItems || []).reduce((sum, id) => sum + Number(getMagicItem(id)?.cost || 0), 0);
  if (entry.magicBanner) total += Number(getMagicItem(entry.magicBanner)?.cost || 0);

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
  const cleaned = String(name || "").replace(/^the\s+/i, "").trim();
  const ampersandMatch = cleaned.match(/^([^\s&]+)\s*&\s*([^\s&]+)/);
  if (ampersandMatch) {
    return `${ampersandMatch[1][0]}&${ampersandMatch[2][0]}`.toUpperCase();
  }
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map(word => word[0]).join("").toUpperCase() || "WHR";
}

async function loadArmyManifest() {
  const response = await fetch(ARMIES_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${ARMIES_URL} (${response.status})`);
  state.armyManifest = await response.json();
}

/* Remaining application code unchanged. */
