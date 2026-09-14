/* Deterministic water physics and save-compatible, once-only aquatic objectives. */
import {TIDE_POOLS,TIDE_POINTS,TIDE_TASKS,TIDEGLASS,tidePoolAt,tideLevel,tideGoal,tideProgress} from './tideglass-world.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function cleanTideglass(value){const v=value&&typeof value==='object'?value:{};return {stage:Number.isInteger(v.stage)?clamp(v.stage,0,4):0,valves:[0,1].map(i=>v.valves?.[i]===true),drained:v.drained===true,plates:[...new Set(Array.isArray(v.plates)?v.plates.filter(id=>TIDE_POINTS.some(p=>p.id===id&&p.kind==='plate')):[])]};}
export function tideSnapshot(s){const w=s.tideglass;return {...cleanTideglass(w),level:w?.level??TIDE_POOLS[0].high,wet:{...s.p.water},ripples:w?.ripples.length||0,goal:tideGoal(s),progress:tideProgress(s)};}
export function createTideglass({occupied,groundAt,clearLine,emit}){
 const message=(s,text)=>emit(s,'expedition-message',{text});
 const save=s=>emit(s,'save');
 function reset(s){s.p.water={swimming:false,submerged:false,diving:false,pool:null};}
 function init(s,saved){const v=cleanTideglass(saved);if(s.expedition.flags.includes(TIDE_TASKS[0].flag))v.stage=4;else if(v.stage===4)v.stage=3;if(v.stage>=2)v.valves=[true,true];if(v.stage>=3)v.drained=false;if(s.expedition.flags.includes(TIDE_TASKS[1].flag))v.plates=TIDE_POINTS.filter(p=>p.kind==='plate').map(p=>p.id);s.tideglass={...v,level:v.drained?TIDE_POOLS[0].low:TIDE_POOLS[0].high,ripples:[],splashAt:-10};reset(s);}
 function ripple(s,x,z,strength=.6){const q=tidePoolAt(x,z);if(!q)return;const a=s.tideglass.ripples;a.push({x,z,pool:q.id,born:s.time,strength:clamp(strength,.1,1)});if(a.length>8)a.shift();}
 function tick(s,dt){const p=s.p;const basin=TIDE_POOLS[0];if(!p.rail&&!p.ride&&!p.climb&&p.y<5.4&&p.y>=basin.floor-.2&&Math.abs(p.x-basin.x)<basin.w/2&&Math.abs(p.z-basin.z)<basin.d/2){p.x=clamp(p.x,basin.x-basin.w/2+.40,basin.x+basin.w/2-.40);p.z=clamp(p.z,basin.z-basin.d/2+.40,basin.z+basin.d/2-.40);}
  const w=s.tideglass,target=w.drained?TIDE_POOLS[0].low:TIDE_POOLS[0].high;w.level+=clamp(target-w.level,-.65*dt,.65*dt);w.ripples=w.ripples.filter(r=>s.time-r.born<3.5);}
 function nearby(s){if(s.p.rail||s.p.ride||s.p.climb)return null;const w=s.tideglass,eye={...s.p,y:s.p.y+(s.p.crouched?1.02:1.62)};
  const candidates=TIDE_POINTS.filter(q=>!(q.kind==='pickup'&&w.stage!==1)&&!(q.kind==='plate'&&w.plates.includes(q.id)));
  const q=candidates.filter(q=>dist(s.p,q)<1.75&&clearLine(eye,{...q,y:q.y+.7},s)).sort((a,b)=>dist(s.p,a)-dist(s.p,b))[0];
  return q?{type:'tideglass',id:q.id,label:'X / E - '+q.name+(q.kind==='valve'?(w.valves[Number(q.id.at(-1))]?' / ISOLATED':' / OPEN'):q.kind==='pump'?(w.drained?' / REFILL':' / DRAIN'):'')}:null;
 }
 function reward(s,i){const t=TIDE_TASKS[i];if(s.expedition.flags.includes(t.flag))return;s.expedition.flags.push(t.flag);s.kit.credits=Math.min(99999,s.kit.credits+t.reward);emit(s,'expedition-complete',{id:t.id,name:t.name,credits:t.reward});save(s);}
 function use(s,id){if(s.won||nearby(s)?.id!==id)return false;const w=s.tideglass,q=TIDE_POINTS.find(q=>q.id===id);
  if(q.kind==='desk'){s.expedition.tracked=TIDE_TASKS[0].id;if(w.stage===0){w.stage=1;s.checkpoint=TIDEGLASS.id;message(s,'TAVI: Two isolation valves first. The regulator is on the basin floor. Dive with B, surface with A, or drain the pool from the pumphouse and take the steps. Your suit supplies air.');}else if(w.stage===3&&Math.abs(w.level-TIDE_POOLS[0].high)<.03){w.stage=4;reward(s,0);message(s,'TAVI: The gardens have clean water again. Tideglass is restored, and your 240-credit repair fee is recorded.');}else message(s,tideProgress(s));save(s);return true;}
  if(q.kind==='valve'){if(w.stage!==1){message(s,'Read the dispatch first. Completed isolation work stays in place.');return false;}w.valves[Number(q.id.at(-1))]=true;emit(s,'tide-valve',{at:q});message(s,w.valves.every(Boolean)?'Flow isolated. Dive for the regulator, or use the pumphouse drain control.':'One valve isolated. Follow the dry perimeter to the other valve.');save(s);return true;}
  if(q.kind==='pump'){if(w.stage<1||!w.valves.every(Boolean)){message(s,'Isolate both valves before changing the water level.');return false;}if(w.stage>=3){message(s,'The repaired system is circulating. The basin stays full.');return false;}w.drained=!w.drained;emit(s,'tide-pump',{at:q});message(s,w.drained?'Draining gradually. The railed basin steps provide a dry route to the regulator.':'Refilling gradually. A surfaces; B toggles diving. The basin steps always lead out.');save(s);return true;}
  if(q.kind==='pickup'){if(w.stage!==1||!w.valves.every(Boolean)){message(s,'Isolate the two water valves before releasing this regulator.');return false;}w.stage=2;emit(s,'tide-recover',{at:q});message(s,'Regulator recovered. Bring it to the socket inside the pumphouse.');save(s);return true;}
  if(q.kind==='install'){if(w.stage!==2){message(s,'Recover the regulator from the basin floor, then fit it here.');return false;}w.stage=3;w.drained=false;emit(s,'tide-pump',{at:q});message(s,'Regulator fitted. Once the basin refills, report to dispatch for your repair fee.');save(s);return true;}
  if(q.kind==='plate'){w.plates.push(q.id);emit(s,'tide-survey',{at:q});message(s,w.plates.length+' of 3 calibration plates recorded.');if(w.plates.length===3)reward(s,1);save(s);return true;}return false;
 }
 function swim(s,input,dt){const p=s.p,w=p.water,q=tidePoolAt(p.x,p.z),level=q?tideLevel(s,q):0;
  const floor=q?groundAt(p.x,p.z,level+.75).y:-Infinity;
  const active=q&&!p.rail&&!p.ride&&!p.climb&&p.y<level-.65&&level-floor>1.4;
  if(!active){if(w.swimming)emit(s,'tide-splash',{at:{x:p.x,y:level,z:p.z},enter:false});reset(s);return false;}
  if(!w.swimming){w.swimming=true;w.diving=false;p.vy=0;p.gliding=false;p.crouched=false;p.lastRail=null;p.hookRequest=0;ripple(s,p.x,p.z,1);emit(s,'tide-splash',{at:{x:p.x,y:level,z:p.z},enter:true});}
  w.pool=q.id;p.grounded=false;p.crouched=false;
  const ix=Number.isFinite(input.moveX)?clamp(input.moveX,-1,1):Number(!!input.right)-Number(!!input.left),iz=Number.isFinite(input.moveZ)?clamp(input.moveZ,-1,1):Number(!!input.forward)-Number(!!input.back),len=Math.max(1,Math.hypot(ix,iz)),speed=input.boost?5.4:3.6;
  p.vx=(Math.sin(p.yaw)*iz+Math.cos(p.yaw)*ix)*speed/len;p.vz=(-Math.cos(p.yaw)*iz+Math.sin(p.yaw)*ix)*speed/len;
  const nx=p.x+p.vx*dt,nz=p.z+p.vz*dt;if(!occupied(nx,p.y,p.z,s))p.x=nx;else p.vx=0;if(!occupied(p.x,p.y,nz,s))p.z=nz;else p.vz=0;
  const support=groundAt(p.x,p.z,level+.75).y,target=Math.max(support,w.diving?q.floor+.035:level-1.18),dy=clamp(target-p.y,-2.8*dt,2.8*dt);
  if(!occupied(p.x,p.y+dy,p.z,s))p.y+=dy;p.vy=dt?dy/dt:0;
  w.submerged=p.y+1.62<level-.07;
  if(!w.submerged&&Math.hypot(p.vx,p.vz)>.8&&s.time-s.tideglass.splashAt>.65){s.tideglass.splashAt=s.time;ripple(s,p.x,p.z,.45);emit(s,'tide-stroke',{at:{x:p.x,y:level,z:p.z}});}
  return true;
 }
 function action(s,name){if(!s.p.water.swimming)return false;const w=s.p.water;if(name==='jump'||name==='traverse'){w.diving=false;return true;}if(name==='stance'||name==='glide'){w.diving=!w.diving;return true;}return false;}
 function impact(s,a,b){for(const q of TIDE_POOLS){const y=tideLevel(s,q),t=(y-a.y)/(b.y-a.y);if(t>0&&t<1){const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;if(tidePoolAt(x,z)?.id===q.id){ripple(s,x,z,.75);emit(s,'tide-splash',{at:{x,y,z},enter:false});}}}}
 return{init,reset,tick,nearby,use,swim,action,impact,ripple};
}
