from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

# Keep initial page startup deliberately small. This is enough to fetch and
# render data/armies.json, provide the loading overlay, and install the dev
# wrappers. The heavier army-specific rules are loaded after the army cards
# have rendered.
STARTUP_SOURCES = [
    "app.js",
    "dev_startup_gate.js",
    "army_loading.js",
    "dev_runtime_loader.js",
    "dev_branding.js",
]

ARMY_SOURCES = [
    "bootstrap.js",
    "chaos_dwarfs_payload_loader.js",
    "wood_elves_loader.js",
    "dwarf_payload_loader.js",
    "dogs_of_war_loader.js",
    "lizardmen_loader.js",
    "kislev_loader.js",
    "norse_loader.js",
    "slann_empire_loader.js",
    "global_release_rules.js",
    "army_extensions.js",
    "army_extensions_vampire_fix.js",
    "vampire_champion_fixes.js",
    "chaos_state_guard.js",
    "dwarf_extensions.js",
    "dwarf_validation_patch.js",
    "armour_save_fixes.js",
    "orc_special_character_fixes.js",
    "orc_shaman_fixes.js",
    "orc_magic_item_filter.js",
    "bretonnia_extensions.js",
    "skaven_extensions.js",
    "skaven_variable_units.js",
    "chaos_extensions.js",
    "chaos_final_fixes.js",
    "common_magic_item_effects.js",
    "undead_magic_banners.js",
    "chaos_abomination.js",
    "chaos_abomination_mount_guard.js",
    "chaos_dwarfs_extensions.js",
    "chaos_dwarfs_final_fixes.js",
    "halflings_loader.js",
    "ogre_mercenaries_loader.js",
    "halflings_extensions.js",
    "halflings_final_fixes.js",
    "dark_elves_loader.js",
    "dark_elves_extensions.js",
    "dark_elves_final_fixes.js",
    "wood_elves_extensions.js",
    "wood_elves_final_fixes.js",
    "dogs_of_war_extensions.js",
    "dogs_of_war_dwarf_runes.js",
    "dogs_of_war_final_fixes.js",
    "dogs_of_war_magic_guard.js",
    "lizardmen_extensions.js",
    "lizardmen_final_fixes.js",
    "ogre_mercenaries_extensions.js",
    "ogre_mercenaries_final_fixes.js",
    "ogre_mercenaries_guard.js",
    "kislev_extensions.js",
    "norse_extensions.js",
    "norse_final_fixes.js",
    "norse_guard.js",
    "slann_empire_extensions.js",
    "slann_empire_final_fixes.js",
    "global_consistency_fixes.js",
    "special_character_magic_fixes.js",
    "special_character_mount_fixes.js",
    "tomb_kings_champion_fix.js",
    "classic_undead_champion_fix.js",
    "roster_interactions.js",
    "unit_model_count.js",
    "unit_scrollbar.js",
    "roster_pad_sort.js",
    "roster_pad_layout_fix.js",
    "swarm_unit_fixes.js",
    "vampire_wraith_steed_fix.js",
    "global_zero_one.js",
    "chaos_daemon_regiment_items.js",
    "dogs_of_war_regiments_of_renown.js",
    "general_system.js",
    "general_overrides.js",
    "dev_roster_pad_sort.js",
]

ACCOUNT_SOURCES = [
    "dev_auth.js",
    "dev_auth_getuser_dedupe.js",
    "dev_cloud_visibility_preserve.js",
    "dev_cloud_saves.js",
    "dev_landing_armies.js",
    "dev_privacy_account.js",
    "dev_retention.js",
    "dev_shared_armies.js",
]

CAMPAIGN_SOURCES = [
    "campaign.js",
    "dev_campaigns.js",
    "dev_campaign_armies.js",
    "dev_campaign_territories.js",
    "dev_territory_permissions.js",
    "dev_territory_random_server.js",
    "dev_territory_specific_create.js",
    "dev_campaign_delete.js",
    "dev_campaign_dialog_guard.js",
    "dev_mighty_empires_manual_builder_v3.js",
    "dev_mighty_empires_tray_scroll.js",
    "dev_mighty_empires_map_scroll.js",
    "dev_modal_close.js",
]

BUNDLES = {
    "dev_startup_bundle.js": STARTUP_SOURCES,
    "dev_army_bundle.js": ARMY_SOURCES,
    "dev_account_bundle.js": ACCOUNT_SOURCES,
    "dev_campaign_bundle.js": CAMPAIGN_SOURCES,
}


def build_bundle(filename, sources):
    missing = [name for name in sources if not (ROOT / name).exists()]
    if missing:
        raise SystemExit(f"Missing sources for {filename}: {', '.join(missing)}")

    parts = [
        "// GENERATED FILE - DO NOT EDIT DIRECTLY.\n",
        f"// Built by tools/build_dev_bundle.py as {filename}.\n",
    ]
    for name in sources:
        source = (ROOT / name).read_text(encoding="utf-8")
        parts.append(f"\n/* ===== BEGIN {name} ===== */\n")
        parts.append(source)
        if not source.endswith("\n"):
            parts.append("\n")
        parts.append(";\n")
        parts.append(f"/* ===== END {name} ===== */\n")

    (ROOT / filename).write_text("".join(parts), encoding="utf-8")


for filename, sources in BUNDLES.items():
    build_bundle(filename, sources)

index_path = ROOT / "index.html"
index = index_path.read_text(encoding="utf-8")

# Remove existing generated/external application script tags and the previous
# lazy-bundle loader block. CSS and inline page markup remain untouched.
index = re.sub(r'<script\s+src="[^"]+"\s*></script>', '', index)
index = re.sub(
    r'<!-- DEV_BUNDLE_LOADER_START -->.*?<!-- DEV_BUNDLE_LOADER_END -->',
    '',
    index,
    flags=re.S,
)

if 'dev_auth.css' not in index:
    index = index.replace(
        '</head>',
        '  <link rel="stylesheet" href="dev_auth.css?v=1">\n</head>'
    )

bundle_tags = '''<script src="dev_startup_bundle.js?v=1"></script>
<!-- DEV_BUNDLE_LOADER_START -->
<script>
(() => {
  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.body.appendChild(script);
  });

  const startDeferredBundles = async () => {
    try {
      await loadScript('dev_army_bundle.js?v=1');
      window.whrResolveArmyFeatures?.();
    } catch (error) {
      console.error(error);
      window.whrRejectArmyFeatures?.(error);
      return;
    }

    try {
      await loadScript('dev_account_bundle.js?v=1');
    } catch (error) {
      console.warn('Account bundle failed to load; army builder remains available.', error);
    }

    try {
      await loadScript('dev_campaign_bundle.js?v=1');
    } catch (error) {
      console.warn('Campaign bundle failed to load; army builder remains available.', error);
    }
  };

  // Do not parse the large army rule bundle until the tiny army manifest has
  // rendered. This keeps the landing-page army cards responsive even on a
  // slower phone or cold-cache request.
  const waitForArmyCards = () => {
    if (window.state?.armyManifest || (typeof state !== 'undefined' && state.armyManifest)) {
      requestAnimationFrame(() => requestAnimationFrame(startDeferredBundles));
      return;
    }
    setTimeout(waitForArmyCards, 25);
  };

  waitForArmyCards();
})();
</script>
<!-- DEV_BUNDLE_LOADER_END -->
'''
index = index.replace("</body>", bundle_tags + "</body>")
index_path.write_text(index, encoding="utf-8")

print(
    "Built dev bundles: "
    + ", ".join(f"{name} ({len(sources)} sources)" for name, sources in BUNDLES.items())
)
