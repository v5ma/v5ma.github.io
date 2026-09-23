import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build,paths,groundRow} from '../waterwheel-layout-core.mjs';
import {MILL_BELL,withMillBell,visibleMillBell} from '../waterwheel-whip-core.mjs';
const require=createRequire(import.meta.url),{context,T}=require('../../../tests/helpers/flow-fixture.cjs'),c=context();
test('Opt-in adds exactly one optional peg and no new movement, mandatory goal or rail',()=>{
 const old=build(T),before=JSON.stringify(old),d=build(T,{whipLink:true});
 assert.equal(JSON.stringify(old),before);assert.notEqual(d.cells,old.cells);
 assert.deepEqual([...d.cells].flatMap((v,i)=>v!==old.cells[i]?[i]:[]),[39*d.width+143]);
 assert.equal(d.cells[39*d.width+143],T.PEG);assert.deepEqual(d.ct,old.ct);assert.deepEqual(d.boxes,old.boxes);
 assert.equal(d.requiredGrapples,0);assert.equal(d.gp.requiredGrapples,0);assert.equal(d.quota,0);assert.equal(d.gp.waterwheel.preview,true);
 assert.equal(d.gp.skyNetwork.pegCount,1);assert.equal(d.gp.skyNetwork.links.filter(l=>l.type==='optional-whip').length,1);
 assert.equal(d.gp.waterwheel.whipLink.to,'ww-gallery');
});
test('Old/default and ground-only preview documents remain peg-free',()=>{
 assert(!build(T).cells.includes(T.PEG));const d=build(T,{groundOnly:true,whipLink:true});
 assert(!d.cells.includes(T.PEG));assert.equal(d.ct.length,0);assert.equal(d.gp.waterwheel.whipLink,undefined);
});
test('Reapplying the opt-in is deterministic without duplicating anchors or links',()=>{
 const d=build(T,{whipLink:true});assert.deepEqual(withMillBell(d,T.PEG),d);
});
test('Colliding anchor placement and missing receivers fail before mutating the source',()=>{
 const d=build(T);d.cells[39*d.width+143]=T.STEEL;const before=JSON.stringify(d);
 assert.throws(()=>withMillBell(d,T.PEG),/overwrite/);assert.equal(JSON.stringify(d),before);
 const missing=build(T);missing.ct=missing.ct.filter(p=>p.sky.id!==MILL_BELL.to);
 assert.throws(()=>withMillBell(missing,T.PEG),/receiver/);assert.throws(()=>withMillBell(build(T),undefined),/peg tile/);
});
test('Versioned optional connection survives the original code and editor roundtrip',()=>{
 const d=c.WorkshopCore.decode(c.GroundCampaign.encode(build(T,{whipLink:true})));
 const after=c.WorkshopCore.decode(c.WorkshopCore.encode(d));assert.deepEqual(after.extra.gp.waterwheel.whipLink,d.extra.gp.waterwheel.whipLink);
 assert.equal(c.WorkshopCore.check(after).errors.length,0);
});
test('Edited-away anchors or receivers and unknown metadata cannot leave misleading relay signs',()=>{
 const d=build(T,{whipLink:true});assert.equal(visibleMillBell(d),MILL_BELL);
 d.cells[39*d.width+143]=0;assert.equal(visibleMillBell(d),null);
 d.cells[39*d.width+143]=T.PEG;d.ct=d.ct.filter(p=>p.sky.id!==MILL_BELL.to);assert.equal(visibleMillBell(d),null);
 assert.equal(visibleMillBell(build(T)),null);
});
// Explicit model fixture: seeded ordinary road-jump sample, then continuously
// carried isolated grip/flight/swing state. Not a native game or device replay.
function model(mode,scenario,castX=5000,angle=.7){
 const {physics:K,grip}=c.RailGripCore.create();grip.configure({mode});const rails=paths().map(p=>K.rail(p,p.sky));
 const p={x:3080,y:groundRow(85)*36-30,w:26,h:30,vx:7.5,vy:-13,trackCD:0,_airTicks:0,onGround:false,roll:0};
 let entered=false,from=null,hook=null,release=null;const visits=[];
 for(let tick=0;tick<1600;tick++){
  const old={x:p.x,y:p.y};if(p.trackCD>0)p.trackCD--;
  if(scenario!=='none'&&!hook&&p.x>=castX&&visits.includes(MILL_BELL.from)){
   const target=K.target(p,[MILL_BELL.peg]);if(target&&K.cast(p,target))hook={tick,x:p.x,y:p.y};
  }
  if(p.peg){const a=((p.peg.th%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
   if((scenario==='early'&&tick-hook.tick>=2)||(scenario!=='early'&&a>=angle&&a<angle+.2&&p.vx>0&&p.vy<0)){
    release={tick,...K.release(p)};p._railAir=true;p._airTicks=0;from='whip';
   }else K.swing(p,{right:true});
  }else if(p.track){const tr=p.track;if(K.ride(p,{right:true})){from=tr.sky.id;p._airTicks=0;}}
  else {if(!entered){p.vy=Math.min(13,p.vy+.55);p.x+=p.vx;p.y+=p.vy;}else K.flight(p,{right:true});p._airTicks++;
   const hit=K.catchRail(p,old,rails,from);if(hit){entered=true;visits.push(hit.tr.sky.id);from=null;p._airTicks=0;}}
  assert([p.x,p.y,p.vx,p.vy].every(Number.isFinite));
  if(!p.track&&!p.peg&&p.y+p.h>=groundRow(Math.floor(p.x/36))*36)return {hook,release,visits,x:p.x};
 }
 throw Error('No modeled useful road return');
}
for(const mode of ['forgiving','precision']){
 for(const castX of [4960,5000,5100])for(const angle of [.4,.7,1.05])test(`Isolated carried whip ${mode} at ${castX}, release ${angle}`,()=>{
  const r=model(mode,'whip',castX,angle);assert(r.hook&&r.release);assert(r.release.vx>0&&r.release.vy<0);
  assert.deepEqual(r.visits,['ww-runway','ww-crescent','ww-gallery','ww-finish']);assert(r.x<9036);
 });
 test(`Premature release returns before a useful road delivery ${mode}`,()=>{const r=model(mode,'early');assert(r.hook&&r.release);assert(r.x>5000&&r.x<157*36-145);});
 test(`Late rising release still reaches a receiver ${mode}`,()=>{const r=model(mode,'whip',5000,1.3);assert(r.visits.includes('ww-gallery'));assert(r.x<9036);});
 test(`No whip preserves the original four-section express ${mode}`,()=>{const r=model(mode,'none');assert.equal(r.hook,null);assert.deepEqual(r.visits,['ww-runway','ww-crescent','ww-gallery','ww-finish']);});
}
