import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createGame,checkpoint} from '../model.mjs';
import {solidAt} from '../world.mjs';
import {RETURN_TASK,recutHeight} from '../floodgate-recut.mjs';
import {CLINIC_CUES,clinicNavigation,createClinicCues,drawClinicRoutes} from '../clinic-wayfinding.mjs';
import {selectIsHeld,holdOwnerActive,hoverTarget,craftReadout} from '../xr-interaction.mjs';
import {createXRInput} from '../xr-input.mjs';
test('A ray hold belongs to exactly one tracked source, not whichever hand is still pressed',()=>{
 const hold={sourceId:'right-1'},right={id:'right-1',side:'right',buttons:[{pressed:true}]},left={id:'left-1',side:'left',buttons:[{pressed:true}]};
 assert.ok(holdOwnerActive(hold,[left,right]));right.buttons[0].pressed=false;assert.equal(holdOwnerActive(hold,[left,right]),false);
 assert.equal(holdOwnerActive(hold,[left]),false);assert.equal(holdOwnerActive(hold,[{...right,id:'replacement',buttons:[{pressed:true}]}]),false);
 assert.equal(holdOwnerActive({},[left]),false);
});
test('Articulated hand ownership uses pinch and ends when that particular hand releases',()=>{
 const hold={sourceId:'hand'},r={id:'hand',hand:true,pinch:true};assert.ok(holdOwnerActive(hold,[r]));r.pinch=false;
 assert.equal(holdOwnerActive(hold,[r,{id:'other',hand:true,pinch:true}]),false);assert.equal(selectIsHeld(null),false);
 assert.ok(selectIsHeld({buttons:[{value:.8}]}));assert.equal(selectIsHeld({buttons:[{value:.6}]}),false);
});
test('Hover feedback has deterministic priority but cannot transfer action ownership',()=>{
 const l={id:'l',side:'left',row:{id:'reload'}},r={id:'r',side:'right',row:{id:'craft-smoke'}};
 assert.equal(hoverTarget([l,r]),'craft-smoke');assert.equal(hoverTarget([l]),'reload');assert.equal(hoverTarget([]),null);
 assert.equal(holdOwnerActive({sourceId:'l'},[r]),false);
});
test('Native Quest A crafting is not sustained by the left or right trigger',()=>{
 const i=createXRInput(),L={id:'l',side:'left',axes:[0,0,0,0],buttons:[]},R={id:'r',side:'right',axes:[0,0,0,0],buttons:[]},list=[L,R],step=()=>i.sample(list,.05,{mode:'pack'});step();step();
 R.buttons[4]={pressed:true};assert.ok(step().confirmHeld);R.buttons[4]={pressed:false};L.buttons[0]={pressed:true};R.buttons[0]={pressed:true};assert.equal(step().confirmHeld,false);
});
test('Craft progress is bounded, uses actual recipe durations and never mutates state',()=>{
 const s=createGame(),raw=checkpoint(s);assert.equal(craftReadout(s.player),null);assert.equal(checkpoint(s),raw);
 assert.equal(craftReadout({craft:{item:'smoke',left:1.2}}).percent,50);
 assert.equal(craftReadout({craft:{item:'medkit',left:1.05}}).percent,50);
 assert.equal(craftReadout({craft:{item:'smoke',left:-1}}).percent,100);
 assert.equal(craftReadout({craft:{item:'smoke',left:30}}).percent,0);
 assert.equal(craftReadout({craft:{item:'unknown',left:1}}),null);assert.equal(craftReadout({craft:{item:'smoke',left:NaN}}),null);
});
test('Clinic route information reflects the real optional gate without changing checkpoints',()=>{
 const s=createGame(),raw=checkpoint(s);assert.match(clinicNavigation(s).status,/CLOSED/);assert.equal(checkpoint(s),raw);
 s.completedTasks.push(RETURN_TASK);assert.match(clinicNavigation(s).status,/OPEN/);
 assert.equal(clinicNavigation({level:'natatorium'}),null);assert.equal(clinicNavigation(null),null);
});
test('The ten floor cues lie on real open ramp surfaces',()=>{
 createGame();assert.equal(CLINIC_CUES.length,10);
 for(const cue of CLINIC_CUES)assert.equal(solidAt(cue.x,cue.z),false,JSON.stringify(cue));
 const scene=new T.Scene(),cues=createClinicCues(scene),v=cues.mesh.geometry.attributes.position;
 assert.equal(cues.count,10);assert.equal(scene.children.length,1);
 for(let i=0;i<v.count;i++)assert.ok(Math.abs(v.getY(i)-recutHeight(v.getX(i),v.getZ(i))-.035)<1e-5);
 cues.mesh.geometry.dispose();cues.mesh.material.dispose();
});
test('The route-map overlay is presentation-only and explicitly distinguishes closed from open',()=>{
 const s=createGame(),raw=checkpoint(s),ops=[],g=new Proxy({}, {get:(_,name)=>(...args)=>ops.push([name,...args]),set:()=>true});
 drawClinicRoutes(g,s,{x:v=>v,z:v=>v});assert.equal(checkpoint(s),raw);assert.equal(ops.at(-1)[0],'restore');assert.equal(ops.some(o=>o[0]==='arc'),false);
 s.completedTasks.push(RETURN_TASK);ops.length=0;drawClinicRoutes(g,s,{x:v=>v,z:v=>v});assert.ok(ops.some(o=>o[0]==='arc'));
 ops.length=0;drawClinicRoutes(g,{level:'natatorium'},{x:v=>v,z:v=>v});assert.equal(ops.length,0);
});
