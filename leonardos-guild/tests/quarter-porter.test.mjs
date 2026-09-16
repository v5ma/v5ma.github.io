/* Model/CPU fixtures. End-to-end hardware journeys are in quarter-browser.py. */
import {test} from 'node:test';import assert from 'node:assert/strict';
import {makeWorld,newState,step,saveData,readSave} from '../model.mjs';
import {attachFrontier} from '../frontier-core.mjs';
import {attachQuarter,quarterAct,quarterBlocked,quarterSurface,quarterState,nearbyQuarter} from '../quarter-core.mjs';
import {PORTER_SPEED,PORTER_NODES,normalizePorterOrder,requestPorter,cancelPorter,porterStatus} from '../quarter-porter.mjs';
const world=makeWorld(),fixture=()=>{const s=attachQuarter(attachFrontier(newState()),{active:true,goodsAccess:true,archOpen:true,parcel:true,reported:true,delivery:1});return s;};
const tick=(s,n=1)=>{for(let i=0;i<n;i++)step(s,world,{},1/60);};
function until(s,condition,limit=7200){for(let i=0;i<limit;i++){if(condition())return i/60;tick(s);}assert.fail('Timed out '+JSON.stringify(s.quarter.porter));}
function walk(s,x,z){for(let i=0;i<6000;i++){const d=Math.hypot(x-s.x,z-s.z);if(d<.18){tick(s,30);return;}step(s,world,{throttle:Math.min(.65,d*.9),moveYaw:Math.atan2(x-s.x,z-s.z),analog:true},1/60);}assert.fail('Player blocked');}
const atBell=s=>{walk(s,-16,-11);walk(s,-16,-6);};
test('The restored arch bell starts optional cooperation only after its actual prerequisites',()=>{
 const s=fixture();assert.equal(quarterAct(s,'arch-front','call-porter').ok,false,'remote bell');atBell(s);
 for(const key of ['goodsAccess','archOpen','reported']){s.quarter[key]=false;assert.equal(quarterAct(s,'arch-front','call-porter').ok,false,key);s.quarter[key]=true;}
 assert.ok(quarterAct(s,'arch-front','call-porter').ok);assert.equal(s.quarter.delivery,1);assert.equal(s.credits,0);
 assert.equal(quarterAct(s,'arch-front','call-porter').ok,false,'held/repeated request');
});
test('Neri walks through real loading and return connections, never through walls or across floors',()=>{
 const s=fixture();requestPorter(s.quarter);let steps=0,maxSpeed=0,seen=new Set(),last={...s.quarter.porter};
 while(s.quarter.porterOrder!=='ready'&&steps++<7200){tick(s);const p=s.quarter.porter,d=Math.hypot(p.x-last.x,p.z-last.z);maxSpeed=Math.max(maxSpeed,d*60);seen.add(p.node);
  assert.equal(quarterBlocked({quarter:{...s.quarter,groundY:p.y}},p.x,p.z,.33),false,JSON.stringify(p));
  assert.ok(Math.abs(quarterSurface(p.x,p.z,p.y).y-p.y)<1e-6);last={...p};}
 assert.equal(s.quarter.porterOrder,'ready');assert.ok(maxSpeed<=PORTER_SPEED+1e-6);assert.ok(seen.has(0)&&seen.has(7)&&seen.has(10)&&seen.has(15));
 assert.equal(s.quarter.delivery,1);assert.equal(s.credits,0);assert.equal(s.life.xp,0);
});
test('Autonomous arrival never collects, completes, pays or imposes a deadline',()=>{
 const s=fixture();atBell(s);assert.ok(quarterAct(s,'arch-front','call-porter').ok);until(s,()=>s.quarter.porterOrder==='ready');const p={...s.quarter.porter};tick(s,3600);
 assert.equal(s.quarter.porter.x,p.x);assert.equal(s.quarter.delivery,1);assert.equal(s.credits,0);assert.ok(nearbyQuarter(s).some(v=>v.id==='porter'));
 assert.ok(quarterAct(s,'porter','take-spindle').ok);assert.equal(s.quarter.delivery,2);assert.equal(quarterAct(s,'porter','take-spindle').ok,false);assert.equal(s.credits,0);
});
test('Correct-floor and line-of-sight checks protect porter handoffs in every presentation',()=>{
 const s=fixture();requestPorter(s.quarter);until(s,()=>s.quarter.porterOrder==='ready');
 assert.equal(quarterAct(s,'porter','take-spindle').ok,false,'remote observer');atBell(s);s.quarter.groundY=3.2;
 assert.equal(quarterAct(s,'porter','take-spindle').ok,false,'wrong floor');s.quarter.groundY=0;s.lift=1;
 assert.equal(quarterAct(s,'porter','take-spindle').ok,false,'airborne');s.lift=0;assert.ok(quarterAct(s,'porter','take-spindle').ok);
});
test('Cancelling before pickup returns Neri home without moving him instantaneously',()=>{
 const s=fixture();requestPorter(s.quarter);tick(s,20);const before={...s.quarter.porter};assert.ok(cancelPorter(s.quarter));assert.deepEqual(s.quarter.porter.x,before.x);
 until(s,()=>s.quarter.porter.phase==='sorting');assert.equal(s.quarter.porter.carrying,false);assert.equal(s.quarter.delivery,1);assert.equal(s.quarter.porterOrder,'');
});
test('Cancelling a carried order physically returns the spindle; it cannot exist simultaneously at the bench',()=>{
 const s=fixture();requestPorter(s.quarter);until(s,()=>s.quarter.porter.phase==='carrying');tick(s,180);assert.ok(cancelPorter(s.quarter));assert.equal(s.quarter.porterOrder,'returning');
 const pose={...s.quarter.porter};tick(s);assert.ok(Math.hypot(s.quarter.porter.x-pose.x,s.quarter.porter.z-pose.z)<=PORTER_SPEED/60+1e-6);
 until(s,()=>s.quarter.porterOrder==='');assert.equal(s.quarter.porter.carrying,false);assert.equal(s.quarter.delivery,1);
});
test('Missing collision support or a closed goods gate makes the porter wait, never teleport',()=>{
 const s=fixture();requestPorter(s.quarter);until(s,()=>s.quarter.porter.carrying);s.quarter.goodsAccess=false;until(s,()=>s.quarter.porter.blocked);const before={...s.quarter.porter};tick(s,180);
 assert.equal(s.quarter.porter.x,before.x);assert.equal(s.quarter.porter.z,before.z);assert.equal(s.quarter.porterOrder,'requested');assert.match(porterStatus(s.quarter),/obstructed/);
 s.quarter.goodsAccess=true;until(s,()=>s.quarter.porterOrder==='ready');
});
test('Named order checkpoints round-trip without saving actor pose or overwriting earned history',()=>{
 for(const order of ['requested','ready','returning']){const s=fixture();s.quarter.porterOrder=order;s.credits=453;s.quarter.observations=['arch-front'];const data=saveData(s);
  assert.equal(data.version,2);assert.equal(data.quarter.porterOrder,order);assert.ok(!('porter' in data.quarter));
  const raw=readSave(JSON.stringify(data),world),r=attachQuarter(attachFrontier(newState(raw),raw.frontier),raw.quarter);
  assert.equal(r.quarter.porterOrder,order);assert.equal(r.credits,453);assert.equal(r.x,-20);assert.deepEqual(r.quarter.observations,['arch-front']);
  tick(r,120);assert.ok(!r.quarter.porter.blocked);assert.equal(r.quarter.delivery,1);
 }
});
test('Old saves, completed deliveries and malformed orders normalize safely',()=>{
 for(const raw of [null,true,'invented',{},'ready'])assert.equal(normalizePorterOrder(raw,{delivery:3,reported:true,goodsAccess:true,archOpen:true}),'');
 assert.equal(quarterState({}).porterOrder,'');assert.equal(quarterState({reported:true,parcel:true,delivery:1,porterOrder:'requested'}).porterOrder,'');
 assert.equal(PORTER_NODES.length,16);
});
