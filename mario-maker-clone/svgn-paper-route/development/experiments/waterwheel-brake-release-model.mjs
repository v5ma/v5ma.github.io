/* Exploratory input-policy comparison. Isolated rail physics, not native play.
 * One seeded jump per case, then continuous carried state and a finite brake hold.
 * No live game is loaded or changed. Outputs JSON for review, not acceptance.
 */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {build,groundRow} from '../../waterwheel-layout-core.mjs';
const require=createRequire(import.meta.url),{context,T}=require('../../../../tests/helpers/flow-fixture.cjs');
const c=context(),d=build(T);
function run({threshold,hold,mode}){
 const f=c.RailGripCore.create();f.grip.configure({mode});const K=f.physics,rails=d.ct.map(p=>K.rail(p,p.sky));
 const entry=rails.find(t=>t.sky.id==='ww-runway'),x=entry.pts[0][0]-120;
 const p={x,y:groundRow(Math.floor(x/36))*36-30,w:26,h:30,vx:7.5,vy:-13,trackCD:0,_airTicks:0,onGround:false,roll:0};
 let entered=false,from=null,brakeStarted=false,held=0;const visits=[],events=[];
 for(let tick=0;tick<1600;tick++){
  const old={x:p.x,y:p.y};if(p.trackCD>0)p.trackCD--;
  if(!brakeStarted&&threshold>0&&p.track?.sky.id==='ww-runway'&&p.track.len-p.trackS<threshold){brakeStarted=true;events.push({type:'brake',tick,x:p.x,speed:p.speed});}
  const brake=brakeStarted&&held<hold;if(brake)held++;
  if(p.track){const t=p.track;if(K.ride(p,{right:!brake,left:brake})){from=t.sky.id;p._airTicks=0;events.push({type:'exit',id:from,tick,x:p.x,vx:p.vx,vy:p.vy});}}
  else{
   if(!entered){p.vy=Math.min(13,p.vy+.55);p.x+=p.vx;p.y+=p.vy;}else K.flight(p,{right:!brake,left:brake});
   p._airTicks++;const hit=K.catchRail(p,old,rails,from);if(hit){entered=true;visits.push(hit.tr.sky.id);from=null;p._airTicks=0;}
  }
  if(![p.x,p.y,p.vx,p.vy].every(Number.isFinite))throw Error('Nonfinite carried state');
  if(!p.track&&p.y+p.h>=groundRow(Math.floor(p.x/36))*36)return {visits,events,exit:'road',landingX:p.x,ticks:tick};
  if(p.x<0||p.x>d.width*36||p.y<0)return {visits,events,exit:'bounds',x:p.x,y:p.y,ticks:tick};
 }
 return {visits,events,exit:'timeout',x:p.x,y:p.y,track:p.track?.sky.id};
}
const results=[];
for(const mode of ['forgiving','precision']){
 results.push({mode,threshold:0,hold:0,...run({mode,threshold:0,hold:0})});
 for(const threshold of [80,160,200,240])for(const hold of [4,8,12,18,24,36])results.push({mode,threshold,hold,...run({mode,threshold,hold})});
}
const inputs=['waterwheel-layout-core.mjs','rail-grip-core.js','grapple-core.js'];
const input_sha256=Object.fromEntries(inputs.map(name=>[name,createHash('sha256').update(readFileSync(new URL('../../'+name,import.meta.url))).digest('hex')]));
console.log(JSON.stringify({scope:'Exploratory one-shot brake/release input policy in isolated carried-state rail physics. Seed speed 7.5, offset 120. No full native terrain, enemy, packet, swept-body, physical-device or human-readability qualification. This script changes no game runtime and is not a shipped automatic brake.',input_sha256,cases:results.length,results},null,2));
