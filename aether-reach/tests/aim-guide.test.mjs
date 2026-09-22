/* Isolated model/render fixtures, not a native playthrough or device approval. */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createState,fire,step,traceWeaponRay,weaponStats,saveState} from '../model.mjs';
import {windowAim,windowAimPreview,currentWindowAim} from '../window-controls.mjs';
import {eyeHeight} from '../skirmish-core.mjs';
import {createDiorama} from '../diorama-view.mjs';
const close=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function fixture(){const s=createState();Object.assign(s.p,{x:0,y:1000,z:0,yaw:0,pitch:0});s.drones=[];return s;}
function target(s,overrides={}){const b={id:'fixture',kind:'target',hp:1000,maxHp:1000,stun:0,x:0,y:s.p.y+eyeHeight(s.p),z:-12,...overrides};s.drones.push(b);return b;}
function fired(s){assert(fire(s,windowAim(s)));return s.events.findLast(e=>e.type==='shot');}
test('Aim preview uses every equipped weapon range, not a fixed 80-meter guide',()=>{
 for(const weapon of ['arc','carbine','sniper','scatter']){const s=fixture();s.p.weapon=weapon;const g=windowAimPreview(s);assert.equal(g.kind,'range');assert.equal(g.range,weaponStats(s).range);close(g.distance,g.range);close(g.end.z,-g.range);}
});
test('Shared ray distinguishes humanoid body, head, breacher and large drone geometry',()=>{
 for(const shape of [{humanoid:true,x:.7},{humanoid:true,y:1000.75},{humanoid:true,kind:'breacher',x:.6},{kind:'heavy',x:1.3},{x:1.05}]){
  const s=fixture();target(s,shape);const before=windowAimPreview(s),shot=fired(s);assert.equal(before.kind==='target',shot.hit);close(before.end.x,shot.end.x);close(before.end.y,shot.end.y);close(before.end.z,shot.end.z);assert.equal(before.critical,shot.critical);
 }
 const miss=fixture();target(miss,{humanoid:true,x:.7});assert.equal(windowAimPreview(miss).kind,'range');
 const head=fixture();target(head,{humanoid:true,y:1000.75});assert.equal(windowAimPreview(head).kind,'target');assert(windowAimPreview(head).critical);
});
test('Friendly overrides and dead enemies do not capture the weapon marker',()=>{
 const s=fixture();target(s,{id:'ally',z:-4,allyUntil:10});target(s,{id:'dead',z:-7,hp:0});target(s,{id:'enemy',z:-14});assert.equal(windowAimPreview(s).targetId,'enemy');s.time=11;assert.equal(windowAimPreview(s).targetId,'ally');
});
test('Nearer solid cover and both reversible receiver screen states agree with real shots',()=>{
 for(const mode of [0,1]){const s=createState();s.drones=[];s.bellwether.stage=3;s.bellwether.windbreak=mode;Object.assign(s.p,{x:-111,y:27.5,z:-6,yaw:0,pitch:0});target(s,{x:-111,z:-15});const g=windowAimPreview(s),shot=fired(s);assert.equal(g.kind,mode?'blocked':'target');assert.equal(shot.hit,!mode);close(g.end.z,shot.end.z);}
});
test('Short-range and long-range markers never advertise a target beyond weapon reach',()=>{
 for(const [weapon,distance,kind]of [['scatter',45,'range'],['arc',84,'target'],['arc',95,'range'],['sniper',150,'target']]){const s=fixture();s.p.weapon=weapon;target(s,{z:-distance});assert.equal(windowAimPreview(s).kind,kind);}
});
test('Reading the guide never modifies recoil, ammunition, rewards, events or saves',()=>{
 const s=fixture();target(s);s.skirmish.recoil={x:.06,y:.04};s.p.crouched=true;const raw=JSON.stringify(s),save=saveState(s);for(let i=0;i<100;i++)windowAimPreview(s);assert.equal(JSON.stringify(s),raw);assert.equal(saveState(s),save);
});
test('Current-step aim preserves no-tracking nulls and original first-person controller rays',()=>{
 const s=fixture(),tracked={origin:{x:1,y:2,z:3},direction:{x:0,y:0,z:-1}};assert.equal(currentWindowAim(s,null,true),null);assert.equal(currentWindowAim(s,undefined,true),undefined);assert.equal(currentWindowAim(s,tracked,false),tracked);assert.deepEqual(currentWindowAim(s,tracked,true),windowAim(s));
});
test('Motion beyond the muzzle leash rejects stale aim but accepts the current avatar ray',()=>{
 const s=fixture(),stale=windowAim(s);s.p.grounded=false;s.p.vx=80;for(let i=0;i<12;i++)step(s,{explorer:true},1/120);assert(Math.hypot(s.p.x-stale.origin.x,s.p.z-stale.origin.z)>2.5);const ammo=s.p.ammo;assert.equal(fire(s,stale),false);assert.equal(s.p.ammo,ammo);assert(fire(s,currentWindowAim(s,stale,true)));assert.equal(s.p.ammo,ammo-1);
});
test('Crouch and recoil changes after frame input are reflected without altering that input',()=>{
 const s=fixture(),stale=windowAim(s),raw=JSON.stringify(stale);s.p.crouched=true;s.p.yaw=.3;s.skirmish.recoil={x:.12,y:.08};const now=currentWindowAim(s,stale,true);close(now.origin.y,s.p.y+.9);assert.notDeepEqual(now.direction,stale.direction);assert.equal(JSON.stringify(stale),raw);
});
test('Actual Three diorama line follows the shared ray in world coordinates, including crouch and recoil',async()=>{
 const prior=globalThis.document;globalThis.document={body:{classList:{toggle(){}}}};
 try{
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(),renderer={localClippingEnabled:false,getClearColor:c=>c.set(0),getClearAlpha:()=>1,setClearColor(){}};
  const d=createDiorama({scene,camera,renderer}),s=fixture();s.p.yaw=.7;s.p.pitch=.2;s.p.crouched=true;s.skirmish.recoil={x:.1,y:-.04};d.set(true,{mode:'diorama-ar'},s);d.update(s,0);scene.updateMatrixWorld(true);
  const g=windowAimPreview(s),line=scene.getObjectByName('Courier aiming direction'),p=line.geometry.attributes.position;
  const a=new T.Vector3().fromBufferAttribute(p,0).applyMatrix4(line.matrixWorld),b=new T.Vector3().fromBufferAttribute(p,1).applyMatrix4(line.matrixWorld);close(a.x,g.origin.x);close(a.y,g.origin.y);close(a.z,g.origin.z);const v=b.clone().sub(a).normalize();close(v.x,g.direction.x);close(v.y,g.direction.y);close(v.z,g.direction.z);close(a.distanceTo(b),7);assert.deepEqual(d.stats().aimGuide,g);
  const cover=createState();cover.drones=[];cover.bellwether.stage=3;cover.bellwether.windbreak=1;Object.assign(cover.p,{x:-111,y:27.5,z:-10.8,yaw:0,pitch:0});d.update(cover,0);scene.updateMatrixWorld(true);const cg=windowAimPreview(cover);assert.equal(cg.kind,'blocked');assert(cg.distance<7);const ca=new T.Vector3().fromBufferAttribute(p,0).applyMatrix4(line.matrixWorld),cb=new T.Vector3().fromBufferAttribute(p,1).applyMatrix4(line.matrixWorld);close(ca.distanceTo(cb),cg.distance);assert.equal(line.material.color.getHex(),0xf69570);
  d.set(false,{},s);assert.equal(d.stats().aimGuide,null);await new Promise(r=>setTimeout(r,0));
 }finally{globalThis.document=prior;}
});
