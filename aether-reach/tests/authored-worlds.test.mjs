import test from 'node:test';
import assert from 'node:assert/strict';
import {XR_VIEWS, OPENINGS, cleanPresentation, openings, setOpening, sessionRequest, shellVisibility, worldToDiorama, dioramaToWorld, pointerRayToWorld, aimFromAvatar} from '../diorama-policy.mjs';
import {BELLWETHER_AUTHORED as chapter, STARTER_CAPABILITIES, auditProgression} from '../planning/bellwether-authored-contract.mjs';
const copy = ()=>structuredClone(chapter);
const near = (a,b)=>{for(const k of ['x','y','z']) assert.ok(Math.abs(a[k]-b[k])<1e-9,`${k}: ${a[k]} != ${b[k]}`);};
const transform={origin:{x:-93,y:7,z:-18},anchor:{x:0,y:.85,z:-1.15},scale:.025,yaw:.7};

test('presentation preference defaults preserve first-person VR and a valid opening',()=>{
  const p=cleanPresentation(null);assert.equal(p.view,'first-person-vr');assert.equal(p.opening,'both');assert.ok(Object.isFrozen(p));
});
test('malformed stored presentation settings cannot create an entirely closed housing',()=>{
  for(const v of [undefined,null,[],42,{opening:'closed'},{opening:'neither'},{top:false,front:false}]){
    const o=openings(v);assert.ok(o.top||o.front);assert.equal(cleanPresentation(v).opening,'both');
  }
});
test('the three opening presets have exactly the requested meanings',()=>{
  assert.deepEqual(openings({opening:'top'}),{top:true,front:false});
  assert.deepEqual(openings({opening:'front'}),{top:false,front:true});
  assert.deepEqual(openings({opening:'both'}),{top:true,front:true});
});
test('every surface toggle is atomic, immutable and preserves at least one opening',()=>{
  for(const opening of OPENINGS)for(const surface of ['top','front'])for(const open of [true,false]){
    const before=cleanPresentation({opening,view:'diorama-ar'}),after=setOpening(before,surface,open);
    assert.equal(before.opening,opening);assert.equal(after.view,before.view);
    const o=openings(after);assert.ok(o.top||o.front);assert.equal(o[surface],open);
  }
});
test('closing the sole opening opens the opposite face rather than ignoring input',()=>{
  assert.equal(setOpening({opening:'top'},'top',false).opening,'front');
  assert.equal(setOpening({opening:'front'},'front',false).opening,'top');
});
test('invalid opening actions fail instead of being coerced into destructive settings',()=>{
  assert.throws(()=>setOpening({},'rear',true),TypeError);assert.throws(()=>setOpening({},'top','false'),TypeError);
});
test('settings clamp scale, placement and rotation without accepting NaN or infinity',()=>{
  const a=cleanPresentation({scale:0,height:-100,distance:900,yaw:Infinity});
  assert.equal(a.scale,.01);assert.equal(a.height,.35);assert.equal(a.distance,2.5);assert.equal(a.yaw,0);
  assert.equal(cleanPresentation({scale:NaN}).scale,.025);assert.equal(cleanPresentation({scale:100}).scale,.05);
});
test('first-person presentation hides only the outer diorama housing',()=>{
  for(const opening of OPENINGS){const s=shellVisibility({view:'first-person-vr',opening});assert.equal(s.housing,false);assert.equal(s.top,false);assert.equal(s.front,false);assert.equal(s.changeCollision,false);}
});
test('diorama housings never obscure both the top and front; physics is unchanged',()=>{
  for(const view of XR_VIEWS.slice(1))for(const opening of OPENINGS){const s=shellVisibility({view,opening});assert.ok(!s.top||!s.front);assert.equal(s.base,true);assert.equal(s.sides,true);assert.equal(s.changeCollision,false);}
});
test('an AR request is capability-gated and never silently changed to VR',()=>{
  const r=sessionRequest({view:'diorama-ar'},{'immersive-vr':true});assert.equal(r.mode,'immersive-ar');assert.equal(r.supported,false);assert.ok(r.reason);assert.equal(r.needsUserActivation,true);
});
test('requested view and required floor remain explicit for every XR mode',()=>{
  for(const view of XR_VIEWS){const r=sessionRequest({view},{'immersive-vr':true,'immersive-ar':true});assert.equal(r.supported,true);assert.equal(r.mode,view==='diorama-ar'?'immersive-ar':'immersive-vr');assert.deepEqual(r.requiredFeatures,['local-floor']);assert.ok(r.optionalFeatures.includes('hand-tracking'));}
});
test('unknown capabilities do not advertise support',()=>{
  assert.equal(sessionRequest({}).supported,false);assert.equal(sessionRequest({},null).supported,false);assert.equal(sessionRequest({}, {'immersive-vr':'true'}).supported,false);
});
test('world origin maps exactly to the physical tabletop anchor',()=>near(worldToDiorama(transform.origin,transform),transform.anchor));
test('scaled and rotated world transforms round-trip across representative viewpoints',()=>{
  for(let i=0;i<180;i++){
    const t={...transform,scale:.01+(i%5)*.01,yaw:-Math.PI+i*.071};
    const p={x:-200+i*2.7,y:-20+i*.31,z:150-i*2.1};near(dioramaToWorld(worldToDiorama(p,t),t),p);
  }
});
test('table placement transforms never mutate the player point or anchor',()=>{
  const t=structuredClone(transform),p={x:5,y:8,z:12},before=JSON.stringify([p,t]);worldToDiorama(p,t);dioramaToWorld(p,t);assert.equal(JSON.stringify([p,t]),before);
});
test('unsafe transforms and non-finite tracked points fail explicitly',()=>{
  for(const scale of [0,-1,NaN,Infinity])assert.throws(()=>worldToDiorama({x:0,y:0,z:0},{...transform,scale}),TypeError);
  assert.throws(()=>dioramaToWorld({x:NaN,y:0,z:0},transform),TypeError);
});
test('pointer direction and distance units survive inverse tabletop rotation and scale',()=>{
  const a={x:-91,y:8,z:-16},b={x:-85,y:11,z:-10},pa=worldToDiorama(a,transform),pb=worldToDiorama(b,transform);
  const ray=pointerRayToWorld({origin:pa,direction:{x:pb.x-pa.x,y:pb.y-pa.y,z:pb.z-pa.z}},transform);
  near(ray.origin,a);const length=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);near(ray.direction,{x:(b.x-a.x)/length,y:(b.y-a.y)/length,z:(b.z-a.z)/length});assert.equal(ray.worldMetresPerPhysicalMetre,40);
});
test('a zero pointer ray is not allowed to create NaN aiming data',()=>assert.throws(()=>pointerRayToWorld({origin:{x:0,y:0,z:0},direction:{x:0,y:0,z:0}},transform),TypeError));
test('third-person weapon origin is the avatar muzzle, not the observer',()=>{
  const muzzle={x:4,y:2,z:3},ray=aimFromAvatar(muzzle,{x:4,y:2,z:-7});near(ray.origin,muzzle);near(ray.direction,{x:0,y:0,z:-1});assert.notEqual(ray.origin,muzzle);assert.equal(aimFromAvatar(muzzle,muzzle),null);
});
test('the new chapter is explicitly an unintegrated design contract',()=>{
  assert.equal(chapter.status,'design-contract-not-playable');assert.equal(chapter.viewRules.hardwareVerified,false);assert.equal(chapter.viewRules.scaleTrackedHead,false);assert.equal(chapter.viewRules.hideGameplayCollision,false);assert.equal(chapter.viewRules.revealSealedRooms,false);assert.ok(Object.isFrozen(chapter.routes));
});
test('starter equipment can complete the abstract chapter using no rails or powers',()=>{
  const r=auditProgression();assert.equal(r.abstractOnly,true);assert.equal(r.completable,true);assert.deepEqual(r.unreachableRooms,[]);assert.deepEqual(r.strandedStates,[]);
});
test('removing every optional aerial route preserves completion and recovery',()=>{
  const c=copy();c.routes=c.routes.filter(r=>!['rail','glide'].includes(r.verb));const r=auditProgression(c);assert.equal(r.completable,true);assert.deepEqual(r.strandedStates,[]);assert.deepEqual(r.unreachableRooms,[]);
});
test('the workshop story/clue detour is optional, not a disguised required key',()=>{
  const c=copy();c.rooms=c.rooms.filter(r=>r.id!=='workshop');c.routes=c.routes.filter(r=>r.from!=='workshop'&&r.to!=='workshop');const r=auditProgression(c);assert.equal(r.completable,true);assert.deepEqual(r.strandedStates,[]);
});
test('visiting the roof early cannot activate the receiver before the Arcade',()=>{
  const r=auditProgression();assert.ok(r.flagsByRoom.receiver.some(flags=>flags.length===0));
  for(const flags of Object.values(r.flagsByRoom).flat()) if(flags.includes('receiver-synced'))assert.ok(flags.includes('circuit-balanced'));
});
test('no route order can award the report milestone before signal restoration',()=>{
  const r=auditProgression(chapter,[...STARTER_CAPABILITIES,'rail','glide']);
  for(const flags of Object.values(r.flagsByRoom).flat())if(flags.includes('reported'))for(const flag of ['receiver-synced','circuit-balanced','street-secured'])assert.ok(flags.includes(flag));
  assert.deepEqual(r.strandedStates,[]);
});
test('the shorter return opens from its far end after visible restoration',()=>{
  const route=chapter.routes.find(r=>r.id==='return-shortcut'),m=chapter.milestones.find(m=>m.id==='open-return');
  assert.deepEqual(route.requires,['return-latched']);assert.equal(m.room,'return-landing');assert.deepEqual(m.requires,['receiver-synced']);assert.equal(route.to,'arrival');
});
test('the logical audit catches an omitted prerequisite-producing milestone',()=>{
  const c=copy();c.milestones=c.milestones.filter(m=>m.sets!=='circuit-balanced');const r=auditProgression(c);assert.equal(r.completable,false);assert.ok(r.strandedStates.length>0);
});
test('the logical audit rejects unknown routes, flags and duplicate room ids',()=>{
  let c=copy();c.routes[0].to='nowhere';assert.throws(()=>auditProgression(c),/Invalid route/);
  c=copy();c.milestones[0].requires=['missing'];assert.throws(()=>auditProgression(c),/Unknown prerequisite/);
  c=copy();c.rooms.push(c.rooms[0]);assert.throws(()=>auditProgression(c),/duplicate rooms/);
});
test('the graph is not credited as complete when the basic combat capability is removed',()=>{
  const r=auditProgression(chapter,STARTER_CAPABILITIES.filter(v=>v!=='basic-combat'));assert.equal(r.completable,false);
});
test('audit analysis does not modify the reusable chapter specification',()=>{
  const before=JSON.stringify(chapter);auditProgression();assert.equal(JSON.stringify(chapter),before);
});
