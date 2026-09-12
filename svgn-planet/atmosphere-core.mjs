/* Presentation only. Preferences deliberately use a different slot from saves.
 * No weather setting changes traction, speed, missions, rewards or simulation. */
export const ATMOSPHERE_VERSION='0.9.0';
export const ATMOSPHERE_KEY='svgn.neighborhood.atmosphere.v1';
export const DEFAULT_ATMOSPHERE=Object.freeze({enabled:true,preset:'day',strength:.8,wind:true,rain:true});
export const ATMOSPHERES=Object.freeze({
 day:Object.freeze({label:'Coastal daylight',wet:0,rain:0,night:0,warm:.10,sky:1,sun:3.05,ambient:1.04,elevation:35,fogNear:140,fogFar:445}),
 golden:Object.freeze({label:'Golden hour',wet:0,rain:0,night:.12,warm:.92,sky:.94,sun:2.7,ambient:.90,elevation:20,fogNear:115,fogFar:410}),
 'after-rain':Object.freeze({label:'After-rain sunset',wet:.92,rain:0,night:.22,warm:.82,sky:.85,sun:2.45,ambient:.88,elevation:22,fogNear:100,fogFar:390}),
 rain:Object.freeze({label:'Coastal rain',wet:1,rain:1,night:.45,warm:.05,sky:.44,sun:.9,ambient:1.00,elevation:33,fogNear:65,fogFar:245}),
 'blue-hour':Object.freeze({label:'Blue hour',wet:.55,rain:0,night:.82,warm:.15,sky:.26,sun:.6,ambient:.83,elevation:28,fogNear:90,fogFar:330})
});
const clamp=v=>Math.max(0,Math.min(1,v));
export function cleanAtmosphere(raw){const r=raw&&typeof raw==='object'?raw:{},p={...DEFAULT_ATMOSPHERE};for(const k of ['enabled','wind','rain'])if(typeof r[k]==='boolean')p[k]=r[k];if(Object.hasOwn(ATMOSPHERES,r.preset||''))p.preset=r.preset;if(Number.isFinite(r.strength))p.strength=clamp(r.strength);return p;}
export function loadAtmosphere(storage){try{return cleanAtmosphere(JSON.parse(storage?.getItem(ATMOSPHERE_KEY)||'{}'));}catch{return {...DEFAULT_ATMOSPHERE};}}
export function storeAtmosphere(storage,p){const clean=cleanAtmosphere(p);try{storage?.setItem(ATMOSPHERE_KEY,JSON.stringify(clean));return true;}catch{return false;}}
export function atmosphereFrame(raw,{low=false,quiet=false}={}){
 const p=cleanAtmosphere(raw),look=ATMOSPHERES[p.preset],amount=p.enabled?p.strength:0;
 const base={wet:0,rain:0,night:0,warm:0,sky:1,sun:2.72,ambient:1.02,elevation:35,fogNear:150,fogFar:430},result={};
 for(const k of Object.keys(base))result[k]=base[k]+(look[k]-base[k])*amount;
 return {...result,amount,wind:!quiet&&p.wind&&!low?amount*.7:0,ripples:!quiet&&!low?result.rain:0,rainCount:quiet||!p.rain?0:Math.round(result.rain*(low?160:640)),label:p.enabled?look.label:'Original lighting',motion:!quiet&&p.enabled,physics:'unchanged'};
}
