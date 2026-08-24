(() => {
  let currentCampaignId = null;
  let deleting = false;
  let realmBusy = false;
  let lastNormalisedSignature = '';

  const key = (q, r) => `${q},${r}`;
  const neighbours = (q, r) => {
    const odd = q & 1;
    const ds = odd
      ? [[1,0],[1,1],[0,1],[-1,1],[-1,0],[0,-1]]
      : [[1,-1],[1,0],[0,1],[-1,0],[-1,-1],[0,-1]];
    return ds.map(([dq,dr]) => [q+dq,r+dr]);
  };

  function isMightyEmpiresOpenButton(button) {
    const card = button?.closest?.('.campaign-card');
    return !!(button?.dataset?.openCampaign && card && card.textContent.includes('Mighty Empires'));
  }

  function campaignOwnerIsViewing() {
    return document.getElementById('meCampaignMeta')?.textContent?.includes('Campaign owner');
  }

  function mapExists() {
    const meta = document.getElementById('meCampaignMeta')?.textContent || '';
    return /\b\d+ hexes\b/.test(meta);
  }

  async function loadHexes() {
    if (!currentCampaignId || !window.whrSupabase) return [];
    const { data, error } = await window.whrSupabase
      .from('mighty_empire_hexes')
      .select('id,q,r,terrain_type,terrain_variant,settlement_type,owner_id,special_state')
      .eq('campaign_id', currentCampaignId);
    if (error) throw error;
    return data || [];
  }

  async function loadMembers() {
    const { data, error } = await window.whrSupabase
      .from('campaign_members')
      .select('user_id,role,joined_at')
      .eq('campaign_id', currentCampaignId)
      .order('joined_at');
    if (error) throw error;
    return data || [];
  }

  function installDeleteButton() {
    const dialog = document.getElementById('mightyEmpiresCampaignDialog');
    const actions = dialog?.querySelector('.me-header-actions');
    if (!dialog || !actions) return;
    let button = document.getElementById('meDeleteMap');
    if (!campaignOwnerIsViewing() || !mapExists()) { button?.remove(); return; }
    if (button) return;
    button = document.createElement('button');
    button.id = 'meDeleteMap';
    button.className = 'me-btn secondary';
    button.type = 'button';
    button.textContent = 'Delete Map';
    button.addEventListener('click', deleteMap);
    actions.insertBefore(button, actions.firstChild);
  }

  async function deleteMap() {
    if (deleting || !currentCampaignId || !window.whrSupabase) return;
    if (!window.confirm('Delete this Mighty Empires map?\n\nAll hexes and exploration data for this map will be removed. This cannot be undone.')) return;
    const button = document.getElementById('meDeleteMap'); deleting = true;
    if (button) { button.disabled = true; button.textContent = 'Deleting…'; }
    try {
      const { error } = await window.whrSupabase.from('mighty_empire_hexes').delete().eq('campaign_id', currentCampaignId);
      if (error) throw error;
      const dialog = document.getElementById('mightyEmpiresCampaignDialog');
      if (dialog?.open) dialog.close();
      await window.whrOpenMightyEmpires?.(currentCampaignId);
    } catch (error) {
      window.alert(`Unable to delete map: ${error.message || error}`);
      if (button) { button.disabled = false; button.textContent = 'Delete Map'; }
    } finally { deleting = false; }
  }

  function getLandComponents(hexes) {
    const byKey = new Map(hexes.map(h => [key(h.q,h.r), h]));
    const land = new Set(hexes.filter(h => h.terrain_type !== 'sea').map(h => key(h.q,h.r)));
    const seen = new Set(), components = [];
    for (const start of land) {
      if (seen.has(start)) continue;
      const queue = [start], component = []; seen.add(start);
      while (queue.length) {
        const k = queue.shift(), hex = byKey.get(k); if (!hex) continue;
        component.push(hex);
        for (const [nq,nr] of neighbours(hex.q,hex.r)) {
          const nk = key(nq,nr);
          if (land.has(nk) && !seen.has(nk)) { seen.add(nk); queue.push(nk); }
        }
      }
      components.push(component);
    }
    return components;
  }

  async function rebuildCoastline(hexes) {
    const byKey = new Map(hexes.map(h => [key(h.q,h.r), h]));
    const changes = [];
    for (const h of hexes) {
      if (h.terrain_type === 'sea') continue;
      const touchesSea = neighbours(h.q,h.r).some(([q,r]) => byKey.get(key(q,r))?.terrain_type === 'sea');
      if (touchesSea && h.terrain_type === 'lowland') changes.push({h,type:'coastal'});
      else if (!touchesSea && h.terrain_type === 'coastal') changes.push({h,type:'lowland'});
    }
    for (const {h,type} of changes) {
      const {error}=await window.whrSupabase.from('mighty_empire_hexes').update({terrain_type:type,terrain_variant:null,rotation:0,updated_at:new Date().toISOString()}).eq('id',h.id);
      if(error) throw error;
      h.terrain_type=type; h.terrain_variant=null;
    }
    return changes.length;
  }

  async function ensureSingleLandmass() {
    if (!campaignOwnerIsViewing() || !mapExists() || realmBusy) return false;
    let hexes = await loadHexes(); if (!hexes.length) return false;
    const signature = `${currentCampaignId}:${hexes.map(h => `${h.q},${h.r},${h.terrain_type}`).sort().join('|')}`;
    if (signature === lastNormalisedSignature) return false;
    lastNormalisedSignature = signature;
    realmBusy = true;
    try {
      const components = getLandComponents(hexes);
      let changed = false;
      if (components.length > 1) {
        components.sort((a,b) => b.length-a.length);
        for (const hex of components.slice(1).flat()) {
          const { error } = await window.whrSupabase.from('mighty_empire_hexes').update({terrain_type:'sea',terrain_variant:null,rotation:0,settlement_type:null,owner_id:null,updated_at:new Date().toISOString()}).eq('id',hex.id);
          if (error) throw error;
          changed = true;
        }
        hexes = await loadHexes();
      }
      if (await rebuildCoastline(hexes)) changed = true;
      if (changed) {
        lastNormalisedSignature = '';
        document.getElementById('meReload')?.click();
      }
      return changed;
    } finally { realmBusy = false; }
  }

  function hexDistance(a,b) {
    const ar = a.r - (a.q - (a.q & 1)) / 2, ax = a.q, az = ar, ay = -ax-az;
    const br = b.r - (b.q - (b.q & 1)) / 2, bx = b.q, bz = br, by = -bx-bz;
    return Math.max(Math.abs(ax-bx),Math.abs(ay-by),Math.abs(az-bz));
  }

  function chooseCapitals(hexes,count) {
    const candidates = hexes.filter(h => h.terrain_type === 'lowland' || h.terrain_type === 'river_valley');
    if (!candidates.length || count < 1) return [];
    const minQ=Math.min(...hexes.map(h=>h.q)), maxQ=Math.max(...hexes.map(h=>h.q));
    const minR=Math.min(...hexes.map(h=>h.r)), maxR=Math.max(...hexes.map(h=>h.r));
    const centre={q:(minQ+maxQ)/2,r:(minR+maxR)/2};
    if (count===1) return [candidates.slice().sort((a,b)=>(Math.abs(a.q-centre.q)+Math.abs(a.r-centre.r))-(Math.abs(b.q-centre.q)+Math.abs(b.r-centre.r)))[0]];
    const target=Math.max(maxQ-minQ,maxR-minR)*.28;
    const first=candidates.slice().sort((a,b)=>{const da=Math.abs(a.q-centre.q)+Math.abs(a.r-centre.r),db=Math.abs(b.q-centre.q)+Math.abs(b.r-centre.r);return Math.abs(da-target)-Math.abs(db-target)||a.q-b.q||a.r-b.r;})[0];
    const chosen=[first];
    while(chosen.length<count){
      const remaining=candidates.filter(c=>!chosen.some(x=>x.id===c.id)); if(!remaining.length)break;
      remaining.sort((a,b)=>{const ad=Math.min(...chosen.map(c=>hexDistance(a,c))),bd=Math.min(...chosen.map(c=>hexDistance(b,c)));if(bd!==ad)return bd-ad;const ac=Math.abs(a.q-centre.q)+Math.abs(a.r-centre.r),bc=Math.abs(b.q-centre.q)+Math.abs(b.r-centre.r);return ac-bc||a.q-b.q||a.r-b.r;});
      chosen.push(remaining[0]);
    }
    return chosen;
  }

  async function setupStartingRealms() {
    if (realmBusy || !currentCampaignId || !campaignOwnerIsViewing()) return;
    if (!window.confirm('Set up starting realms for every current campaign member?\n\nExisting capital markers and Mighty Empires hex ownership will be reset. Each player will receive a well-spaced capital and the adjacent land hexes.')) return;
    const button=document.getElementById('meStartingRealms'); realmBusy=true;
    if(button){button.disabled=true;button.textContent='Setting up…';}
    try {
      let hexes=await loadHexes();
      const components=getLandComponents(hexes);
      if(components.length>1){components.sort((a,b)=>b.length-a.length);for(const hex of components.slice(1).flat()){const {error}=await window.whrSupabase.from('mighty_empire_hexes').update({terrain_type:'sea',terrain_variant:null,rotation:0,settlement_type:null,owner_id:null,updated_at:new Date().toISOString()}).eq('id',hex.id);if(error)throw error;}}
      hexes=await loadHexes(); await rebuildCoastline(hexes);
      const [freshHexes,members]=await Promise.all([loadHexes(),loadMembers()]);
      if(!members.length)throw new Error('This campaign has no members.');
      const capitals=chooseCapitals(freshHexes,members.length); if(capitals.length<members.length)throw new Error('There are not enough suitable lowland or river-valley hexes for all campaign members.');
      const {error:clearError}=await window.whrSupabase.from('mighty_empire_hexes').update({owner_id:null,settlement_type:null,updated_at:new Date().toISOString()}).eq('campaign_id',currentCampaignId);if(clearError)throw clearError;
      const byKey=new Map(freshHexes.map(h=>[key(h.q,h.r),h])),claimed=new Set();
      for(let i=0;i<members.length;i++){
        const member=members[i],capital=capitals[i],realm=[capital];
        for(const [nq,nr] of neighbours(capital.q,capital.r)){const h=byKey.get(key(nq,nr));if(h&&h.terrain_type!=='sea')realm.push(h);}
        for(const h of realm){if(claimed.has(h.id))continue;claimed.add(h.id);const {error}=await window.whrSupabase.from('mighty_empire_hexes').update({owner_id:member.user_id,settlement_type:h.id===capital.id?'capital':null,updated_at:new Date().toISOString()}).eq('id',h.id);if(error)throw error;}
      }
      document.getElementById('meReload')?.click();
    }catch(error){window.alert(`Unable to set up starting realms: ${error.message||error}`);}finally{realmBusy=false;if(button){button.disabled=false;button.textContent='Set Up Starting Realms';}}
  }

  function installStartingRealmsButton(){
    const dialog=document.getElementById('mightyEmpiresCampaignDialog'),actions=dialog?.querySelector('.me-header-actions');
    if(!dialog||!actions||!campaignOwnerIsViewing()||!mapExists()){document.getElementById('meStartingRealms')?.remove();return;}
    if(document.getElementById('meStartingRealms'))return;
    const button=document.createElement('button');button.id='meStartingRealms';button.className='me-btn secondary';button.type='button';button.textContent='Set Up Starting Realms';button.addEventListener('click',setupStartingRealms);
    const deleteButton=document.getElementById('meDeleteMap');actions.insertBefore(button,deleteButton||actions.firstChild);
  }

  async function installControls(){installDeleteButton();installStartingRealmsButton();try{await ensureSingleLandmass();}catch(error){console.warn('Mighty Empires landmass/coastline normalisation failed',error);}}
  document.addEventListener('click',event=>{const button=event.target.closest?.('[data-open-campaign]');if(isMightyEmpiresOpenButton(button))currentCampaignId=button.dataset.openCampaign;},true);
  const observer=new MutationObserver(()=>installControls());observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener('click',event=>{if(event.target.closest?.('#meReload'))setTimeout(installControls,0);});
})();
