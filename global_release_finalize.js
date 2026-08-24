// Final v1.0 release-hardening pass.
// Loaded after every army-specific extension so final runtime units and item
// lists still obey the universal WHR release rules.
(() => {
  const previousAllowedMagicItems = getAllowedMagicItems;
  getAllowedMagicItems = function(unit, context) {
    let items = previousAllowedMagicItems(unit, context) || [];
    if (typeof window.whrMagicItemEligibleForBearer === "function") items = items.filter(item => window.whrMagicItemEligibleForBearer(item, unit, context));
    const selectedIds = context === "champion" ? (state.draft?.champion?.magicItems || []) : (state.draft?.magicItems || []);
    const selectedArmour = selectedIds.find(id => getMagicItem(id)?.category === "magic_armour");
    if (selectedArmour) items = items.filter(item => item.category !== "magic_armour" || item.id === selectedArmour);
    return [...new Map(items.map(item => [item.id, item])).values()];
  };

  const previousSelectArmy = selectArmy;
  selectArmy = async function(armyId) {
    await previousSelectArmy(armyId);
    if (!state.data) return;
    if (typeof window.whrApplyEffectiveRegimentMinimums === "function") window.whrApplyEffectiveRegimentMinimums();
    renderUnitBrowser(); renderArmy();
  };

  const daemonRegimentItems=document.createElement("script");daemonRegimentItems.src="chaos_daemon_regiment_items.js?v=1";daemonRegimentItems.async=false;document.body.appendChild(daemonRegimentItems);
  const dogsOfWarRoR=document.createElement("script");dogsOfWarRoR.src="dogs_of_war_regiments_of_renown.js?v=1";dogsOfWarRoR.async=false;document.body.appendChild(dogsOfWarRoR);
  const generalScript=document.createElement("script");generalScript.src="general_system.js?v=2";generalScript.async=false;generalScript.onload=()=>{const s=document.createElement("script");s.src="general_overrides.js?v=1";s.async=false;document.body.appendChild(s);};document.body.appendChild(generalScript);

  const authStyle=document.createElement("link");authStyle.rel="stylesheet";authStyle.href="dev_auth.css?v=1";document.head.appendChild(authStyle);
  const authScript=document.createElement("script");authScript.src="dev_auth.js?v=3";authScript.async=false;
  authScript.onload=()=>{
    const authDedupe=document.createElement("script");authDedupe.src="dev_auth_getuser_dedupe.js?v=2";authDedupe.async=false;document.body.appendChild(authDedupe);
    const visibility=document.createElement("script");visibility.src="dev_cloud_visibility_preserve.js?v=1";visibility.async=false;
    visibility.onload=()=>{
      const cloud=document.createElement("script");cloud.src="dev_cloud_saves.js?v=3";cloud.async=false;
      cloud.onload=()=>{
        const landing=document.createElement("script");landing.src="dev_landing_armies.js?v=1";landing.async=false;
        landing.onload=()=>{
          const continueAfterPrivacy=()=>{
            const files=["dev_retention.js?v=1","dev_shared_armies.js?v=3","dev_campaigns.js?v=2","dev_campaign_armies.js?v=1","dev_campaign_territories.js?v=1","dev_territory_permissions.js?v=1","dev_territory_random_server.js?v=1","dev_territory_specific_create.js?v=1","dev_campaign_delete.js?v=1","dev_campaign_dialog_guard.js?v=1","dev_mighty_empires_delete_map.js?v=2","dev_mighty_empires.js?v=2","dev_mighty_empires_starting_realms.js?v=1","dev_mighty_empires_tile_art.js?v=2","dev_modal_close.js?v=1"];
            const loadNext=i=>{if(i>=files.length)return;const s=document.createElement("script");s.src=files[i];s.async=false;s.onload=()=>loadNext(i+1);s.onerror=()=>{console.warn(`${files[i]} failed to load; continuing.`);loadNext(i+1);};document.body.appendChild(s);};loadNext(0);
          };
          const privacy=document.createElement("script");privacy.src="dev_privacy_account.js?v=3";privacy.async=false;privacy.onload=continueAfterPrivacy;privacy.onerror=()=>{console.warn("dev_privacy_account.js failed to load; continuing with the remaining Dev modules.");continueAfterPrivacy();};document.body.appendChild(privacy);
        };document.body.appendChild(landing);
      };document.body.appendChild(cloud);
    };document.body.appendChild(visibility);
  };document.body.appendChild(authScript);
})();
