import {test} from 'node:test';import assert from 'node:assert/strict';
import {createGame,update,checkpoint} from '../model.mjs';
import {FREEFIELD_KEY,freefieldOptions,locomotionPolicy,readFreefield,saveFreefield,quietScore} from '../freefield.mjs';
import {REMAP_KEY,normalizeRemaps,remapPads,loadRemaps,saveRemaps} from '../freefield-remap.mjs';
import {previewBlink,blink} from '../blink.mjs';
import {solidAt,heightAt,HEIGHT} from '../world.mjs';
test('Free Stride offers faster running without fatigue while legacy exhaustion stays available',()=>{
 const p={stance:'stand',stamina:0,exhausted:true};assert.equal(locomotionPolicy({sprint:true},p).sprint,false);
 const free=locomotionPolicy({sprint:true,freeStride:true},p);assert.equal(free.speed,9);assert.ok(free.sprint);
 assert.equal(locomotionPolicy({sprint:true,freeStride:true,runSpeed:999},p).speed,14);
});
test('An hour of real model locomotion has no fatigue slowdown; turns are measured separately',()=>{
 const s=createGame();s.enemies=[];let direction=1,sinceTurn=0,samples=0,min=Infinity;
 for(let i=0;i<72010;i++){
  if(direction>0&&s.player.x>25||direction<0&&s.player.x<0){direction=-direction;sinceTurn=0;}
  update(s,{x:direction,z:0,sprint:true,freeStride:true,runSpeed:9},.05);sinceTurn+=.05;
  if(sinceTurn>.8){min=Math.min(min,s.player.speed);samples++;}
 }
 assert.ok(s.t>=3600);assert.ok(samples>30000);assert.ok(min>8.95,`${min} measured away from turns`);assert.equal(s.player.stamina,100);assert.ok(s.player.hp>0);
});
test('Movement preferences never enter checkpoints and storage denial remains nonfatal',()=>{
 const s=createGame(),before=checkpoint(s),disk=new Map(),storage={getItem:k=>disk.get(k),setItem:(k,v)=>disk.set(k,v)};
 assert.ok(saveFreefield(storage,freefieldOptions()));assert.deepEqual([...disk.keys()],[FREEFIELD_KEY]);assert.equal(checkpoint(s),before);
 assert.equal(readFreefield({getItem(){throw Error()}}).runSpeed,9);assert.equal(saveFreefield({setItem(){throw Error()}},{}),false);
});
test('Remaps are validated and leave menu input plus reserved system buttons untouched',()=>{
 const map=normalizeRemaps({xr:{rightprimary:'interact',rightsecondary:'reload',rightstick:'fire'},xbox:{0:3,3:3,9:7,1:99}});
 assert.equal(map.xr.rightstick,undefined);assert.equal(map.xbox[9],undefined);assert.equal(map.xbox[1],1);
 const buttons=Array.from({length:17},()=>({pressed:false,value:0}));buttons[0]={pressed:true,value:1};buttons[9]={pressed:true,value:1};const pads=[{id:'x',index:0,connected:true,mapping:'standard',buttons,axes:[0,0,0,0]}];
 assert.equal(remapPads(pads,map.xbox,false),pads);const transformed=remapPads(pads,map.xbox,true)[0];assert.ok(transformed.buttons[3].pressed);assert.ok(transformed.buttons[9].pressed);assert.ok(pads[0].buttons[0].pressed);
 const disk=new Map(),storage={getItem:k=>disk.get(k),setItem:(k,v)=>disk.set(k,v)};saveRemaps(storage,map);assert.deepEqual([...disk.keys()],[REMAP_KEY]);assert.deepEqual(loadRemaps(storage),map);
});
test('Blink preview is read-only; actual blink uses clear collision-authorized ground and no resource grants',()=>{
 const s=createGame(),raw=checkpoint(s),preview=previewBlink(s,{x:0,z:-1});assert.ok(preview.valid);assert.equal(checkpoint(s),raw);
 const {hp,mag,reserve,stamina}=s.player;assert.ok(blink(s,{x:0,z:-1}));assert.ok(!solidAt(s.player.x,s.player.z,HEIGHT.stand));assert.deepEqual([s.player.hp,s.player.mag,s.player.reserve,s.player.stamina],[hp,mag,reserve,stamina]);
});
test('Blink stops at the same closed walls, cannot cross deep water or skip an active action',()=>{
 const s=createGame();Object.assign(s.player,{x:12,z:-24});const preview=previewBlink(s,{x:1,z:0});assert.ok(preview.point.x<14);blink(s,{x:1,z:0});assert.ok(s.player.x<14);
 s.player.craft={item:'medkit',left:1};assert.equal(previewBlink(s,{x:0,z:-1}).valid,false);
 delete s.player.craft;assert.equal(previewBlink(s,{x:NaN,z:1}).valid,false);assert.equal(blink(s,{x:0,z:-1},false),false);
});
test('The sparse score has silent bars and no repetitive percussion channel',()=>{
 let notes=0,silent=0;for(let i=0;i<48;i++){const s=quietScore('meridian',i);assert.ok(s.seconds>0);notes+=s.notes.length;silent+=!s.notes.length;assert.ok(s.notes.every(n=>!['drum','tick'].includes(n.kind)));}assert.ok(silent>35&&notes<15);
});
