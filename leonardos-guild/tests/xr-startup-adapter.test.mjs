/* Explicit CPU adapter tests: actual guild-xr, Three ray math and input routing,
 * with mock DOM/canvas, XR session and renderer. NOT native WebGL/device evidence. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createGuildXR} from '../guild-xr.mjs';
import {createXRPanel} from '../xr-panel.mjs';
import {radialIndex} from '../resonance-data.mjs';

async function fixture(t,{stall=null}={}){
 const saved=new Map(['document','navigator','isSecureContext'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 t.after(()=>{for(const [key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}});
 const nodes=new Map(),context=new Proxy({}, {get:()=>()=>{},set:()=>true});
 const element=(tag='button')=>({tagName:tag.toUpperCase(),id:'',textContent:'',innerText:'',hidden:false,
  getContext:()=>context,setAttribute(){},getAttribute:()=>null,querySelector:()=>null,cloneNode(){return element(tag);},
  after(...items){for(const node of items)nodes.set(node.id,node);}});
 const doc={createElement:element,getElementById(id){if(!nodes.has(id)){const e=element();e.id=id;nodes.set(id,e);}return nodes.get(id);},activeElement:null};
 const source=handedness=>({handedness,tracked:true,targetRaySpace:{handedness},position:{x:handedness==='left'?-.25:.25,y:1.3,z:-.1},orientation:{x:0,y:0,z:0,w:1},gamepad:{mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:6},()=>({pressed:false,value:0}))}});
 const timerJobs=new Map();let timerId=0;const realSet=globalThis.setTimeout,realClear=globalThis.clearTimeout;globalThis.setTimeout=fn=>{timerJobs.set(++timerId,fn);return timerId;};globalThis.clearTimeout=id=>timerJobs.delete(id);t.after(()=>{globalThis.setTimeout=realSet;globalThis.clearTimeout=realClear;});
 let settle;const blocked=new Promise(resolve=>settle=resolve);let rendererCalls=0;
 const left=source('left'),right=source('right'),session=new EventTarget(),reference=new EventTarget();
 session.inputSources=[left,right];session.visibilityState='visible';session.requestReferenceSpace=async()=>stall==='reference-space'?blocked:reference;
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
 const renderer={xr:{enabled:false,isPresenting:false,setReferenceSpaceType(){},setFramebufferScaleFactor(){},getReferenceSpace:()=>reference,async setSession(){rendererCalls++;if(stall==='renderer')await blocked;if(!session.ended)this.isPresenting=true;}},setRenderTarget(){}};
 session.end=async()=>{session.ended=true;renderer.xr.isPresenting=false;session.dispatchEvent(new Event('end'));};
 const view={update(){},inspect:()=>({quality:'low'}),setQuality(){},camera:new T.PerspectiveCamera()};
 Object.defineProperty(globalThis,'document',{configurable:true,value:doc});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{xr:{isSessionSupported:async()=>true,requestSession:async()=>session}}});
 Object.defineProperty(globalThis,'isSecureContext',{configurable:true,value:true});
 const xr=createGuildXR({renderer,view,getState:()=>state,playing:()=>true,active:()=>running&&!modal,actions,ui,consoleUI,clearInput(){}});
 await Promise.resolve();const pending=nodes.get('guild-xr-enter').onclick();for(let i=0;i<10;i++)await Promise.resolve();
 const pose=(position,orientation={x:0,y:0,z:0,w:1})=>({transform:{position,orientation}});
 const frame={getViewerPose:()=>pose({x:0,y:1.6,z:0}),getPose(space){const s=session.inputSources.find(s=>s.handedness===space.handedness);return s?.tracked?pose(s.position,s.orientation):null;},getJointPose(space){const s=right;if(!s.tracked)return null;return {...pose({...s.position,x:s.position.x+(space.name==='thumb-tip'?s.pinch:0)}),radius:.008};}};
 const tick=(n=1)=>{for(let i=0;i<n;i++){now+=1000/60;xr.poll(now,1/60,frame);}return xr.controls(1/60);};
 const button=(s,i,down)=>s.gamepad.buttons[i]={pressed:down,value:down?1:0};
 const press=(s,i)=>{button(s,i,true);tick(2);button(s,i,false);tick(2);};
 tick(3);
 return {pending,settle:()=>settle(reference),timerJobs,renderer,rendererCalls:()=>rendererCalls,expire(){for(const [id,fn]of [...timerJobs]){timerJobs.delete(id);fn();}},nodes,xr,left,right,session,state,calls,actions,ui,consoleUI,doc,element,frame,tick,button,press,modal(v){modal=v;running=!v;},paused};
}


for(const stall of ['reference-space','renderer'])test('Actual adapter ends a stalled '+stall+' startup instead of hanging the launcher',async t=>{
 const f=await fixture(t,{stall});assert.equal(f.timerJobs.size,1,'Startup must already have a deadline while awaiting '+stall);
 f.expire();for(let i=0;i<10;i++)await Promise.resolve();
 assert.equal(f.session.ended,true);assert.equal(f.xr.presenting(),false);assert.equal(f.nodes.get('guild-xr-enter').disabled,false);
 assert.match(f.xr.inspect().entry.error,new RegExp(stall));f.settle();await f.pending;
 assert.equal(f.xr.presenting(),false);assert.equal(f.xr.inspect().entry.phase,'failed');assert.equal(f.xr.inspect().entry.frames,0);
 if(stall==='reference-space')assert.equal(f.rendererCalls(),0,'A stale floor probe must never initialize the renderer after end');
});
test('Actual adapter registers a first-frame deadline and cancels it when the session ends',async t=>{
 const f=await fixture(t);await f.pending;assert.equal(f.timerJobs.size,1);assert.equal(f.xr.inspect().entry.phase,'waiting-for-frame');await f.session.end();for(let i=0;i<4;i++)await Promise.resolve();assert.equal(f.timerJobs.size,0);assert.equal(f.xr.inspect().entry.phase,'idle');
});
