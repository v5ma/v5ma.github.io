import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build,paths,groundRow,DELIVERIES} from '../waterwheel-layout-core.mjs';
import {FORK,brakeMarks,FORK_SIGNS} from '../waterwheel-fork-core.mjs';
const require=createRequire(import.meta.url),{context,T}=require('../../../tests/helpers/flow-fixture.cjs');
const c=context();
test('The fork joins existing route identities and a real useful delivery',()=>{
 const d=build(T);assert.equal(d.gp.waterwheel.fork.id,FORK.id);assert.equal(FORK.delivery,'millworkers-terrace');assert(DELIVERIES.some(d=>d.id===FORK.delivery&&d.tx===157));
 assert.equal(d.ct.length,7);assert.equal(d.quota,0);assert.equal(build(T,{groundOnly:true}).gp.waterwheel.fork,null);
});
test('Brake markings come from the actual runway, not an invisible trigger',()=>{
 const p=paths().find(r=>r.sky.id===FORK.launch),m=brakeMarks(p);assert(m.length>=4&&m.length<=20);assert(m.every(x=>x.remaining>=60&&x.remaining<=260));assert.equal(brakeMarks([]).length,0);assert.equal(FORK_SIGNS.length,2);
});
test('Collector extends the early-brake receiving area while retaining its road exit',()=>{
 const p=paths().find(r=>r.sky.id===FORK.lower);assert.deepEqual(p[0],[4060,1970]);assert.deepEqual(p.at(-1),[4980,2076]);assert(p.every(([x,y])=>y+34<groundRow(Math.floor(x/36))*36));
});
test('Fork intention roundtrips through the original editable document codec',()=>{
 const d=c.WorkshopCore.decode(c.GroundCampaign.encode(build(T)));const r=c.WorkshopCore.decode(c.WorkshopCore.encode(d));assert.equal(JSON.stringify(r.extra.gp.waterwheel.fork),JSON.stringify(FORK));assert.equal(c.WorkshopCore.check(r).errors.length,0);
});
for(const mode of ['forgiving','precision'])for(const threshold of [80,160,200,240])for(const hold of [12,18,24,36])test(`Isolated seeded fork recovery ${mode}, brake ${threshold}, hold ${hold}`,()=>{
 const f=c.RailGripCore.create();f.grip.configure({mode});const K=f.physics,rails=paths().map(p=>K.rail(p,p.sky)),x=3080;
 const p={x,y:groundRow(Math.floor(x/36))*36-30,w:26,h:30,vx:7.5,vy:-13,trackCD:0,_airTicks:0,onGround:false,roll:0};let entered=false,from=null,started=false,held=0,landing=null;const visits=[];
 for(let n=0;n<1600;n++){
  const old={x:p.x,y:p.y};if(p.trackCD>0)p.trackCD--;
  if(!started&&p.track?.sky.id==='ww-runway'&&p.track.len-p.trackS<threshold)started=true;
  const brake=started&&held<hold;if(brake)held++;
  if(p.track){const t=p.track;if(K.ride(p,{left:brake,right:!brake})){from=t.sky.id;p._airTicks=0;}}
  else{if(!entered){p.vy=Math.min(13,p.vy+.55);p.x+=p.vx;p.y+=p.vy;}else K.flight(p,{left:brake,right:!brake});p._airTicks++;const h=K.catchRail(p,old,rails,from);if(h){entered=true;visits.push(h.tr.sky.id);from=null;p._airTicks=0;}}
  assert([p.x,p.y,p.vx,p.vy].every(Number.isFinite));
  if(!p.track&&p.y+p.h>=groundRow(Math.floor(p.x/36))*36){landing=p.x;break;}
 }
 assert(landing>4000&&landing<9036,'Finite release must have a usable modeled road return');
 if(threshold===200){assert.deepEqual(visits,['ww-runway','ww-collector']);assert(landing<5500,'Lower return must precede the terrace mailbox');}
});
