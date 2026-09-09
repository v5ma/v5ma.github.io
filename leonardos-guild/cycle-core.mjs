/* Bartolo's working cycle bench. Additive local save; stock controls and physics
 * are unchanged. Road-test gates observe actual swept movement, never drive it. */
import {roomAt,stats,notify} from './life-core.mjs';
export const CYCLE_BENCH=Object.freeze({id:'cycleworks',name:"Bartolo's cycle tuning bench",x:-22,z:212,room:'smith',kind:'cycle',job:'fitting',description:'Finish A Better Fit here, then fit gears, a brake lever or a frame finish. Owned parts can be refitted free. Try the optional road test outside.'});
export const GEARS=Object.freeze({stock:{name:'Original gearing',price:0,accel:1,top:1},sprint:{name:'Sprint gearing',price:30,accel:1.25,top:.88},cruise:{name:'Cruise gearing',price:50,accel:.85,top:1.12}});
export const BRAKES=Object.freeze({stock:{name:'Original brake',price:0,rate:1},lever:{name:'Long-pull brake lever',price:35,rate:1.5}});
export const FINISHES=Object.freeze({terracotta:{name:'Workshop terracotta',price:0,color:'#ba623b'},river:{name:'River enamel',price:8,color:'#397d8e'},olive:{name:'Olive enamel',price:8,color:'#708048'},ivory:{name:'Ivory enamel',price:8,color:'#ddd1ad'}});
export const ROAD_GATES=Object.freeze([{x:0,z:220,name:'Start / roll north',radius:4},{x:-2,z:229,name:'Left line',radius:2.8},{x:2,z:239,name:'Right line',radius:2.8},{x:-2,z:249,name:'Return left',radius:2.8},{x:0,z:259,name:'Brake and stop',radius:3.2}]);
const kinds={gear:GEARS,brake:BRAKES,finish:FINISHES};
const initial={gear:'stock',brake:'stock',finish:'terracotta'};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const owns=(o,k)=>Object.hasOwn(o,k);
export function cycleState(raw){
 const c={version:1,gear:'stock',brake:'stock',finish:'terracotta',owned:{gear:['stock'],brake:['stock'],finish:['terracotta']},rewarded:false,best:null,pending:null,active:null};
 if(!raw||raw.version!==1)return c;
 for(const [kind,items]of Object.entries(kinds)){
  if(Array.isArray(raw.owned?.[kind]))c.owned[kind]=[...new Set([initial[kind],...raw.owned[kind].filter(k=>typeof k==='string'&&owns(items,k))])];
  if(c.owned[kind].includes(raw[kind]))c[kind]=raw[kind];
 }
 c.rewarded=raw.rewarded===true;
 const time=t=>Number.isFinite(t)&&t>0&&t<=7200;
 if(time(raw.best))c.best=raw.best;
 if(time(raw.pending?.seconds))c.pending={seconds:raw.pending.seconds};
 // A saved game starts at the workshop, so an unfinished timed run is not resumed.
 return c;
}
export function saveCycle(c){return {version:1,gear:c.gear,brake:c.brake,finish:c.finish,owned:{gear:[...c.owned.gear],brake:[...c.owned.brake],finish:[...c.owned.finish]},rewarded:c.rewarded,best:c.best,pending:c.pending?{...c.pending}:null};}
export function cycleModifiers(s){const c=s.cycle||cycleState();return {accel:GEARS[c.gear].accel,top:GEARS[c.gear].top,brake:BRAKES[c.brake].rate};}
export function bikeSpecification(s){const variant=s.life.bike,base=variant==='courier'?{top:17,boost:22,accel:7}:variant==='cargo'?{top:11,boost:15,accel:5}:{top:13,boost:18,accel:6};const m=cycleModifiers(s),bonus=stats(s).rideBonus;return {top:(base.top+bonus)*m.top,boost:(base.boost+bonus)*m.top,accel:base.accel*m.accel,brake:5*m.brake};}
export function atCycleBench(s,w){return s.mode==='foot'&&Math.abs(s.speed)<=1.7&&!s.life.inside&&roomAt(s,w)?.id==='smith'&&distance(s,CYCLE_BENCH)<3.1;}
export function cycleAction(s,w,action){
 if(!atCycleBench(s,w))return {ok:false,text:'Stop on foot beside the tuning bench inside Bartolo\'s shop.'};
 if(!s.street.done.includes('fitting'))return {ok:false,text:'First finish A Better Fit at this same workstation, using Work / Y or Nearby.'};
 const c=s.cycle,reply=text=>{notify(s,text,'cycle-work',{action});return {ok:true,text};};
 if(action==='start'){
  if(c.active)return {ok:false,text:'A test is already marked. Ride it, or cancel it from the Road test tab.'};
  if(c.pending)return {ok:false,text:'Report your finished test before starting another.'};
  c.active={gate:0,seconds:0};return reply('Road test marked. Mount your bicycle, roll north through the start, follow the gates, and brake inside the final ring. There is no time limit or entry fee.');
 }
 if(action==='report'){
  if(!c.pending)return {ok:false,text:'Finish the actual road test, including a stopped landing in its final ring, before reporting.'};
  const seconds=c.pending.seconds;let rewarded=false;
  if(!c.rewarded){c.rewarded=true;s.life.xp+=40;s.credits+=25;rewarded=true;}
  c.pending=null;return reply(`Road test recorded: ${seconds.toFixed(1)} s. ${rewarded?'+40 experience / +25 florins.':'Practice improves your personal best; rewards are not paid again.'}`);
 }
 const [kind,id,...extra]=action.split(':');
 if(extra.length||!owns(kinds,kind)||!owns(kinds[kind],id))return {ok:false,text:'That component is not available.'};
 if(c.active||c.pending)return {ok:false,text:'Finish or cancel the active test and report its result before changing your setup.'};
 const item=kinds[kind][id],owned=c.owned[kind].includes(id);
 if(!owned&&s.credits<item.price)return {ok:false,text:`You need ${item.price} earned florins. Nothing was charged.`};
 if(!owned){s.credits-=item.price;c.owned[kind].push(id);}c[kind]=id;
 return reply(`${item.name} fitted${owned?' without a refitting charge':` for ${item.price} florins`}. This setup applies to your bicycle, not the pedal carriage.`);
}
export function cancelRoadTest(s){if(!s.cycle?.active)return false;s.cycle.active=null;notify(s,'Road test cancelled. No fee, reward or old mission progress changed.','cycle-cancel');return true;}
export function roadTarget(s){if(s.cycle?.active)return ROAD_GATES[s.cycle.active.gate];if(s.cycle?.pending)return {...CYCLE_BENCH,name:'Return inside Bartolo\'s shop and report'};return null;}
function sweptDistance(a,b,p){const dx=b.x-a.x,dz=b.z-a.z,d=dx*dx+dz*dz,t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/d)):0;return Math.hypot(a.x+dx*t-p.x,a.z+dz*t-p.z);}
export function cycleStep(s,old,dt){
 const a=s.cycle?.active;if(!a)return;
 if(a.gate>0)a.seconds+=dt;
 if(s.life.inside){cancelRoadTest(s);return;}
 if(s.mode!=='bike'||distance(s,old)>2||!Number.isFinite(dt)||dt<=0)return;
 const gate=ROAD_GATES[a.gate];
 if(a.gate===ROAD_GATES.length-1){
  if(distance(s,gate)>gate.radius||Math.abs(s.speed)>1.2||s.lift>.05)return;
  const seconds=Math.round(Math.max(.1,Math.min(7200,a.seconds))*10)/10;
  s.cycle.pending={seconds};s.cycle.best=s.cycle.best===null?seconds:Math.min(seconds,s.cycle.best);s.cycle.active=null;
  notify(s,'Clean stop! Return to Bartolo to report your road test. No restart or teleport is needed.','cycle-finish',{seconds});return;
 }
 // One checkpoint per simulation step, northward passage only; foot/car/remote
 // button actions and skipping directly to the stopping ring cannot count.
 if(s.z<=old.z||s.speed<.3||sweptDistance(old,s,gate)>gate.radius)return;
 a.gate++;notify(s,`Road test ${a.gate}/${ROAD_GATES.length-1}: ${ROAD_GATES[a.gate].name}.`,'cycle-gate',{gate:a.gate});
}
