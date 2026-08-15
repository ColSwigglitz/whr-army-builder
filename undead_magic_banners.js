// Shared magic-banner support for Vampire Counts, Tomb Kings and Classic Undead.
(() => {
  const UNDEAD_ARMIES = new Set(["vampire_counts", "tomb_kings", "classic_undead"]);

  const UNDEAD_BANNERS = [
    {id:"banner_swift_shooting",name:"Banner of Swift Shooting",category:"magic_banner",cost:10,rules:"Once per game, the unit may either fire its missile weapons twice at the same target in one Shooting phase, or make a Stand and Shoot reaction, in either case without penalties to hit."},
    {id:"banner_swift_charging",name:"Banner of Swift Charging",category:"magic_banner",cost:10,rules:"One use only. On its first charge, the unit adds +2 inches to its charge range."},
    {id:"standard_hellish_vigour",name:"Standard of Hellish Vigour",category:"magic_banner",cost:10,rules:"Undead regiments only. Initiative 10."},
    {id:"ghost_rider_banner",name:"Ghost Rider Banner",category:"magic_banner",cost:10,rules:"Skeleton Horsemen only. The unit may move through terrain in the same way as ethereal models."},
    {id:"icon_rakaph",name:"Icon of Rakaph",category:"magic_banner",cost:25,rules:"Tomb Guards only. Once per battle, the unit may make a free complete reform before charges are declared."},
    {id:"doom_rider_banner",name:"Doom Rider Banner",category:"magic_banner",cost:25,rules:"Skeleton Horsemen only. Riders hit automatically on the charge; does not affect steeds or accompanying characters."},
    {id:"banner_hidden_death",name:"Banner of Hidden Death",category:"magic_banner",cost:25,rules:"Battle Standard Bearer only. Monstrous Scorpions and Scorpion Swarms may deploy up to 12 inches from the enemy after scouts but before vanguard moves."},
    {id:"standard_desert",name:"Standard of the Desert",category:"magic_banner",cost:25,rules:"Regiments from the Tomb Kings army only. The regiment may march even outside 12 inches of the general and with enemies within 8 inches at the start of the turn."},
    {id:"banner_blood_keep",name:"Banner of Blood Keep",category:"magic_banner",cost:100,rules:"All Vampires in the regiment become subject to frenzy. Vampires leaving the unit lose the frenzy at the beginning of the next player turn."},
    {id:"banner_binding",name:"Banner of Binding",category:"magic_banner",cost:100,rules:"Skeletons only, but not Tomb Guard."}
  ];

  function isUndeadArmy() {
    return UNDEAD_ARMIES.has(state.selectedArmyId) && UNDEAD_ARMIES.has(state.data?.faction?.id);
  }

  function hasStandardBearer(unit) {
    if (!unit || (unit.tags || []).includes("skirmisher")) return false;
    const definition = getCommandDefinition(unit, "standardBearer");
    return definition?.allowed !== false;
  }

  function isSkeletonHorsemen(unit) {
    return /skeleton.*(light|heavy)?.*horse/i.test(String(unit?.name || ""));
  }

  function isTombGuard(unit) {
    return unit?.id === "tomb_guards" || /tomb guard/i.test(String(unit?.name || ""));
  }

  function isSkeletonRegiment(unit) {
    return /skeleton/i.test(String(unit?.name || "")) && !isTombGuard(unit);
  }

  function bannerAllowedForRegiment(item, unit) {
    if (!item || item.category !== "magic_banner") return true;
    switch (item.id) {
      case "standard_hellish_vigour": return (unit.tags || []).includes("undead");
      case "ghost_rider_banner":
      case "doom_rider_banner": return isSkeletonHorsemen(unit);
      case "icon_rakaph": return isTombGuard(unit);
      case "banner_hidden_death": return false;
      case "standard_desert": return state.selectedArmyId === "tomb_kings";
      case "banner_binding": return isSkeletonRegiment(unit);
      default: return true;
    }
  }

  function bannerAllowedForBsb(item) {
    if (!item || item.category !== "magic_banner") return false;
    switch (item.id) {
      case "ghost_rider_banner":
      case "doom_rider_banner":
      case "icon_rakaph":
      case "standard_desert":
      case "banner_binding":
        return false;
      default:
        return true;
    }
  }

  function patchUndeadData() {
    if (!isUndeadArmy() || state.data.__undeadMagicBannersPatched) return;
    state.data.__undeadMagicBannersPatched = true;

    state.data.factionMagicItems = state.data.factionMagicItems || [];
    for (const banner of UNDEAD_BANNERS) {
      if (!state.data.factionMagicItems.some(item => item.id === banner.id)) {
        state.data.factionMagicItems.push({...banner});
      }
    }

    for (const unit of state.data.faction?.regiments || []) {
      if (hasStandardBearer(unit)) {
        unit.magicBanner = {...(unit.magicBanner || {}), allowed:true};
      }
    }
  }

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!isUndeadArmy()) return;
    patchUndeadData();
    buildIndexes();
    renderUnitBrowser();
    renderArmy();
  };

  const previousRenderMagicBannerEditor = renderMagicBannerEditor;
  renderMagicBannerEditor = function(entry, unit) {
    if (!isUndeadArmy()) return previousRenderMagicBannerEditor(entry, unit);
    patchUndeadData();
    const original = state.data.factionMagicItems;
    state.data.factionMagicItems = (original || []).filter(item => bannerAllowedForRegiment(item, unit));
    try {
      return previousRenderMagicBannerEditor(entry, unit);
    } finally {
      state.data.factionMagicItems = original;
    }
  };

  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let items = previousGetAllowedMagicItems(unit, context);
    if (!isUndeadArmy() || context !== "character" || !(unit?.tags || []).some(tag => tag === "bsb" || tag === "battle_standard_bearer")) {
      return items;
    }
    patchUndeadData();
    const banners = (state.data.factionMagicItems || []).filter(bannerAllowedForBsb);
    const seen = new Set(items.map(item => item.id));
    for (const banner of banners) if (!seen.has(banner.id)) items.push(banner);
    return items;
  };
})();