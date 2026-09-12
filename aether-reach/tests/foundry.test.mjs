import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createState,step,interact,nearby,COMBAT_COVER,DISTRICTS,saveState} from '../model.mjs';
import {ARENA_CONSOLES,COMBAT_DECKS,RIFTS} from '../skirmish-world.mjs';
import {installFoundryArt} from '../foundry-art.mjs';
import {surfacePixels,exposedDeck} from '../foundry-kit.mjs';
for(const console of ARENA_CONSOLES)test(console.name+' survives patrol, sight acquisition and attack',()=>{
 const s=createState();for(const b of s.drones)b.hp=0;
 Object.assign(s.p,{x:console.x,y:console.y,z:console.z,grounded:true,invuln:999});
 assert.equal(nearby(s)?.id,console.id);assert.ok(interact(s));
 for(let i=0;i<120*12;i++){step(s,{},1/120);s.events=[];}
 assert.equal(s.skirmish.battle.phase,'active');assert.ok(s.drones.filter(b=>b.arena).length===3);
 for(const b of s.drones.filter(b=>b.arena))assert.ok([b.x,b.y,b.z].every(Number.isFinite));
});
test('Foundry collision bodies have exactly the model dimensions',()=>{const scene=new T.Scene(),art=installFoundryArt({scene,cover:COMBAT_COVER,districts:DISTRICTS});scene.updateMatrixWorld(true);for(const c of COMBAT_COVER){const box=new T.Box3().setFromObject(scene.getObjectByName(c.id)),size=box.getSize(new T.Vector3());for(const [got,want]of [[size.x,c.w],[size.y,c.h],[size.z,c.d]])assert.ok(Math.abs(got-want)<1e-6);}assert.equal(art.stats().consoles,3);art.dispose();assert.equal(scene.children.length,0);});
test('Art follows companion, rift and trap state without changing saves or growing object pools',()=>{const scene=new T.Scene(),art=installFoundryArt({scene,cover:COMBAT_COVER,districts:DISTRICTS}),s=createState();const count=()=>{let n=0;scene.traverse(()=>n++);return n;},initial=count();s.skirmish.rift={...RIFTS[0],life:30};s.skirmish.traps=[{x:3,y:0,z:4,power:'pulse'}];s.skirmish.gunDrops=[{x:6,y:0,z:5,weapon:'sniper'}];const before=saveState(s);for(let i=0;i<100;i++)art.update(s,{reduced:i%2===0});assert.equal(count(),initial);assert.equal(saveState(s),before);assert.equal(art.stats().dynamicVisible,3);assert.ok(art.stats().companionVisible);s.skirmish.rift=null;s.skirmish.traps=[];s.skirmish.gunDrops=[];art.update(s);assert.equal(art.stats().dynamicVisible,0);art.dispose();});
test('New deck surfaces cannot overpaint the original same-height district floor',()=>{for(const d of COMBAT_DECKS)for(const p of exposedDeck(d,DISTRICTS)){assert.ok(p.x2>p.x1&&p.z2>p.z1);for(const h of DISTRICTS.filter(h=>h.y===d.y)){const overlap=Math.max(0,Math.min(p.x2,h.x+h.w/2)-Math.max(p.x1,h.x-h.w/2))*Math.max(0,Math.min(p.z2,h.z+h.d/2)-Math.max(p.z1,h.z-h.d/2));assert.equal(overlap,0);}}});
test('Original procedural surface data are deterministic, bounded and opaque',()=>{for(const kind of ['stone','timber','metal']){const a=surfacePixels(kind);assert.equal(a.length,128*128*4);assert.deepEqual(a,surfacePixels(kind));assert.ok(new Set(a).size>8);for(let i=3;i<a.length;i+=4)assert.equal(a[i],255);}});

import {CombatGestures} from '../combat-gestures.mjs';
test('A quick X or bumper tap after a slow frame cannot become a held action',()=>{for(const[key,tap,hold]of [['reload','use','use-hold'],['pulse','power-tap','power-charge'],['reverse','power-recent','power-wheel']]){const g=new CombatGestures();assert.deepEqual(g.step({[key]:true},.75),[]);assert.deepEqual(g.step({[key]:false},.05),[tap]);assert.deepEqual(g.step({[key]:true},.75),[]);assert.deepEqual(g.step({[key]:true},.4),[hold]);assert.deepEqual(g.step({[key]:true},.4),[]);}});
