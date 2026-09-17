/* Runs the real XR adapter and Three math with an explicitly fake renderer.
 * This is an input/menu-model test, NOT WebGL, browser, or headset acceptance. */
import {test} from 'node:test';import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createXR} from './xr.mjs';import {fresh} from './core.mjs';
const ctx={fillRect(){},fillText(){},drawImage(){},measureText(s){return {width:s.length*12};}};
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx}),body:{classList:{add(){},remove(){}}}};
globalThis.addEventListener=()=>{};
const pose=(x=0,y=0,z=0)=>({position:{x,y,z,w:1},orientation:{x:0,y:0,z:0,w:1}});
const device=handedness=>({handedness,gamepad:{buttons:Array.from({length:6},()=>({pressed:false,value:0})),axes:[0,0,0,0]},targetRaySpace:{pose:pose(4,0,0)},gripSpace:{pose:pose(handedness==='left'?-.2:.2,-.25,-.35)}});
async function setup(mode){
 const scene=new T.Scene(),rig=new T.Group(),world=new T.Group(),camera=new T.PerspectiveCamera();scene.add(rig,world);rig.add(camera);
 const left=device('left'),right=device('right');const session=new EventTarget();Object.assign(session,{inputSources:[left,right],visibilityState:'visible',environmentBlendMode:mode.endsWith('-ar')?'alpha-blend':'opaque',async end(){this.dispatchEvent(new Event('end'));}});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{xr:{requestSession:async()=>session}}});
 let paused=true,confirmation=null,now=0,head=pose(),tracked=true,pinching=.06,yaw=0;const actions=[],data=new Map();
 const renderer={xr:{getReferenceSpace:()=>({}),setReferenceSpaceType(){},setFoveation(){},async setSession(){},enabled:false},shadowMap:{},setRenderTarget(){},setClearColor(){}};
 const view={renderer,scene,camera,rig,world,curtain:{visible:false,material:{}},stopPortal(){world.position.set(0,0,0);world.rotation.set(0,0,0);world.scale.setScalar(1);},presentPortal(){world.scale.setScalar(.08);},cutaway(){},resize(){},setOpening(v){view.opening=v;}};
 const s=fresh();const frame={getViewerPose:()=>({transform:head}),getPose:space=>tracked?{transform:space.pose}:null,getJointPose:space=>tracked?{transform:pose(right.gripSpace.pose.position.x+(space.index===0?pinching:0),right.gripSpace.pose.position.y,right.gripSpace.pose.position.z)}:null};
 const store={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 const xr=createXR(view,{storage:store,state:()=>s,clear(){},pause(v){paused=v;if(!v)confirmation=null;},paused:()=>paused,action:(...a)=>actions.push(a),save(){},goal:()=> 'A safe test goal',missions:()=>[{id:'watch',title:'Night Watch'}],map(){},track(id){actions.push(['track',id]);},message:t=>actions.push(['message',t]),yaw:()=>yaw,turn(a){yaw+=a;},confirmation:()=>confirmation,cancelConfirmation(){confirmation=null;},menuAction(id){actions.push(['menu',id]);if(['restore','restart'].includes(id))confirmation='Replace current progress?';if(id==='replace')confirmation=null;}});
 function update(n=1){let result;for(let i=0;i<n;i++){now+=24;scene.updateMatrixWorld(true);result=xr.update(now,frame,s);scene.updateMatrixWorld(true);}return result;}
 function release(){for(const src of [left,right]){src.gamepad.buttons.forEach(b=>{b.pressed=false;b.value=0;});src.gamepad.axes=[0,0,0,0];}pinching=.06;update(8);}
 function aim(label){const panel=xr.panelPose(),r=panel.rows.find(r=>r.label===label);assert.ok(r,'Missing '+label);const point=new T.Vector3(((r.x+r.w/2)/1024-.5)*panel.width,(.5-(r.y+r.h/2)/768)*panel.height,0).applyMatrix4(new T.Matrix4().fromArray(panel.referenceMatrix));const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),point.normalize());right.targetRaySpace.pose={position:{x:0,y:0,z:0,w:1},orientation:q};}
 function clickHere(label){aim(label);update(2);if(right.hand)pinching=.012;else right.gamepad.buttons[0]={pressed:true,value:1};update(2);if(right.hand)pinching=.06;else right.gamepad.buttons[0]={pressed:false,value:0};update(8);}
 function click(label){update(8);for(let i=0;i<20;i++){const rows=xr.panelPose().rows;if(rows.some(r=>r.label===label)){clickHere(label);return;}clickHere(rows.find(r=>r.label.startsWith('Next ')).label);}throw Error('Not found: '+label);}
 function button(src,i,value=true){src.gamepad.buttons[i]={pressed:value,value:value?1:0};return update(3);}
 function hands(){right.hand=new Map([['thumb-tip',{index:0}],['index-finger-tip',{index:1}],['wrist',{index:2}]]);session.inputSources=[right];session.dispatchEvent(new Event('inputsourceschange'));release();}
 await xr.enter(mode);update(10);release();
 return {xr,s,view,left,right,session,actions,store,update,release,click,button,hands,setHead:p=>head=p,setPinch:p=>pinching=p,setTracking:v=>tracked=v,get paused(){return paused;},get confirmation(){return confirmation;},setPause(v){paused=v;update(8);},get yaw(){return yaw;}};
}
for(const mode of['diorama-vr','first-person-vr','diorama-ar','first-person-ar']){
 test(mode+': actual adapter hides UI, keeps direct actions and neutral rearm',async()=>{
  const h=await setup(mode);assert.equal(h.xr.inspect().kind,mode);h.click('Resume');assert.equal(h.paused,false);assert.equal(h.xr.inspect().actionPanelVisible,false);assert.equal(h.xr.inspect().visibleRays,0);
  h.button(h.right,1);assert.equal(h.actions.at(-1)[0],'interact');h.release();h.left.gamepad.axes[3]=-1;assert.equal(h.update().y,1);h.release();assert.equal(h.button(h.left,3).boost,true);h.release();assert.equal(h.update().boost,false);
  h.button(h.left,5);assert.ok(h.paused);h.release();h.button(h.left,3);h.click('Resume');assert.equal(h.update().boost,false);h.release();assert.equal(h.button(h.left,3).boost,true);h.release();await h.xr.exit();
 });
 test(mode+': native menus, reversible preferences and destructive confirmation',async()=>{
  const h=await setup(mode);h.click('Controls');h.click('Dominant: right');assert.equal(h.xr.inspect().controls.dominant,'left');h.click('Swap sticks: off');assert.ok(h.xr.inspect().controls.swapSticks);h.click('Motion strikes: on');assert.equal(h.xr.inspect().controls.motionPunch,false);h.click('Back to Menu');
  h.click('Save / recovery');h.click('Restore backup');assert.ok(h.confirmation);assert.equal(h.xr.panelPose().rows[0].label,'Keep current progress');h.xr.navigate(0,false,true);h.update(8);assert.equal(h.confirmation,null);assert.ok(h.paused);h.click('Restart chapter');h.click('Keep current progress');assert.ok(!h.actions.some(a=>a[1]==='replace'));h.click('Export current progress');assert.equal(h.actions.at(-1)[1],'export');h.click('Back to Menu');h.click('Missions / map');h.click('Night Watch');assert.equal(h.actions.at(-1)[0],'track');assert.equal(h.s.watch.stage,0);await h.xr.exit();
 });
 test(mode+': hand gestures work without a permanent board and loss clears input',async()=>{
  const h=await setup(mode);h.hands();h.click('Resume');assert.ok(!h.xr.inspect().actionPanelVisible);h.right.gripSpace.pose.position.y=-.65;h.setPinch(.012);h.update(10);assert.equal(h.xr.inspect().input.y,1);h.setPinch(.06);h.update(5);assert.equal(h.xr.inspect().input.y,0);assert.ok(h.xr.inspect().input.brake);
  h.right.gripSpace.pose.position.y=-.02;h.setPinch(.012);h.update(30);assert.ok(h.paused);assert.ok(h.xr.inspect().menuGestures>0);h.setPinch(.06);h.right.gripSpace.pose.position.y=-.25;h.update(8);const m=h.xr.inspect().panelMatrix;h.setHead({...pose(.1,0,0),orientation:{x:0,y:0,z:.2,w:Math.sqrt(.96)}});h.update(8);assert.deepEqual(h.xr.inspect().panelMatrix,m);h.setTracking(false);h.update();assert.ok(h.paused);assert.equal(h.xr.inspect().input.y,0);await h.xr.exit();
 });
}
