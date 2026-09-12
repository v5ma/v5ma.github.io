import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import {BRANCH,practicePath,upgradeCourse,freshRun,observe,incident,sanitize,settle,mission,cues} from '../sunrise-core.mjs';
const require=createRequire(import.meta.url),{context,T}=require('../../../tests/helpers/flow-fixture.cjs');
const c=context();
for(const file of ['sky-network-art.js','sky-relay.js'])vm.runInContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),c,{filename:file});
const before=c.GroundCampaign.make(0,T),originalCode=c.GroundCampaign.encode(before),data=upgradeCourse(before);
function complete(){const r=freshRun();for(let s=0;s<520;s+=18)observe(r,{x:1750+s,rail:BRANCH,s});observe(r,{x:2160,road:false});observe(r,{x:2200,road:true});return r;}
test('only the existing Sunrise chapter gains one branch',()=>{assert.equal(data.ct.length,before.ct.length+1);assert.equal(data.ct.at(-1).sky.id,BRANCH);assert.equal(upgradeCourse(c.GroundCampaign.make(1,T)).ct.length,c.GroundCampaign.make(1,T).ct.length);});
test('all original curves including the relay keep exact points and metadata',()=>{for(let i=0;i<before.ct.length;i++)assert.deepEqual(data.ct[i],before.ct[i]);assert.equal(c.GroundCampaign.encode(before),originalCode);});
test('the entire tile grid, mail, checkpoint, spawn and finish data remain unchanged',()=>{assert.deepEqual(data.cells,before.cells);assert.deepEqual(data.goal,before.goal);assert.deepEqual(data.boxes,before.boxes);assert.equal(data.quota,before.quota);assert.equal(data.music,before.music);});
test('repeat decoration does not stack duplicate paths',()=>assert.equal(upgradeCourse(data),data));
test('branch is a finite, ordered, bounded polyline with ground clearance',()=>{const p=practicePath();assert.equal(p.length,73);assert(p.every(v=>v.every(Number.isFinite)));for(let i=1;i<p.length;i++)assert(p[i][0]>p[i-1][0]);assert(p.every(v=>2160-v[1]-p.sky.roadDepth>=52));});
test('the new branch stays clear of original rail surfaces',()=>{let distance=Infinity;for(const p of before.ct)for(const a of p)for(const b of data.ct.at(-1))distance=Math.min(distance,Math.hypot(a[0]-b[0],a[1]-b[1]));assert(distance>170);});
test('workshop encode/decode retains branch identity and challenge metadata',()=>{const code=c.GroundCampaign.encode(data),doc=c.WorkshopCore.decode(code),copy=c.WorkshopCore.decode(c.WorkshopCore.encode(doc));assert.equal(copy.paths.at(-1).meta.id,BRANCH);assert.equal(copy.extra.gp.sunrise.version,1);});
test('guidance contains entry, receiving, braking and road-return cues',()=>{const list=cues(data,c.GrappleCore);for(const kind of ['choice','jump','catch','brake','return'])assert(list.some(x=>x.kind===kind));assert(list.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)));assert.equal(cues(before,c.GrappleCore).length,0);});
test('grazing the new rail never counts as a completed detour',()=>{const r=freshRun();observe(r,{x:2130,rail:BRANCH,s:400});observe(r,{x:2200,road:true});assert.equal(r.landed,false);});
test('sustained riding and a natural market landing advance the challenge',()=>assert.equal(complete().phase,'finish'));
test('a crash before landing invalidates that attempt',()=>{const r=freshRun();for(let s=0;s<=400;s+=20)observe(r,{x:1750+s,rail:BRANCH,s});incident(r);observe(r,{x:2200,road:true});assert(!r.landed);assert.equal(r.incidents,1);});
test('a crash after a completed detour keeps provisional achievement, not a clean-run claim',()=>{const r=complete();incident(r);assert(r.landed);assert.equal(r.incidents,1);});
test('leaving the wrong end or landing outside the recovery does not count',()=>{const r=freshRun();for(let s=0;s<=200;s+=20)observe(r,{x:1750+s,rail:BRANCH,s});observe(r,{x:1850,road:true});assert(!r.landed);const q=freshRun();for(let s=0;s<=500;s+=20)observe(q,{x:1750+s,rail:BRANCH,s});observe(q,{x:2400,road:true});assert(!q.landed);});
test('rejected and unobserved finishes cannot bank a seal',()=>{assert(!settle({},complete(),false).banked);assert(!settle({},freshRun(),true).banked);});
test('real accepted finish banks the seal exactly once',()=>{const r=complete(),a=settle({},r,true);assert(a.banked&&a.fresh&&a.records.marketPilot);assert.equal(a.records.finishes,1);assert(!settle(a.records,r,true).banked);});
test('the road-only finish is valid without awarding the optional seal',()=>{const r=freshRun();observe(r,{x:500,road:true});const a=settle({},r,true);assert(!a.banked);assert(!a.records.marketPilot);});
test('replays preserve the earned seal without calling it new',()=>{const a=settle({marketPilot:true,finishes:2},complete(),true);assert(!a.fresh);assert.equal(a.records.finishes,3);});
test('malformed persistence is bounded and never grants truthy-string rewards',()=>{assert.deepEqual(sanitize({marketPilot:'true',finishes:-99}),{marketPilot:false,finishes:0});assert.equal(sanitize({finishes:1e20}).finishes,0);});
test('journal presents all three steps and unavailable storage honestly',()=>{const m=mission(complete(),{},false);assert.equal(m.steps.length,3);assert(m.steps[0].done&&m.steps[1].done&&!m.steps[2].done);assert.equal(m.saveOK,false);});
// Isolated carried-state physics, not a renderer or a complete native level.
for(const speed of [5,7.5,9,12])for(const offset of [80,100,120,150,180])test(`carry: speed ${speed}, jump ${offset} before entry returns to the market road`,()=>{
 const K=c.RailGripCore.create().physics,rails=data.ct.map(p=>K.rail(p,p.sky));
 const p={x:1750-offset,y:2130,w:26,h:30,vx:speed,vy:-13,trackCD:0,_airTicks:0,onGround:false,roll:0};
 let blocked=null,landing=null;const visits=[];
 for(let tick=0;tick<400;tick++){
  const old={x:p.x,y:p.y};if(p.trackCD>0)p.trackCD--;
  if(p.track){const tr=p.track;if(K.ride(p,{right:true})){blocked=tr.sky.id;p._airTicks=0;}}
  else{if(!visits.length){p.vy=Math.min(13,p.vy+.55);p.x+=p.vx;p.y+=p.vy;}else K.flight(p,{right:true});p._airTicks++;const hit=K.catchRail(p,old,rails,blocked);if(hit){visits.push(hit.tr.sky.id);blocked=null;}}
  if(!p.track&&p.y+p.h>=2160){landing=p.x;break;}
 }
 assert.deepEqual(visits,[BRANCH]);assert(landing>=2140&&landing<2330);
});
