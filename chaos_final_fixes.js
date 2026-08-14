// Final Chaos construction edge cases layered after chaos_extensions.js.
(() => {
  const CHAOS_IDS = new Set(["chaos_warriors","chaos_beastmen","chaos_daemons","chaos_warband","chaos_warhost"]);
  const isChaos = () => state.data?.faction?.id === "chaos" && CHAOS_IDS.has(state.selectedArmyId);

  function singlePower() {
    if (!isChaos() || state.selectedArmyId === "chaos_warhost") return null;
    const stored = state.armyOptions?.chaosDevotions?.[state.selectedArmyId];
    if (state.selectedArmyId === "chaos_warband") return stored && stored !== "mixed" ? stored : "undivided";
    return stored && stored !== "mixed" ? stored : null;
  }

  function daemonPrinceIsBSB(entry = state.draft) {
    return Boolean(entry?.unitId === "daemon_prince" && entry.optionSelections?.battle_standard);
  }

  // In mixed Chaos forces the source reserves Ungor bows and Centaur missile
  // weapons for pure Beastmen armies.
  const previousRenderRegimentEditor = renderRegimentEditor;
  renderRegimentEditor = function(entry, unit) {
    if (!isChaos() || state.selectedArmyId === "chaos_beastmen") {
      return previousRenderRegimentEditor(entry, unit);
    }

    if (unit.id !== "ungors" && unit.id !== "centaurs") {
      return previousRenderRegimentEditor(entry, unit);
    }

    const view = clone(unit);
    if (view.id === "ungors") {
      view.options = (view.options || []).filter(option => option.id !== "short_bows");
    }
    if (view.id === "centaurs") {
      view.options = (view.options || []).map(option => {
        if (option.type !== "choice_group") return option;
        return {
          ...option,
          choices: (option.choices || []).filter(choice => {
            const id = typeof choice === "string" ? choice : choice.id;
            return id !== "bow" && id !== "throwing_spear";
          })
        };
      }).filter(option => option.type !== "choice_group" || (option.choices || []).length);
    }
    return previousRenderRegimentEditor(entry, view);
  };

  // A Daemon Prince using the Small reward may carry the battle standard.
  // In a single-Power army it may additionally carry a Chaos Banner without
  // reducing its normal Daemonic Reward allowance.
  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const result = previousGetAllowedMagicItems(unit, context);
    if (!isChaos() || context === "champion" || unit.id !== "daemon_prince" || !daemonPrinceIsBSB()) return result;

    const power = singlePower();
    if (!power) return result;

    const banners = (state.data.factionMagicItems || []).filter(item =>
      item.chaosBanner && (!item.chaosPower || item.chaosPower === power)
    );
    const byId = new Map(result.map(item => [item.id, item]));
    for (const banner of banners) byId.set(banner.id, banner);
    return [...byId.values()];
  };

  const previousGetMagicMaximum = getMagicMaximum;
  getMagicMaximum = function(unit, context) {
    const normal = previousGetMagicMaximum(unit, context);
    if (isChaos() && context !== "champion" && unit.id === "daemon_prince" && daemonPrinceIsBSB()) {
      return normal + 1;
    }
    return normal;
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isChaos() && state.draft?.unitId === "daemon_prince" && state.draft.optionSelections?.battle_standard) {
      if (!(state.draft.magicItems || []).includes("small")) {
        window.alert("A Daemon Prince may carry the battle standard only when it has the Small Daemonic Reward.");
        return;
      }
      if (state.draft.optionSelections?.wings) {
        window.alert("A Small Daemon Prince carrying the battle standard cannot have wings.");
        return;
      }
      const chosenBanner = (state.draft.magicItems || []).some(id => getMagicItem(id)?.chaosBanner);
      if (!singlePower() && chosenBanner) {
        window.alert("A Daemonic Battle Standard Bearer may carry a Chaos Banner only when the whole army is devoted to one Chaos Power.");
        return;
      }
    }
    previousSaveEditor();
  };

  // The source says the Warband general must be a character from the Chaos
  // Warrior section; this includes Chaos Sorcerers. Remove the earlier warning
  // when such a legal character is present, while retaining the BSB/core checks.
  const previousRenderArmyStatus = renderArmyStatus;
  renderArmyStatus = function(total) {
    previousRenderArmyStatus(total);
    if (!isChaos()) return;

    if (state.selectedArmyId === "chaos_warband" || state.selectedArmyId === "chaos_warhost") {
      const hasWarriorGeneralCandidate = state.roster.some(entry => {
        if (entry.sectionKey !== "characters") return false;
        const unit = getUnit(entry.sectionKey, entry.unitId);
        return unit?.chaosFaction === "warriors" && !(unit.tags || []).includes("battle_standard_bearer");
      });

      if (hasWarriorGeneralCandidate) {
        for (const span of els.armyStatus.querySelectorAll(".army-system-panel span")) {
          if (span.innerHTML.includes("A Warband/Warhost must include a Chaos Warrior character capable of being the general.")) {
            span.innerHTML = span.innerHTML.replace("A Warband/Warhost must include a Chaos Warrior character capable of being the general.", "").replace(/\s{2,}/g, " ");
          }
        }
      }

      const illegalDaemonBSB = state.roster.some(entry => entry.unitId === "daemon_prince" && entry.optionSelections?.battle_standard);
      if (illegalDaemonBSB) {
        const panel = els.armyStatus.querySelector(".army-system-panel:last-of-type");
        const copy = panel?.querySelector(".army-system-copy");
        if (copy) copy.insertAdjacentHTML("beforeend", `<span style="margin-top:6px;"><strong>Rules:</strong> A Warband/Warhost Battle Standard Bearer must come from the Chaos Warriors section.</span>`);
        if (panel) panel.classList.add("warn");
      }
    }
  };
})();
