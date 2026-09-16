/* Exploratory actual isolated rail physics. One seeded jump, not native play.
 * Run from any directory; redirect stdout to retain all ninety samples.
 * No live game state is read or written and no claim of universal reachability.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {build,groundRow} from '../../waterwheel-layout-core.mjs';
const require=createRequire(import.meta.url),{context,T}=require('../../../../tests/helpers/flow-fixture.cjs');
const c=context(),d=build(T);
function run({speed,offset,mode,brake}){
 const f=c.RailGripCore.create();f.grip.configure({mode});const K=f.physics,rails=d.ct.map(p=>K.rail(p,p.sky));
 const r=rails.find(t=>t.sky.id==='ww-runway'),x=r.pts[0][0]-offset;
 const p={x,y:groundRow(Math.floor(x/36))*36-30,w:26,h:30,vx:speed,vy:-13,trackCD:0,_airTicks:0,onGround:false,roll:0};
 let entered=false,from=null;const visits=[],exits=[];
 for(let tick=0;tick<1600;tick++){
  const old={x:p.x,y:p.y};if(p.trackCD>0)p.trackCD--;
  if(p.track){const t=p.track,b=t.sky.id==='ww-runway'&&brake>0&&t.len-p.trackS<brake;
   if(K.ride(p,{right:!b,left:b})){from=t.sky.id;p._airTicks=0;exits.push({id:from,x:p.x,y:p.y,vx:p.vx,vy:p.vy});}
  }else{
   if(!entered){p.vy=Math.min(13,p.vy+.55);p.x+=p.vx;p.y+=p.vy;}else K.flight(p,{right:true,left:false});
   p._airTicks++;const hit=K.catchRail(p,old,rails,from);
   if(hit){entered=true;visits.push(hit.tr.sky.id);from=null;p._airTicks=0;}
  }
  if(![p.x,p.y,p.vx,p.vy].every(Number.isFinite))throw Error('Nonfinite carried state');
  if(!p.track&&p.y+p.h>=groundRow(Math.floor(p.x/36))*36)return {visits,exits,exit:'road',landing:{x:p.x,y:p.y,vx:p.vx},ticks:tick};
  if(p.x<0||p.x>d.width*36||p.y<0)return {visits,exits,exit:'bounds',x:p.x,y:p.y,ticks:tick};
 }
 return {visits,exits,exit:'timeout',x:p.x,y:p.y,track:p.track?.sky?.id,speed:p.speed};
}
const results=[];
for(const mode of ['forgiving','precision'])for(const speed of [5,7.5,10])for(const offset of [90,120,150])for(const brake of [0,80,160,200,240])results.push({mode,speed,offset,brake,...run({mode,speed,offset,brake})});
const summary=[0,80,160,200,240].map(brake=>{
 const samples=results.filter(r=>r.brake===brake),outcomes={},landings=samples.filter(r=>r.landing).map(r=>r.landing.x);
 for(const r of samples){const key=r.visits.join(' > ')+' / '+r.exit;outcomes[key]=(outcomes[key]||0)+1;}
 return {brake,cases:samples.length,outcomes,landingRange:landings.length?[Math.min(...landings),Math.max(...landings)]:null};
});
const inputs=['waterwheel-layout-core.mjs','rail-grip-core.js','grapple-core.js'];
const hashes=Object.fromEntries(inputs.map(name=>[name,createHash('sha256').update(readFileSync(new URL('../../'+name,import.meta.url))).digest('hex')]));
console.log(JSON.stringify({scope:'Exploratory isolated carried-state rail model. One explicit road-jump seed; no native full-terrain/enemy/packet or swept-body/deck qualification. Brake is an experiment input policy, not an automatic game mechanic. Timeouts do not establish that a user is trapped.',input_sha256:hashes,summary,results},null,2));
