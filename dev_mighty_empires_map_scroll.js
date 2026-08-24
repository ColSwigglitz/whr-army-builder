// Mighty Empires map scrolling/panning fix (Dev only)
(() => {
  const id='me3MapScrollFix';
  if(document.getElementById(id)) return;
  const s=document.createElement('style');
  s.id=id;
  s.textContent=`
    .me3-workspace{
      min-width:0;
      min-height:0;
      overflow:auto!important;
      overscroll-behavior:contain;
      -webkit-overflow-scrolling:touch;
      touch-action:pan-x pan-y;
      scrollbar-gutter:stable both-edges;
    }
    .me3-canvas{
      flex:none;
      max-width:none!important;
      max-height:none!important;
    }
    .me3-workspace::-webkit-scrollbar{width:12px;height:12px;}
    .me3-workspace::-webkit-scrollbar-thumb{background:#7b817d;border-radius:10px;border:3px solid #b8cdd1;}
    .me3-workspace::-webkit-scrollbar-track{background:#b8cdd1;}
    @media(max-width:850px){
      .me3-workspace{
        width:100%;
        height:100%;
        overflow:auto!important;
        touch-action:pan-x pan-y;
      }
    }
  `;
  document.head.appendChild(s);
})();
