// Prevent campaign-detail extensions from leaking into reused campaign forms.
(() => {
  function cleanNonDetailCampaignForm() {
    const dialog = document.getElementById("campaignFormDialog");
    if (!dialog?.open) return;
    const content = dialog.querySelector("#campaignFormContent");
    if (!content) return;

    // The campaign form dialog is reused for create/apply/detail views. Territory
    // extensions remember the last opened campaign, so without this guard they
    // can re-insert the previous campaign's panels when the dialog is later used
    // to create a new campaign or submit an application.
    const isNonDetailForm = Boolean(
      content.querySelector("#createCampaignForm") ||
      content.querySelector("#campaignApplyForm")
    );
    if (!isNonDetailForm) return;

    content.querySelectorAll("[data-territory-panel], .territory-admin-manager").forEach(el => el.remove());
  }

  document.addEventListener("click", event => {
    if (event.target.closest?.("#campaignCreateBtn")) {
      // Run after dev_campaigns.js has replaced the shared dialog content.
      setTimeout(cleanNonDetailCampaignForm, 0);
      setTimeout(cleanNonDetailCampaignForm, 100);
    }
  }, true);

  const observer = new MutationObserver(cleanNonDetailCampaignForm);
  observer.observe(document.body, { childList:true, subtree:true });
  setInterval(cleanNonDetailCampaignForm, 300);
})();