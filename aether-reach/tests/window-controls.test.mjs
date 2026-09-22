import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {InputSampler} from '../input-core.mjs';
import {WINDOW_CONTROLS,windowControls,windowAim,stepWindowLook} from '../window-controls.mjs';
import {FirstPersonWindow} from '../first-person-window.mjs';
import {createState,step,fire,saveState,forward} from '../model.mjs';
import {eyeHeight} from '../skirmish-core.mjs';
import {readFileSync} from 'node:fs';
const source=handedness=>({handedness,gamepad:{mapping:'xr-standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:6},()=>({pressed:false,value:0}))}});
function inputs(){return {sampler:new InputSampler(),sources:[source('left'),source('right')]};}
const button=(s,h,i,v)=>{s.find(s=>s.handedness===h).gamepad.buttons[i]={pressed:v,value:v?1:0};};
test('Two XR thumbsticks, both triggers and B remain independent when pressed together',()=>{
 const {sampler,sources}=inputs();windowControls(sampler,sources);
 sources[0].gamepad.axes=[0,0,.5,-1];sources[1].gamepad.axes=[0,0,.4,-.6];
 button(sources,'right',0,true);button(sources,'left',0,true);button(sources,'right',5,true);
 const c=windowControls(sampler,sources);assert(c.move[1]<0&&c.look[0]>0&&c.look[1]<0);assert(c.held.fire&&c.held.aim&&c.edges.reload);assert(!c.edges.pause&&!c.edges.interact);
 const s=createState(),yaw=s.p.yaw,pitch=s.p.pitch;stepWindowLook(s.p,c.look,.1,{fine:true});assert(s.p.yaw>yaw&&s.p.pitch>pitch);
});
test('The window weapon can fire into empty space without a controller-pointing hit',()=>{
 const s=createState(),before=s.p.ammo;assert(fire(s,windowAim(s)));assert.equal(s.p.ammo,before-1);assert(s.events.some(e=>e.type==='shot'));
});
test('Model fixture: move, aim, fire, reload and move during reload use the real simulation',()=>{
 const s=createState(),initialAmmo=s.p.ammo,before={x:s.p.x,z:s.p.z};s.p.yaw=-.8;
 for(let i=0;i<20;i++){stepWindowLook(s.p,[.3,-.2],1/120);fire(s,windowAim(s));step(s,{moveX:.4,moveZ:.5,explorer:true},1/120);}
 assert(s.p.ammo<initialAmmo);const used=s.p.ammo;step(s,{moveX:.4,moveZ:.5,reload:true,explorer:true},1/120);assert(s.p.reload>0);const middle={x:s.p.x,z:s.p.z};
 for(let i=0;i<240;i++)step(s,{moveX:.4,moveZ:.5,explorer:true},1/120);
 assert(s.p.ammo>used);assert(Math.hypot(s.p.x-before.x,s.p.z-before.z)>.1);assert(Math.hypot(s.p.x-middle.x,s.p.z-middle.z)>.1);
});
test('Aperture misses, tracking loss and reconnect cannot create held-trigger gunfire',()=>{
 const {sampler,sources}=inputs();button(sources,'right',0,true);assert(!windowControls(sampler,sources).held.fire);button(sources,'right',0,false);windowControls(sampler,sources);button(sources,'right',0,true);assert(windowControls(sampler,sources).held.fire);
 assert(!windowControls(sampler,[]).held.fire);assert(!windowControls(sampler,sources).held.fire);
});
test('Hand UI never becomes movement or combat even with a nonstandard synthetic gamepad',()=>{
 const {sampler,sources}=inputs();for(const s of sources){s.hand=new Map();s.gamepad.axes=[1,1,1,1];s.gamepad.buttons.fill({pressed:true,value:1});}
 const c=windowControls(sampler,sources);assert.deepEqual(c.move,[0,0]);assert.deepEqual(c.look,[0,0]);assert(!Object.values(c.held).some(Boolean));assert(!Object.values(c.edges).some(Boolean));
});
test('Right squeeze uses; B reloads; left squeeze casts; A traverses; X swaps; Y pauses',()=>{
 for(const[side,index,key]of [['right',1,'interact'],['right',5,'reload'],['left',1,'pulse'],['right',4,'jump'],['left',4,'next'],['left',5,'pause']]){
  const {sampler,sources}=inputs();windowControls(sampler,sources);button(sources,side,index,true);const c=windowControls(sampler,sources);assert(c.edges[key]);assert.equal(Object.values(c.edges).filter(Boolean).length,1);
 }
 assert(WINDOW_CONTROLS.includes('B: reload'));
});
test('First-person window maps the initial physical eye to the player eye, not a giant miniature viewpoint',()=>{
 for(const yaw of[-2,0,1.2])for(const pitch of[-.7,0,.4]){
  const s=createState();s.p.yaw=yaw;s.p.pitch=pitch;const saved=saveState(s),rig=new T.Group(),w=new FirstPersonWindow(),head={x:.2,y:1.65,z:0},anchor={x:.2,y:.5,z:-1.45};w.center(head,anchor,.03);w.sync(rig,s.p);
  const eye=new T.Vector3(head.x,head.y,head.z).applyMatrix4(rig.matrixWorld);assert(eye.distanceTo(new T.Vector3(s.p.x,s.p.y+eyeHeight(s.p),s.p.z))<1e-9);
  const direction=new T.Vector3(0,0,-1).applyQuaternion(w.windowView).applyQuaternion(rig.quaternion),aim=forward(yaw,pitch);assert(direction.distanceTo(new T.Vector3(aim.x,aim.y,aim.z))<1e-9);assert.equal(saveState(s),saved);assert.equal(rig.scale.x,1);
  const box=w.boxMatrix(rig,anchor,.03).clone().premultiply(rig.matrixWorld.clone().invert()),origin=new T.Vector3().applyMatrix4(box);assert(origin.distanceTo(new T.Vector3(anchor.x,anchor.y-.09,anchor.z))<1e-9);
 }
});
test('Window draw path has no shell planes, hides only marked atmospheric sheets, and preserves original VR',()=>{
 const view=readFileSync(new URL('../diorama-view.mjs',import.meta.url),'utf8'),xr=readFileSync(new URL('../xr-session.mjs',import.meta.url),'utf8');
 assert(!view.includes('new T.PlaneGeometry'));assert(!view.includes('shellMaterial'));assert(view.includes('if(o.userData.portalBackdrop)hide(o,true)'));
 assert(!xr.includes("hi.fillRect"));assert(xr.includes("createFieldRotunda({rig,panel,hud"));assert(xr.includes('diorama.active&&!menu?windowControls'));assert(xr.includes("sessionMode==='first-person-ar'"));
 assert(xr.includes('item.line.visible=!windowPlay'));assert(xr.includes('item.barrel.visible=!diorama.active'));
 assert(view.includes('firstWindow.center(firstWindow.reference,anchor,config.scale,dioramaHeight(config))'));
});
