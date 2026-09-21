/* Route entry policy. No game, document or network state is mutated here. */
export const STORE='svgn.skycycle.launch.v1';
export const MODES=Object.freeze(['ar','vr','screen']);
export function preference(value){return {version:1,mode:MODES.includes(value?.mode)?value.mode:null};}
export function routeByID(routes,id){
 const index=Array.isArray(routes)?routes.findIndex(r=>r.id===id):-1;
 return index<0?null:{index,route:routes[index]};
}
export function entryGate({routes,id,mode,ready,protectedDraft=false,busy=false,supported={},webgl=true,currentMode=null}={}){
 const target=routeByID(routes,id);
 if(!target||!MODES.includes(mode))return {ok:false,reason:'This route or play mode is not available.'};
 if(busy)return {ok:false,reason:'An entry request is already in progress.'};
 if(!ready)return {ok:false,reason:'The routes are still loading. Try again when loading finishes.'};
 if(protectedDraft)return {ok:false,reason:'Return from the Workshop to a campaign route before starting another route. Your current draft and playtest are unchanged.'};
 if(mode!=='screen'&&!supported[mode])return {ok:false,reason:`${mode.toUpperCase()} is unavailable in this browser. Your route is unchanged. Choose Screen explicitly to play without immersion.`};
 return {ok:true,...target,action:mode==='screen'?(currentMode?'leave':'start'):currentMode?(currentMode==='immersive-'+mode?'start':'switch'):webgl?'enter':'reload'};
}
export function entryURL(href,id,mode){
 if(typeof id!=='string'||!id||!['ar','vr'].includes(mode))throw new TypeError('An explicit immersive route is required');
 const url=new URL(href);url.searchParams.delete('destination');url.searchParams.delete('xrMode');
 url.searchParams.set('xr','1');url.searchParams.set('scRoute',id);url.searchParams.set('scMode',mode);return url.href;
}
export function pendingEntry(href,routes){
 const url=new URL(href),id=url.searchParams.get('scRoute'),mode=url.searchParams.get('scMode');
 return routeByID(routes,id)&&['ar','vr'].includes(mode)?{id,mode}:null;
}
export function clearEntryURL(href){const u=new URL(href);u.searchParams.delete('scRoute');u.searchParams.delete('scMode');return u.href;}
