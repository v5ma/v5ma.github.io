/* Tideglass is an indoor zone in the existing game, not a new save or project.
 * Mission state is persisted; reload always returns to the safe city entrance.
 * No breath meter, stamina depletion or automatic slowdown on city streets. */
import {street,distance,clamp,tangent} from './world.mjs';
export const AQUATICS_VERSION='0.10.0';
export const POOL_ENTRANCE=Object.freeze({id:'tideglass',name:'Tideglass Aquatic Center',n:street(-37,5.2),mail:street(-37,5.2)});
export const POOL=Object.freeze({halfWidth:8,halfLength:16,deckX:11.65,deckZ:20.5,spawn:[9.8,.35,15],ladder:[7.3,-.55,14],exit:[10.2,.35,19],locker:[9.8,.35,13]});
export const poolFloor=z=>-1.65-3.05*clamp((12-z)/24,0,1);
export const JOBS=Object.freeze([
 {id:'glass-circuit',name:'Through the looking water',type:'circuit',reward:300,par:65,description:'Swim through seven rings. Some are below the surface: A / Space rises, B / Ctrl dives. The timer records your best; it never locks you out.',nodes:[[-5,-.65,11],[5,-1.1,7],[5,-2.2,-2],[-5,-3.4,-10],[4,-3.7,-13],[-4,-1.8,0],[5,-.65,12]]},
 {id:'lost-and-found',name:'The things we leave behind',type:'salvage',reward:360,par:110,description:'Recover four lost keepsakes from the tiled basin with X / E, then return them to the poolside locker. Y returns you to the deck without losing your finds.',nodes:[[-5,-1.05,10],[5,-2.15,2],[-4,-3.6,-9],[4.5,-4.1,-13]]},
 {id:'clear-current',name:'A clearer current',type:'valves',reward:380,par:120,description:'Follow the service lights to three submerged circulation valves. At each valve, press X / E and line up its dial with the marked setting. The valves do not pull or slow the swimmer.',nodes:[[-7.3,-1.1,9],[7.3,-2.5,-3],[-7.3,-3.8,-12]],settings:[2,3,1]}
]);
const ids=new Set(JOBS.map(j=>j.id)),finite=(v,otherwise=0)=>Number.isFinite(v)?v:otherwise;
export const poolDistance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
export function readAquatics(raw){
 const r=raw&&typeof raw==='object'?raw:{},records={};
 for(const j of JOBS){const v=r.records?.[j.id];if(v&&Number.isFinite(v.count)&&v.count>0)records[j.id]={count:clamp(Math.floor(v.count),1,99999),best:clamp(finite(v.best,99999),.01,99999)};}
 let active=null;const j=JOBS.find(j=>j.id===r.active?.id);
 if(j){const a=r.active;active={id:j.id,index:clamp(Math.floor(finite(a.index)),0,j.type==='salvage'?j.nodes.length:j.nodes.length-1),elapsed:clamp(finite(a.elapsed),0,99999)};}
 const last=r.last&&ids.has(r.last.id)?{id:r.last.id,time:clamp(finite(r.last.time),.01,99999),reward:clamp(Math.floor(finite(r.last.reward)),0,9999),best:r.last.best===true}:null;
 return {records,active,last};
}
export function createAquatics(raw){return {...readAquatics(raw),inside:false,p:[...POOL.spawn],previous:[...POOL.spawn],swimming:false,yaw:0,pitch:0,view:'chase',speed:0,clock:0,stroke:0,splashes:[],signal:0,revision:0};}
export const poolJob=s=>JOBS.find(j=>j.id===s.aquatics.active?.id)||null;
export function poolTarget(s){const q=s.aquatics,j=poolJob(s);if(!j)return null;return q.active.index<j.nodes.length?{p:[...j.nodes[q.active.index]],label:j.type==='circuit'?'Swim through ring '+(q.active.index+1):j.type==='salvage'?'Recover keepsake '+(q.active.index+1):'Adjust circulation valve '+(q.active.index+1),kind:j.type}: {p:[...POOL.locker],label:'Return the keepsakes to the locker',kind:'locker'};}
function announce(s,type,text,data={}){s.toast=text;s.toastT=5;s.events.push({type,step:s.steps,...data});if(s.events.length>180)s.events.shift();}
export function canEnterPool(s){return distance(s.n,POOL_ENTRANCE.n)<4;}
export function enterPool(s,{travel=false}={}){
 if(s.aquatics.inside)return false;
 if(!travel&&!canEnterPool(s))return false;
 if(travel){s.n=[...POOL_ENTRANCE.n];s.north=tangent([0,0,-1],s.n);s.facing=[...s.north];}
 s.speed=0;s.boosting=false;s.paper=null;s.lift=0;s.vy=0;
 Object.assign(s.aquatics,{inside:true,p:[...POOL.spawn],previous:[...POOL.spawn],swimming:false,speed:0,yaw:-.65,pitch:.12,view:'chase'});
 announce(s,'pool-enter','TIDEGLASS | Walk into the pool to swim. A rises; B dives. Y returns to the deck.');return true;
}
export function leavePool(s){const q=s.aquatics;if(!q.inside)return false;q.inside=false;q.swimming=false;q.speed=0;s.speed=0;s.boosting=false;s.lift=0;s.vy=0;announce(s,'pool-exit','Back in the neighborhood. Your water-mission progress is kept.');return true;}
export function returnToDeck(s){const q=s.aquatics;if(!q.inside)return false;Object.assign(q,{p:[...POOL.spawn],previous:[...POOL.spawn],swimming:false,speed:0});announce(s,'pool-deck','Back on the deck. Your mission and collected items are kept.');return true;}
export function startPoolJob(s,id,{replace=false}={}){
 const j=JOBS.find(j=>j.id===id);if(!j||!s.aquatics.inside)return {kind:'unavailable'};
 if(s.aquatics.active){if(s.aquatics.active.id===id)return {kind:'resumed'};if(!replace)return {kind:'conflict'};}
 s.aquatics.active={id,index:0,elapsed:0};s.aquatics.revision++;announce(s,'pool-job','WATER MISSION | '+j.name);return {kind:'started'};
}
export function abandonPoolJob(s){if(!s.aquatics.active)return false;s.aquatics.active=null;s.aquatics.revision++;announce(s,'pool-deck','Water mission put aside. Your records and credits remain.');return true;}
function finish(s){const q=s.aquatics,j=poolJob(s);if(!j)return false;const run=q.active,old=q.records[j.id],seconds=Math.max(.01,run.elapsed),reward=old?Math.round(j.reward*.55):j.reward,best=!old||seconds<old.best;
 q.records[j.id]={count:(old?.count||0)+1,best:Math.min(old?.best||Infinity,seconds)};q.last={id:j.id,time:seconds,reward,best};q.active=null;q.revision++;
 s.jobs.wallet+=reward;s.jobs.earned+=reward;announce(s,'pool-complete','WATER MISSION COMPLETE | +'+reward+' credits'+(best?' | Personal best!':''),{id:j.id,reward});return true;
}
function advance(s){const q=s.aquatics,j=poolJob(s);if(!j)return;q.active.index++;q.revision++;if(q.active.index>=j.nodes.length&&j.type!=='salvage'){finish(s);return;}announce(s,'pool-stage',poolTarget(s).label);}
export function interactPool(s){const q=s.aquatics;if(!q.inside)return null;const target=poolTarget(s),job=poolJob(s);if(target&&poolDistance(q.p,target.p)<1.9){if(target.kind==='locker'&&!q.swimming){finish(s);return {kind:'complete'};}if(target.kind==='salvage'){announce(s,'pool-pickup','Kept safe: keepsake '+(q.active.index+1));advance(s);return {kind:'pickup'};}if(target.kind==='valves')return {kind:'valve',index:q.active.index,setting:job.settings[q.active.index]};}
 if(q.swimming&&poolDistance(q.p,POOL.ladder)<2.7){returnToDeck(s);return {kind:'ladder'};}
 if(!q.swimming&&poolDistance(q.p,POOL.exit)<2.5)return {kind:'exit'};
 return {kind:'board'};
}
export function solvePoolValve(s,index,setting){const q=s.aquatics,j=poolJob(s);if(!q.inside||j?.type!=='valves'||q.active.index!==index||poolDistance(q.p,j.nodes[index])>1.9)return false;if(setting!==j.settings[index]){announce(s,'pool-miss','Not lined up yet. Match the indicated dial setting.');return false;}q.signal++;announce(s,'pool-valve','Circulation valve restored.');advance(s);return true;}
export function poolLook(s,x,y){const q=s.aquatics;if(!q.inside)return false;q.yaw+=finite(x);q.pitch=clamp(q.pitch+finite(y),-.8,.9);return true;}
export function ripple(q,strength=1){q.splashes.push([q.p[0],q.p[2],q.clock,strength]);if(q.splashes.length>12)q.splashes.shift();}
function sweptPoint(a,b,p,r){const d=b.map((v,i)=>v-a[i]),l=d.reduce((n,v)=>n+v*v,0),t=l?clamp(d.reduce((n,v,i)=>n+v*(p[i]-a[i]),0)/l,0,1):0;return poolDistance(a.map((v,i)=>v+d[i]*t),p)<r;}
export function stepPool(s,input={},dt=1/60){
 if(!Number.isFinite(dt)||dt<=0||dt>.05)throw Error('Pool simulation needs bounded fixed steps.');
 const q=s.aquatics;if(!q.inside)return;s.steps++;s.time+=dt;q.clock+=dt;s.toastT=Math.max(0,s.toastT-dt);if(q.active)q.active.elapsed=Math.min(99999,q.active.elapsed+dt);
 q.previous=[...q.p];let x=clamp(finite(input.x),-1,1),z=clamp(finite(input.z),-1,1);const len=Math.max(1,Math.hypot(x,z));x/=len;z/=len;const moving=Math.hypot(x,z),fast=!!input.boost,brake=!!input.brake;
 const desired=moving*(q.swimming?(fast?6.6:3.2):4.2)*(brake?.3:1);q.speed+=(desired-q.speed)*(1-Math.exp(-dt*9));
 const sx=Math.cos(q.yaw)*x+Math.sin(q.yaw)*z,sz=Math.sin(q.yaw)*x-Math.cos(q.yaw)*z;
 if(moving>.01){q.p[0]+=sx/moving*q.speed*dt;q.p[2]+=sz/moving*q.speed*dt;}
 if(q.swimming){q.p[0]=clamp(q.p[0],-7.65,7.65);q.p[2]=clamp(q.p[2],-15.65,15.65);q.p[1]+=((input.ascend?1:0)-(input.dive?1:0))*(fast?3.8:2.5)*dt;q.p[1]=clamp(q.p[1],poolFloor(q.p[2])+.4,-.48);
  q.stroke+=q.speed*dt;if(q.p[1]>-.85&&q.stroke>.8){q.stroke%=.8;ripple(q,.35);}
 }else{q.p[0]=clamp(q.p[0],-POOL.deckX,POOL.deckX);q.p[2]=clamp(q.p[2],-POOL.deckZ,POOL.deckZ);q.p[1]=.35;
  if(Math.abs(q.p[0])<7.85&&Math.abs(q.p[2])<15.85){q.swimming=true;q.p[1]=-.5;ripple(q,1);announce(s,'pool-splash','Swimming | A / Space rises. B / Ctrl dives. X interacts.');}
 }
 const j=poolJob(s);if(j?.type==='circuit'){const target=poolTarget(s);if(q.swimming&&sweptPoint(q.previous,q.p,target.p,1.15))advance(s);}
 q.splashes=q.splashes.filter(r=>q.clock-r[2]<4.5);
}
export function poolInspect(s){const q=s.aquatics,j=poolJob(s);return {version:AQUATICS_VERSION,inside:q.inside,position:[...q.p],swimming:q.swimming,yaw:q.yaw,pitch:q.pitch,camera:q.view,speed:q.speed,depth:q.swimming?Math.max(0,-q.p[1]):0,active:q.active?{...q.active,name:j.name,total:j.nodes.length}:null,target:poolTarget(s),records:structuredClone(q.records),last:q.last?{...q.last}:null,splashes:q.splashes.length,cityJobsUnaffected:true,entry:[...POOL_ENTRANCE.n],clock:q.clock};}
