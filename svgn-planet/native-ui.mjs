/* Main-entry only. Native menus retain their DOM controls; obsolete flat HUDs do not. */
export const XR_HUD_IDS=Object.freeze(['hud','objective','water-minimap','pulse-summary','toast','context','touch','ward-map-shortcut']);
export function mountNativeChrome(doc=document){
 if(doc.getElementById('unified-native-chrome'))return;
 const style=doc.createElement('style');style.id='unified-native-chrome';
 style.textContent=XR_HUD_IDS.map(id=>'.in-xr #'+id).join(',')+'{visibility:hidden!important}'+
 'body.in-lantern #water-minimap,body.in-lantern #pulse-summary{display:none!important}';
 doc.head.append(style);
}
export function nativeMenuDescription(root,goal,doc=document){
 if(!root)return goal;
 if(root.id==='ward-menu'){
  const notice=doc.getElementById('toast')?.textContent.trim();
  return notice?notice+' / '+goal:goal;
 }
 const paragraphs=[...root.querySelectorAll('p:not(.eyebrow)')].filter(p=>!p.closest('[hidden]')&&p.getClientRects().length>0);
 const feedback=paragraphs.filter(p=>p.getAttribute('role')==='status');
 const text=[...feedback,...paragraphs.filter(p=>!feedback.includes(p))].map(p=>p.textContent.trim()).filter(Boolean);
 return text.join(' / ')||goal;
}
