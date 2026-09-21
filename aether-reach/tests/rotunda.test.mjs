import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {readFileSync} from 'node:fs';
import {cleanWorkspace,workspaceAnchor,workspaceStep,ROTUNDA_KEY} from '../rotunda-core.mjs';
import {stepDioramaLook} from '../diorama-aim.mjs';
import {stepWindowLook} from '../window-controls.mjs';
import {createShotFeedback} from '../shot-feedback.mjs';
import {createState,fire,saveState} from '../model.mjs';
const near=(a,b)=>assert(Math.abs(a-b)<1e-9);
test('Workspace defaults are bounded, independent preferences, not an expedition schema',()=>{
 const d=cleanWorkspace(null);assert.equal(d.height,1.12);assert.equal(d.hud,'left');assert.equal(d.guidedAim,true);assert(!ROTUNDA_KEY.includes('expedition'));
 assert.deepEqual(cleanWorkspace({height:Infinity,scale:NaN}),d);
 const v=cleanWorkspace({height:100,distance:-1,scale:5,yaw:-100,hud:'camera',motion:false});assert.equal(v.height,1.65);assert.equal(v.distance,.65);assert.equal(v.scale,1.2);assert.equal(v.yaw,-Math.PI);assert.equal(v.hud,'left');assert.equal(v.motion,false);
});
test('Workspace anchor uses horizontal room coordinates, not eye pitch or roll',()=>{
 const c=cleanWorkspace(),h={x:2,y:1.65,z:3,forward:{x:0,z:-1}};
 assert.deepEqual(workspaceAnchor(h,c),workspaceAnchor({...h,y:.8,roll:1,pitch:-1},c));
 const a=workspaceAnchor(h,c);near(a.x,2);near(a.z,1.95);near(a.y,1.12);
 const b=workspaceAnchor({...h,forward:{x:1,z:0}},c);near(b.x,3.05);near(b.z,3);near(b.yaw,-Math.PI/2);
});
test('Reduced-motion lift is immediate; animation is bounded and reversible',()=>{
 near(workspaceStep(.2,true,.016,false),1);near(workspaceStep(.8,false,.016,false),0);
 let v=0;for(let i=0;i<100;i++)v=workspaceStep(v,true,.016);assert(v>.999&&v<=1);
 for(let i=0;i<100;i++)v=workspaceStep(v,false,.016);assert(v<.001&&v>=0);
 near(workspaceStep(.4,true,NaN),.4);near(workspaceStep(.4,true,-1),.4);
});
test('Guided third-person horizontal turn ignores minor diagonal drift',()=>{
 const p={yaw:0,pitch:0};stepDioramaLook(p,[.7,.15],.1);assert(p.yaw>0);near(p.pitch,0);
});
test('A deliberate sweep levels pitch; neutral preserves chosen elevation',()=>{
 const p={yaw:0,pitch:.5};stepDioramaLook(p,[.7,0],.1);assert(p.pitch<.5&&p.pitch>0);
 const before={...p};stepDioramaLook(p,[0,0],.1);assert.deepEqual(p,before);
});
test('Fine aim and disabled guidance exactly preserve full elevation input',()=>{
 for(const opts of [{fine:true},{guided:false},{fine:true,invertY:true,speed:2}]){
  const a={yaw:.2,pitch:.3},b={...a};stepDioramaLook(a,[.4,-.6],.05,opts);stepWindowLook(b,[.4,-.6],.05,opts);assert.deepEqual(a,b);
 }
});
test('Strong vertical input still reaches elevations with guidance enabled',()=>{
 const p={yaw:0,pitch:0};stepDioramaLook(p,[0,-1],.1);assert(p.pitch>0);stepDioramaLook(p,[0,1],.1);near(p.pitch,0);
 stepDioramaLook(p,[.7,0],NaN);assert(Number.isFinite(p.yaw)&&Number.isFinite(p.pitch));
});
test('Shot visuals copy real shot endpoints and do not mutate the model or saves',()=>{
 const s=createState(),scene=new T.Scene(),f=createShotFeedback(scene);scene.userData.thirdPersonWindow=true;
 fire(s);const shot=s.events.find(e=>e.type==='shot');assert(shot);const saved=saveState(s),raw=JSON.stringify(s);
 f.shot(shot);f.update(.02);assert.equal(f.stats().events,1);assert.equal(f.stats().visible,1);assert.deepEqual(f.stats().last.end,shot.end);assert.deepEqual(f.stats().last.origin,shot.o);assert.equal(saveState(s),saved);assert.equal(JSON.stringify(s),raw);
});
test('Shot feedback is pooled, finite, third-person-only, and never manufactures a hit',()=>{
 const scene=new T.Scene(),f=createShotFeedback(scene),e={type:'shot',o:{x:0,y:2,z:0},end:{x:0,y:2,z:-10},hit:false};f.shot(e);assert.equal(f.stats().events,0);
 scene.userData.thirdPersonWindow=true;f.shot({...e,end:{x:NaN,y:0,z:0}});assert.equal(f.stats().events,0);
 for(let i=0;i<100;i++)f.shot(e);f.update(.01);assert.equal(f.stats().visible,24);assert.equal(f.stats().last.hit,false);
 for(let i=0;i<5;i++)f.update(.1);assert.equal(f.stats().visible,0);f.shot(e);scene.userData.thirdPersonWindow=false;f.update(.01);assert.equal(f.stats().visible,0);
});
test('Spatial UI code excludes head/window parenting and dismissed raycast targets',()=>{
 const xr=readFileSync(new URL('../xr-session.mjs',import.meta.url),'utf8'),r=readFileSync(new URL('../field-rotunda.mjs',import.meta.url),'utf8');
 assert(!xr.includes('camera.add(panel')&&!xr.includes('camera.add(hud'));assert(!xr.includes('diorama.uiRoot.add'));
 assert(r.includes('menu&&panel.visible?buttons.filter'));assert(r.includes('headLocked:false'));assert(r.includes('attachedToWindow:false'));assert(r.includes('new T.BoxGeometry'));assert(r.includes("api.show('workspace-dialog')"));
});
