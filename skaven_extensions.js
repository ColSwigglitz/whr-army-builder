// Skaven-specific builder behaviour, mainstay validation and Roster Pad support.
(() => {
  const previousFetch = window.fetch.bind(window);

  // The compact Skaven data keeps the common pool empty. Load the shared common
  // magic items from the Empire data in the same way as the other standalone armies.
  window.fetch = async function(input, init) {
    const response = await previousFetch(input, init);
    const url = typeof input === "string" ? input : input?.url || "";
    if (!response.ok || !(url.endsWith("data/whr_skaven_v0_1.json") || url.endsWith("/whr_skaven_v0_1.json"))) {
      return response;
    }

    try {
      const data = await response.clone().json();
      if (!data.commonMagicItems?.length) {
        const commonResponse = await previousFetch("./data/whr_empire_v0_1.json", { cache:"no-store" });
        if (commonResponse.ok) {
          const commonData = await commonResponse.json();
          data.commonMagicItems = commonData.commonMagicItems || [];
        }
      }
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type":"application/json" }
      });
    } catch (error) {
      console.error("Unable to enrich Skaven army data", error);
      return response;
    }
  };

  const isSkaven = () => state.data?.faction?.id === "skaven";
  const countUnit = unitId => state.roster.filter(entry => entry.unitId === unitId).length;
  const hasSkrolk = () => state.roster.some(entry => entry.sectionKey === "specialCharacters" && entry.unitId === "skrolk");

  state.armyOptions = state.armyOptions || {};

  function mainstayUnitId() {
    if (hasSkrolk() && state.armyOptions.skavenSkrolkGeneral) return "plague_monks";
    return "clanrat_warriors";
  }

  function mainstayName() {
    return mainstayUnitId() === "plague_monks" ? "Plague Monks" : "Clanrat Warriors";
  }

  function mainstayCount() {
    return countUnit(mainstayUnitId());
  }

  function mainstayViolations() {
    if (!isSkaven()) return [];
    const cap = mainstayCount();
    const mainstayId = mainstayUnitId();
    const counts = new Map();

    for (const entry of state.roster) {
      if (entry.sectionKey !== "regiments" && entry.sectionKey !== "warMachines") continue;
      if (entry.unitId === mainstayId) continue;
      counts.set(entry.unitId, (counts.get(entry.unitId) || 0) + 1);
    }

    const violations = [];
    for (const [unitId, count] of counts.entries()) {
      if (count <= cap) continue;
      const entry = state.roster.find(x => x.unitId === unitId);
      const unit = entry ? getUnit(entry.sectionKey, entry.unitId) : null;
      violations.push(`${unit?.name || humanise(unitId)}: ${count} choice${count === 1 ? "" : "s"}, maximum ${cap}`);
    }
    return violations;
  }

  function regimentModelPoints(entry, unit) {
    if (entry.sectionKey !== "regiments") return null;
    let total = Number(unit.points?.value || 0) * Number(entry.size || 0);
    for (const option of unit.options || []) {
      const selected = entry.optionSelections?.[option.id];
      if (!selected) continue;
      if (option.cost?.type === "per_model") {
        total += Number(option.cost.value || 0) * Number(entry.size || 0);
      } else if (option.type === "quantity") {
        total += Number(selected || 0) * Number(option.cost?.value || option.cost || 0);
      }
    }
    return total;
  }

  function undersizedRegiments() {
    if (!isSkaven()) return [];
    return state.roster.flatMap(entry => {
      if (entry.sectionKey !== "regiments") return [];
      const unit = getUnit(entry.sectionKey, entry.unitId);
      const points = regimentModelPoints(entry, unit);
      return points < 50 ? [`${unit.name}: ${formatPoints(points)} pts of regiment models`] : [];
    });
  }

  // BSB is explicitly 0-1; special characters are unique globally.
  const oldAddUnit = addUnit;
  addUnit = function(sectionKey, unitId) {
    if (isSkaven()) {
      const unit = getUnit(sectionKey, unitId);
      const alreadyPresent = state.roster.some(entry => entry.sectionKey === sectionKey && entry.unitId === unitId);
      if (alreadyPresent && ((unit?.tags || []).includes("zero_one") || sectionKey === "specialCharacters")) {
        window.alert(`${unit.name} may only be included once in a Skaven army.`);
        return;
      }
    }
    return oldAddUnit(sectionKey, unitId);
  };

  // Jezzails form units of one to five teams. The generic size input only has a
  // minimum, so enforce the source maximum on save.
  const oldSaveEditor = saveEditor;
  saveEditor = function() {
    if (isSkaven() && state.draft) {
      if (state.draft.unitId === "warplock_jezzail_team" && Number(state.draft.size || 0) > 5) {
        window.alert("A Warplock Jezzail unit may contain no more than five teams.");
        return;
      }
      if ((state.draft.unitId === "giant_rat_pack" || state.draft.unitId === "rat_ogre_pack") &&
          Number(state.draft.optionSelections?.packmasters || 0) < 1) {
        window.alert("A Giant Rat or Rat Ogre pack must include at least one Packmaster.");
        return;
      }
    }
    oldSaveEditor();
  };

  function secondaryRow(profileId, label, notes = [], css = "mount") {
    const profile = profileById.get(profileId);
    if (!profile) return "";
    return `
      <tr class="${css}-row">
        <td class="unit-cell ${css}-name">↳ ${escapeHtml(label || profile.name || humanise(profileId))}</td>
        ${rosterPadProfileCells(profile)}
        <td class="save">–</td>
        <td class="notes-cell ${css}-notes">${rosterPadNotesInline(notes)}</td>
        <td class="points-cell"></td>
      </tr>
    `;
  }

  function skavenAdditionalRows(entry, unit) {
    if (!isSkaven()) return "";
    let rows = "";

    for (const component of unit.additionalProfiles || []) {
      rows += secondaryRow(component.profileId, component.label, component.notes || ["Additional profile"]);
    }

    if (unit.id === "giant_rat_pack" || unit.id === "rat_ogre_pack") {
      const count = Number(entry.optionSelections?.packmasters || 0);
      if (count > 0) rows += secondaryRow("packmaster", `${count} Packmaster${count === 1 ? "" : "s"}`, ["Beastmasters"], "crew");
    }

    return rows;
  }

  const oldRosterPadRow = rosterPadRow;
  rosterPadRow = function(entry) {
    const base = oldRosterPadRow(entry);
    if (!isSkaven()) return base;
    const unit = getUnit(entry.sectionKey, entry.unitId);
    return base + skavenAdditionalRows(entry, unit);
  };

  const oldRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    oldRenderArmyStatus(total);
    if (!isSkaven()) return;

    const violations = mainstayViolations();
    const undersized = undersizedRegiments();
    const skrolk = hasSkrolk();

    const panel = document.createElement("div");
    panel.className = "warning-box";
    panel.style.marginTop = "10px";

    const selector = skrolk ? `
      <label style="display:flex;align-items:center;gap:7px;margin-top:7px;">
        <input type="checkbox" data-skaven-skrolk-general ${state.armyOptions.skavenSkrolkGeneral ? "checked" : ""}>
        <span>Lord Skrolk is the General — use Plague Monks as mainstay instead of Clanrat Warriors</span>
      </label>
    ` : "";

    const mainstayText = `<strong>Skaven mainstay:</strong> ${escapeHtml(mainstayName())} × ${mainstayCount()}.`;
    const violationText = violations.length
      ? `<div style="margin-top:5px;"><strong>Mainstay limit exceeded:</strong> ${violations.map(escapeHtml).join("; ")}</div>`
      : `<div style="margin-top:5px;">All regiment and war-machine choice counts are within the current mainstay limit.</div>`;
    const sizeText = undersized.length
      ? `<div style="margin-top:5px;"><strong>Regiments below 50 points of models:</strong> ${undersized.map(escapeHtml).join("; ")}</div>`
      : "";

    panel.innerHTML = `${mainstayText}${violationText}${sizeText}${selector}`;
    els.armyStatus.appendChild(panel);

    const toggle = panel.querySelector("[data-skaven-skrolk-general]");
    if (toggle) {
      toggle.addEventListener("change", () => {
        state.armyOptions.skavenSkrolkGeneral = toggle.checked;
        renderArmy();
      });
    }
  };
})();
