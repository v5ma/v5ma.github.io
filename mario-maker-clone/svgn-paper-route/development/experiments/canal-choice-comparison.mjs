/* Isolated paired geometry comparison. One seeded jump then carried state.
 * This is not a native playthrough and changes no running game or saved document.
 * Both old/new collector definitions are explicit, so later layout edits cannot
 * silently replace the historical control curve in this experiment.
 */
import {createRequire} from 'node:module';
import {paths,groundRow} from '../../waterwheel-layout-core.mjs';
const require=createRequire(import.meta.url),{context}=require('../../../../tests/helpers/flow-fixture.cjs');
const c=context();
function run(mode,threshold,hold,extension){
const f=c.RailGripCore.create();f.grip.configure({mode});const K=f.physics, ps=paths();
{const r=ps.find(p=>p.sky.id==='ww-collector');const [p0,p1,p2,p3]=extension?[[4060,1970],[4320,2030],[4740,2050],[4980,2076]]:[[4300,1990],[4520,2050],[4760,2050],[4980,2076]];const arr=[];for(let i=0;i<=64;i++){const t=i/64,u=1-t;arr.push([u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0],u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1]]);}arr.sky=r.sky;ps[ps.indexOf(r)]=arr;}
const rails=ps.map(p=>K.rail(p,p.sky)),entry=rails.find(t=>t.sky.id==='ww-runway'),x=entry.pts[0][0]-120;
const p={x,y:groundRow(Math.floor(x/36))*36-30,w:26,h:30,vx:7.5,vy:-13,trackCD:0,_airTicks:0,onGround:false,roll:0};
let entered=false,from=null,started=false,held=0;const visits=[];
for(let tick=0;tick<1600;tick++){
const old={x:p.x,y:p.y};if(p.trackCD>0)p.trackCD--;
if(!started&&threshold>0&&p.track?.sky.id==='ww-runway'&&p.track.len-p.trackS<threshold)started=true;
const brake=started&&held<hold;if(brake)held++;
if(p.track){const t=p.track;if(K.ride(p,{right:!brake,left:brake})){from=t.sky.id;p._airTicks=0;}}
else{if(!entered){p.vy=Math.min(13,p.vy+.55);p.x+=p.vx;p.y+=p.vy;}else K.flight(p,{right:!brake,left:brake});p._airTicks++;const h=K.catchRail(p,old,rails,from);if(h){entered=true;visits.push(h.tr.sky.id);from=null;p._airTicks=0;}}
if(!p.track&&p.y+p.h>=groundRow(Math.floor(p.x/36))*36)return {mode,threshold,hold,extension,visits,x:p.x,exit:'road',ticks:tick};
}return {mode,threshold,hold,extension,visits,exit:'timeout'};}
for(const extension of [false,true]){let all=[];for(const mode of ['forgiving','precision'])for(const t of [0,80,120,160,200,240,320])for(const h of [8,12,18,24,36])all.push(run(mode,t,h,extension));console.log(JSON.stringify({extension,byThreshold:Object.fromEntries([0,80,120,160,200,240,320].map(t=>{let a=all.filter(r=>r.threshold===t),out={};for(const r of a){const k=r.visits.join(',')+' / '+r.exit;out[k]=(out[k]||0)+1;}return [t,out];})),cases:all}));}
