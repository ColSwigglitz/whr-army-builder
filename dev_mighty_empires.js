(() => {
  const TERRAIN_NAMES={lowland:'Lowlands',highland:'Highlands',river_valley:'River Valley',coastal:'Coastal',sea:'Sea',swamp:'Swamp'};
  const FEATURE_ICONS={village:'⌂',fortress:'♜',city:'♛',capital:'★'};
  const state={campaign:null,user:null,hexes:[],selected:null,scale:.86,x:0,y:0,dragging:false,dragStart:null};

  function loadStyles(){if(document.querySelector('link[data-me-style]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='dev_mighty_empires.css?v=1';l.dataset.meStyle='1';document.head.appendChild(l);}
  function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
  function isOwner(){return state.campaign&&state.user&&state.campaign.owner_id===state.user.id;}

  async function getUser(){const {data,error}=await window.whrSupabase.auth.getUser();if(error)throw error;return data?.user||null;}
  async function getCampaign(id){const {data,error}=await window.whrSupabase.from('campaigns').select('id,campaign_type_id,owner_id,name,description,visibility,created_at,updated_at').eq('id',id).single();if(error)throw error;return data;}
  async function loadHexes(){const {data,error}=await window.whrSupabase.from('mighty_empire_hexes').select('id,campaign_id,q,r,terrain_type,terrain_variant,rotation,settlement_type,owner_id,razed,under_siege,special_state,updated_at').eq('campaign_id',state.campaign.id).order('q').order('r');if(error)throw error;state.hexes=data||[];}

  function ensureDialog(){let d=document.getElementById('mightyEmpiresCampaignDialog');if(d)return d;d=document.createElement('dialog');d.id='mightyEmpiresCampaignDialog';d.className='me-dialog';d.innerHTML=`<div class="me-shell"><header class="me-header"><div><div class="eyebrow">Mighty Empires</div><h2 id="meCampaignName">Campaign</h2><p id="meCampaignMeta">Persistent hex campaign</p></div><div class="me-header-actions"><button id="meReload" class="me-btn secondary" type="button">Reload Map</button><button id="meClose" class="me-btn secondary" type="button">Close</button></div></header><div id="meBody" class="me-layout"></div></div>`;document.body.appendChild(d);d.querySelector('#meClose').onclick=()=>d.close();d.querySelector('#meReload').onclick=async()=>{await loadHexes();render();};return d;}

  function campaignSeed(){let h=2166136261;for(const ch of String(state.campaign?.id||'mighty-empires')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function hashNoise(a,b,c=0){let n=(campaignSeed()+Math.imul(a+101,374761393)+Math.imul(b+211,668265263)+Math.imul(c+307,2246822519))>>>0;n^=n>>>13;n=Math.imul(n,1274126177);n^=n>>>16;return(n>>>0)/4294967295;}
  function key(q,r){return `${q},${r}`;}
  function neighbours(q,r){const odd=q&1;const ds=odd?[[1,0],[1,1],[0,1],[-1,1],[-1,0],[0,-1]]:[[1,-1],[1,0],[0,1],[-1,0],[-1,-1],[0,-1]];return ds.map(([dq,dr])=>[q+dq,r+dr]);}
  function inBounds(q,r,cols,rows){return q>=0&&r>=0&&q<cols&&r<rows;}
  function shuffled(arr,salt){return [...arr].sort((a,b)=>hashNoise(a[0]+salt,a[1],salt)-hashNoise(b[0]+salt,b[1],salt));}

  function createWorld(cols,rows){
    const world=new Map();
    const cx=(cols-1)/2,cy=(rows-1)/2;

    // 1. Form one irregular primary landmass with sea concentrated around the rim.
    for(let q=0;q<cols;q++)for(let r=0;r<rows;r++){
      const nx=(q-cx)/(Math.max(1,cx));
      const ny=(r-cy)/(Math.max(1,cy));
      const radial=Math.sqrt(nx*nx+ny*ny);
      const edge=Math.min(q,r,cols-1-q,rows-1-r);
      const broadNoise=(hashNoise(Math.floor(q/2),Math.floor(r/2),7)-.5)*.28;
      const fineNoise=(hashNoise(q,r,11)-.5)*.18;
      let landScore=1-radial+broadNoise+fineNoise;
      if(edge===0)landScore-=.16;
      if(edge>=2)landScore+=.10;
      world.set(key(q,r),landScore>.04?'lowland':'sea');
    }

    // Guarantee a usable interior and some water around the perimeter.
    const centreQ=Math.round(cx),centreR=Math.round(cy);
    world.set(key(centreQ,centreR),'lowland');
    [[0,0],[cols-1,0],[0,rows-1],[cols-1,rows-1]].forEach(([q,r])=>world.set(key(q,r),'sea'));

    // 2. Any land touching the sea becomes coastline.
    for(let q=0;q<cols;q++)for(let r=0;r<rows;r++){
      if(world.get(key(q,r))==='sea')continue;
      if(neighbours(q,r).some(([nq,nr])=>inBounds(nq,nr,cols,rows)&&world.get(key(nq,nr))==='sea'))world.set(key(q,r),'coastal');
    }

    // 3. Grow 1-2 connected highland ranges in the interior.
    const interior=[];
    for(let q=1;q<cols-1;q++)for(let r=1;r<rows-1;r++)if(world.get(key(q,r))==='lowland')interior.push([q,r]);
    const rangeCount=Math.max(1,Math.round(cols/6));
    for(let range=0;range<rangeCount;range++){
      if(!interior.length)break;
      const seedIndex=Math.floor(hashNoise(range,cols+rows,23)*interior.length);
      let [q,r]=interior[seedIndex];
      const length=Math.max(3,Math.round(cols*.55));
      for(let step=0;step<length;step++){
        if(world.get(key(q,r))==='lowland')world.set(key(q,r),'highland');
        const options=shuffled(neighbours(q,r).filter(([nq,nr])=>inBounds(nq,nr,cols,rows)&&world.get(key(nq,nr))==='lowland'),range*31+step);
        if(!options.length)break;
        const towardCentre=options.sort((a,b)=>{
          const da=Math.abs(a[0]-cx)+Math.abs(a[1]-cy),db=Math.abs(b[0]-cx)+Math.abs(b[1]-cy);
          const wander=(hashNoise(step,range,37)-.5)*2;
          return (da+wander)-(db-wander);
        });
        [q,r]=towardCentre[Math.min(towardCentre.length-1,Math.floor(hashNoise(step,range,41)*Math.min(3,towardCentre.length)))];
        if(hashNoise(q,r,43)<.38){
          for(const [bq,br] of shuffled(neighbours(q,r),step).slice(0,2))if(inBounds(bq,br,cols,rows)&&world.get(key(bq,br))==='lowland'&&hashNoise(bq,br,47)<.48)world.set(key(bq,br),'highland');
        }
      }
    }

    // 4. Run river valleys from highlands downhill to the nearest coast.
    const highlands=[];
    for(let q=0;q<cols;q++)for(let r=0;r<rows;r++)if(world.get(key(q,r))==='highland')highlands.push([q,r]);
    const riverCount=Math.max(1,Math.round(cols/5));
    for(let river=0;river<riverCount&&highlands.length;river++){
      let [q,r]=highlands[Math.floor(hashNoise(river,rows,53)*highlands.length)];
      const visited=new Set([key(q,r)]);
      for(let step=0;step<cols+rows;step++){
        const current=world.get(key(q,r));
        if(current==='coastal'||current==='sea')break;
        const options=neighbours(q,r).filter(([nq,nr])=>inBounds(nq,nr,cols,rows)&&!visited.has(key(nq,nr))&&world.get(key(nq,nr))!=='highland');
        if(!options.length)break;
        const coastDistance=([x,y])=>{
          let best=999;
          for(let cq=0;cq<cols;cq++)for(let cr=0;cr<rows;cr++)if(world.get(key(cq,cr))==='coastal')best=Math.min(best,Math.abs(cq-x)+Math.abs(cr-y));
          return best;
        };
        options.sort((a,b)=>coastDistance(a)-coastDistance(b)+(hashNoise(a[0]+step,a[1],59)-hashNoise(b[0]+step,b[1],59))*.8);
        [q,r]=options[0];visited.add(key(q,r));
        if(world.get(key(q,r))==='lowland')world.set(key(q,r),'river_valley');
        if(world.get(key(q,r))==='coastal')break;
      }
    }

    // 5. Add only a few small swamp pockets, away from highlands and sea.
    for(let q=1;q<cols-1;q++)for(let r=1;r<rows-1;r++){
      if(world.get(key(q,r))!=='lowland'||hashNoise(q,r,67)>.055)continue;
      const ns=neighbours(q,r).map(([nq,nr])=>world.get(key(nq,nr)));
      if(!ns.includes('sea')&&!ns.includes('highland'))world.set(key(q,r),'swamp');
    }

    return world;
  }

  function buildHexRows(size){
    const dims={small:[7,7],medium:[9,9],large:[11,11]};
    const [cols,rows]=dims[size]||dims.medium;
    const world=createWorld(cols,rows);
    const centre=[Math.floor(cols/2),Math.floor(rows/2)];
    let capital=centre;
    if(!['lowland','river_valley'].includes(world.get(key(...capital)))){
      const candidates=[];
      for(let q=0;q<cols;q++)for(let r=0;r<rows;r++)if(['lowland','river_valley'].includes(world.get(key(q,r))))candidates.push([q,r]);
      candidates.sort((a,b)=>(Math.abs(a[0]-centre[0])+Math.abs(a[1]-centre[1]))-(Math.abs(b[0]-centre[0])+Math.abs(b[1]-centre[1])));
      if(candidates.length)capital=candidates[0];
    }
    const out=[];
    for(let q=0;q<cols;q++)for(let r=0;r<rows;r++){
      const isCapital=q===capital[0]&&r===capital[1];
      out.push({campaign_id:state.campaign.id,q,r,terrain_type:world.get(key(q,r)),terrain_variant:'generated-v2',rotation:[0,60,120,180,240,300][Math.floor(hashNoise(q,r,71)*6)],settlement_type:isCapital?'capital':null,owner_id:isCapital?state.user.id:null,special_state:{map_size:size,generator:'coherent-v2'}});
    }
    return out;
  }

  async function generateMap(size,button){button.disabled=true;button.textContent='Generating…';try{const rows=buildHexRows(size);const {error}=await window.whrSupabase.from('mighty_empire_hexes').insert(rows);if(error)throw error;await loadHexes();render();}catch(err){showError(err.message||String(err));button.disabled=false;button.textContent='Generate Map';}}
  function showError(msg){const body=document.getElementById('meBody');if(body)body.innerHTML=`<div class="me-setup"><h3>Unable to load Mighty Empires</h3><div class="me-error">${esc(msg)}</div><p>If the error mentions a missing table, run <strong>supabase/013_mighty_empires.sql</strong> against the Dev Supabase project.</p></div>`;}

  function renderSetup(){const body=document.getElementById('meBody');body.innerHTML=`<section class="me-setup"><div class="eyebrow">Campaign Map</div><h3>Create the realm</h3><p>This campaign does not have a map yet. Generate the first persistent hex map. The hexes will be stored in Supabase and everyone in this campaign will see the same map.</p>${isOwner()?`<div class="me-setup-grid"><label>Map size<select id="meMapSize"><option value="small">Small — 7 × 7</option><option value="medium" selected>Medium — 9 × 9</option><option value="large">Large — 11 × 11</option></select></label></div><button id="meGenerate" class="me-btn" type="button">Generate Map</button><div class="me-status">The generator now creates a coherent landmass with coastline, connected highlands and rivers running toward the coast. Terrain artwork is still provisional.</div>`:`<div class="me-empty">The campaign owner needs to generate the map first.</div>`}</section>`;body.className='me-layout';document.getElementById('meGenerate')?.addEventListener('click',e=>generateMap(document.getElementById('meMapSize').value,e.currentTarget));}

  function applyTransform(){const map=document.getElementById('meMap');if(map)map.style.transform=`translate(${state.x}px,${state.y}px) scale(${state.scale}) translate(-50%,-50%)`;}
  function resetView(){state.scale=.86;state.x=0;state.y=0;applyTransform();}
  function zoom(d){state.scale=Math.max(.45,Math.min(1.8,state.scale+d));applyTransform();}

  function renderMap(){const map=document.getElementById('meMap');if(!map)return;map.innerHTML='';const w=90,h=104,xStep=w*.75;state.hexes.forEach(hex=>{const b=document.createElement('button');b.type='button';b.className=`me-hex ${hex.terrain_type}${state.selected?.id===hex.id?' selected':''}`;b.style.left=`${hex.q*xStep}px`;b.style.top=`${hex.r*h+(hex.q%2?h/2:0)}px`;b.dataset.hexId=hex.id;b.innerHTML=`<span class="me-hex-label">${hex.q},${hex.r}</span>${hex.settlement_type&&FEATURE_ICONS[hex.settlement_type]?`<span class="me-feature" title="${esc(hex.settlement_type)}">${FEATURE_ICONS[hex.settlement_type]}</span>`:''}`;b.onclick=e=>{e.stopPropagation();state.selected=hex;renderMap();renderDetails();};map.appendChild(b);});applyTransform();}

  function renderDetails(){const side=document.getElementById('meSidebar');if(!side)return;if(!state.selected){side.innerHTML='<div class="eyebrow">Selected Hex</div><div class="me-empty">Select a hex to inspect it.</div>';return;}const h=state.selected;side.innerHTML=`<div class="eyebrow">Selected Hex</div><h3>Hex ${h.q}, ${h.r}</h3><dl><dt>Terrain</dt><dd>${esc(TERRAIN_NAMES[h.terrain_type]||h.terrain_type)}</dd><dt>Feature</dt><dd>${esc(h.settlement_type||'None')}</dd><dt>Owner</dt><dd>${h.owner_id?esc(h.owner_id===state.user.id?'You':'Campaign player'):'Unclaimed'}</dd><dt>Siege</dt><dd>${h.under_siege?'Yes':'No'}</dd><dt>Razed</dt><dd>${h.razed?'Yes':'No'}</dd></dl>${isOwner()?`<div class="me-editor"><label>Terrain<select id="meTerrain">${Object.keys(TERRAIN_NAMES).map(t=>`<option value="${t}" ${t===h.terrain_type?'selected':''}>${TERRAIN_NAMES[t]}</option>`).join('')}</select></label><label>Settlement<select id="meSettlement"><option value="">None</option>${['barren','village','fortress','city','capital'].map(t=>`<option value="${t}" ${t===h.settlement_type?'selected':''}>${t[0].toUpperCase()+t.slice(1)}</option>`).join('')}</select></label><button id="meSaveHex" class="me-btn" type="button">Save Hex</button><div id="meSaveStatus" class="me-status"></div></div>`:''}`;document.getElementById('meSaveHex')?.addEventListener('click',saveSelectedHex);}

  async function saveSelectedHex(){const btn=document.getElementById('meSaveHex'),status=document.getElementById('meSaveStatus');btn.disabled=true;status.textContent='Saving…';const terrain=document.getElementById('meTerrain').value;const settlement=document.getElementById('meSettlement').value||null;const {data,error}=await window.whrSupabase.from('mighty_empire_hexes').update({terrain_type:terrain,settlement_type:settlement,updated_at:new Date().toISOString()}).eq('id',state.selected.id).select().single();if(error){status.textContent=error.message;btn.disabled=false;return;}state.selected=data;const i=state.hexes.findIndex(h=>h.id===data.id);if(i>=0)state.hexes[i]=data;renderMap();renderDetails();}

  function wireMap(){const wrap=document.getElementById('meMapWrap');document.getElementById('meZoomIn').onclick=()=>zoom(.12);document.getElementById('meZoomOut').onclick=()=>zoom(-.12);document.getElementById('meReset').onclick=resetView;wrap.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?.08:-.08);},{passive:false});wrap.addEventListener('pointerdown',e=>{if(e.target.closest('.me-hex'))return;state.dragging=true;state.dragStart={x:e.clientX,y:e.clientY,ox:state.x,oy:state.y};wrap.classList.add('dragging');wrap.setPointerCapture(e.pointerId);});wrap.addEventListener('pointermove',e=>{if(!state.dragging)return;state.x=state.dragStart.ox+(e.clientX-state.dragStart.x);state.y=state.dragStart.oy+(e.clientY-state.dragStart.y);applyTransform();});wrap.addEventListener('pointerup',()=>{state.dragging=false;wrap.classList.remove('dragging');});}

  function render(){document.getElementById('meCampaignName').textContent=state.campaign.name;document.getElementById('meCampaignMeta').textContent=`${state.hexes.length?state.hexes.length+' hexes':'Map not generated'} · ${isOwner()?'Campaign owner':'Campaign member'}`;if(!state.hexes.length){renderSetup();return;}const body=document.getElementById('meBody');body.className='me-layout';body.innerHTML=`<div id="meMapWrap" class="me-map-wrap"><div id="meMap" class="me-map"></div><div class="me-map-controls"><button id="meZoomIn" type="button">+</button><button id="meZoomOut" type="button">−</button><button id="meReset" type="button">⌂</button></div></div><aside id="meSidebar" class="me-sidebar"></aside>`;state.selected=null;wireMap();renderMap();renderDetails();requestAnimationFrame(resetView);}

  async function openMightyEmpires(id){loadStyles();try{if(!window.whrSupabase)throw new Error('Supabase is not ready. Please refresh the page.');state.user=await getUser();if(!state.user)throw new Error('You must be signed in to open a campaign.');state.campaign=await getCampaign(id);if(state.campaign.campaign_type_id!=='mighty_empires')return;await loadHexes();document.getElementById('campaignHubDialog')?.close();const d=ensureDialog();render();d.showModal();}catch(err){const d=ensureDialog();d.showModal();showError(err.message||String(err));}}

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-open-campaign]');
    if(!btn)return;
    const card=btn.closest('.campaign-card');
    if(!card||!card.textContent.includes('Mighty Empires'))return;
    const id=btn.dataset.openCampaign;
    if(!id)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openMightyEmpires(id);
  },true);

  loadStyles();
  window.whrOpenMightyEmpires=openMightyEmpires;
})();
