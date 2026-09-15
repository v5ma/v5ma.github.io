/* Pixel-space spatial controls share the DOM navigator's current focus. */
export function spatialPage(menu){
 if(!menu)return [];
 const index=Math.max(0,menu.index??menu.items.findIndex(i=>i.focused)),start=Math.floor(index/5)*5,items=menu.items.slice(start,start+5).map((v,i)=>({...v,kind:'activate',x:25,y:290+i*60,w:974,h:51}));
 const selected=menu.items[index]?.element,adjustable=selected?.type==='range'||selected?.tagName==='SELECT';
 const actions=[['previous-page','Previous page',start>0],['next-page','Next page',start+5<menu.items.length],['back','Back',true],['decrease','Decrease value',adjustable],['increase','Increase value',adjustable],['exit','Exit VR',true]];
 actions.forEach(([kind,label,enabled],i)=>items.push({kind,label,disabled:!enabled,x:25+(i%3)*329,y:608+Math.floor(i/3)*58,w:316,h:50}));return items;
}
export function spatialHit(items,u,v){if(!Number.isFinite(u)||!Number.isFinite(v))return null;const x=u*1024,y=(1-v)*768;return items.find(i=>!i.disabled&&x>=i.x&&x<=i.x+i.w&&y>=i.y&&y<=i.y+i.h)||null;}
