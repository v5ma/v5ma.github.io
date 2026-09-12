/* Data + deterministic progression. Old newspaper routes remain independent.
 * Contracts, wallet, personal bests and cosmetic ownership share the existing
 * save slot; no timers advance while the simulation is paused. */
import {WORLD,CITY,RADIUS,street,norm,add,mul,dot,cross,tangent,distance,clamp} from './world.mjs';
import {cubePoint,cubePosition} from './city-data.mjs';
export const JOB_VERSION='0.7.0';
export const PAINTS=Object.freeze([{id:'ocean',name:'Ocean enamel',cost:0,color:'#147b94'},{id:'sunset',name:'Sunset copper',cost:240,color:'#d27147'},{id:'mint',name:'Sea-glass mint',cost:420,color:'#71b4a2'},{id:'midnight',name:'Midnight pearl',cost:680,color:'#323e66'},{id:'gold',name:'Champagne gold',cost:1000,color:'#c2a86b'}]);
const TYPES=['courier','cleanup','repair','photo','sprint','stunt'];
const CLIENTS=['Maya at the corner cafe','Luis with the neighborhood crew','Ari at City Signals','Nia from the photo club','The Sunrise Cycling Club','The boardwalk riders'];
const TITLES=['The breakfast run','Leave it better','Keep the signals moving','A different point of view','Coastline circuit','Air above the avenue'];
const HELP={courier:'Collect the cafe basket, then hand it to each waiting neighbor with X / E.',cleanup:'Find the highlighted litter bundles and collect them with X / E.',repair:'Stop at each signal cabinet, then lock 3 pulses in the green band.',photo:'Brake at each viewpoint and press X / E to take a postcard.',sprint:'Ride through the checkpoint rings in order. Beat your personal best; missing the par time does not end the run.',stunt:'Hop through every low stunt ring with A / Space. Keep your momentum between jumps.'};
function shifted(n,f,meters){return norm(add(n,mul(tangent(f,n),meters/RADIUS)));}
function task(n,label,mode='interact'){return {n,mail:n,label,mode};}
const originalPaths={
 courier:[[6,-4.5],[24,5],[48,5],[84,-5]],
 cleanup:[[7,4.5],[29,-4.5],[53,4.5],[76,-4.5],[103,4.5]],
 repair:[[8,-4.5],[45,-16],[87,24]],
 photo:[[13,4.5],[63,-4.5],[108,4.5]],
 sprint:[[8,-1.5],[18,-20],[66,-20],[114,-20],[114,20],[66,20],[18,20],[18,0],[7,-1.5]],
 stunt:[[10,-1.5],[32,-1.5],[56,-1.5],[80,-1.5],[103,-1.5]]
};
function buildJob(id,type,region,client,points,index){
 const mode=type==='sprint'||type==='stunt'?'pass':'interact';
 const nodes=points.map((n,i)=>task(n,type==='courier'?(i?'Hand the basket to neighbor '+i:'Pick up the cafe basket'):type==='cleanup'?'Collect litter bundle '+(i+1):type==='repair'?'Restore signal cabinet '+(i+1):type==='photo'?'Photograph viewpoint '+(i+1):type==='stunt'?'Hop through ring '+(i+1):'Checkpoint '+(i+1),mode));
 const length=points.slice(1).reduce((m,n,i)=>m+distance(points[i],n),0);
 return {id,type,region,client,name:TITLES[TYPES.indexOf(type)]+(region==='original'?'':' / '+region),instructions:HELP[type],nodes,reward:140+nodes.length*30,par:Math.ceil(length/(type==='sprint'?15:9)+nodes.length*3),seed:index,repeatable:true};
}
export const ACTIVITIES=TYPES.map((type,i)=>buildJob('local-'+type,type,'original',CLIENTS[i],originalPaths[type].map(([t,x])=>street(t,x)),i));
for(const [i,d]of CITY.districts.entries()){
 const p=cubePosition(d.mail),du=2/CITY.N,dv=du;
 for(let j=0;j<4;j++){
  const type=TYPES[(i+j)%TYPES.length];
  const grid=[[p.u,p.v],[p.u,p.v-.075],[p.u+du,p.v-.075],[p.u+du,p.v+.075],[p.u,p.v+.075],[p.u,p.v]];
  let points=grid.map(([u,v])=>cubePoint(p.face,u,v));
  if(type!=='sprint'&&type!=='stunt')points=points.slice(0,type==='cleanup'?5:4).map((n,k)=>{
   const next=points[Math.min(k+1,points.length-1)],f=tangent(add(next,mul(n,-1)),n);
   return shifted(n,cross(f,n),4.8);
  });
  if(type==='stunt')points=[-.055,-.025,.015,.05,.08].map(v=>cubePoint(p.face,p.u,p.v+v));
  const job=buildJob(d.id+'-'+type,type,d.id,CLIENTS[TYPES.indexOf(type)],points,20+i*4+j);job.name=TITLES[TYPES.indexOf(type)]+' / '+d.name;ACTIVITIES.push(job);
 }
}
const byId=new Map(ACTIVITIES.map(j=>[j.id,j]));
export function readJobs(raw){
 const r=raw&&typeof raw==='object'?raw:{},known=a=>Array.isArray(a)?[...new Set(a.filter(x=>byId.has(x)))]:[];
 const best={};if(r.best&&typeof r.best==='object')for(const [id,v]of Object.entries(r.best))if(byId.has(id)&&Number.isFinite(v)&&v>0&&v<86400)best[id]=v;
 const active=r.active&&byId.get(r.active.id),run=active?{id:active.id,index:Math.min(active.nodes.length-1,Math.max(0,Math.floor(Number(r.active.index)||0))),elapsed:clamp(Number(r.active.elapsed)||0,0,86400)}:null;
 return {completed:known(r.completed),wallet:clamp(Math.floor(Number(r.wallet)||0),0,999999),earned:clamp(Math.floor(Number(r.earned)||0),0,9999999),best,active:run,owned:[...new Set(['ocean',...(Array.isArray(r.owned)?r.owned.filter(id=>PAINTS.some(p=>p.id===id)):[])])],paint:PAINTS.some(p=>p.id===r.paint)?r.paint:'ocean'};
}
export function createJobs(raw){const s=readJobs(raw);if(!s.owned.includes(s.paint))s.paint='ocean';return s;}
export function writeJobs(s){return readJobs(s.jobs);}
function notify(s,type,text,data={}){s.toast=text;s.toastT=4;s.events.push({type,step:s.steps,...data});if(s.events.length>180)s.events.shift();}
export function currentJob(s){return s.jobs?.active?byId.get(s.jobs.active.id)||null:null;}
export function jobTarget(s){const j=currentJob(s);if(!j)return null;const n=j.nodes[s.jobs.active.index];return {...n,id:j.id,name:n.label,job:j,mail:n.n};}
export function startJob(s,id){const job=byId.get(id);if(!job)return false;s.jobs.active={id,index:0,elapsed:0};notify(s,'job-start',job.client+': '+job.instructions,{id});return true;}
export function abandonJob(s){if(!s.jobs?.active)return false;s.jobs.active=null;notify(s,'job-cancel','Contract put aside. Your completed work and credits are kept.');return true;}
function advance(s){
 const run=s.jobs.active,j=currentJob(s);if(!run||!j)return false;
 run.index++;
 if(run.index<j.nodes.length){notify(s,'job-stage',j.nodes[run.index].label+' | '+run.index+'/'+j.nodes.length,{id:j.id});return true;}
 const repeat=s.jobs.completed.includes(j.id),reward=repeat?Math.round(j.reward*.55):j.reward,elapsed=Math.max(.01,run.elapsed);
 s.jobs.wallet+=reward;s.jobs.earned+=reward;
 if(!repeat)s.jobs.completed.push(j.id);
 if(!s.jobs.best[j.id]||elapsed<s.jobs.best[j.id])s.jobs.best[j.id]=elapsed;
 s.jobs.active=null;notify(s,'job-complete','CONTRACT COMPLETE | +'+reward+' credits | '+Math.round(elapsed)+' seconds'+(elapsed<=j.par?' | Gold pace!':''),{id:j.id,reward,elapsed});return true;
}
export function interactJob(s){
 const j=currentJob(s),t=jobTarget(s);if(!j||!t||t.mode==='pass'||distance(s.n,t.n)>4.1)return null;
 if(j.type==='repair'){if(s.speed>1.7){notify(s,'hint','Brake at the cabinet to work on it.');return {kind:'handled'};}return {kind:'repair',seed:j.seed+s.jobs.active.index};}
 if(j.type==='photo'&&s.speed>1.7){notify(s,'hint','Brake first for a sharp postcard.');return {kind:'handled'};}
 const kind=j.type==='photo'?'photo':j.type==='cleanup'?'pickup':'handoff';notify(s,kind,t.label,{id:j.id});advance(s);return {kind};
}
export function finishRepair(s){const j=currentJob(s),t=jobTarget(s);if(j?.type!=='repair'||!t||distance(s.n,t.n)>4.1)return false;notify(s,'repair','Signal restored. The neighborhood thanks you.');return advance(s);}
export function signalPhase(seconds,seed=0){return (seconds*(.6+(seed%3)*.07)+seed*.17)%1;}
export function goodSignal(phase){return phase>=.38&&phase<=.64;}
function crossed(a,b,p){
 if(distance(b,p)<3.0)return true;
 const delta=mul(add(b,mul(a,-1)),RADIUS),to=mul(add(p,mul(a,-1)),RADIUS),l2=dot(delta,delta);
 if(l2<1e-10||l2>2500)return false;const t=clamp(dot(to,delta)/l2,0,1);return Math.hypot(...add(to,mul(delta,-t)))<3.0;
}
export function tickJobs(s,previous,dt){
 const j=currentJob(s);if(!j)return;s.jobs.active.elapsed+=dt;
 const t=jobTarget(s);if(t.mode==='pass'&&crossed(previous,s.n,t.n)){
  if(j.type==='stunt'&&s.lift<.20){if(s.toastT<.5)notify(s,'hint','Hop through the ring: A / Space.');return;}
  if(s.ride)advance(s);
 }
}
export function buyPaint(s,id){const p=PAINTS.find(p=>p.id===id);if(!p)return false;if(!s.jobs.owned.includes(id)){if(s.jobs.wallet<p.cost){notify(s,'hint','Earn '+(p.cost-s.jobs.wallet)+' more credits for '+p.name+'.');return false;}s.jobs.wallet-=p.cost;s.jobs.owned.push(id);}s.jobs.paint=id;notify(s,'customize','Equipped: '+p.name);return true;}
export function jobSummary(s){return {total:ACTIVITIES.length,completed:s.jobs.completed.length,wallet:s.jobs.wallet,earned:s.jobs.earned,rank:['New neighbor','Local regular','Community rider','Coastal champion'][Math.min(3,Math.floor(s.jobs.earned/1400))],active:s.jobs.active?{...s.jobs.active,name:currentJob(s)?.name,total:currentJob(s)?.nodes.length}:null,paint:s.jobs.paint};}
