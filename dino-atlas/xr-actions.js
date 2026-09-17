// Shared XR input rules. WebXR sources are not standard Xbox gamepads.
export const CONTROL_KEY='dino-atlas.grounded-controls.v1';
export function readControls(storage){try{const s=JSON.parse(storage?.getItem(CONTROL_KEY)||'null');return {quickTools:s?.quickTools!==false};}catch{return {quickTools:true};}}
export function saveControls(storage,value){try{storage?.setItem(CONTROL_KEY,JSON.stringify({version:1,quickTools:value.quickTools!==false}));return !!storage;}catch{return false;}}
export const emptyMotion=()=>({x:0,z:0,steer:0,throttle:0,climb:0,aim:false,fire:false,brake:false,boost:false,jump:false,lookX:0,lookY:0});
const button=(p,i)=>Math.max(0,Math.min(1,Number(p?.buttons?.[i]?.value??(p?.buttons?.[i]?.pressed?1:0))||0));
const axis=(p,i)=>{const n=Number(p?.axes?.[i])||0;return Math.abs(n)>.2?Math.sign(n)*Math.min(1,(Math.abs(n)-.2)/.8):0;};
export function trackedMotion(sources,mode='foot',blocked=new Set()){
 const v=emptyMotion();let left=null,right=null;
 for(const s of sources||[])if(!s.hand&&s.gamepad?.mapping==='xr-standard'&&!blocked.has(s)){if(s.handedness==='left')left=s.gamepad;else if(s.handedness==='right')right=s.gamepad;}
 v.x=axis(left,2);v.z=-axis(left,3);v.steer=-v.x;v.aim=button(left,1)>.35;
 const rt=button(right,0),lt=button(left,0);v.fire=(mode==='foot'||v.aim)&&rt>.15;
 if(!v.aim){if(mode==='helicopter')v.climb=rt-lt;else if(mode!=='foot')v.throttle=rt-lt;}
 v.boost=button(left,3)>.4;v.jump=mode==='foot'&&button(right,1)>.45;
 return v;
}
export function mergeMotion(base,extra){const v={...base};for(const k of ['x','z','steer','throttle','climb'])if(Math.abs(extra[k]||0)>.01)v[k]=extra[k];for(const k of ['aim','fire','brake','boost','jump','independentTools'])v[k]||=!!extra[k];return v;}
export class EdgeGate{
 constructor(){this.states=new Map();this.neutral=new Set();}
 reset(sources=[]){this.states.clear();this.neutral=new Set(sources);}
 remove(source){this.states.delete(source);this.neutral.delete(source);}
 read(source){const p=source.gamepad,now=Array.from({length:6},(_,i)=>button(p,i)>.35),old=this.states.get(source)||[];this.states.set(source,now);
  if(this.neutral.has(source)){if(!now.some(Boolean)&&!(p?.axes||[]).some(n=>Math.abs(n)>.2))this.neutral.delete(source);return [];}
  return now.map((b,i)=>b&&!old[i]);
 }
}
