export const ENVIRONMENT_KEY='svgn.neighborhood-environment.v1';
export const DEFAULT_ENVIRONMENT=Object.freeze({v:1,quality:'balanced',quiet:false,scenery:true});
export function environmentPreferences(raw){
 if(raw==null)return {...DEFAULT_ENVIRONMENT};
 const p=typeof raw==='string'?JSON.parse(raw):raw;
 if(!p||p.v!==1||!['light','balanced'].includes(p.quality)||typeof p.quiet!=='boolean'||typeof p.scenery!=='boolean')throw Error('Unknown environment preferences; original retained.');
 return {v:1,quality:p.quality,quiet:p.quiet,scenery:p.scenery};
}
export function readEnvironmentPreferences(storage){try{return {value:environmentPreferences(storage?.getItem(ENVIRONMENT_KEY)),blocked:false};}catch(e){return {value:{...DEFAULT_ENVIRONMENT},blocked:true,error:String(e.message||e)};}}
export function writeEnvironmentPreferences(storage,p){const raw=JSON.stringify(environmentPreferences(p));const old=storage?.getItem(ENVIRONMENT_KEY);if(old)environmentPreferences(old);storage?.setItem(ENVIRONMENT_KEY,raw);return raw;}
