/* Presentation state only. It must never write player, collision or checkpoint state. */
export const XR_VIEWS=Object.freeze(['first-person','first-person-ar','diorama-vr','diorama-ar']);
export const DIORAMA_SHELLS=Object.freeze(['both-open','top-open','front-open']);
export const STAGE_METRES=Object.freeze({width:1.6,depth:1.2,height:.72});
export const DIORAMA_DEFAULTS=Object.freeze({view:'first-person',shell:'both-open',scale:.04,follow:true});
export const XR_PREFS_KEY='svgn.rainward.v1.xr-view';
export function normalizeDiorama(value={}){
 const v=value&&typeof value==='object'?value:{};
 return {view:XR_VIEWS.includes(v.view)?v.view:'first-person',shell:DIORAMA_SHELLS.includes(v.shell)?v.shell:'both-open',scale:typeof v.scale==='number'&&Number.isFinite(v.scale)?Math.min(.08,Math.max(.02,v.scale)):.04,follow:typeof v.follow==='boolean'?v.follow:true};
}
export function shellOpenings(shell='both-open'){return {topOpen:shell!=='front-open',frontOpen:shell!=='top-open'};}
export function setOpening(shell,part,open){
 if(!['top','front'].includes(part))return DIORAMA_SHELLS.includes(shell)?shell:'both-open';
 const state=shellOpenings(shell);state[part+'Open']=!!open;
 // Closing the final opening explicitly opens the other face.
 if(!state.topOpen&&!state.frontOpen)state[(part==='top'?'front':'top')+'Open']=true;
 return state.topOpen?(state.frontOpen?'both-open':'top-open'):'front-open';
}
export function sessionType(view){return view.endsWith('-ar')?'immersive-ar':'immersive-vr';}
export function readDioramaPreferences(storage){try{return normalizeDiorama(JSON.parse(storage.getItem(XR_PREFS_KEY)||'{}'));}catch{return {...DIORAMA_DEFAULTS};}}
export function writeDioramaPreferences(storage,value){const state=normalizeDiorama(value);try{storage.setItem(XR_PREFS_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function displayBounds(scale=.04){scale=normalizeDiorama({scale}).scale;return {width:STAGE_METRES.width/scale,depth:STAGE_METRES.depth/scale,height:STAGE_METRES.height/scale};}
export function followCentre(centre,player,yaw,width,depth,dt,follow=true){
 if(!centre)return {x:player.x,z:player.z};if(!follow)return {...centre};
 const c=Math.cos(yaw),s=Math.sin(yaw),dx=player.x-centre.x,dz=player.z-centre.z,lx=c*dx-s*dz,lz=s*dx+c*dz;
 const ox=lx-Math.max(-width*.25,Math.min(width*.25,lx)),oz=lz-Math.max(-depth*.25,Math.min(depth*.25,lz));
 const a=1-Math.exp(-Math.max(0,Math.min(.25,dt))*8);
 return {x:centre.x+(c*ox+s*oz)*a,z:centre.z+(-s*ox+c*oz)*a};
}
