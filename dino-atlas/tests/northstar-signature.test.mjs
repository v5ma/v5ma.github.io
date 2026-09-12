import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import R from '../vendor/rapier.mjs';
import {initPhysics,ParkPhysics} from '../ranger-physics.js';
import {buildRanchWorld} from '../ranch-world.js';
import {NORTHSTAR,NORTHSTAR_BUILD,NORTHSTAR_KEY,CIRCUIT_POINTS,CIRCUIT_REWARD,SERVICE_TOP,SERVICE_ROOF,serviceGateAt,emptyCircuit,sanitizeCircuit,readCircuit,saveCircuit,startCircuit,circuitAction,advanceCircuit,buildNorthstarSignature} from '../northstar-signature.js';
import {sanitizeEconomy,emptyEconomy} from '../frontier-economy-core.js';
import {Fleet} from '../frontier-vehicles.js';
import {emptyFrontier} from '../frontier-data.js';
await initPhysics();
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v),m};};

test('signature build, save namespace and bounded state are explicit',()=>{assert.equal(NORTHSTAR_BUILD,'northstar-signature-20260912.1');assert.equal(NORTHSTAR_KEY,'dino-atlas.northstar-signature.v1');assert.deepEqual(sanitizeCircuit(null),emptyCircuit());const s=sanitizeCircuit({version:1,active:true,stage:99,elapsed:Infinity,completed:-8,best:-1,rewarded:true,lastRoute:'teleport'});assert.equal(s.stage,4);assert.equal(s.elapsed,0);assert.equal(s.completed,0);assert.equal(s.best,null);assert.equal(s.lastRoute,'none');});

test('circuit suspend/load and first reward remain independent of prior save keys',()=>{const st=storage();for(const k of ['dino-atlas.progress.v1','dino-atlas.ranger.v1','dino-atlas.frontier.v2','dino-atlas.ranch.v1','dino-atlas.aaa-director.v1','dino-atlas.living-herds.v1'])st.setItem(k,'old:'+k);let s=startCircuit(emptyCircuit(),true);s.stage=3;s.elapsed=44;assert.ok(saveCircuit(st,s));s=readCircuit(st);assert.equal(s.stage,3);assert.equal(s.elapsed,44);for(const [k,v] of st.m)if(k!==NORTHSTAR_KEY)assert.equal(v,'old:'+k);let result;for(;s.active;)result=advanceCircuit(s);assert.equal(result.reward,CIRCUIT_REWARD);s=startCircuit(s,true);for(;s.active;)result=advanceCircuit(s);assert.equal(result.reward,0);assert.equal(s.completed,2);});

test('five interactions require on-foot, correct elevation, low speed and correct stage',()=>{const s=startCircuit(emptyCircuit(),true);for(let stage=0;stage<5;stage++){s.stage=stage;const p=CIRCUIT_POINTS[Object.keys(CIRCUIT_POINTS)[stage]];assert.equal(circuitAction(s,p,'jeep',0),null);assert.equal(circuitAction(s,p,'foot',6),null);assert.equal(circuitAction(s,{...p,y:p.y+5},'foot',0),null);assert.equal(circuitAction(s,p,'foot',0),'circuit');}});

test('one-time AAA reward ledger retains Living Herds and Northstar tags across reload',()=>{const e=emptyEconomy();e.rewardLedger=['aaa:storm-response','aaa:living-herds','aaa:northstar-canopy','other'];assert.deepEqual(sanitizeEconomy(e).rewardLedger,['aaa:storm-response','aaa:living-herds','aaa:northstar-canopy']);});



test('exterior service ascent is physically climbable to the roof airlock',()=>{const old=globalThis.document;globalThis.document={createElement:()=>({width:1024,height:100,getContext:()=>({fillRect(){},strokeRect(){},fillText(){},measureText:()=>({width:40})})})};const physics=new ParkPhysics();try{buildRanchWorld(new T.Scene(),physics);buildNorthstarSignature(new T.Scene(),physics);const f=new Fleet(physics,emptyFrontier());f.active='foot';const x1=NORTHSTAR.x+NORTHSTAR.hx+4.2,x2=NORTHSTAR.x+NORTHSTAR.hx+8.2,zF=NORTHSTAR.z+NORTHSTAR.hz+1,zB=NORTHSTAR.z-NORTHSTAR.hz+4;f.person.setActive(true,{x:x1,y:1.1,z:zF});const tick=v=>{f.drive(v,1/60,0,0);physics.world.step();f.afterStep(1/60);};const go=(x,z)=>{for(let i=0;i<2400;i++){const p=f.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<1.25)return true;tick({x:dx/d,z:-dz/d});}return false;};assert.ok(go(x1,zB));assert.ok(go(x2,zB));assert.ok(go(x2,zF));assert.ok(f.position.y>NORTHSTAR.h);assert.equal(serviceGateAt(f.position,'foot',0),'roof');assert.equal(serviceGateAt(SERVICE_ROOF,'foot',0),'stairs');}finally{physics.world.free();globalThis.document=old;}});

test('signature world keeps the helipad clear and provides physical support for the exterior service ascent',()=>{const old=globalThis.document;globalThis.document={createElement:()=>({width:1024,height:100,getContext:()=>({fillRect(){},strokeRect(){},fillText(){},measureText:()=>({width:40})})})};const physics=new ParkPhysics();try{buildRanchWorld(new T.Scene(),physics);const w=buildNorthstarSignature(new T.Scene(),physics);physics.world.step();assert.equal(w.consoles.length,5);const ray=(x,y,z)=>physics.world.castRay(new R.Ray({x,y,z},{x:0,y:-1,z:0}),50,true);assert.ok(ray(NORTHSTAR.x+NORTHSTAR.hx+4.2,5,NORTHSTAR.z+NORTHSTAR.hz));assert.ok(ray(NORTHSTAR.x+NORTHSTAR.hx+7.8,12,NORTHSTAR.z));assert.ok(ray(NORTHSTAR.x+NORTHSTAR.hx+11.4,22,NORTHSTAR.z));const center=physics.world.castRay(new R.Ray({x:NORTHSTAR.x+2,y:NORTHSTAR.h+12,z:NORTHSTAR.z+1},{x:0,y:-1,z:0}),30,true);assert.ok(center,'existing helipad roof remains supported');}finally{physics.world.free();globalThis.document=old;}});
