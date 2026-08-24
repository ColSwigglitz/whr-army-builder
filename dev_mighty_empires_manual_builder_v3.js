// Mighty Empires manual map builder v3 (Dev only)
(() => {
  const GRID_COLS=15, GRID_ROWS=15, W=104, H=90, XSTEP=78;
  const SHEET_ROOT='https://www.fysh.org/~katie/wargames/downloads/mighty_empires/';
  const CENTRES=[[84,71],[327,71],[206,142],[84,213],[327,213],[206,284],[84,355],[327,355],[206,426],[84,497],[327,497],[206,568],[84,639],[327,639]];
  const ASSETS=[];

  const addSheet=(prefix,label,terrain,file,start,count,indices=null)=>{
    const picks=indices || Array.from({length:count},(_,i)=>i);
    picks.forEach((centreIndex,j)=>{
      const [cx,cy]=CENTRES[centreIndex];
      const n=start+j;
      ASSETS.push({id:`${prefix}-${String(n).padStart(2,'0')}`,name:`${label} ${String(n).padStart(2,'0')}`,terrain,sheet:`${SHEET_ROOT}${file}`,cx,cy,limit:1});
    });
  };

  addSheet('coastal','Coastal','coastal','Costal1.jpg',1,14);
  addSheet('coastal','Coastal','coastal','Costal2.jpg',15,14);
  addSheet('highland','Highland','highland','highland1.jpg',1,14);
  addSheet('highland','Highland','highland','highland2.jpg',15,8,Array.from({length:8},(_,i)=>i));
  addSheet('lowland','Lowland','lowland','lowlands1.jpg',1,14);
  addSheet('lowland','Lowland','lowland','lowlands2.jpg',15,14);
  addSheet('lowland','Lowland','lowland','lowlands3.jpg',29,6,[0,2,3,5,6,9]);
  addSheet('river','River Valley','river_valley','rivervalley1.jpg',1,14);
  addSheet('river','River Valley','river_valley','rivervalley2.jpg',15,12,Array.from({length:12},(_,i)=>i));
  ASSETS.push({id:'sea-01',name:'Sea',terrain:'sea',sheet:`${SHEET_ROOT}sea.jpg`,cx:84,cy:71,limit:28,rotatable:false});

  // Keep the five already-proven local prototype assets for their first variants.
  const local={
    'coastal-01':'assets/mighty-empires/tiles/coastal/coastal-01.webp',
    'highland-01':'assets/mighty-empires/tiles/highland/highland-01.webp',
    'lowland-01':'assets/mighty-empires/tiles/lowland/lowland-01.webp',
    'river-01':'assets/mighty-empires/tiles/river-valley/river-01.webp',
    'sea-01':'assets/mighty-empires/tiles/sea/sea-01.webp'
  };
  ASSETS.forEach(a=>{if(local[a.id])a.src=local[a.id];});
  const byAsset=new Map(ASSETS.map(a=>[a.id,a]));
  const categories=[['coastal','Coastal'],['highland','Highland'],['lowland','Lowland'],['river_valley','River Valley'],['sea','Sea']];
  const state={campaign:null,user:null,rows:[],selectedAsset:null,selectedHex:null,movingId:null,busy:false,category:'coastal'};

  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const isOwner=()=>state.campaign&&state.user&&state.campaign.owner_id===state.user.id;
  const usage=id=>state.rows.filter(r=>r.terrain_variant===id).length;
  const rowAt=(q,r)=>state.rows.find(x=>x.q===q&&x.r===r);

  function tileMarkup(a,rotation=0,cls=''){
    if(!a)return '';
    if(a.src)return `<img class="${cls}" src="${a.src}" alt="${esc(a.name)}" style="transform:rotate(${rotation}deg)">`;
    // The original source sheets are 504x713. View only the exact 164x142 tile crop,
    // then scale the complete crop into the hex. This avoids the old CSS-sprite renderer.
    const x=a.cx-82,y=a.cy-71;
    return `<svg class="${cls}" viewBox="${x} ${y} 164 142" preserveAspectRatio="xMidYMid slice" aria-label="${esc(a.name)}" style="transform:rotate(${rotation}deg)"><image href="${a.sheet}" x="0" y="0" width="504" height="713"/></svg>`;
  }

  function styles(){
    if(document.getElementById('meManualV3Styles'))return;
    const s=document.createElement('style');s.id='meManualV3Styles';s.textContent=`
      .me3-dialog{width:min(1540px,98vw);height:min(940px,95vh);border:0;border-radius:12px;padding:0;box-shadow:0 22px 70px rgba(0,0,0,.38)}
      .me3-dialog::backdrop{background:rgba(0,0,0,.62)}.me3-shell{height:100%;display:flex;flex-direction:column;background:#f4f1e8}
      .me3-header{display:flex;justify-content:space-between;gap:16px;align-items:center;background:#0d1d12;color:#fff;padding:14px 18px;border-bottom:3px solid #7b211b}.me3-header h2{margin:2px 0 0;color:#fff}.me3-header p{margin:4px 0 0;color:#d8e0da}.me3-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
      .me3-btn{border:1px solid #aeb7af;background:#fff;color:#263027;border-radius:6px;padding:9px 12px;font-weight:800;cursor:pointer}.me3-btn.primary{background:#8f261e;border-color:#8f261e;color:#fff}.me3-btn:disabled{opacity:.45;cursor:not-allowed}
      .me3-body{flex:1;min-height:0;display:grid;grid-template-columns:300px 1fr 300px}.me3-tray,.me3-inspector{background:#fff;padding:15px;overflow:auto}.me3-tray{border-right:1px solid #d9ddd8}.me3-inspector{border-left:1px solid #d9ddd8}
      .me3-help{font-size:13px;color:#606963;line-height:1.4;margin:7px 0 12px}.me3-tabs{display:flex;gap:5px;overflow:auto;padding-bottom:7px;margin-bottom:8px}.me3-tab{white-space:nowrap;border:1px solid #c9ceca;background:#f4f5f3;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:800}.me3-tab.active{background:#16261a;color:#fff;border-color:#16261a}
      .me3-assets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.me3-asset{border:2px solid transparent;border-radius:8px;background:#f5f5f2;padding:6px;cursor:pointer;text-align:left;min-width:0}.me3-asset.selected{border-color:#8f261e;background:#fff6f3}.me3-asset:disabled{opacity:.42;cursor:not-allowed}.me3-thumb{width:100%;aspect-ratio:240/208;display:block;overflow:hidden}.me3-thumb img,.me3-thumb svg{width:100%;height:100%;display:block;object-fit:contain;transform-origin:50% 50%}.me3-asset strong{display:block;font-size:11px;margin-top:4px}.me3-asset small{font-size:10px;color:#68716b}
      .me3-workspace{position:relative;overflow:auto;background:#b8cdd1;background-image:radial-gradient(rgba(255,255,255,.28) 1px,transparent 1px);background-size:18px 18px}.me3-canvas{position:relative;width:${(GRID_COLS-1)*XSTEP+W+80}px;height:${GRID_ROWS*H+45+80}px;margin:28px auto}
      .me3-slot{position:absolute;width:${W}px;height:${H}px;padding:0;border:1px dashed rgba(43,70,61,.3);background:rgba(255,255,255,.11);clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);cursor:pointer;overflow:hidden}.me3-slot:hover{background:rgba(255,255,255,.25)}.me3-slot.occupied{border:0;background:transparent}.me3-slot.active{filter:drop-shadow(0 0 4px #7b211b)}.me3-slot img,.me3-slot svg{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:fill;transform-origin:50% 50%;pointer-events:none}.me3-coord{position:absolute;inset:auto 0 6px;text-align:center;font-size:9px;color:rgba(0,0,0,.45);pointer-events:none}.me3-slot.occupied .me3-coord{display:none}
      .me3-empty{padding:26px 12px;color:#64706a;text-align:center}.me3-preview{width:210px;aspect-ratio:240/208;margin:8px auto 15px;overflow:hidden}.me3-preview img,.me3-preview svg{width:100%;height:100%;display:block;object-fit:contain;transform-origin:50% 50%}.me3-inspector dl{display:grid;grid-template-columns:90px 1fr;gap:8px;margin:14px 0}.me3-inspector dt{font-weight:800}.me3-inspector dd{margin:0}.me3-inspector-actions{display:grid;gap:8px}.me3-count{font-size:12px;color:#67716b;margin-top:10px}
      @media(max-width:850px){.me3-dialog{width:100vw;height:100vh;max-width:none;max-height:none;border-radius:0}.me3-header{align-items:flex-start}.me3-header h2{font-size:22px}.me3-actions{max-width:58%}.me3-btn{padding:8px 10px}.me3-body{grid-template-columns:1fr;grid-template-rows:auto minmax(470px,1fr) auto}.me3-tray{border-right:0;border-bottom:1px solid #d9ddd8;max-height:255px}.me3-assets{grid-template-columns:repeat(4,minmax(86px,1fr));overflow:auto}.me3-asset{min-width:86px}.me3-inspector{border-left:0;border-top:1px solid #d9ddd8;max-height:280px}}
    `;document.head.appendChild(s);
  }

  async function getUser(){const {data,error}=await window.whrSupabase.auth.getUser();if(error)throw error;return data?.user||null;}
  async function getCampaign(id){const {data,error}=await window.whrSupabase.from('campaigns').select('id,owner_id,name,campaign_type_id').eq('id',id).single();if(error)throw error;return data;}
  async function loadRows(){const {data,error}=await window.whrSupabase.from('mighty_empire_hexes').select('id,campaign_id,q,r,terrain_type,terrain_variant,rotation,special_state').eq('campaign_id',state.campaign.id).order('q').order('r');if(error)throw error;state.rows=data||[];}

  function dialog(){let d=document.getElementById('mightyEmpiresManualDialogV3');if(d)return d;styles();d=document.createElement('dialog');d.id='mightyEmpiresManualDialogV3';d.className='me3-dialog';d.innerHTML=`<div class="me3-shell"><header class="me3-header"><div><div class="eyebrow">Mighty Empires · Manual Builder</div><h2 id="me3Name">Campaign</h2><p id="me3Meta">15 × 15 build area · full tile library</p></div><div class="me3-actions"><button id="me3Clear" class="me3-btn" type="button">Clear Map</button><button id="me3Reload" class="me3-btn" type="button">Reload</button><button id="me3Close" class="me3-btn" type="button">Close</button></div></header><div id="me3Body" class="me3-body"></div></div>`;document.body.appendChild(d);d.querySelector('#me3Close').onclick=()=>d.close();d.querySelector('#me3Reload').onclick=reload;d.querySelector('#me3Clear').onclick=clearMap;return d;}

  function renderTray(){const tray=document.getElementById('me3Tray');if(!tray)return;const filtered=ASSETS.filter(a=>a.terrain===state.category);tray.innerHTML=`<div class="eyebrow">Tile Tray</div><h3 style="margin:2px 0 5px">Tile library</h3><div class="me3-tabs">${categories.map(([id,label])=>`<button class="me3-tab ${state.category===id?'active':''}" data-cat="${id}" type="button">${label}</button>`).join('')}</div><div class="me3-assets">${filtered.map(a=>{const remaining=Math.max(0,a.limit-usage(a.id));return `<button class="me3-asset ${state.selectedAsset===a.id?'selected':''}" data-asset="${a.id}" type="button" ${(!isOwner()||remaining===0)?'disabled':''}><span class="me3-thumb">${tileMarkup(a)}</span><strong>${esc(a.name)}</strong><small>${remaining} remaining</small></button>`}).join('')}</div><div class="me3-count">${ASSETS.length-1} individual land tiles + 28 Sea tiles. Build area: ${GRID_COLS} × ${GRID_ROWS}.</div>`;tray.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{state.category=b.dataset.cat;state.selectedAsset=null;renderTray();renderInspector();});tray.querySelectorAll('[data-asset]').forEach(b=>b.onclick=()=>{state.selectedAsset=b.dataset.asset;state.selectedHex=null;state.movingId=null;renderTray();renderBoard();renderInspector();});}

  function renderBoard(){const board=document.getElementById('me3Board');if(!board)return;board.innerHTML='';for(let q=0;q<GRID_COLS;q++)for(let r=0;r<GRID_ROWS;r++){const row=rowAt(q,r);const b=document.createElement('button');b.type='button';b.className=`me3-slot${row?' occupied':''}${state.selectedHex?.id===row?.id?' active':''}`;b.style.left=`${q*XSTEP+20}px`;b.style.top=`${r*H+(q%2?H/2:0)+10}px`;if(row){const a=byAsset.get(row.terrain_variant);b.innerHTML=a?`${tileMarkup(a,Number(row.rotation)||0)}<span class="me3-coord">${q},${r}</span>`:`<span>Unknown tile</span>`;}else b.innerHTML=`<span class="me3-coord">${q},${r}</span>`;b.onclick=()=>slotClick(q,r,row);board.appendChild(b);}}

  function renderInspector(){const p=document.getElementById('me3Inspector');if(!p)return;if(state.movingId){const row=state.rows.find(r=>r.id===state.movingId),a=row&&byAsset.get(row.terrain_variant);p.innerHTML=`<div class="eyebrow">Move Tile</div><h3>${esc(a?.name||'Tile')}</h3><p class="me3-help">Tap an empty hex to move this tile there.</p><button id="me3CancelMove" class="me3-btn" type="button">Cancel Move</button>`;p.querySelector('#me3CancelMove').onclick=()=>{state.movingId=null;renderInspector();};return;}const row=state.selectedHex;if(!row){const a=byAsset.get(state.selectedAsset);p.innerHTML=a?`<div class="eyebrow">Selected Tile</div><h3>${esc(a.name)}</h3><div class="me3-preview">${tileMarkup(a)}</div><p class="me3-help">Tap an empty position on the map to place it.</p>`:`<div class="eyebrow">Map Builder</div><div class="me3-empty">Choose a tile from the tray or select a placed tile.</div>`;return;}const a=byAsset.get(row.terrain_variant);p.innerHTML=`<div class="eyebrow">Placed Tile</div><h3>${esc(a?.name||row.terrain_variant)}</h3>${a?`<div class="me3-preview">${tileMarkup(a,Number(row.rotation)||0)}</div>`:''}<dl><dt>Position</dt><dd>${row.q}, ${row.r}</dd><dt>Rotation</dt><dd>${Number(row.rotation)||0}°</dd></dl>${isOwner()?`<div class="me3-inspector-actions">${a?.rotatable===false?'':`<button id="me3Rotate" class="me3-btn primary" type="button">Rotate 60°</button>`}<button id="me3Move" class="me3-btn" type="button">Move Tile</button><button id="me3Remove" class="me3-btn" type="button">Remove Tile</button></div>`:''}`;p.querySelector('#me3Rotate')?.addEventListener('click',rotateSelected);p.querySelector('#me3Move')?.addEventListener('click',()=>{state.movingId=row.id;renderInspector();});p.querySelector('#me3Remove')?.addEventListener('click',removeSelected);}

  function render(){const d=dialog();d.querySelector('#me3Name').textContent=state.campaign?.name||'Mighty Empires';d.querySelector('#me3Meta').textContent=`${state.rows.length} placed tiles · 15 × 15 build area · ${isOwner()?'Campaign owner':'Player'}`;d.querySelector('#me3Body').innerHTML='<aside id="me3Tray" class="me3-tray"></aside><section class="me3-workspace"><div id="me3Board" class="me3-canvas"></div></section><aside id="me3Inspector" class="me3-inspector"></aside>';d.querySelector('#me3Clear').hidden=!isOwner();renderTray();renderBoard();renderInspector();}
  function renderAll(){render();}

  async function slotClick(q,r,row){if(row){state.selectedHex=row;state.selectedAsset=null;state.movingId=null;renderBoard();renderTray();renderInspector();return;}if(!isOwner()||state.busy)return;if(state.movingId){const moving=state.rows.find(x=>x.id===state.movingId);if(!moving)return;state.busy=true;try{const {error}=await window.whrSupabase.from('mighty_empire_hexes').update({q,r,updated_at:new Date().toISOString()}).eq('id',moving.id);if(error)throw error;moving.q=q;moving.r=r;state.selectedHex=moving;state.movingId=null;renderAll();}catch(e){alert(`Unable to move tile: ${e.message||e}`);}finally{state.busy=false;}return;}const a=byAsset.get(state.selectedAsset);if(!a||usage(a.id)>=a.limit)return;state.busy=true;try{const payload={campaign_id:state.campaign.id,q,r,terrain_type:a.terrain,terrain_variant:a.id,rotation:0,settlement_type:null,owner_id:null,razed:false,under_siege:false,special_state:{manual_builder:true,tile_id:a.id,map_cols:GRID_COLS,map_rows:GRID_ROWS},updated_at:new Date().toISOString()};const {data,error}=await window.whrSupabase.from('mighty_empire_hexes').insert(payload).select('id,campaign_id,q,r,terrain_type,terrain_variant,rotation,special_state').single();if(error)throw error;state.rows.push(data);state.selectedHex=data;state.selectedAsset=null;renderAll();}catch(e){alert(`Unable to place tile: ${e.message||e}`);}finally{state.busy=false;}}

  async function rotateSelected(){const row=state.selectedHex,a=row&&byAsset.get(row.terrain_variant);if(!row||!a||a.rotatable===false||state.busy)return;state.busy=true;try{const rotation=((Number(row.rotation)||0)+60)%360;const {error}=await window.whrSupabase.from('mighty_empire_hexes').update({rotation,updated_at:new Date().toISOString()}).eq('id',row.id);if(error)throw error;row.rotation=rotation;renderBoard();renderInspector();}catch(e){alert(`Unable to rotate tile: ${e.message||e}`);}finally{state.busy=false;}}
  async function removeSelected(){const row=state.selectedHex;if(!row||state.busy)return;if(!confirm('Remove this tile from the map?'))return;state.busy=true;try{const {error}=await window.whrSupabase.from('mighty_empire_hexes').delete().eq('id',row.id);if(error)throw error;state.rows=state.rows.filter(x=>x.id!==row.id);state.selectedHex=null;renderAll();}catch(e){alert(`Unable to remove tile: ${e.message||e}`);}finally{state.busy=false;}}
  async function clearMap(){if(!isOwner()||!state.campaign||state.busy)return;if(!confirm('Clear every tile from this Mighty Empires map?'))return;state.busy=true;try{const {error}=await window.whrSupabase.from('mighty_empire_hexes').delete().eq('campaign_id',state.campaign.id);if(error)throw error;state.rows=[];state.selectedHex=null;state.selectedAsset=null;state.movingId=null;renderAll();}catch(e){alert(`Unable to clear map: ${e.message||e}`);}finally{state.busy=false;}}
  async function reload(){if(!state.campaign||state.busy)return;state.busy=true;try{await loadRows();state.selectedHex=null;state.movingId=null;renderAll();}catch(e){alert(`Unable to reload map: ${e.message||e}`);}finally{state.busy=false;}}

  async function openCampaign(id){try{document.getElementById('mightyEmpiresManualDialog')?.close?.();const d=dialog();state.user=await getUser();if(!state.user)throw new Error('Sign in to open this campaign.');state.campaign=await getCampaign(id);state.rows=[];state.selectedAsset=null;state.selectedHex=null;state.movingId=null;state.category='coastal';await loadRows();render();document.getElementById('campaignHubDialog')?.close?.();if(!d.open)d.showModal();}catch(e){console.error('Mighty Empires v3 failed',e);alert(`Unable to open Mighty Empires: ${e.message||e}`);}}

  window.whrOpenMightyEmpires=openCampaign;
  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-open-campaign]');const card=b?.closest?.('.campaign-card');if(!b?.dataset?.openCampaign||!card?.textContent?.includes('Mighty Empires'))return;e.preventDefault();e.stopImmediatePropagation();openCampaign(b.dataset.openCampaign);},true);
})();
