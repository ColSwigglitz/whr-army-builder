// Restrict Orcs & Goblins special-character faction items to valid bearers.
(() => {
  const oldGetAllowedMagicItems = getAllowedMagicItems;

  function orcBearerType(unit) {
    switch (unit?.id) {
      case "azhag":
      case "gorfang":
      case "oglok":
      case "gorbad":
        return "common_orc";
      case "grom":
        return "common_goblin";
      case "skarsnik":
        return "night_goblin";
      case "morglum":
        return "black_orc";
      default:
        return null;
    }
  }

  getAllowedMagicItems = function(unit, context) {
    const items = oldGetAllowedMagicItems(unit, context);
    if (state.data?.faction?.id !== "orcs_goblins" || context === "champion") return items;

    const bearer = orcBearerType(unit);
    if (!bearer) return items;

    return items.filter(item => {
      const text = `${item.name || ""} ${item.rules || ""}`.toLowerCase();

      if (text.includes("common goblin") && bearer !== "common_goblin") return false;
      if (text.includes("common orc") && bearer !== "common_orc") return false;
      if (text.includes("forest goblin") && bearer !== "forest_goblin") return false;
      if (text.includes("night goblin") && bearer !== "night_goblin") return false;
      if ((text.includes("shaman only") || text.includes("shamans only")) && unit.id !== "azhag") return false;

      return true;
    });
  };
})();
