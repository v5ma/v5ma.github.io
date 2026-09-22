// Production model/raycast tests. DOM and clock fixtures are explicit, not headset acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {MessageTrail,messageOpacity,feedbackSettings,controlCard,FieldFeedback,focusedPage} from '../field-feedback.js';
import {settings,stageMatrix} from '../diorama-core.js';
import {dimensions,PORTAL_SPAN,boxInverse,seesFragment} from '../diorama-portal.js';
import {DioramaXR} from '../diorama-xr.js';
import {SpatialConsole,consoleMaterial} from '../spatial-console.js';
import {readFileSync} from 'node:fs';

test('Notifications finish fading at 2 wall-clock seconds, even when simulation is paused',()=>{
 const messages=new MessageTrail();messages.push('Gearbox aligned. Return to the crossing.',100);
 assert.equal(messages.opacity(100),1);assert.equal(messages.opacity(101.5),1);assert.ok(Math.abs(messages.opacity(101.8)-.5)<1e-10);assert.equal(messages.opacity(102),0);assert.equal(messages.opacity(120),0);
 assert.equal(messages.current.text,'Gearbox aligned. Return to the crossing.');assert.equal(messages.history.length,1);
});
test('Repeated genuine messages restart their own lifetime; history is bounded and text-only',()=>{
 const m=new MessageTrail();m.push('Out of reach',0);m.push('Out of reach',1.9);assert.equal(m.opacity(2),1);assert.equal(m.current.id,2);
 for(let i=0;i<25;i++)m.push('Notice '+i,i+4);assert.equal(m.history.length,12);assert.equal(m.history[0].text,'Notice 24');m.push('',100);assert.equal(m.serial,27);
 for(const age of [-1,Infinity,NaN,2,9])assert.equal(messageOpacity(age),0);
});
test('Older presentation preferences gain a tall aperture without dropping width, mode or openings',()=>{
 const old={version:1,width:2.4,view:'diorama-ar',aperture:'front'};const next=settings(old);
 assert.equal(next.height,2);assert.equal(next.width,2.4);assert.equal(next.view,'diorama-ar');assert.equal(next.aperture,'front');assert.ok(next.height>3*dimensions(2.4).height);
 assert.equal(settings({...old,height:NaN}).height,2);assert.equal(settings({...old,height:99}).height,4);assert.equal(settings({...old,height:-1}).height,.6);
 assert.equal(settings({...old,width:99}).width,4.8);assert.equal(settings({...old,width:-1}).width,.8);
});
test('Changing portal height preserves the current avatar display center and physical world',()=>{
 const original=globalThis.document;globalThis.document={getElementById:()=>null};
 try{const x=Object.create(DioramaXR.prototype);x.presentation=settings({width:2.4,height:2});x.anchor=new T.Vector3(1,.25,-2);x.persist=()=>{};x.updateStage=()=>{};
  const center=x.anchor.y+x.presentation.height/2;x.setDisplaySize({height:3.5});assert.equal(x.anchor.y+x.presentation.height/2,center);assert.equal(x.presentation.width,2.4);
  const anchor=x.anchor.clone();x.setDisplaySize({width:1.2});assert.deepEqual(x.anchor.toArray(),anchor.toArray());assert.equal(x.presentation.height,3.5);
 }finally{globalThis.document=original;}
});
test('Tall and resized boxes keep character centering, real-world ray depth and outside masking',()=>{
 for(const width of [.8,2.4,4.8])for(const height of [.6,2,4])for(const yaw of [0,.6]){
  const a=new T.Vector3(0,.05,-2),size=dimensions(width,height),mid=a.clone().add(new T.Vector3(0,height/2,0)),p=new T.Vector3(90,18,-70),matrix=stageMatrix(mid,yaw,width/PORTAL_SPAN,p);
  assert.ok(p.clone().applyMatrix4(matrix).distanceTo(mid)<1e-8);
  const inverse=boxInverse(a,yaw),toWorld=inverse.clone().invert(),eye=new T.Vector3(0,height/2,size.depth/2+2),far=new T.Vector3(0,height/2,-20);
  assert.ok(seesFragment(eye.clone().applyMatrix4(toWorld),far.clone().applyMatrix4(toWorld),inverse,size));
  assert.equal(seesFragment(eye.clone().applyMatrix4(toWorld),far.clone().setY(1000).applyMatrix4(toWorld),inverse,size),false);
 }
});
test('Controls reflect the selected profile, on-foot versus flight mode and tracked hands',()=>{
 assert.equal(controlCard({xr:true,active:true}).interact,'GRIP (either hand)');assert.match(controlCard({xr:true,mode:'helicopter'}).move,/Right stick up\/down: altitude/);
 assert.match(controlCard({xr:true,active:false,mode:'helicopter'}).move,/RT\/LT raise\/lower/);assert.equal(controlCard({xr:true,active:false}).interact,'A');
 assert.match(controlCard({xr:true,hands:true}).move,/Pinch FIELD/);assert.match(controlCard({active:false}).tools,/LB \+ RT/);assert.match(controlCard({active:true}).tools,/LT: aim/);
});
test('Floor UI preferences are bounded and do not contain game state',()=>{
 assert.deepEqual(feedbackSettings({scale:99,height:-5,visible:false,credits:999}),{version:1,scale:1.6,height:.03,visible:false});assert.deepEqual(feedbackSettings(null),{version:1,scale:1,height:.05,visible:true});
});
test('Floor guide uses actual selected task and enabled interaction rather than generic game instructions',()=>{
 const old=globalThis.document;const nodes={'interact-label':{textContent:'Align the bridge gearbox'},'interact-button':{disabled:false},'tool-name':{textContent:'Survey scanner'},ammo:{textContent:'READY'}};
 globalThis.document={getElementById:id=>nodes[id]};
 try{const f=Object.create(FieldFeedback.prototype);f.xr={travel:{navigation:{goal:{name:'Pump house',detail:'Enter the maintenance aisle.'}}}};f.card=()=>controlCard({xr:true});const d=f.data();assert.equal(d.goal,'Pump house');assert.equal(d.step,'Enter the maintenance aisle.');assert.equal(d.prompt,'GRIP (either hand): Align the bridge gearbox');
  nodes['interact-button'].disabled=true;nodes['interact-label'].textContent='Slow down to interact';assert.equal(f.data().prompt,'Slow down to interact');
  nodes['interact-label'].textContent='Explore the reserve';assert.match(f.data().prompt,/Move closer/);
 }finally{globalThis.document=old;}
});
test('Floor guide captures a floor pose and is not attached to the head or game portal',()=>{
 const f=Object.create(FieldFeedback.prototype);f.xr={active:true,ctx:{camera:new T.PerspectiveCamera()}};f.console={head:()=>new T.Vector3(2,1.6,3)};f.cfg=feedbackSettings();f.root=new T.Group();f.guide={mesh:new T.Group()};f.notice={mesh:new T.Group()};f.root.add(f.guide.mesh,f.notice.mesh);
 f.place();assert.deepEqual(f.root.position.toArray(),[2,.05,3]);assert.equal(f.guide.mesh.position.z,-1.05);const before=f.root.matrixWorld.clone();f.xr.ctx.camera.rotation.x=-.8;assert.deepEqual(f.root.matrixWorld.elements,before.elements);
});
test('Floor-map information absorbs a trigger; a real button selects only its own action',()=>{
 const c=Object.create(SpatialConsole.prototype),root=new T.Group(),plane=()=>new T.Mesh(new T.PlaneGeometry(1,1),consoleMaterial({}));
 c.root=root;c.rail={mesh:plane()};c.wrist={mesh:plane()};c.dock={mesh:plane()};const panel=plane();for(const m of [panel,c.rail.mesh,c.wrist.mesh,c.dock.mesh]){m.visible=false;root.add(m);}
 const feedback=Object.create(FieldFeedback.prototype);feedback.guide={mesh:plane()};root.add(feedback.guide.mesh);feedback.notice={mesh:plane()};feedback.notice.mesh.visible=false;feedback.buttons=[{label:'Map'},{label:'What to do / controls'},{label:'Menu / sizes'}];c.feedback=feedback;
 const origin=new T.Vector3(0,0,1);c.xr={active:true,invisible:false,panel,raycaster:new T.Raycaster(),rayFor:()=>({origin,direction:new T.Vector3(0,0,-1)})};
 assert.equal(c.hit({})?.occludesUI,true);origin.set(0,-.45,1);assert.equal(c.hit({}),feedback.buttons[1]);root.visible=false;assert.equal(c.hit({}),null);
});
test('Map and message wiring uses current gameplay UI and no test-only observers',()=>{
 const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8'),s=read('field-feedback.js'),nav=read('field-navigation.js');
 assert.match(s,/\['toast','radio-text'\]/);assert.match(s,/performance\.now\(\)\/1000/);assert.doesNotMatch(s,/__tidegate|__dinoRanger|localStorage\.clear|setInterval/);
 assert.match(nav,/travel\.navigation=this/);assert.match(nav,/drawDistrictMap\(this\.liveMap,this\.fleet\.state,this\.fleet\.position,\[\]\)/);assert.match(nav,/button\.onclick=\(\)=>travel\.ctx\.action\('map'\)/);
 assert.match(s,/this\.xr\.travel\.navigation\?\.liveMap/);
});

test('Controller focus pages the rendered menu to the actual offscreen control',()=>{
 const controls=Array.from({length:30},()=>({})),rows=controls.map(element=>({element}));
 assert.equal(focusedPage(rows,controls[2],2),0);assert.equal(focusedPage(rows,controls[13],0),1);assert.equal(focusedPage(rows,controls[28],0),2);assert.equal(focusedPage(rows,{},2),2);
});
