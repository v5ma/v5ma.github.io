/* Presentation preferences only. Never reads or rewrites a game save. */
import * as T from './vendor/three.module.js';
export const CONSOLE_KEY='svgn.neighborhood-spatial-console.v1';
export const CONSOLE_DEFAULTS=Object.freeze({v:1,mount:'floor',height:.95,distance:.9,size:.72,hud:'wrist',motion:true,triggerDrive:true});
const ranges={height:[.35,1.5],distance:[.55,1.5],size:[.45,1]};
export function parseConsolePrefs(raw){
 const p=raw==null?{...CONSOLE_DEFAULTS}:typeof raw==='string'?JSON.parse(raw):raw;
 if(!p||p.v!==1||!['floor','controller'].includes(p.mount)||!['wrist','floor','off'].includes(p.hud)||typeof p.motion!=='boolean'||typeof p.triggerDrive!=='boolean')throw Error('Unsupported spatial console preferences; original data retained.');
 for(const [k,[a,b]] of Object.entries(ranges))if(!Number.isFinite(p[k])||p[k]<a||p[k]>b)throw Error('Invalid spatial console '+k+'; original data retained.');
 return Object.fromEntries(Object.keys(CONSOLE_DEFAULTS).map(k=>[k,p[k]]));
}
export function loadConsolePrefs(store){try{return {prefs:parseConsolePrefs(store?.getItem(CONSOLE_KEY)),blocked:false};}catch(e){return {prefs:{...CONSOLE_DEFAULTS},blocked:true,error:e.message};}}
export function saveConsolePrefs(store,prefs){try{const text=JSON.stringify(parseConsolePrefs(prefs));store.setItem(CONSOLE_KEY,text);return store.getItem(CONSOLE_KEY)===text;}catch{return false;}}
export function floorAnchor(viewer,measuredFloor){
 const p=viewer.position,q=viewer.orientation;
 const forward=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion().copy(q));
 const yaw=Math.hypot(forward.x,forward.z)>.05?Math.atan2(-forward.x,-forward.z):0;
 // Local-floor is optional. An estimated floor is explicit, never called a room scan.
 const measured=Number.isFinite(measuredFloor)&&p.y-measuredFloor>.35&&p.y-measuredFloor<2.6;
 return {x:p.x,z:p.z,y:measured?measuredFloor:p.y-1.65,eye:p.y,yaw,measured};
}
export function consoleTransform(anchor,prefs,amount=1){
 const p=parseConsolePrefs(prefs),t=T.MathUtils.clamp(amount,0,1),e=t*t*(3-2*t);
 const high=Math.max(anchor.y+.35,Math.min(anchor.y+p.height,anchor.eye-.3));
 const position=new T.Vector3(0,anchor.y+.035+(high-anchor.y-.035)*e,-p.distance).applyAxisAngle(new T.Vector3(0,1,0),anchor.yaw);position.x+=anchor.x;position.z+=anchor.z;
 const rotation=new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2+(Math.PI/2-.22)*e,anchor.yaw,0,'YXZ'));
 return new T.Matrix4().compose(position,rotation,new T.Vector3().setScalar(p.size*(.45+.55*e)));
}
export function triggerVehicleSpeed(state,enabled=true){return !!enabled&&(state?.ride===true||typeof state?.ride==='string'&&state.ride!=='foot');}
