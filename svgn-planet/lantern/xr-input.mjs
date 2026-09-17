/* Pure input interpretation. Head-relative hand motion rejects tracking jumps. */
export const XR_PREFS_KEY='svgn.lantern-xr-controls.v1';
export const XR_DEFAULTS=Object.freeze({v:1,profile:'action',dominant:'right',swapSticks:false,snap:30,motionPunch:true});
export function parseXRPrefs(raw){
 if(raw==null)return {...XR_DEFAULTS};const p=typeof raw==='string'?JSON.parse(raw):raw;
 if(p.v!==1||!['action','courier'].includes(p.profile)||!['left','right'].includes(p.dominant)||typeof p.swapSticks!=='boolean'||![30,45].includes(p.snap)||typeof p.motionPunch!=='boolean')throw Error('Unsupported XR controls. Existing preference data retained.');
 return {v:1,profile:p.profile,dominant:p.dominant,swapSticks:p.swapSticks,snap:p.snap,motionPunch:p.motionPunch};
}
export function loadXRPrefs(store){try{return {prefs:parseXRPrefs(store?.getItem(XR_PREFS_KEY)),blocked:false};}catch(e){return {prefs:{...XR_DEFAULTS},blocked:true,error:e.message};}}
export function saveXRPrefs(store,prefs){try{const text=JSON.stringify(parseXRPrefs(prefs));store.setItem(XR_PREFS_KEY,text);return store.getItem(XR_PREFS_KEY)===text;}catch{return false;}}
export function sourceRoles(hand,prefs){return {primary:hand===prefs.dominant,movement:hand===(prefs.swapSticks?'right':'left')};}
export function motionStrike(previous,current,dt,closed,armed=true){
 if(!closed||!armed||!previous||!current||!Number.isFinite(dt)||dt<.008||dt>.12)return false;
 const delta=current.map((v,i)=>v-previous[i]);if(delta.some(v=>!Number.isFinite(v)))return false;
 const speed=Math.hypot(...delta)/dt,forward=-delta[2]/dt;
 return speed>=.65&&speed<4.5&&forward>.55&&current[2]<-.20&&current[2]>-.85&&Math.abs(current[0])<.8&&current[1]>-.8&&current[1]<.25;
}
export function guardPose(p,closed){return !!closed&&p?.length===3&&p.every(Number.isFinite)&&Math.abs(p[0])<.65&&p[1]>-.38&&p[1]<.22&&p[2]<-.1&&p[2]>-.6;}
export function xrNeutral(buttons,ax,ay){return !buttons.some(Boolean)&&Number.isFinite(ax)&&Number.isFinite(ay)&&Math.abs(ax)<=.16&&Math.abs(ay)<=.16;}
