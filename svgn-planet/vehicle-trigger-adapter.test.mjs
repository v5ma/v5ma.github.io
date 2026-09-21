/* Real unified adapter and Three.js math; fake renderer/session/DOM. This is NOT
 * a pixel test or a physical-device test. No gameplay save is seeded or edited. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {createUnifiedXR} from './unified-xr.mjs';
import {xrInput} from './xr-input.mjs';
const ctx={fillRect(){},fillText(){},drawImage(){},measureText:s=>({width:s.length*11})};
const pose=(x=0,y=0,z=0)=>({position:{x,y,z,w:1},orientation:{x:0,y:0,z:0,w:1}});
const device=handedness=>({handedness,gamepad:{buttons:Array.from({length:6},()=>({pressed:false,value:0})),axes:[0,0,0,0]},targetRaySpace:{pose:pose(4,0,0)},gripSpace:{pose:pose(handedness==='left'?-.2:.2,-.3,-.4)}});
async function setup({ride=true,choice='primary',dominant='right',profile='action',reverse=false}={}){
 let paused=true,now=0;const actions=[],data=new Map(),left=device('left'),right=device('right');
 const dialog={id:'test-pause',tagName:'DIALOG',dataset:{},querySelector:()=>null,querySelectorAll:()=>[]};
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx}),head:{append(){}},body:{classList:{add(){},remove(){}}},getElementById:()=>null,querySelectorAll:()=>paused?[dialog]:[],activeElement:null};
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(),spatial={view:{scene,camera},end(){},restore(){},inspect(){return {};},ray:(o,d)=>({origin:o,direction:d})};
 const session=new EventTarget();Object.assign(session,{inputSources:reverse?[right,left]:[left,right],visibilityState:'visible',environmentBlendMode:'alpha-blend',requestReferenceSpace:async()=>({pose:pose(0,-1.65,0)}),async end(){this.dispatchEvent(new Event('end'));}});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{xr:{requestSession:async()=>session}}});
 const renderer={xr:{getReferenceSpace:()=>({}),setReferenceSpaceType(){},setFoveation(){},async setSession(){},getCamera:()=>({cameras:[{},{}]}),enabled:false},shadowMap:{},setRenderTarget(){},setClearColor(){}};
 const state={ride};const xr=createUnifiedXR({renderer,storage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},state:()=>state,spatial:()=>spatial,clear(){},playing:()=>!paused,pause(){paused=true;},resume(){paused=false;},goal:()=> 'Drive safely',message(){},hud:()=>({goal:'Drive safely'}),action:(...a)=>actions.push(a),turn(){},combat:()=>false,embodied:()=>false,canGlide:()=>false});
 xr.preference('profile',profile);xr.preference('dominant',dominant);xr.consolePreference('driveHand',choice);
 const frame={getViewerPose:()=>({transform:pose()}),getPose:s=>s.pose?{transform:s.pose}:null};
 const update=(n=1)=>{for(let i=0;i<n;i++){now+=24;xr.update(now,frame);}return {...xrInput};};
 const button=(hand,index,down)=>{({left,right}[hand]).gamepad.buttons[index]={pressed:down,value:down?1:0};return update(3);};
 await xr.enter('third-person-ar');update(12);paused=false;update(8);
 return {xr,state,left,right,actions,update,button,pause:()=>{paused=true;update();},resume:()=>{paused=false;update();},async end(){await session.end();await Promise.resolve();}};
}
for(const reverse of [false,true])test('Actual unified adapter honors physical left drive/right brake independent of source order '+reverse,async()=>{
 const h=await setup({choice:'left',reverse});assert.ok(h.button('left',0,true).boost);assert.equal(h.actions.length,0);assert.ok(h.button('right',0,true).brake);h.button('left',0,false);assert.equal(h.update().boost,false);h.button('right',0,false);assert.equal(h.update().brake,false);await h.end();
});
test('Actual adapter retains default primary driving and can select physical right with a left dominant hand',async()=>{
 let h=await setup();assert.ok(h.button('right',0,true).boost);assert.equal(h.button('left',0,true).brake,false);await h.end();
 h=await setup({choice:'right',dominant:'left'});assert.ok(h.button('right',0,true).boost);assert.ok(h.button('left',0,true).brake);await h.end();
});
test('On-foot trigger interaction and Courier driving are not overridden by physical riding selection',async()=>{
 let h=await setup({choice:'left',ride:'foot'});assert.equal(h.button('right',0,true).boost,false);assert.equal(h.actions.at(-1)[0],'interact');await h.end();
 h=await setup({choice:'right',profile:'courier'});assert.ok(h.button('left',0,true).boost);h.button('right',0,true);assert.equal(h.actions.at(-1)[0],'interact');await h.end();
});
test('Pause, held-input rearm and immersive exit clear vehicle input on the real adapter',async()=>{
 const h=await setup({choice:'left'});h.button('left',0,true);h.pause();assert.equal(h.update().boost,false);h.resume();assert.equal(h.update().boost,false);h.button('left',0,false);assert.ok(h.button('left',0,true).boost);await h.end();assert.equal(h.xr.inspect().active,false);assert.equal(h.xr.inspect().input.boost,false);
});
