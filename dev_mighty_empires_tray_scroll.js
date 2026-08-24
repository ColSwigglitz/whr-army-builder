// Mighty Empires tile tray scrolling fix (Dev only)
(() => {
  const id='me3TrayScrollFix';
  document.getElementById(id)?.remove();
  const s=document.createElement('style');
  s.id=id;
  s.textContent=`
    .me3-tray{min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}
    .me3-tabs{flex:0 0 auto!important;}
    .me3-assets{min-height:0!important;flex:1 1 auto!important;overflow-y:scroll!important;overflow-x:hidden!important;overscroll-behavior:contain;scrollbar-gutter:stable both-edges;padding-right:6px;}
    .me3-assets::-webkit-scrollbar{width:12px;}
    .me3-assets::-webkit-scrollbar-thumb{background:#8f9690;border-radius:999px;border:3px solid #fff;}
    .me3-assets::-webkit-scrollbar-track{background:#ecefea;}
    @media(max-width:850px){
      .me3-tray{height:290px!important;max-height:290px!important;}
      .me3-assets{display:grid!important;grid-template-columns:repeat(3,minmax(86px,1fr))!important;align-content:start!important;overflow-y:scroll!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;}
    }
  `;
  document.head.appendChild(s);
})();
