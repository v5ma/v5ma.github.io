/* Night Watch: optional, original action/investigation case on existing geography.
 * Durable progress and credits are separate from both courier ledgers. */
import {HIGHLINE_ANCHORS,HIGHLINE_MAX_Y,highlineKit} from './highline-layout.mjs';
export const WATCH_REWARD=180;
export const WATCH_POINTS=Object.freeze({
 desk:{id:'watch-desk',label:'Meet Mara at the neighborhood watch desk',x:-10,y:0,z:14},
 trace:{id:'watch-trace',label:'Scan the damaged receiver inside the print shop',x:-9.6,y:0,z:2.3},
 meter:{id:'watch-meter',label:'Scan the interference meter at the pump',x:6.5,y:0,z:-12.4},
 roof:{id:'watch-roof',label:'Override the sentry signal from the loading loft',x:12,y:4.4,z:-2.2},
 ground:{id:'watch-ground',label:'Disable the sentries, then reset the pump relay',x:6.5,y:0,z:-9.8}
});
export const GRAPPLE_ANCHORS=Object.freeze([
 {id:'print-perch',label:'Print terrace',x:-14.5,y:4.4,z:-4.5},
 {id:'loft-perch',label:'Loading loft',x:10.5,y:4.4,z:-3.6},
 {id:'pump-landing',label:'Pump landing',x:6.5,y:0,z:-12.2},
 {id:'arcade-landing',label:'Arcade landing',x:-21.5,y:0,z:-12.5},
 ...HIGHLINE_ANCHORS
]);
export const freshWatch=()=>({v:1,tracking:false,stage:0,route:'roof',credits:0});
export function parseWatch(raw){
 if(raw==null)return freshWatch();
 if(!raw||raw.v!==1||typeof raw.tracking!=='boolean'||!Number.isInteger(raw.stage)||raw.stage<0||raw.stage>4||!['roof','ground'].includes(raw.route)||raw.credits!==(raw.stage===4?WATCH_REWARD:0)||raw.stage===4&&raw.tracking)throw Error('Unsupported or inconsistent Night Watch save. Original progress retained.');
 return {v:1,tracking:raw.tracking,stage:raw.stage,route:raw.route,credits:raw.credits};
}
export const watchState=s=>s.watch||(s.watch=freshWatch());
const sessions=new WeakMap();
function newSentries(){return [
 {id:'sentry-scout',role:'Scout',x:6.1,y:0,z:-8.2,home:[6.1,-8.2],hp:3,phase:'patrol',timer:0,stun:0},
 {id:'sentry-shield',role:'Shield',x:7.7,y:0,z:-11.1,home:[7.7,-11.1],hp:3,phase:'patrol',timer:0,stun:0}
];}
export function watchRuntime(s){if(!sessions.has(s))sessions.set(s,{scan:false,tool:'grapple',health:5,combo:0,bestCombo:0,guard:false,guardWindow:0,cooldown:0,pulseCooldown:0,smoke:0,smokeCooldown:0,invincible:0,travel:null,knockedOut:false,sentries:newSentries().map(e=>watchState(s).stage>=3?{...e,hp:0,phase:'disabled'}:e),strikes:0,counters:0,grapples:0,approach:null});return sessions.get(s);}
export function watchTarget(s){const w=watchState(s);if(!w.tracking||w.stage===4)return null;return {...(w.stage===0||w.stage===3?WATCH_POINTS.desk:w.stage===1?WATCH_POINTS.trace:WATCH_POINTS[w.route]),kind:'watch'};}
export function trackWatch(s){const w=watchState(s);if(w.stage===4)return 'Night Watch complete. The ward relay stays restored.';w.tracking=true;if(s.city)s.city.active=null;return 'Tracking Night Watch: Signal Hijack. '+watchTarget(s).label+'.';}
export function watchGoal(s){const w=watchState(s),r=watchRuntime(s);if(!w.tracking)return '';if(r.knockedOut)return 'Night Watch: take a breath. Open Menu > Field tools > Recover at the watch desk.';if(w.stage===2&&w.route==='ground')return 'Night Watch: '+r.sentries.filter(e=>e.hp>0).length+' sentries active. Counter blue windups, or take the roof override.';return 'Night Watch: '+(watchTarget(s)?.label||'Case complete.');}
export function watchOptions(s){const w=watchState(s);return {id:'watch',title:'Night Watch: Signal Hijack'+(w.stage===4?' / complete':''),detail:'Mara / Scan the interference. Use roof access or nonlethal sentry combat, restore the relay, and report home.',disabled:w.stage===4,active:w.tracking};}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const eye=s=>({x:s.x,y:s.y+1.2,z:s.z});
const visible=(s,t,api)=>api.lineClear(s,eye(s),{x:t.x,y:t.y+1.0,z:t.z});
const close=(s,t,api,r=2.0)=>distance(s,t)<r&&visible(s,t,api);
const say=(s,t,api)=>{api.say(s,t);return true;};
function aimScore(s,t,ray){
 const o=ray?.origin||eye(s),d=ray?.direction||{x:-Math.sin(s.yaw||0),y:0,z:-Math.cos(s.yaw||0)},v={x:t.x-o.x,y:t.y+1-o.y,z:t.z-o.z},n=Math.hypot(v.x,v.y,v.z)*Math.hypot(d.x,d.y,d.z);
 return n?(v.x*d.x+v.y*d.y+v.z*d.z)/n:-1;
}
export function grapplePath(from,to,t){const arc=Math.max(3,Math.abs(to.y-from.y)*.9);return {x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t+Math.sin(t*Math.PI)*arc,z:from.z+(to.z-from.z)*t};}
export function validGrapple(s,a,api){
 if((watchState(s).stage<1&&!highlineKit(s))||(a.highline&&!highlineKit(s))||s.ride!=='foot'||s.lift||s.transition||watchRuntime(s).travel||distance(s,a)>15||distance(s,a)<1.2)return false;
 const sf=api.support(s,a.x,a.z,a.y+.1);if(!sf||Math.abs(api.floorHeight(sf,a.z)-a.y)>.15||api.blocked(s,a.x,a.y,a.z))return false;
 const from={x:s.x,y:s.y,z:s.z};
 let previous=from;for(let i=1;i<=60;i++){const p=grapplePath(from,a,i/60);if(p.y>HIGHLINE_MAX_Y-.05||api.blocked(s,p.x,p.y,p.z))return false;
  // Never pull the head through the underside of a solid floor.
  if(api.surfaces&&api.surfaces(s,p.x,p.z).some(f=>!f.stairs&&api.floorHeight(f,p.z)>previous.y+1.7&&api.floorHeight(f,p.z)<p.y+1.7))return false;previous=p;}
 return true;
}
export function grappleTarget(s,api,ray){return GRAPPLE_ANCHORS.filter(a=>validGrapple(s,a,api)&&(!ray||aimScore(s,{...a,y:a.y+.3},ray)>.84)).sort((a,b)=>ray?aimScore(s,b,ray)-aimScore(s,a,ray):distance(s,a)-distance(s,b))[0]||null;}
export function watchAction(s,name,api,ray){
 const w=watchState(s),r=watchRuntime(s);
 if(w.tracking&&r.knockedOut&&name!=='watch-recover')return say(s,'Open Menu, Field tools, Recover at watch desk. Other mission progress is safe.',api);
 if(name==='watch-route'){w.route=w.route==='roof'?'ground':'roof';return say(s,'Night Watch approach: '+w.route+'. Both routes restore the same relay.',api);}
 if(name==='scan'){
  r.scan=!r.scan;
  if(w.tracking&&w.stage===1&&[WATCH_POINTS.trace,WATCH_POINTS.meter].some(p=>close(s,p,api,3.3))){w.stage=2;return say(s,'Trace found: the rooftop receiver controls both sentries. Override it from the loft, or disable the sentries and reset the pump relay.',api);}
  return say(s,r.scan?'Scanner on. Look for the linked relay, sentries and safe grapple rings. Scan a nearby damaged receiver to investigate.':'Scanner off.',api);
 }
 if(name==='tool-cycle'){r.tool=['grapple','pulse','smoke'][(['grapple','pulse','smoke'].indexOf(r.tool)+1)%3];return say(s,'Field tool: '+r.tool+'. Aim with the off-hand trigger; fire with the main trigger.',api);}
 if(name==='watch-recover'){
  if(!r.knockedOut)return say(s,'Recovery is available after a sentry setback. Retreat to the depot freely while you can move.',api);
  r.knockedOut=false;r.health=5;r.combo=0;r.sentries=newSentries();r.invincible=2;s.x=WATCH_POINTS.desk.x;s.y=0;s.z=WATCH_POINTS.desk.z;s.vx=s.vy=s.vz=s.speed=0;s.safe=[s.x,s.y,s.z];
  return say(s,'Recovered at the watch desk. Clues, deliveries and earned rewards are retained. Try the roof approach or counter the blue windup.',api);
 }
 if(name==='grapple'||name==='tool'&&r.tool==='grapple'){
  const a=grappleTarget(s,api,ray);if(!a)return say(s,w.stage<1?'Meet Mara at the watch desk to borrow the grapple kit.':'No safe grapple path. Get closer on foot and aim at a visible service ring; stairs remain available.',api);
  r.travel={from:{x:s.x,y:s.y,z:s.z},to:{...a},t:0};r.grapples++;s.vx=s.vy=s.vz=s.speed=0;return say(s,'Grappling to '+a.label+'.',api);
 }
 if(name==='smoke'||name==='tool'&&r.tool==='smoke'){
  if(!w.tracking||w.stage<1||w.stage>2)return say(s,'Smoke is available during the optional Night Watch encounter.',api);
  if(r.smokeCooldown)return say(s,'Smoke is recharging. Retreat or guard.',api);r.smoke=4;r.smokeCooldown=10;return say(s,'Smoke deployed. Sentries lose sight for four seconds; retreat or reposition.',api);
 }
 if(name==='strike'||name==='pulse'||name==='tool'){
  if(!w.tracking||w.stage<1||w.stage>2)return name==='strike'?say(s,'No hostile target. Residents are never attack targets.',api):false;
  if(r.knockedOut||r.travel)return true;const pulse=name!=='strike';if(pulse?r.pulseCooldown:r.cooldown)return true;
  const targets=r.sentries.filter(e=>e.hp>0&&distance(s,e)<(pulse?8:2.5)&&visible(s,e,api)&&aimScore(s,e,ray)>(pulse?.75:.1)).sort((a,b)=>distance(s,a)-distance(s,b)),e=targets[0];
  if(!e)return say(s,'No sentry in reach and sight. Move deliberately; do not swing harder.',api);
  if(pulse){r.pulseCooldown=3;e.stun=2;e.phase='stunned';return say(s,e.role+' staggered. Close the distance or take the service route.',api);}
  r.cooldown=.38;r.strikes++;if(e.role==='Shield'&&!e.stun){r.combo=0;return say(s,'Shield held. Counter its blue windup or use a pulse before striking.',api);}
  e.hp--;e.stun=.75;e.phase=e.hp?'stunned':'disabled';r.combo++;r.bestCombo=Math.max(r.combo,r.bestCombo);return say(s,e.hp?'Clean strike. Watch the next blue counter cue.':'Sentry safely disabled.',api);
 }
 if(name!=='interact'||!w.tracking)return false;
 if(w.stage===0&&close(s,WATCH_POINTS.desk,api)){w.stage=1;return say(s,'Mara: Someone hijacked our service sentries. Borrow the scanner and grapple. Inspect the print-shop receiver or pump meter; the loft override can shut them down without a fight.',api);}
 if(w.stage===1&&[WATCH_POINTS.trace,WATCH_POINTS.meter].some(p=>close(s,p,api)))return watchAction(s,'scan',api,ray);
 if(w.stage===2){
  const rooftop=close(s,WATCH_POINTS.roof,api),ground=close(s,WATCH_POINTS.ground,api);
  if(ground&&r.sentries.some(e=>e.hp>0))return say(s,'The ground relay is guarded. Counter or pulse the sentries, or use the rooftop override instead.',api);
  if(rooftop||ground){w.stage=3;r.approach=rooftop?'roof':'ground';r.sentries.forEach(e=>{e.hp=0;e.phase='disabled';});r.scan=false;return say(s,'Ward relay restored. The sentries stand down. Return to Mara at the depot; the roof route and kit stay useful.',api);}
 }
 if(w.stage===3&&close(s,WATCH_POINTS.desk,api)){w.stage=4;w.credits=WATCH_REWARD;w.tracking=false;return say(s,'Mara: Signal restored, no residents hurt. 180 Watch credits recorded once. Keep the kit for the service perches.',api);}
 return false;
}
export function advanceWatch(s,input,dt,api){
 const w=watchState(s),r=watchRuntime(s);if(input.guard&&!r.guard)r.guardWindow=.5;r.guard=!!input.guard;
 for(const k of ['cooldown','pulseCooldown','smoke','smokeCooldown','invincible','guardWindow'])r[k]=Math.max(0,r[k]-dt);
 if(r.travel){const t=r.travel;t.t=Math.min(1,t.t+dt/.9);const p=grapplePath(t.from,t.to,t.t);
  if(api.blocked(s,p.x,p.y,p.z)){Object.assign(s,t.from);s.vx=s.vz=s.vy=s.speed=0;r.travel=null;api.say(s,'Grapple route changed. Returned to the safe departure perch.');return true;}
  s.distance+=Math.hypot(s.x-p.x,s.y-p.y,s.z-p.z);Object.assign(s,p);s.vx=s.vz=s.vy=s.speed=0;
  if(t.t===1){s.safe=[s.x,s.y,s.z];r.travel=null;}return true;
 }
 if(r.knockedOut&&w.tracking){s.vx=s.vz=s.vy=s.speed=0;return true;}
 if(!w.tracking||w.stage<1||w.stage>2)return false;
 let attacking=r.sentries.find(e=>e.phase==='windup'&&e.hp>0);
 for(const e of r.sentries){if(!e.hp)continue;
  e.stun=Math.max(0,e.stun-dt);e.timer+=dt;if(e.stun){e.phase='stunned';continue;}
  const d=distance(s,e),seen=d<6.5&&Math.abs(s.y-e.y)<1.1&&!r.smoke&&visible(s,e,api);
  if(!seen){e.phase=r.smoke?'search':'patrol';if(!r.smoke){const dx=e.home[0]-e.x,dz=e.home[1]-e.z,L=Math.hypot(dx,dz);if(L>.1){const step=Math.min(L,dt*.7),x=e.x+dx/L*step,z=e.z+dz/L*step;if(!api.blocked(s,x,e.y,z)){e.x=x;e.z=z;}}}continue;}
  if(e.phase==='windup'){
   if(r.guard&&r.guardWindow>0&&e.timer>.22&&e.timer<1.05){e.phase='stunned';e.stun=1.7;e.timer=0;r.guardWindow=0;r.counters++;r.combo++;r.bestCombo=Math.max(r.combo,r.bestCombo);api.say(s,'Counter! Sentry staggered. Strike or change position.');continue;}
   if(e.timer>=1.05){e.phase='recover';e.timer=0;if(d<2.1&&r.guard){r.combo=0;api.say(s,'Guard absorbed the hit. Raise guard during the blue cue for a counter opening.');}else if(d<2.1&&!r.invincible){r.health--;r.combo=0;r.invincible=1.3;api.say(s,'Sentry hit. Hold guard on the blue cue, use smoke, or retreat.');if(r.health<=0){r.knockedOut=true;api.say(s,'Take a breath. Menu > Field tools > Recover at the watch desk. Your progress is safe.');}}}continue;
  }
  if(e.phase==='recover'&&e.timer<1.0)continue;
  if(d>1.65){const step=Math.min(dt*1.25,d-1.5),x=Math.max(4.2,Math.min(8.2,e.x+(s.x-e.x)*step/d)),z=Math.max(-13.2,Math.min(-6.8,e.z+(s.z-e.z)*step/d));if(!api.blocked(s,x,e.y,z)){e.x=x;e.z=z;}e.phase='pursue';}
  else if(!attacking){e.phase='windup';e.timer=0;attacking=e;}
 }
 return false;
}
export function watchInspect(s){const r=watchRuntime(s);return {...r,travel:r.travel?{...r.travel}:null,sentries:r.sentries.map(e=>({...e,home:[...e.home]})),progress:{...watchState(s)}};}

export function watchBlocks(s,x,y,z){const w=watchState(s);if(!w.tracking||w.stage<1||w.stage>2)return false;return watchRuntime(s).sentries.some(e=>e.hp>0&&Math.abs(y-e.y)<1.6&&Math.hypot(x-e.x,z-e.z)<.62);}
