import {test} from 'node:test';
import assert from 'node:assert/strict';
import {waterPrompt} from '../aquatic-prompts.mjs';
import {GamepadInput} from '../input.mjs';
import {createGame,update,checkpoint,restore} from '../model.mjs';
import {toggleSubmerge,surfaceWater} from '../aquatic.mjs';

test('Survival advertises hold B, Classic B, and both advertise A to surface',()=>{
 for(const preset of ['survival','classic']){
  assert.equal(waterPrompt({connected:true,preset}).control,(preset==='survival'?'HOLD B':'B')+' DIVE / GEAR STOWED');
  assert.equal(waterPrompt({connected:true,preset,submerged:true}).control,'A SURFACE / GEAR STOWED');
 }
});
test('Keyboard dive/surface hints do not masquerade as Xbox controls',()=>{
 assert.equal(waterPrompt().control,'Z DIVE / GEAR STOWED');
 assert.equal(waterPrompt({submerged:true}).control,'SPACE SURFACE / GEAR STOWED');
});
test('Low air is a textual, input-aware warning at 25 percent, not an automatic surface',()=>{
 assert.equal(waterPrompt({submerged:true,oxygen:25.01}).lowAir,false);
 for(const oxygen of [25,1,0]){
  const gamepad=waterPrompt({submerged:true,oxygen,connected:true});
  assert.equal(gamepad.lowAir,true);assert.match(gamepad.warning,/Press A/);assert.match(gamepad.state,/LOW AIR/);
  assert.match(waterPrompt({submerged:true,oxygen}).warning,/Press Space/);
 }
 assert.equal(waterPrompt({oxygen:0}).warning,'');
 assert.equal(waterPrompt({submerged:true,oxygen:100}).warning,'');
});
test('Oxygen display is bounded and handles non-finite or missing data',()=>{
 for(const [value,expected] of [[-2,0],[102,100],[NaN,100],[Infinity,100],[24.3,25]])assert.equal(waterPrompt({oxygen:value}).air,expected);
 assert.equal(waterPrompt().oxygenLabel,'Oxygen remaining: 100 percent');
});
test('Advertised dive gesture and A surface retain the original preset actions',()=>{
 for(const profile of ['survival','classic']){
  const input=new GamepadInput(),pad={connected:true,mapping:'standard',index:0,id:'test',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
  input.sample([pad],.18,profile,0);pad.buttons[1]={pressed:true,value:1};const tap=input.sample([pad],.18,profile,.1);
  const held=input.sample([pad],.18,profile,.6);assert.ok((profile==='survival'?held:tap).actions.includes(profile==='survival'?'prone':'crouch'));
  pad.buttons[1]={pressed:false,value:0};input.sample([pad],.18,profile,.7);pad.buttons[0]={pressed:true,value:1};assert.ok(input.sample([pad],.18,profile,.8).actions.includes(profile==='survival'?'traverse':'dodge'));
 }
});
test('Rendering low-air guidance neither mutates gameplay nor changes checkpoint format',()=>{
 const state=createGame('natatorium');Object.assign(state.player,{x:15,z:10});update(state,{},1/60);toggleSubmerge(state);
 const before=JSON.stringify(state.player);waterPrompt({submerged:true,oxygen:state.player.oxygen,connected:true});assert.equal(JSON.stringify(state.player),before);
 surfaceWater(state);Object.assign(state.player,{x:15,z:23.5});update(state,{},1/60);state.checkpoint='natatorium-deck';const raw=checkpoint(state);assert.equal(JSON.parse(raw).version,4);assert.ok(restore(raw));
});
