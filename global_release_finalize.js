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

  const generalScript = document.createElement("script");
  generalScript.src = "general_system.js?v=2"; generalScript.async = false;
  generalScript.onload = () => {
    const overrideScript = document.createElement("script");
    overrideScript.src = "general_overrides.js?v=1"; overrideScript.async = false;
    document.body.appendChild(overrideScript);
  };
  document.body.appendChild(generalScript);

  const authStyle = document.createElement("link"); authStyle.rel = "stylesheet"; authStyle.href = "dev_auth.css?v=1"; document.head.appendChild(authStyle);
  const authScript = document.createElement("script"); authScript.src = "dev_auth.js?v=2"; authScript.async = false;
  authScript.onload = () => {
    const visibilityPatch = document.createElement("script"); visibilityPatch.src = "dev_cloud_visibility_preserve.js?v=1"; visibilityPatch.async = false;
    visibilityPatch.onload = () => {
      const cloudSaveScript = document.createElement("script"); cloudSaveScript.src = "dev_cloud_saves.js?v=3"; cloudSaveScript.async = false;
      cloudSaveScript.onload = () => {
        const landingArmiesScript = document.createElement("script"); landingArmiesScript.src = "dev_landing_armies.js?v=1"; landingArmiesScript.async = false;
        landingArmiesScript.onload = () => {
          const privacyScript = document.createElement("script"); privacyScript.src = "dev_privacy_account.js?v=2"; privacyScript.async = false;
          privacyScript.onload = () => {
            const retentionScript = document.createElement("script"); retentionScript.src = "dev_retention.js?v=1"; retentionScript.async = false;
            retentionScript.onload = () => {
              const sharedScript = document.createElement("script"); sharedScript.src = "dev_shared_armies.js?v=3"; sharedScript.async = false;
              sharedScript.onload = () => {
                const campaignScript = document.createElement("script"); campaignScript.src = "dev_campaigns.js?v=2"; campaignScript.async = false;
                campaignScript.onload = () => {
                  const campaignArmiesScript = document.createElement("script");
                  campaignArmiesScript.src = "dev_campaign_armies.js?v=1";
                  campaignArmiesScript.async = false;
                  campaignArmiesScript.onload = () => {
                    const territoryScript = document.createElement("script");
                    territoryScript.src = "dev_campaign_territories.js?v=1";
                    territoryScript.async = false;
                    territoryScript.onload = () => {
                      const territoryPermissionScript = document.createElement("script");
                      territoryPermissionScript.src = "dev_territory_permissions.js?v=1";
                      territoryPermissionScript.async = false;
                      territoryPermissionScript.onload = () => {
                        const randomSecurityScript = document.createElement("script");
                        randomSecurityScript.src = "dev_territory_random_server.js?v=1";
                        randomSecurityScript.async = false;
                        randomSecurityScript.onload = () => {
                          const specificTerritoryScript = document.createElement("script");
                          specificTerritoryScript.src = "dev_territory_specific_create.js?v=1";
                          specificTerritoryScript.async = false;
                          specificTerritoryScript.onload = () => {
                            const campaignDeleteScript = document.createElement("script");
                            campaignDeleteScript.src = "dev_campaign_delete.js?v=1";
                            campaignDeleteScript.async = false;
                            campaignDeleteScript.onload = () => {
                              const campaignDialogGuard = document.createElement("script");
                              campaignDialogGuard.src = "dev_campaign_dialog_guard.js?v=1";
                              campaignDialogGuard.async = false;
                              document.body.appendChild(campaignDialogGuard);
                            };
                            document.body.appendChild(campaignDeleteScript);
                          };
                          document.body.appendChild(specificTerritoryScript);
                        };
                        document.body.appendChild(randomSecurityScript);
                      };
                      document.body.appendChild(territoryPermissionScript);
                    };
                    document.body.appendChild(territoryScript);
                  };
                  document.body.appendChild(campaignArmiesScript);
                };
                document.body.appendChild(campaignScript);
              };
              document.body.appendChild(sharedScript);
            };
            document.body.appendChild(retentionScript);
          };
          document.body.appendChild(privacyScript);
        };
        document.body.appendChild(landingArmiesScript);
      };
      document.body.appendChild(cloudSaveScript);
    };
    document.body.appendChild(visibilityPatch);
  };
  document.body.appendChild(authScript);
})();