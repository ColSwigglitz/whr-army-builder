(() => {
  const TYPE = 'thorskins_island';
  const POINTS = 1500;
  let viewedCampaignId = null;
  let readOnlyCampaignArmy = false;

  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  async function currentUser(){ const {data}=await window.whrSupabase.auth.getUser(); return data?.user||null; }
  async function fetchCampaign(id){ const {data,error}=await window.whrSupabase.from('campaigns').select('id,name,owner_id,campaign_type_id').eq('id',id).single(); if(error)throw error; return data; }

  function setContext(campaign){
    state.campaignContext = {id:campaign.id,name:campaign.name,campaign_type_id:campaign.campaign_type_id};
    state.pointsLimit = POINTS;
    if (els.pointsLimit){ els.pointsLimit.value=POINTS; els.pointsLimit.disabled=true; els.pointsLimit.title='Thorskins Island armies are fixed at 1,500 points.'; }
  }

  function clearReadOnly(){
    if(!readOnlyCampaignArmy)return;
    readOnlyCampaignArmy=false;
    document.body.classList.remove('shared-readonly-mode');
    document.getElementById('thorskinsArmyViewBanner')?.remove();
  }

  function enableReadOnly(row,campaign){
    readOnlyCampaignArmy=true;
    document.body.classList.add('shared-readonly-mode');
    let banner=document.getElementById('thorskinsArmyViewBanner');
    if(!banner){ banner=document.createElement('div'); banner.id='thorskinsArmyViewBanner'; banner.className='shared-view-banner'; document.querySelector('#builderScreen .app-header')?.insertAdjacentElement('afterend',banner); }
    banner.innerHTML=`<div class="shared-view-banner-message"><strong>${esc(campaign.name)}</strong> — viewing ${esc(row.name||'Campaign Army')} read-only.</div><button class="campaign-button" type="button" id="thorskinsBackToCampaign">Back to Campaign</button>`;
    banner.querySelector('#thorskinsBackToCampaign')?.addEventListener('click',()=>{ clearReadOnly(); showArmySelection(); document.getElementById('landingCampaignsBtn')?.click(); });
  }

  async function viewCampaignArmy(id,campaign){
    const {data:row,error}=await window.whrSupabase.from('army_lists').select('id,owner_id,name,army_id,faction_id,faction_name,points_limit,total_points,roster_data,campaign_id').eq('id',id).eq('campaign_id',campaign.id).single();
    if(error)throw error;
    const snap=row.roster_data||{}; const armyId=snap.armyId||row.army_id||row.faction_id;
    await selectArmy(armyId);
    state.currentSaveId=null; state.rosterName=snap.name||row.name||'Campaign Army'; state.pointsLimit=Number(snap.pointsLimit||row.points_limit||POINTS); state.roster=clone(snap.roster||[]); state.generalEntryId=snap.generalEntryId||null;
    els.rosterName.value=state.rosterName; els.pointsLimit.value=state.pointsLimit; els.armySelectionScreen.hidden=true; els.builderScreen.hidden=false; renderUnitBrowser(); renderArmy(); enableReadOnly(row,campaign); window.scrollTo({top:0,behavior:'instant'});
  }

  async function renderPanel(){
    const content=document.getElementById('campaignFormContent'); const dialog=document.getElementById('campaignFormDialog'); if(!content||!dialog?.open||!viewedCampaignId)return;
    try{
      const [campaign,user]=await Promise.all([fetchCampaign(viewedCampaignId),currentUser()]); if(!user||campaign.campaign_type_id!==TYPE)return;
      const {data:membership,error:mErr}=await window.whrSupabase.from('campaign_members').select('campaign_id,user_id,role,team_id').eq('campaign_id',campaign.id).eq('user_id',user.id).maybeSingle(); if(mErr||!membership)return;
      const {data:armies,error}=await window.whrSupabase.from('army_lists').select('id,owner_id,name,faction_name,points_limit,total_points,updated_at,campaign_id').eq('campaign_id',campaign.id).order('updated_at',{ascending:false}); if(error)throw error;
      const rows=armies||[]; const ownerIds=[...new Set(rows.map(a=>a.owner_id))]; let names=new Map(); if(ownerIds.length){const {data:p}=await window.whrSupabase.from('profiles').select('id,display_name').in('id',ownerIds); names=new Map((p||[]).map(x=>[x.id,x.display_name]));}
      const own=rows.find(a=>a.owner_id===user.id); const owner=user.id===campaign.owner_id;
      const old=content.querySelector(`[data-campaign-army-panel="${CSS.escape(campaign.id)}"]`); if(old)old.remove();
      const panel=document.createElement('section'); panel.className='campaign-subpanel'; panel.dataset.campaignArmyPanel=campaign.id;
      panel.innerHTML=`<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h3 style="margin:0 0 4px">Campaign Armies</h3><div class="campaign-meta">Each competing player creates one standard ${POINTS}-point army. ${owner?'As Campaign Master you can view all player armies.':'You can view your own army and your team-mate’s army only.'}</div></div>${!owner&&!own?`<button class="campaign-button" type="button" data-thorskins-create-army>Create Army</button>`:''}</div><div style="display:grid;gap:8px;margin-top:12px">${rows.length?rows.map(a=>`<div class="campaign-person-row"><div><strong>${esc(a.name)}</strong><div class="campaign-meta">${esc(a.faction_name||'Army')} · ${formatPoints(a.total_points)} / ${formatPoints(a.points_limit)} pts · ${esc(names.get(a.owner_id)||'WHR Player')}</div></div><div class="campaign-actions">${a.owner_id===user.id?`<button class="campaign-button secondary" type="button" data-thorskins-edit="${esc(a.id)}">Load / Edit</button>`:`<button class="campaign-button secondary" type="button" data-thorskins-view="${esc(a.id)}">View Army</button>`}</div></div>`).join(''):`<div class="campaign-empty" style="padding:18px">No visible campaign armies have been created yet.</div>`}</div>`;
      content.prepend(panel);
      panel.querySelector('[data-thorskins-create-army]')?.addEventListener('click',()=>{ document.getElementById('campaignFormDialog')?.close(); document.getElementById('campaignHubDialog')?.close(); showArmySelection(); setContext(campaign); state.currentSaveId=null; state.roster=[]; state.generalEntryId=null; showToast(`Choose an army book for ${campaign.name}`); });
      panel.querySelectorAll('[data-thorskins-edit]').forEach(b=>b.addEventListener('click',async()=>{ clearReadOnly(); setContext(campaign); await window.whrCloudSaves?.load(b.dataset.thorskinsEdit); setContext(campaign); renderArmy(); }));
      panel.querySelectorAll('[data-thorskins-view]').forEach(b=>b.addEventListener('click',async()=>{ document.getElementById('campaignFormDialog')?.close(); document.getElementById('campaignHubDialog')?.close(); try{await viewCampaignArmy(b.dataset.thorskinsView,campaign);}catch(e){console.error(e);alert(`Could not view this campaign army: ${e?.message||'Unknown error'}`);} }));
    }catch(e){console.error('Could not render Thorskins armies',e);}
  }

  function installBuilderHooks(){
    const previousSnapshot=makeRosterSnapshot;
    makeRosterSnapshot=function(){ const snap=previousSnapshot(); if(state.campaignContext?.campaign_type_id===TYPE){snap.campaignId=state.campaignContext.id;snap.campaignName=state.campaignContext.name;snap.campaignTypeId=TYPE;snap.pointsLimit=POINTS;snap.schemaVersion=Math.max(3,Number(snap.schemaVersion||1));} return snap; };
    const previousSelectArmy=selectArmy;
    selectArmy=async function(armyId){ clearReadOnly(); const result=await previousSelectArmy(armyId); if(state.campaignContext?.campaign_type_id===TYPE){state.currentSaveId=null;state.pointsLimit=POINTS;if(els.pointsLimit){els.pointsLimit.value=POINTS;els.pointsLimit.disabled=true;}state.rosterName=`${state.campaignContext.name} — ${state.data?.faction?.name||'Army'}`;if(els.rosterName)els.rosterName.value=state.rosterName;renderArmy();} return result; };
    document.addEventListener('click',e=>{if(!readOnlyCampaignArmy)return;const target=e.target.closest?.('#roster button,#saveRosterBtn,#newRosterBtn,#savedRostersBtn,#clearArmyBtn');if(target){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}},true);
  }

  window.addEventListener('click',e=>{const open=e.target.closest?.('[data-open-campaign]');if(open?.dataset.openCampaign){viewedCampaignId=open.dataset.openCampaign;setTimeout(renderPanel,180);setTimeout(renderPanel,500);}},true);
  new MutationObserver(()=>{const d=document.getElementById('campaignFormDialog');if(d?.open&&viewedCampaignId)setTimeout(renderPanel,0);}).observe(document.body,{childList:true,subtree:true});
  installBuilderHooks();
})();
