import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build,DELIVERIES,groundRow} from '../waterwheel-layout-core.mjs';
const require=createRequire(import.meta.url),{context,T}=require('../../../tests/helpers/flow-fixture.cjs');
const c=context(),d=build(T),threatTiles=[56,60,125,130,183,190,225,230];

test('Waterwheel has twelve named delivery intentions in road order',()=>{
 assert.equal(DELIVERIES.length,12);
 assert.equal(new Set(DELIVERIES.map(x=>x.id)).size,12);
 assert.deepEqual(d.roadBoxes,DELIVERIES.map(x=>x.tx));
 for(let i=1;i<DELIVERIES.length;i++)assert(DELIVERIES[i].tx>DELIVERIES[i-1].tx);
 assert.deepEqual(new Set(DELIVERIES.map(x=>x.role)),new Set(['teaching','ordinary','return-reward','control','road-choice','discovery','finale']));
});

test('Every delivery intention is a real mailbox on the complete supported road',()=>{
 for(const x of DELIVERIES){
  const ty=groundRow(x.tx)-1;
  assert.equal(d.cells[ty*d.width+x.tx],T.MAILBOX,x.id);
  assert.equal(d.cells[(ty+1)*d.width+x.tx],T.STEEL,x.id+' support');
  assert(x.region&&x.intent&&x.role);
 }
});

test('Ordinary delivery windows do not overlap each other at the 250px throw radius',()=>{
 for(let i=1;i<DELIVERIES.length;i++)assert((DELIVERIES[i].tx-DELIVERIES[i-1].tx)*36>500,`${DELIVERIES[i-1].id} / ${DELIVERIES[i].id}`);
});

test('Road mailboxes are separated from authored encounter centers',()=>{
 for(const box of DELIVERIES)for(const threat of threatTiles)assert(Math.abs(box.tx-threat)*36>250,`${box.id} too close to threat at ${threat}`);
});

test('Road-choice and discovery deliveries give the lower route reasons to exist',()=>{
 const roles=DELIVERIES.filter(x=>['road-choice','discovery'].includes(x.role));
 assert.deepEqual(roles.map(x=>x.id),['express-road-choice','canal-observation-stop','waterwheel-overlook']);
 assert(roles.every(x=>/road|canal|waterwheel|aerial|landmark/i.test(x.intent)));
});

test('Ground-only and full preview share the exact delivery journey',()=>{
 const ground=build(T,{groundOnly:true});
 assert.deepEqual(ground.roadBoxes,d.roadBoxes);
 assert.deepEqual(ground.boxes,d.boxes);
 assert.deepEqual(ground.gp.waterwheel.deliveries,d.gp.waterwheel.deliveries);
 assert.equal(ground.ct.length,0);
});

test('Original document codec retains delivery IDs, roles and intentions',()=>{
 const round=c.WorkshopCore.decode(c.WorkshopCore.encode(c.WorkshopCore.decode(c.GroundCampaign.encode(d))));
 // Codec output lives in the fixture VM realm. Compare its serialized values,
 // not JavaScript object prototypes from two different realms.
 assert.equal(JSON.stringify(round.extra.gp.waterwheel.deliveries),JSON.stringify(DELIVERIES));
 assert.equal(c.WorkshopCore.check(round).errors.length,0);
});

test('Delivery planning does not alter existing campaign builders or settlement owners',()=>{
 const encoded=()=>Array.from({length:c.DeliveryCampaign.routes.length},(_,i)=>c.DeliveryCampaign.encode(c.DeliveryCampaign.build(i,T)));
 const before=encoded();build(T);build(T,{groundOnly:true});assert.deepEqual(before,encoded());
 assert.equal(d.quota,0);
 assert.equal(d.gp.waterwheel.plannedRecordID,'canal-choices-r2');
});