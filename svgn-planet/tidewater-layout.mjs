/* Shared source of truth for the small, authored waterfront. No DOM or renderer. */
export const TIDEWATER_VERSION='0.10.0';
export const TIDEWATER={id:'tidewater',name:'Tidewater Pool & Marina',landing:[-40,27],dock:[-97,49],launch:[-102,55],cart:[-48,65],harbor:[-91,46]};
export const BASINS=Object.freeze([
 Object.freeze({id:'pool',name:'Seaglass Pool',t:-64,x:51,halfT:11,halfX:8,depth:2.2}),
 Object.freeze({id:'canal',name:'Lantern Canal',t:-114,x:75,halfT:22,halfX:42,depth:3.6})
]);
export const WATER_LOOP=[[-40,0],[-40,25],[-143,25],[-143,127],[-85,127],[-85,72],[-40,72],[-40,25]];
export function waterLocal(n,radius=880){return {t:Math.atan2(-n[2],n[1])*radius,x:Math.asin(Math.max(-1,Math.min(1,n[0])))*radius};}
export function tidalReserve(n,radius=880){if(n[1]<.94)return false;const p=waterLocal(n,radius);return p.t>=-151&&p.t<=-33&&p.x>=18&&p.x<=136;}
export function basinAt(n,margin=0){if(n[1]<.94)return null;const p=waterLocal(n);return BASINS.find(b=>Math.abs(p.t-b.t)<b.halfT+margin&&Math.abs(p.x-b.x)<b.halfX+margin)||null;}
export function onDock(n,padding=0){const p=waterLocal(n);return n[1]>.94&&p.t>-104-padding&&p.t<-91+padding&&p.x>45-padding&&p.x<51+padding;}
export function waterBlocksRider(n){return !!basinAt(n,.35)&&!onDock(n,-.1);}
export function boatClear(n){const p=waterLocal(n),b=BASINS[1];return n[1]>.94&&Math.abs(p.t-b.t)<b.halfT-1.4&&Math.abs(p.x-b.x)<b.halfX-1.4&&!onDock(n,.9);}
