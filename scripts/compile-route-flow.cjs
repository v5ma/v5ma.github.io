/* Offline compiler: recipe -> fit -> reject collisions -> compose states -> export. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{load,T,root}=require('../tests/flow-fixture.cjs');
const c=load(['route-flow-core.js','route-flow-layout.js','route-flow-world.js']);
const F=c.RouteFlow,K=c.GrappleCore,dir=path.join(root,'planning/flow-reports');fs.mkdirSync(dir,{recursive:true});
const n=Number(process.argv[2]||0),old=c.GroundCampaign.make(n,T),modelHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'grapple-core.js'))).digest('hex');
console.time('compile');
const fit=c.FlowLayout.build(old,{target:30+n*4});
const mainIDs=old.gp.skyNetwork.mainIDs;
let tracks=fit.rails.map(t=>({points:t.pts.map(q=>q.map(v=>Math.round(v*100)/100)),meta:{...t.sky}}));
tracks.forEach((t,i)=>{t.meta.stage=i;t.meta.optional=true;t.meta.network=true;t.meta.flow=true;});
const sectors=old.gp.skyNetwork.sectors.map(s=>({...s}));
let plan={version:'flow-1',id:'chapter-'+n,modelHash,tracks,mainIDs:mainIDs.filter(id=>tracks.some(p=>p.meta.id===id)),links:[],sectors,pegs:[],flightRewards:[]};
function cloneCourse(d){return {...d,cells:new Uint8Array(d.cells),gp:JSON.parse(JSON.stringify(d.gp))};}
let course=c.FlowWorld.apply(cloneCourse(old),plan,T),w=F.witnesses(course,{maxStates:1800});
// Do not ship a receiver just because a candidate simulation from a fictitious
// starting speed once reached it. Keep only composed entry-to-contact evidence.
for(let pass=0;pass<3&&w.unproven.length;pass++){const unknown=new Set(w.unproven);plan.tracks=plan.tracks.filter(t=>!unknown.has(t.meta.id));plan.mainIDs=plan.mainIDs.filter(id=>!unknown.has(id));course=c.FlowWorld.apply(cloneCourse(old),plan,T);w=F.witnesses(course,{maxStates:1800});}
if(w.unproven.length||w.truncated)throw Error('State witness search incomplete: '+JSON.stringify(w.unproven));
let audit=F.audit(course);
if(audit.issues.length)throw Error('Clearance failure');
const usable=w.transitions.filter(e=>e.to!=='road'),chosen=new Map();
for(const e of usable){const k=e.from+'>'+e.to;if(!chosen.has(k))chosen.set(k,e);}
plan.links=[...chosen.values()].map(e=>({from:e.from,to:e.to,type:'sampled-flight',control:e.control.mode,jumpAt:e.control.jumpAt??null}));
// Plant pegs only on an actual reachable outgoing trajectory with a simulated
// cast, controllable wind-up and a release that reaches a rail or the road.
const rails=course.ct.map(p=>F.rail(p,p.sky));
const pegEvidence=[];
for(const entry of [...chosen.values()]){
 if(plan.pegs.length>=5+n||!entry.witness.launch||!entry.witness.airTicks||entry.witness.airTicks<14)continue;
 const l=entry.witness.launch;let p={w:26,h:30,x:l.x,y:l.y,vx:l.vx,vy:l.vy,track:null,trackCD:6,_airTicks:0};
 for(let tick=0;tick<14;tick++)K.flight(p,{right:true});
 const peg={id:'peg-'+plan.pegs.length,x:Math.round((p.x+13+85-18)/36)*36+18,y:Math.round((p.y+15-160-18)/36)*36+18};
 if(peg.y<160||peg.y>course.ground*36-110||plan.pegs.some(q=>Math.hypot(q.x-peg.x,q.y-peg.y)<480))continue;
 const solid=(x,y)=>{const tx=Math.floor(x/36),ty=Math.floor(y/36);return [1,2,3,9,10,31,32,33,67,84].includes(course.cells[ty*course.width+tx]);};
 if(!K.lineClear({x:p.x+13,y:p.y+15},peg,solid)||!K.cast(p,peg))continue;
 let release=null;
 for(let t=0;t<160;t++){K.swing(p,{right:true},solid);if(!p.peg)break;if(p.peg.loops>=1&&p.vx>7&&p.vy<-3){release=K.release(p);break;}}
 if(!release)continue;
 const r=F.trace(p,rails,{ground:course.ground*36,worldWidth:course.width*36,doc:course,mode:'throttle'});
 if(!['caught','ground'].includes(r.status))continue;
 const at=Math.floor(peg.y/36)*course.width+Math.floor(peg.x/36);if(course.cells[at])continue;
 plan.pegs.push(peg);pegEvidence.push({peg,from:entry.from,castAfterLipTicks:14,control:'Hold Z, steer right for a full wind-up, release upward/right',release,recovery:r.target||'road',witness:F.compact(r),entryRoute:entry.route});
}
for(const e of [...chosen.values()]){if(e.witness.airTicks<12)continue;const p=e.witness.points;for(const t of [.50,.65,.80]){const q=p[Math.floor((p.length-1)*t)];if(q)plan.flightRewards.push(q.map(x=>Math.round(x)));}}
course=c.FlowWorld.apply(cloneCourse(old),plan,T);audit=F.audit(course);w=F.witnesses(course,{maxStates:1800});
const before=F.audit(old),beforeW=F.witnesses(old,{maxStates:1800});
const packedWitness=w=>({...w,points:w.points.filter((_,i)=>i%3===0||i===w.points.length-1)});
w.transitions=w.transitions.map(e=>({...e,witness:packedWitness(e.witness)}));
audit.edges=audit.edges.map(e=>({...e,witness:packedWitness(e.witness)}));
const report={version:'flow-1',chapter:n,level:old.name,modelHash,layoutHash:F.fingerprint(course),before:{metrics:before.metrics,composedUnproven:beforeW.unproven,entryCount:beforeW.entries.length,truncated:beforeW.truncated},after:{metrics:audit.metrics,composedUnproven:w.unproven,entryCount:w.entries.length,truncated:w.truncated},audit,witnesses:w,pegEvidence,claim:'Every final roadway has a bounded composed entry-to-contact witness. Rail/flight model shares GrappleCore. Default ground-entry model, enemy timing and arbitrary player states are not universally proven. Native UI replay required.'};
fs.writeFileSync(path.join(dir,'chapter-'+n+'.json'),JSON.stringify(report));
fs.writeFileSync(path.join(dir,'plan-'+n+'.json'),JSON.stringify(plan));
console.log({chapter:n,nodes:plan.tracks.length,pegs:plan.pegs.length,before:report.before,after:report.after});console.timeEnd('compile');
