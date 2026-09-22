// Source and Canvas2D test doubles; not headset or full-browser acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {FieldFeedback,controlCard} from '../field-feedback.js';
import {RanchGame} from '../ranch-game.js';
import {lessonInstructions,guidanceContext} from '../ranger-guidance.js';
const ctx=(mode='jeep',active=true)=>({fleet:{mode,position:{x:0,y:1,z:50},vehicles:[]},state:{},input:{device:'gamepad',travel:{activeLayout:active,settings:{xboxLayout:active?'active':'legacy'},ctx:{xr:{active:true,session:{inputSources:[]}}}}}});
function patrol(context){const r=Object.create(RanchGame.prototype);r.ctx=context;r.activity='school';r.s={tutorial:0};return r.task();}
test('Active Quest first-patrol instruction never asks aim/fire triggers to drive',()=>{
 const t=patrol(ctx());assert.doesNotMatch(t.detail,/RT accelerates|LT brakes/);assert.match(t.detail,/Left stick/i);assert.equal(t.target.z,38);
});
test('First patrol explains boarding when the current ranger is on foot, without awarding progress',()=>{
 const t=patrol(ctx('foot'));assert.match(t.detail,/board.*Y|Y.*board/i);assert.equal(t.done,0);assert.equal(t.total,10);
});
test('Keyboard help describes actual keys instead of claiming Xbox controls are active',()=>{
 const c=controlCard({device:'keyboard',mode:'foot'});assert.match(c.move,/WASD/);assert.doesNotMatch(c.move,/Xbox/);assert.match(c.tools,/mouse/);
});
test('Floor map title is distinct from the legend and cannot extend into the mission column',()=>{
 const calls=[];const paint={fillText:(...args)=>calls.push(args),measureText:s=>({width:s.length*18})};const c=new Proxy(paint,{get:(o,k)=>o[k]||(()=>{})});
 const f=Object.create(FieldFeedback.prototype);f.guide={c,texture:{}};f.xr={controllers:[],travel:{navigation:{liveMap:{width:192,height:192}}}};f.mapFrames=0;f.buttons=[];
 f.data=()=>({goal:'Your first patrol',step:'Drive to the marker.',bearing:'North',prompt:'Grip: rest',tool:'Water',utility:'',card:{move:'Left stick',tools:'RT'}});
 f.paint();assert.ok(calls.some(v=>v[0]==='LIVE MAP'));assert.ok(calls.some(v=>v[0]==='WHITE: YOU / GOLD: GOAL'&&v[2]>400));assert.equal(f.mapFrames,1);
});
test('XR HERE prompt never contradicts the grip mapping with an obsolete A suffix',()=>{
 const saved=globalThis.document;globalThis.document={getElementById:id=>({'interact-label':{textContent:'Recover floating supplies / A'},'interact-button':{disabled:false}}[id])};
 try{const f=Object.create(FieldFeedback.prototype);f.xr={travel:{navigation:{}}};f.card=()=>controlCard({xr:true});assert.equal(f.data().prompt,'GRIP (either hand): Recover floating supplies');}finally{globalThis.document=saved;}
});

test('Legacy Quest help names the squeeze-based aiming actually used by trackedMotion',()=>{
 const c=controlCard({xr:true,active:false});assert.match(c.tools,/Left grip: aim/);assert.doesNotMatch(c.tools,/Left trigger: aim/);
 assert.match(lessonInstructions('water','', {xr:true,active:false,mode:'foot'}),/Left grip: aim/);
});
test('Guidance reflects switching controller profiles without writing progression or remaps',()=>{
 const c=ctx(),original=JSON.stringify(c.state),a=guidanceContext(c);assert.equal(a.xr,true);assert.equal(a.active,true);
 c.input.travel.ctx.xr.active=false;c.input.travel.settings.xboxLayout='legacy';const b=guidanceContext(c);assert.equal(b.xr,false);assert.equal(b.active,false);
 c.input.device='keyboard';assert.equal(guidanceContext(c).device,'keyboard');assert.equal(JSON.stringify(c.state),original);
});
test('Unknown lessons and fixed-world navigation remain unchanged by control help',()=>{
 const original='Observe the quiet ridge.';assert.equal(lessonInstructions('future-lesson',original,{xr:true}),original);
 for(const mode of ['foot','jeep','boat','helicopter']){const t=patrol(ctx(mode));assert.deepEqual(t.target,{x:0,z:38});assert.equal(t.done,0);assert.equal(t.total,10);}
});
