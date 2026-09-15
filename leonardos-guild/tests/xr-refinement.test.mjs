/* Explicit CPU adapter tests: actual guild-xr, Three ray math and input routing,
 * with mock DOM/canvas, XR session and renderer. NOT native WebGL/device evidence. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createGuildXR} from '../guild-xr.mjs';
import {createXRPanel} from '../xr-panel.mjs';
import {radialIndex} from '../resonance-data.mjs';

async function fixture(t){
 const saved=new Map(['document','navigator','isSecureContext'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 t.after(()=>{for(const [key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}});
 const nodes=new Map(),context=new Proxy({}, {get:()=>()=>{},set:()=>true});
 const element=(tag='button')=>({tagName:tag.toUpperCase(),id:'',textContent:'',innerText:'',hidden:false,
  getContext:()=>context,setAttribute(){},getAttribute:()=>null,querySelector:()=>null,cloneNode(){return element(tag);},
  after(...items){for(const node of items)nodes.set(node.id,node);}});
 const doc={createElement:element,getElementById(id){if(!nodes.has(id)){const e=element();e.id=id;nodes.set(id,e);}return nodes.get(id);},activeElement:null};
 const source=handedness=>({handedness,tracked:true,targetRaySpace:{handedness},position:{x:handedness==='left'?-.25:.25,y:1.3,z:-.1},orientation:{x:0,y:0,z:0,w:1},gamepad:{mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:6},()=>({pressed:false,value:0}))}});
 const left=source('left'),right=source('right'),session=new EventTarget(),reference=new EventTarget();
 session.inputSources=[left,right];session.visibilityState='visible';session.requestReferenceSpace=async()=>reference;
 let running=true,modal=null,wheel=null,index=0,variant=0,now=0;const calls=[];
 const state={mode:'foot',resonance:{tool:'staff',ready:6,reserve:36,aim:false},health:100,credits:0};
 const paused=element('dialog');paused.id='pause';paused.textContent='Paused';
 const ui={root:()=>modal,choices:()=>[],adjust(){},activate(){},back(){calls.push('back');modal=null;running=true;},
  confirm(){calls.push('confirm');modal=null;running=true;},navigate(d){calls.push('navigate:'+d);},tabs(d){calls.push('tab:'+d);},scroll(d){calls.push(['scroll',d]);}};
 const actions={heading:()=>0,gesture(){},pause(){calls.push('pause');running=false;modal=paused;},
  jump(){calls.push('jump');},interact(){calls.push('interact');},reload(){calls.push('reload');},dodge(){calls.push('dodge');},recenter(){calls.push('recenter');},
  quickTool(){calls.push('quick');state.resonance.tool=state.resonance.tool==='staff'?'sling':'staff';},
  dispatch(){calls.push('dispatch');running=false;modal=paused;},vehicle(){calls.push('vehicle');},scan(){},cover(){},magic(){},special(){},journal(){},map(){},
  wheelActive:()=>wheel,openWheel(kind){wheel=kind;calls.push('open:'+kind);},
  closeWheel(commit){calls.push(['close',commit]);if(commit)state.resonance.tool=['staff','sling','letters','lantern'][index];wheel=null;},
  updateWheel(x,y,across){index=radialIndex(x,y,4,index);variant+=across;calls.push(['wheel',x,y,across]);}};
 const consoleUI={inspect:()=>({wheel,index,variant})};
 const renderer={xr:{enabled:false,isPresenting:false,setReferenceSpaceType(){},setFramebufferScaleFactor(){},getReferenceSpace:()=>reference,async setSession(){this.isPresenting=true;}},setRenderTarget(){}};
 session.end=async()=>{renderer.xr.isPresenting=false;session.dispatchEvent(new Event('end'));};
 const view={update(){},inspect:()=>({quality:'low'}),setQuality(){},camera:new T.PerspectiveCamera()};
 Object.defineProperty(globalThis,'document',{configurable:true,value:doc});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{xr:{isSessionSupported:async()=>true,requestSession:async()=>session}}});
 Object.defineProperty(globalThis,'isSecureContext',{configurable:true,value:true});
 const xr=createGuildXR({renderer,view,getState:()=>state,playing:()=>true,active:()=>running&&!modal,actions,ui,consoleUI,clearInput(){}});
 await Promise.resolve();await nodes.get('guild-xr-enter').onclick();
 const pose=(position,orientation={x:0,y:0,z:0,w:1})=>({transform:{position,orientation}});
 const frame={getViewerPose:()=>pose({x:0,y:1.6,z:0}),getPose(space){const s=session.inputSources.find(s=>s.handedness===space.handedness);return s?.tracked?pose(s.position,s.orientation):null;},getJointPose(space){const s=right;if(!s.tracked)return null;return {...pose({...s.position,x:s.position.x+(space.name==='thumb-tip'?s.pinch:0)}),radius:.008};}};
 const tick=(n=1)=>{for(let i=0;i<n;i++){now+=1000/60;xr.poll(now,1/60,frame);}return xr.controls(1/60);};
 const button=(s,i,down)=>s.gamepad.buttons[i]={pressed:down,value:down?1:0};
 const press=(s,i)=>{button(s,i,true);tick(2);button(s,i,false);tick(2);};
 tick(3);
 return {xr,left,right,session,state,calls,actions,ui,consoleUI,doc,element,frame,tick,button,press,modal(v){modal=v;running=!v;},paused};
}

test('The actual XR adapter selects a tool by stick and confirms without leaking a jump or camera turn',async t=>{
 const f=await fixture(t);f.button(f.left,1,true);f.tick(3);assert.equal(f.consoleUI.inspect().wheel,'tools');
 f.right.gamepad.axes=[0,0,1,0];f.tick(3);assert.equal(f.consoleUI.inspect().index,1);
 f.press(f.right,4);assert.equal(f.consoleUI.inspect().wheel,null);assert.equal(f.state.resonance.tool,'sling');
 assert.equal(f.calls.includes('jump'),false);assert.equal(f.tick().look,0);
 f.right.gamepad.axes=[0,0,0,0];f.tick(2);f.right.gamepad.axes=[0,0,1,0];assert.ok(f.tick().look<0);
});
test('The actual XR adapter changes wheel variants and cancels without dodging',async t=>{
 const f=await fixture(t);f.button(f.left,1,true);f.tick(3);f.left.gamepad.axes=[0,0,1,0];f.tick(3);
 assert.equal(f.consoleUI.inspect().variant,1);f.press(f.right,5);
 assert.equal(f.consoleUI.inspect().wheel,null);assert.equal(f.calls.includes('dodge'),false);assert.ok(f.calls.some(v=>Array.isArray(v)&&v[0]==='close'&&v[1]===false));
});
test('The actual XR adapter routes aimed B to reload with one held interaction, not a menu detour',async t=>{
 const f=await fixture(t);f.state.resonance.tool='sling';f.state.resonance.aim=true;f.button(f.right,5,true);f.tick(2);
 assert.equal(f.calls.filter(x=>x==='reload').length,1);assert.equal(f.calls.includes('interact'),false);
 f.tick(40);assert.equal(f.calls.filter(x=>x==='interact').length,1);f.tick(40);assert.equal(f.calls.filter(x=>x==='interact').length,1);
});
test('Menu focus navigation and confirmation use the existing UI adapter, not gameplay buttons',async t=>{
 const f=await fixture(t);f.modal(f.paused);f.tick(2);f.left.gamepad.axes=[0,0,0,1];f.tick(2);
 assert.ok(f.calls.includes('navigate:down'));f.press(f.right,4);assert.ok(f.calls.includes('confirm'));assert.equal(f.calls.includes('jump'),false);
 assert.equal(f.tick().throttle,0);f.left.gamepad.axes=[0,0,0,0];f.tick(2);f.left.gamepad.axes=[0,0,0,1];assert.ok(f.tick().throttle>0);
});
test('Headset blur blocks both XR commands and fallback Xbox locomotion until visibility returns',async t=>{
 const f=await fixture(t);f.session.visibilityState='visible-blurred';f.session.dispatchEvent(new Event('visibilitychange'));f.tick(3);
 const before=f.calls.length;f.button(f.left,4,true);f.tick(3);assert.equal(f.calls.length,before);
 assert.equal(f.xr.controls(1/60,{throttle:1,fire:true}).throttle,0);
 const pauses=f.calls.filter(x=>x==='pause').length;f.modal(null);f.tick(1);assert.equal(f.calls.filter(x=>x==='pause').length,pauses+1,'A resume through another input cannot bypass hidden-session safety');
 f.session.visibilityState='visible';f.modal(null);f.tick(3);assert.equal(f.calls.includes('quick'),false);
});
test('Losing the grip that opened a wheel cancels rather than selecting on tracking release',async t=>{
 const f=await fixture(t);f.button(f.left,1,true);f.tick(3);f.session.inputSources=[f.right];f.session.dispatchEvent(new Event('inputsourceschange'));f.tick(2);
 assert.equal(f.consoleUI.inspect().wheel,null);assert.ok(f.calls.some(v=>Array.isArray(v)&&v[0]==='close'&&v[1]===false));
});
test('Tracked hand pinch still raycasts to the existing quick-tool panel action',async t=>{
 const f=await fixture(t);f.right.hand=new Map([['thumb-tip',{name:'thumb-tip'}],['index-finger-tip',{name:'index-finger-tip'}]]);delete f.right.gamepad;f.right.pinch=.06;
 const uv={u:.5,v:1-(735+3*76+33)/1536};
 const target=new T.Vector3((uv.u-.5)*1.10,(uv.v-.5)*1.65,0).applyAxisAngle(new T.Vector3(0,1,0),-.42).add(new T.Vector3(1.61,1.60,-2.37));
 const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.sub(new T.Vector3().copy(f.right.position)).normalize());f.right.orientation={x:q.x,y:q.y,z:q.z,w:q.w};
 f.tick(3);f.right.pinch=.014;f.tick(3);assert.equal(f.calls.filter(x=>x==='quick').length,1);f.tick(5);assert.equal(f.calls.filter(x=>x==='quick').length,1);
});
test('The XR panel follows a newly focused menu item onto its correct page',async t=>{
 const f=await fixture(t),items=Array.from({length:16},(_,i)=>{const e=f.element();e.id='item'+i;e.textContent='Choice '+i;return e;});
 f.modal(f.paused);f.ui.choices=()=>items;f.doc.activeElement=items[0];
 const p=createXRPanel({ui:f.ui,actions:f.actions,getState:()=>f.state,consoleUI:f.consoleUI,exit(){}});p.draw(1000);assert.equal(p.inspect().page,0);
 f.doc.activeElement=items[13];p.draw(1200);assert.equal(p.inspect().page,1);assert.ok(p.inspect().buttons.includes('dom13'));p.dispose();
});

test('Losing only the opening controller pose also cancels its wheel without waiting for source removal',async t=>{
 const f=await fixture(t);f.button(f.left,1,true);f.tick(3);f.left.tracked=false;f.tick(2);
 assert.equal(f.consoleUI.inspect().wheel,null);assert.ok(f.calls.some(v=>Array.isArray(v)&&v[0]==='close'&&v[1]===false));
});
