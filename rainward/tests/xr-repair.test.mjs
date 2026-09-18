import {test} from 'node:test';import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createDirectXRInput} from '../direct-xr-input.mjs';
import {readingPages,interactionReading} from '../xr-reading.mjs';
import {createXRWeapons} from '../xr-weapons.mjs';
import {createXRSight} from '../xr-sight.mjs';
import {authorizedMuzzle} from '../xr-shot.mjs';
import {freefieldOptions} from '../freefield.mjs';
import * as M from '../model.mjs';import * as W from '../world.mjs';
const source=()=>({id:'R',side:'right',buttons:Array.from({length:6},()=>({pressed:false,value:0})),axes:[0,0,0,0]});
test('B tap reloads, holding B pauses without a release reload, even before neutral arming',()=>{
 const input=createDirectXRInput(),r=source(),step=()=>input.sample([r],.1);step();step();r.buttons[5].pressed=true;assert.deepEqual(step().actions,[]);r.buttons[5].pressed=false;assert.deepEqual(step().actions,['reload']);
 r.buttons[5].pressed=true;const actions=[];for(let i=0;i<12;i++)actions.push(...step().actions);r.buttons[5].pressed=false;actions.push(...step().actions);assert.deepEqual(actions,['pause']);
 input.reset();r.buttons[5].pressed=true;const disarmed=[];for(let i=0;i<8;i++)disarmed.push(...step().actions);assert.deepEqual(disarmed,['pause']);
});
test('R3 still opens menus and the long-B escape does not depend on saved gameplay mapping',()=>{
 const input=createDirectXRInput(),r=source();r.buttons[3].pressed=true;assert.deepEqual(input.sample([r],.1,{mapping:{rightsecondary:'none'}}).actions,['pause']);
});
test('Every actual clue is readable in full after interaction, not before; presentation preserves saves',()=>{
 for(const id of Object.keys(W.LEVELS)){const s=M.createGame(id);if(!s.puzzle)continue;const clue=W.LEVELS[id].puzzle.clue;s.hint='A prior hint';const before=M.checkpoint(s);assert.equal(interactionReading(s,{kind:'clue'},false).text,'A prior hint');assert.equal(M.checkpoint(s),before);
  s.puzzle.clueRead=true;const note=interactionReading(s,{kind:'clue',label:clue.label},true);assert.equal(note.text,clue.text);assert.ok(note.persistent);const pages=readingPages(note.text);assert.equal(pages.flat().join(' ').replace(/\s+/g,' ').trim(),clue.text.replace(/\s+/g,' ').trim());
 }
 const many=readingPages(('Useful complete mechanism instructions. ').repeat(80));assert.ok(many.length>1);assert.ok(many.every(p=>p.length<=16&&p.every(l=>l.length<=58)));
});
test('Mechanical gun muzzle and -Z aim agree under yaw, pitch, reload and arbitrary hand transforms',()=>{
 const weapon=createXRWeapons(),root=new T.Group();root.add(weapon.root);root.position.set(.2,1.3,-.4);
 for(const kind of ['pistol','rifle'])for(const pitch of [-.8,0,.65]){root.rotation.set(pitch,.7,0);weapon.update({equipped:kind,reload:2,shotCD:1,waterMode:'dry'});root.updateMatrixWorld(true);const ray=weapon.ray(),expected=new T.Vector3(0,0,-1).applyQuaternion(root.quaternion);assert.ok(ray.direction.dot(expected)>.999999);assert.ok(ray.origin.distanceTo(root.position)<.75);assert.equal(weapon.root.rotation.x,0);assert.ok(weapon.stats().visible);}
 weapon.dispose();
});
test('Tracked shooting spends normal ammo, starts at the actual safe muzzle and does not converge through the desktop camera',()=>{
 const s=M.createGame(),p=s.player,muzzle={x:p.x+.25,y:1.4,z:p.z-.5},before=p.mag;assert.deepEqual(authorizedMuzzle(s,muzzle),muzzle);assert.ok(M.fire(s,{x:0,y:0,z:-1},muzzle));const shot=s.events.find(e=>e.type==='shot');assert.deepEqual(shot.from,muzzle);assert.equal(shot.to.y,shot.from.y);assert.equal(p.mag,before-1);
 p.shotCD=0;assert.equal(M.fire(s,{x:0,y:0,z:-1},{x:p.x+10,y:1.4,z:p.z}),false);assert.equal(p.mag,before-1);
 Object.assign(p,{x:12,z:-24});assert.equal(authorizedMuzzle(s,{x:14.7,y:1.4,z:-24}),null);
});
test('Scope immediately draws after a chapter clock reset and restores render state',()=>{
 const sight=createXRSight(),rig=new T.Group(),hero=new T.Group();let draws=0,rt=null;
 const renderer={xr:{enabled:true},autoClear:false,getRenderTarget:()=>rt,setRenderTarget:x=>{rt=x;},getViewport:x=>x.set(2,3,100,200),getScissor:x=>x.set(4,5,40,50),getScissorTest:()=>true,setViewport(){},setScissor(){},setScissorTest(){},render(){draws++;}};
 const a=new T.Scene(),b=new T.Scene(),o=new T.Vector3(0,1.4,0),d=new T.Vector3(0,0,-1);
 sight.render(renderer,a,rig,hero,o,d,100,true);sight.render(renderer,b,rig,hero,o,d,0,true);assert.equal(draws,2);assert.equal(sight.stats().sceneDraws,1);assert.equal(renderer.xr.enabled,true);assert.equal(renderer.autoClear,false);assert.equal(rt,null);assert.ok(rig.visible&&hero.visible);assert.ok(new T.Vector3(...sight.stats().direction).distanceTo(d)<1e-10);sight.dispose();
});
test('Fast movement is now the free-stride default, with saved precise/legacy alternatives',()=>{assert.ok(freefieldOptions().autoRun);assert.equal(freefieldOptions({autoRun:false}).autoRun,false);assert.equal(freefieldOptions({freeStride:false}).autoRun,false);assert.equal(freefieldOptions().runSpeed,9);});
