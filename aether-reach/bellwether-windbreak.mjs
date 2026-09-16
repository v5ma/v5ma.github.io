/* Receiver Crosswind: shared geometry, save-safe state and reversible cover.
 * Model helpers only. Neither presentation nor this module grants progression. */
export const WINDBREAK_CONTROLS=Object.freeze([
 {id:'bell-windbreak-west',kind:'windbreak',name:'Windbreak selector',x:-112,y:27.5,z:-3.5},
 {id:'bell-windbreak-east',kind:'windbreak',name:'Windbreak selector',x:-102,y:27.5,z:-3.5}
]);
// East screens the gallery approach from the longshot; west screens the receiver.
// Neither position blocks every attacker or both flanking lanes.
export const WINDBREAK_SCREENS=Object.freeze([
 Object.freeze({id:'bell-windbreak',x1:-106,x2:-105.6,y1:27.5,y2:30,z1:-13.5,z2:-9.5}),
 Object.freeze({id:'bell-windbreak',x1:-112.8,x2:-108,y1:27.5,y2:30,z1:-11.9,z2:-11.5})
]);
export const windbreakMode=s=>s?.bellwether?.windbreak===1?1:0;
export const windbreakSolid=s=>WINDBREAK_SCREENS[windbreakMode(s)];
export function overlapsWindbreak(p,box,r=.45,height=1.8){
 return p&&p.x+r>box.x1&&p.x-r<box.x2&&p.z+r>box.z1&&p.z-r<box.z2&&p.y+height>box.y1&&p.y<box.y2;
}
export function canShiftWindbreak(s){
 const next=WINDBREAK_SCREENS[1-windbreakMode(s)];
 // Interlock: never close a destination panel through the courier or a live NPC.
 return !overlapsWindbreak(s.p,next,.45,s.p.crouched?1.04:1.8)&&!s.drones.some(e=>e.hp>0&&overlapsWindbreak({...e,y:e.humanoid?e.y-1.05:e.y-.5},next,.6,e.humanoid?1.8:1));
}
export function windbreakSnapshot(s){
 const mode=windbreakMode(s);
 return {mode,label:mode?'Receiver shelter':'Gallery shelter',powered:(s?.bellwether?.stage||0)>=3,solid:windbreakSolid(s),switches:s?.bellwether?.windbreakSwitches||0,blocked:s?.bellwether?.windbreakBlocked||0,retreats:s?.bellwether?.galleryRetreats||0};
}
export function inReceiverEncounter(p){
 // The existing east maintenance stair/landing is a recovery, not abandonment.
 const roof=p.y>=24&&p.y<=38&&Math.abs(p.x+107)<=18&&Math.abs(p.z+9)<=20;
 const gallery=p.y>=21&&p.y<29&&p.x>=-103&&p.x<=-97&&p.z>=-21&&p.z<=-4;
 return roof||gallery;
}
