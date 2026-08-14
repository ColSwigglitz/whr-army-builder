// Generic armour-save fixes plus High Elf exceptional armour rules.
(() => {
  const previousFetch = window.fetch.bind(window);

  function allFactionUnits(data) {
    const faction = data?.faction || {};
    return ["characters", "regiments", "warMachines", "specialCharacters"]
      .flatMap(key => faction[key] || []);
  }

  function patchHighElfArmourData(data) {
    if (data?.faction?.id !== "high_elves") return data;

    for (const unit of allFactionUnits(data)) {
      const name = String(unit.name || "").toLowerCase();

      // These saves are explicitly defined by their special rules/items and
      // should not be reconstructed from mundane equipment.
      if (name.includes("tyrion")) unit.fixedArmourSave = 1;
      if (name.includes("korhil")) unit.fixedArmourSave = 3;
    }

    const highElfItems = [
      ...(data.factionMagicItems || []),
      ...(data.faction?.specialCharacterOnlyItems || [])
    ];

    for (const item of highElfItems) {
      const name = String(item.name || "").toLowerCase();
      if (name === "armour of caledor") {
        // Dragon Armour with an additional +1 save: 4+ before shield/mount bonuses.
        item.armourSaveBase = 4;
      }
    }

    return data;
  }

  window.fetch = async function(input, init) {
    const response = await previousFetch(input, init);
    const url = typeof input === "string" ? input : input?.url || "";
    if (!response.ok || !(url.endsWith("data/whr_high_elves_v0_1.json") || url.endsWith("/whr_high_elves_v0_1.json"))) {
      return response;
    }

    try {
      const data = patchHighElfArmourData(await response.clone().json());
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Unable to patch High Elf armour data", error);
      return response;
    }
  };

  const oldGetSelectedEquipmentIds = getSelectedEquipmentIds;
  getSelectedEquipmentIds = function(entry, unit) {
    const ids = new Set(oldGetSelectedEquipmentIds(entry, unit));

    // Special characters keep their fixed equipment, and cavalry regiments
    // inherit equipment carried by their unit mount (notably barding).
    for (const id of unit.fixedEquipment || []) ids.add(id);
    for (const id of unit.unitMount?.equipment || []) ids.add(id);

    // Character mount options can grant equipment such as barding.
    // Only apply equipment from the currently selected mount option.
    if (entry.mount) {
      const selectedMount = (unit.mountOptions || []).find(m => m.mountId === entry.mount);
      for (const id of selectedMount?.freeOptions || []) ids.add(id);
      for (const id of selectedMount?.addsEquipment || []) ids.add(id);
    }

    return [...ids];
  };

  function equipmentNames(ids) {
    return ids.map(id => String(equipmentById.get(id)?.name || humanise(id)).toLowerCase());
  }

  function selectedMagicArmourEffects(entry, unit) {
    // Do not include champion items here: this function calculates the parent
    // unit/character save. Champion rows are deliberately kept separate.
    const ids = [
      ...(entry.magicItems || []),
      ...(unit.fixedMagicItems || [])
    ];

    const items = ids.map(id => getMagicItem(id) ||
      (state.data?.faction?.specialCharacterOnlyItems || []).find(item => item.id === id)
    ).filter(Boolean);

    return {
      fixed: items.find(item => Number(item.fixedArmourSave) > 0)?.fixedArmourSave ?? null,
      bases: items.map(item => Number(item.armourSaveBase)).filter(Number.isFinite),
      modifier: items.reduce((sum, item) => sum + Number(item.armourSaveModifier || 0), 0)
    };
  }

  calculatePrintedArmourSave = function(entry, unit) {
    if (Number(unit.fixedArmourSave) > 0) return `${Number(unit.fixedArmourSave)}+`;

    const equipment = getSelectedEquipmentIds(entry, unit);
    const names = equipmentNames(equipment);
    const hasName = pattern => names.some(name => pattern.test(name));

    let save = null;

    if (equipment.includes("full_plate_armour") || hasName(/full plate/)) save = 4;
    else if (equipment.includes("heavy_armour") || hasName(/heavy armour|dragon armour/)) save = 5;
    else if (equipment.includes("light_armour") || hasName(/light armour/)) save = 6;

    const magic = selectedMagicArmourEffects(entry, unit);
    if (magic.fixed) return `${Number(magic.fixed)}+`;
    for (const base of magic.bases) save = save == null ? base : Math.min(save, base);

    if (equipment.includes("shield") || hasName(/^shield$|\bshield\b/)) {
      save = save == null ? 6 : Math.max(2, save - 1);
    }

    const isMounted = Boolean(entry.mount) || Boolean(unit.unitMount?.mountId) ||
      unit.unitType === "cavalry" || (unit.tags || []).includes("fast_cavalry");

    if (isMounted) {
      save = save == null ? 6 : Math.max(2, save - 1);
    }

    if (equipment.includes("barding") || hasName(/barding/)) {
      save = save == null ? 6 : Math.max(2, save - 1);
    }

    if (save != null && magic.modifier) {
      save = Math.max(2, save - magic.modifier);
    }

    return save == null ? "–" : `${save}+`;
  };
})();
