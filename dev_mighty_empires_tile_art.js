// Mighty Empires development: local coastal artwork renderer.
// Coastline is derived from the rendered map. Each coastal hex gets a cropped
// source-sheet tile which completely replaces the old CSS terrain fill.
(() => {
  const BASE='assets/mighty-empires/coastal/source/';
  const SHEETS={1:`${BASE}coastal_set_1.jpg`,2:`${BASE}coastal_set_2.jpg`};
  const CENTRES=[[84,77],[336,77],[210,146],[84,216],[336,216],[210,285],[84,355],[336,355],[210,424],[84,494],[336,494],[210,563],[84,633],[336,633]];
  const TILES=[];
  for(const set of [1,2]) CENTRES.forEach(([cx,cy],i)=>TILES.push({id:`coastal${set}_${String(i+1).padStart(2,'0')}`,set,cx,cy}));

  function installStyles(){
    if(document.getElementById('meLocalTileStyles'))return;
    const s=document.createElement('style');
    s.id='meLocalTileStyles';
    s.textContent=`
      .me-hex{width:104px!important;height:90px!important;overflow:hidden!important;clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)!important;border:0!important;position:absolute!important}
      .me-hex.has-coastal-art{background:none!important;background-image:none!important}
      .me-tile-art{position:absolute;inset:0;width:104px;height:90px;display:block;z-index:1;pointer-events:none;overflow:hidden;transform-origin:52px 45px}
      .me-tile-crop{position:absolute;inset:0;width:104px;height:90px;display:block;background-repeat:no-repeat;background-color:#9fcbd5}
      .me-hex .me-hex-label,.me-hex .me-feature{position:relative;z-index:4}
    `;
    document.head.appendChild(s);
  }

  const key=(q,r)=>`${q},${r}`;
  function coords(el){
    const m=(el.querySelector('.me-hex-label')?.textContent||'').match(/(\d+)\s*,\s*(\d+)/);
    return m?[Number(m[1]),Number(m[2])]:null;
  }
  function neighbours(q,r){
    const odd=q&1;
    const ds=odd?[[0,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]]:[[0,-1],[1,-1],[1,0],[0,1],[-1,0],[-1,-1]];
    return ds.map(([dq,dr])=>[q+dq,r+dr]);
  }
  function isSea(el){return !!el?.classList.contains('sea');}
  function isLand(el){return !!el&&!isSea(el);}
  function hash(q,r){let n=((q+17)*73856093)^((r+31)*19349663);n^=n>>>13;return Math.abs(n>>>0);}

  function makeTileArt(tile,rotation){
    const scaleX=104/164;
    const scaleY=90/142;
    const art=document.createElement('span');
    art.className='me-tile-art';
    art.dataset.tile=tile.id;
    art.style.transform=`rotate(${rotation}deg)`;

    const crop=document.createElement('span');
    crop.className='me-tile-crop';
    crop.style.backgroundImage=`url("${SHEETS[tile.set]}")`;
    crop.style.backgroundSize=`${504*scaleX}px ${713*scaleY}px`;
    crop.style.backgroundPosition=`${52-(tile.cx*scaleX)}px ${45-(tile.cy*scaleY)}px`;
    art.appendChild(crop);
    return art;
  }

  function decorate(){
    installStyles();
    const map=document.getElementById('meMap');
    if(!map)return false;
    const els=[...map.querySelectorAll('.me-hex')];
    if(!els.length)return false;
    const byCoord=new Map();
    els.forEach(el=>{const c=coords(el);if(c)byCoord.set(key(c[0],c[1]),el);});

    els.forEach(el=>{
      el.querySelector('.me-tile-art')?.remove();
      el.classList.remove('has-coastal-art');
      const c=coords(el);if(!c||!isLand(el))return;
      const [q,r]=c;
      const seaEdges=neighbours(q,r).map(([nq,nr])=>isSea(byCoord.get(key(nq,nr))));
      if(!seaEdges.some(Boolean))return;

      const h=hash(q,r);
      const tile=TILES[h%TILES.length];
      const firstSea=Math.max(0,seaEdges.findIndex(Boolean));
      const rotation=(firstSea*60)%360;
      el.prepend(makeTileArt(tile,rotation));
      el.classList.add('has-coastal-art');
    });
    return true;
  }

  function retryDecorate(){[0,100,300,700,1400].forEach(ms=>setTimeout(decorate,ms));}
  installStyles();
  retryDecorate();
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-open-campaign],#meReload,#meGenerate,#meStartingRealms'))retryDecorate();
    if(e.target.closest?.('#meMap .me-hex'))setTimeout(decorate,0);
  },true);
})();
