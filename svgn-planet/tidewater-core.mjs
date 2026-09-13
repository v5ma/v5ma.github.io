import {street,distance,tangent,add,mul,norm,cross,dot,rotate,RADIUS,clamp} from './world.mjs';
import {TIDEWATER,BASINS,basinAt,boatClear} from './tidewater-layout.mjs';
export * from './tidewater-layout.mjs';
const spot=(t,x,label,kind='work')=>({n:street(t,x),mail:street(t,x),label,kind});
export const WATER_JOBS=Object.freeze([
 {id:'pool-opening',name:'Seaglass Pool / Opening time',type:'pool',reward:360,description:'Pick up a skimmer, remove three rafts of leaves from the pool edge, route the filter valves, and bring back the kit. The pool clears as you work.',nodes:[spot(-48,65,'Collect the pool-service kit'),spot(-57,41,'Skim the shallow-end leaves','skim'),spot(-69,41,'Skim the deep-end leaves','skim'),spot(-64,61,'Skim the east-side leaves','skim'),spot(-79,56,'Restore flow at the filter cabinet','pump'),spot(-48,65,'Return the kit and reopen the pool')]},
 {id:'canal-courier',name:'Lantern Canal / The floating post',type:'canal',reward:520,description:'Collect the harbor parcel, board the pedal skiff at the dock, follow the buoys, recover the floating dispatch, and return it to the boathouse. Y boards or docks; X handles the parcel.',nodes:[spot(-91,46,'Collect the sealed harbor parcel'),spot(...TIDEWATER.dock,'Board the pedal skiff','board'),spot(-114,69,'Pass the first canal buoy','boat-pass'),spot(-125,100,'Brake and collect the floating dispatch','salvage'),spot(-103,102,'Pass the return buoy','boat-pass'),spot(...TIDEWATER.launch,'Return to the dock and disembark','dock'),spot(-91,46,'Deliver both parcels to the boathouse')]},
 {id:'boardwalk-relay',name:'Tidewater Circuit / Ride the waterline',type:'relay',reward:430,description:'Ride through ten checkpoints around the pool and marina. Chase a personal best without a deadline. Your bicycle and unicycle keep their unlimited acceleration and free coasting.',nodes:[[-40,27],[-82,25],[-143,28],[-143,77],[-143,124],[-106,127],[-85,125],[-85,72],[-40,72],[-40,27]].map(([t,x],i)=>spot(t,x,'Boardwalk checkpoint '+(i+1),'ride-pass'))}
]);
const jobs=new Map(WATER_JOBS.map(j=>[j.id,j]));
const finite=(v,d=0)=>Number.isFinite(v)?v:d;
export function readTide(raw){const r=raw&&typeof raw==='object'?raw:{},a=r.active,j=jobs.get(a?.id),best={};for(const [id,v]of Object.entries(r.best&&typeof r.best==='object'?r.best:{}))if(jobs.has(id)&&Number.isFinite(v)&&v>0&&v<86400)best[id]=v;return {active:j?{id:j.id,index:clamp(Math.floor(finite(a.index)),0,j.nodes.length-1),elapsed:clamp(finite(a.elapsed),0,86400)}:null,completed:Array.isArray(r.completed)?[...new Set(r.completed.filter(id=>jobs.has(id)))]:[],best,poolClean:r.poolClean===true,valves:Array.isArray(r.valves)&&r.valves.length===3?r.valves.map(v=>clamp(Math.floor(finite(v)),0,3)):[0,0,0],boat:false};}
export function tideSave(s){const t=readTide(s.tide);delete t.boat;return t;}
export function waterJob(s){return jobs.get(s.tide?.active?.id)||null;}
export function waterTarget(s){const j=waterJob(s),r=s.tide?.active;if(!j||!r)return null;const p=j.nodes[r.index];return {...p,name:p.label,id:'water-'+j.id+'-'+r.index};}
export function waterNotice(s,type,text,data={}){s.toast=text;s.toastT=5;s.events.push({type,step:s.steps,...data});if(s.events.length>180)s.events.shift();}
export function startWaterJob(s,id){const j=jobs.get(id);if(!j)return false;s.tide.active={id,index:0,elapsed:0};if(j.type==='pool')s.tide.valves=[0,0,0];waterNotice(s,'job-start',j.name+' | '+j.nodes[0].label);return true;}
export function abandonWater(s){s.tide.active=null;waterNotice(s,'job-cancel','Water excursion put aside. City jobs and all completed work are kept.');}
function advance(s){const j=waterJob(s),r=s.tide.active;if(!j||!r)return false;r.index++;if(r.index<j.nodes.length){waterNotice(s,'water-stage',j.nodes[r.index].label);return true;}const repeat=s.tide.completed.includes(j.id),earned=Math.round(j.reward*(repeat?.55:1)),elapsed=Math.max(.01,r.elapsed);if(!repeat)s.tide.completed.push(j.id);s.tide.best[j.id]=Math.min(s.tide.best[j.id]||Infinity,elapsed);s.jobs.wallet+=earned;s.jobs.earned+=earned;s.tide.active=null;waterNotice(s,'water-complete','WATERFRONT COMPLETE | +'+earned+' credits | '+elapsed.toFixed(1)+' s',{id:j.id,reward:earned,elapsed});return true;}
export function atWaterDock(s){return distance(s.n,street(...(s.tide?.boat?TIDEWATER.launch:TIDEWATER.dock)))<(s.tide?.boat?6:4.2);}
function place(s,n,heading){s.n=[...n];s.north=tangent(heading||[0,0,-1],n);s.facing=[...s.north];s.speed=s.lift=s.vy=0;s.boosting=false;s.paper=null;s.ride=true;}
export function visitWaterfront(s){s.tide.boat=false;place(s,street(...TIDEWATER.landing),tangent([0,0,1],street(...TIDEWATER.landing)));waterNotice(s,'transit','Tidewater Commons | Pool ahead. Marina beyond. X interacts; Menu opens Water missions.');return true;}
export function returnWaterDock(s){const docking=waterTarget(s)?.kind==='dock';s.tide.boat=false;place(s,street(...TIDEWATER.dock));waterNotice(s,'water-dock','Back at the dock. Your current excursion is kept.');if(docking)advance(s);}
export function toggleWatercraft(s){
 if(!s.tide.boat&&!atWaterDock(s))return false;
 if(!atWaterDock(s)){waterNotice(s,'hint','Return to the marked dock to leave the skiff, or use Water missions / Return to dock.');return true;}
 if(s.speed>2.2){waterNotice(s,'hint','Brake with LT / B / Ctrl before boarding or docking.');return true;}
 const exiting=s.tide.boat,t=waterTarget(s);s.tide.boat=!exiting;const n=street(...(exiting?TIDEWATER.dock:TIDEWATER.launch));place(s,n);if(!exiting)s.facing=s.north=tangent(add(street(-120,72),mul(n,-1)),n);
 waterNotice(s,exiting?'water-dock':'water-board',exiting?'Skiff secured. Your bicycle or unicycle is ready.':'Pedal skiff | Left stick steers. RT accelerates; LT / B brakes. Y docks near the pier.');
 if(t&&(t.kind===(exiting?'dock':'board')))advance(s);return true;
}
export function interactWater(s){const t=waterTarget(s);if(!t||distance(s.n,t.n)>3.8){if(atWaterDock(s)){toggleWatercraft(s);return {kind:'handled'};}return null;}
 if(t.kind==='board'||t.kind==='dock'){toggleWatercraft(s);return {kind:'handled'};}
 if(t.kind.endsWith('-pass'))return null;
 if((t.kind==='salvage')!==s.tide.boat){waterNotice(s,'hint',t.kind==='salvage'?'Use the pedal skiff to reach the floating dispatch.':'Leave the skiff at the dock to work on shore.');return {kind:'handled'};}
 if(s.speed>2.2){waterNotice(s,'hint','Brake beside the marker to work. LT / B / Ctrl.');return {kind:'handled'};}
 if(t.kind==='pump')return {kind:'pump'};
 waterNotice(s,t.kind==='skim'?'water-skim':t.kind==='salvage'?'water-splash':'handoff',t.label,{n:[...t.n]});advance(s);return {kind:'handled'};
}
export const PUMP_SOLUTION=Object.freeze([1,2,3]);
export function setWaterValve(s,i,v){if(!Number.isInteger(i)||i<0||i>2||!Number.isInteger(v)||v<0||v>3)return false;s.tide.valves[i]=v;return true;}
export function finishWaterPump(s){const t=waterTarget(s);if(t?.kind!=='pump'||s.tide.boat||distance(s.n,t.n)>3.8||s.speed>2.2)return false;if(!s.tide.valves.every((v,i)=>v===PUMP_SOLUTION[i])){waterNotice(s,'signal-miss','Match the route: pool intake, filter bed, clean return.');return false;}s.tide.poolClean=true;waterNotice(s,'water-pump','Filter flowing. Seaglass Pool is clear again.');advance(s);return true;}
function swept(a,b,n,threshold=3.5){if(distance(b,n)<threshold)return true;const d=mul(add(b,mul(a,-1)),RADIUS),v=mul(add(n,mul(a,-1)),RADIUS),l2=dot(d,d);if(l2<1e-10||l2>2500)return false;const f=clamp(dot(v,d)/l2,0,1);return Math.hypot(...add(v,mul(d,-f)))<threshold;}
export function tickWater(s,previous,dt){const t=waterTarget(s);if(!t)return;s.tide.active.elapsed+=dt;if((t.kind==='ride-pass'&&s.ride&&!s.tide.boat||t.kind==='boat-pass'&&s.tide.boat)&&swept(previous,s.n,t.n))advance(s);}
export function stepWatercraft(s,input,dt){
 if(!s.tide.boat)return false;
 const brake=!!input.brake,boost=!!input.boost&&!brake;let dir=input.direction;
 if(!dir||!Array.isArray(dir)||dir.length!==3||!dir.every(Number.isFinite)||Math.hypot(...dir)<.01)dir=null;
 const wanted=brake?0:boost?9:Math.max(s.speed,dir?3.6*clamp(finite(input.throttle,1),0,1):0);
 s.speed+=(wanted-s.speed)*(1-Math.exp(-dt*(brake?15:3.5)));if(s.speed<.004)s.speed=0;s.boosting=boost;s.energy=1;s.lift=s.vy=0;
 if(s.speed>.001){dir=tangent(dir||s.facing,s.n);const axis=norm(cross(s.n,dir)),angle=s.speed*dt/RADIUS,next=norm(rotate(s.n,axis,angle));if(boatClear(next)){s.n=next;s.north=tangent(rotate(s.north,axis,angle),s.n);s.facing=tangent(rotate(dir,axis,angle),s.n);s.distance+=angle*RADIUS;}else{s.speed=0;if(s.collisionCooldown<=0){s.collisionCooldown=.6;waterNotice(s,'water-bump','Canal edge. Steer back into open water.');}}}
 return true;
}
export function waterSummary(s){const j=waterJob(s),r=s.tide.active;return {edition:'Tidewater Commons',jobs:WATER_JOBS.length,boat:s.tide.boat,completed:[...s.tide.completed],poolClean:s.tide.poolClean,valves:[...s.tide.valves],active:r?{...r,name:j.name,total:j.nodes.length,target:waterTarget(s)}:null,best:{...s.tide.best}};}
