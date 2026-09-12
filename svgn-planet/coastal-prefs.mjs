export const PREF_KEY='svgn.neighborhood.coastal.v1';
export const DEFAULT_PREFS=Object.freeze({master:.65,music:.34,effects:.62,ambience:.34,muted:false,invertX:false,invertY:false,sensitivity:1,density:'balanced',audioDensity:'balanced'});
export function cleanPrefs(raw){const r=raw&&typeof raw==='object'?raw:{},p={...DEFAULT_PREFS};for(const k of['master','music','effects','ambience'])if(Number.isFinite(r[k]))p[k]=Math.max(0,Math.min(1,r[k]));for(const k of['muted','invertX','invertY'])p[k]=r[k]===true;if(Number.isFinite(r.sensitivity))p.sensitivity=Math.max(.35,Math.min(2.5,r.sensitivity));if(['low','balanced','busy'].includes(r.density))p.density=r.density;if(['quiet','balanced','full'].includes(r.audioDensity))p.audioDensity=r.audioDensity;return p;}
function load(){try{return cleanPrefs(JSON.parse(globalThis.localStorage?.getItem(PREF_KEY)||'{}'));}catch{return cleanPrefs(null);}}
export const preferences=load();
export function setPreference(key,value){if(!(key in DEFAULT_PREFS))return;Object.assign(preferences,cleanPrefs({...preferences,[key]:value}));try{globalThis.localStorage?.setItem(PREF_KEY,JSON.stringify(preferences));}catch{}globalThis.window?.dispatchEvent(new Event('nm-preferences'));}
export function quietMix(){for(const [k,v]of Object.entries({master:.5,music:.24,effects:.5,ambience:.22,audioDensity:'quiet'}))setPreference(k,v);}
