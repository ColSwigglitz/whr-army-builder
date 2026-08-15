// Enforce bearer restrictions on magic items borrowed from other army books.
(() => {
  const isDoW = () => state.data?.faction?.id === "dogs_of_war" && state.selectedArmyId === "dogs_of_war";
  const isKnightUnit = unit => unit?.id === "human_knights";

  function legalBorrowedItem(item, unit, context) {
    if (!item?.dowSourceFaction) return true;
    const rules = String(item.rules || "");

    // Source-book unit-specific items remain restricted to the unit named by
    // their original book; a generic Dogs of War regiment does not inherit that identity.
    if (item.allowedUnitIds?.length && !item.allowedUnitIds.includes(unit?.id)) return false;
    if (item.generalOnly || item.lordOnly || item.wizardOnly || item.commonerChampionOnly) return false;
    if (/\b(general|lord|wizard|mage|priest|runesmith) only\b/i.test(rules)) return false;

    // Bretonnian knightly items/virtues are only meaningful to the explicit
    // Human Knights exception in the Dogs of War list.
    if (item.knightlyOnly && !isKnightUnit(unit)) return false;
    if (item.isVirtue && !(context === "champion" && isKnightUnit(unit))) return false;

    return true;
  }

  const previousGetAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    const items = previousGetAllowedMagicItems(unit, context);
    if (!isDoW()) return items;
    return items.filter(item => legalBorrowedItem(item, unit, context));
  };

  const previousSaveEditor = saveEditor;
  saveEditor = function() {
    if (isDoW() && state.draft) {
      const selected = [
        ...(state.draft.dowLeaderMagicItems || []),
        ...(state.draft.dowExtraChampionItems || [])
      ].filter(Boolean);
      if (new Set(selected).size !== selected.length) {
        window.alert("Each magic item is unique in the army; the same item cannot be selected more than once for this unit.");
        return;
      }
    }
    return previousSaveEditor();
  };
})();
