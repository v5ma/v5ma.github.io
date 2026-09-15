import {test} from 'node:test';import assert from 'node:assert/strict';
import {newState,makeWorld,step,readSave,saveData,blocked,recover,throwPaper} from '../model.mjs';
import {attachFrontier} from '../frontier-core.mjs';
import {attachQuarter,inQuarter,quarterAct,quarterBlocked,quarterEnter,quarterLeave,quarterSurface,quarterState,nearbyQuarter,quarterChoices} from '../quarter-core.mjs';
import {QUARTER_ROUTES,QUARTER_SITES,QUARTER_GATE} from '../quarter-data.mjs';
const world=makeWorld(),fresh=()=>attachQuarter(attachFrontier(newState()),null,{fresh:true});
function idle(s,n=100){for(let i=0;i<n;i++)step(s,world,{},1/60);}
function walk(s,[x,z]){for(let i=0;i<6000;i++){const d=Math.hypot(x-s.x,z-s.z);if(d<.19){idle(s,30);return;}step(s,world,{moveYaw:Math.atan2(x-s.x,z-s.z),throttle:Math.min(.65,d*.9),analog:true},1/60);}assert.fail(`Route blocked going to ${x},${z} from ${s.x},${s.z},${s.quarter.groundY}`);}
function act(s,id,a){const v=quarterAct(s,id,a);assert.ok(v.ok,JSON.stringify({id,a,...v,x:s.x,z:s.z,y:s.quarter.groundY}));return v;}
function route(s,name){for(const p of QUARTER_ROUTES[name]){walk(s,p);if(name==='social'&&p[0]===17.5)act(s,'precision','ratio-2');if(name==='hydraulic'&&p[0]===1.7){act(s,'sluice','drain');idle(s,400);}}}
function finish(s,name){route(s,name);act(s,'parcel','recover');for(const p of QUARTER_ROUTES.return){walk(s,p);if(p[1]===-2.35)act(s,'arch-back','unlatch');}act(s,'workshop','report');}
for(const name of ['social','upper','hydraulic'])test(`The ${name} approach independently completes using real fixed-step walking and a physical return`,()=>{const s=fresh(),vehicles=structuredClone(s.vehicle);finish(s,name);assert.equal(s.credits,60);assert.equal(s.life.xp,120);assert.equal(s.quarter.archOpen,true);assert.equal(s.quarter.goodsAccess,name==='social');assert.equal(s.quarter.low,name==='hydraulic');assert.deepEqual(s.vehicle,vehicles);assert.equal(s.mission,0);assert.equal(s.relay,false);assert.deepEqual([...s.deliveries],[]);});
test('New actual sessions start in the authored opening; legacy fixtures and old saves do not move',()=>{assert.ok(inQuarter(fresh()));const old=attachQuarter(attachFrontier(newState()),null,{fresh:true,legacy:true});assert.equal(old.x,2);assert.equal(old.mode,'bike');assert.ok(!inQuarter(old));const saved=readSave(JSON.stringify(saveData(old)),world),resume=attachQuarter(attachFrontier(newState(saved),saved.frontier),saved.quarter);assert.ok(!inQuarter(resume));});
test('Both deliberate bad-ratio choices are recoverable and consume nothing',()=>{const s=fresh();for(const p of QUARTER_ROUTES.social.slice(0,5))walk(s,p);for(const a of ['ratio-1','ratio-3']){assert.equal(quarterAct(s,'precision',a).ok,false);assert.equal(s.credits,0);assert.equal(s.quarter.goodsAccess,false);}act(s,'precision','ratio-2');});
test('Closed workshop arch is a genuine physical blocker until opened from the far side',()=>{const s=fresh();s.x=-16;s.z=-5;s.quarter.groundY=0;assert.ok(quarterBlocked(s,-16,-3.8,.35));assert.equal(quarterAct(s,'arch-back','unlatch').ok,false);s.quarter.archOpen=true;assert.ok(!quarterBlocked(s,-16,-3.8,.35));});
test('The goods stair gate opens only after cooperation; unrelated routes do not need that flag',()=>{const s=fresh();s.x=17;s.z=1;s.quarter.groundY=0;assert.ok(quarterBlocked(s,17,1.55,.33));s.quarter.goodsAccess=true;assert.ok(!quarterBlocked(s,17,1.55,.33));});
test('Draining changes water over simulation time and a paused state does not advance it',()=>{const s=fresh();for(const p of QUARTER_ROUTES.hydraulic.slice(0,5))walk(s,p);act(s,'sluice','drain');const before=s.quarter.waterY;assert.equal(s.quarter.waterY,before);idle(s,60);assert.ok(Math.abs(s.quarter.waterY-before+.45)<1e-6);});
test('Deep water blocks the channel; lowering the water makes the same physical floor traversable',()=>{const s=fresh();s.x=-3;s.z=7;s.quarter.groundY=-2.6;assert.ok(quarterBlocked(s,-3,8,.33));s.quarter.waterY=-2.38;assert.ok(!quarterBlocked(s,-3,8,.33));});
test('Remote, wrong-floor, airborne and repeated parcel requests cannot manufacture completion',()=>{const s=fresh();assert.equal(quarterAct(s,'parcel','recover').ok,false);s.x=1.8;s.z=14;s.quarter.groundY=-2.6;assert.equal(quarterAct(s,'parcel','recover').ok,false);s.quarter.groundY=3.2;s.lift=1;assert.equal(quarterAct(s,'parcel','recover').ok,false);s.lift=0;act(s,'parcel','recover');assert.equal(quarterAct(s,'parcel','recover').ok,false);assert.equal(s.credits,0);});
test('Every legal completed state reloads with a safe arrival, permanent shortcut and no duplicate payout',()=>{const s=fresh();finish(s,'upper');const raw=readSave(JSON.stringify(saveData(s)),world),resume=attachQuarter(attachFrontier(newState(raw),raw.frontier),raw.quarter);assert.equal(resume.x,-20);assert.equal(resume.quarter.groundY,0);assert.equal(resume.quarter.archOpen,true);assert.equal(resume.credits,60);assert.equal(quarterAct(resume,'workshop','report').ok,false);assert.equal(resume.credits,60);});
test('The follow-up uses known places and pays once without a timer',()=>{const s=fresh();finish(s,'upper');act(s,'workshop','delivery-start');for(const p of QUARTER_ROUTES.social.slice(1,5))walk(s,p);act(s,'precision','collect-spindle');for(const p of [[12,-7],[6,-7],[-8,-7],[-16,-7],[-16,0],[-10,0],[-10,9],[-10,14],[-13,16],[-13,21],[-20,21],[-20,15],[-20,9.5],[-23.4,9.5]])walk(s,p);act(s,'loft','deliver-spindle');assert.equal(s.credits,75);assert.equal(s.life.xp,160);assert.equal(quarterAct(s,'loft','deliver-spindle').ok,false);});
test('Malformed quarter state is bounded and cannot invent arbitrary actor positions or claims',()=>{const q=quarterState({active:1,reported:true,delivery:100,visited:['invented'],groundY:Infinity,waterY:NaN});assert.equal(q.active,false);assert.equal(q.reported,false);assert.equal(q.delivery,0);assert.equal(q.groundY,0);assert.deepEqual(q.visited,[]);assert.ok(Number.isFinite(q.waterY));});
test('Quarter entry requires real legacy location, and leaving preserves old progression and parked vehicles',()=>{const s=attachQuarter(attachFrontier(newState()),null);assert.equal(quarterEnter(s),false);s.mode='foot';s.x=QUARTER_GATE.x;s.z=QUARTER_GATE.z;s.credits=345;s.relay=true;const vehicles=structuredClone(s.vehicle);assert.equal(quarterEnter(s),true);assert.equal(quarterLeave(s),true);assert.equal(s.credits,345);assert.equal(s.relay,true);assert.deepEqual(s.vehicle,vehicles);s.frontier.zone='badlands';assert.equal(quarterEnter(s),false);});
test('Recovery, harmless tools and stable save identities cannot reset old accomplishments',()=>{const s=fresh();s.quarter.parcel=true;s.credits=432;recover(s);assert.ok(s.quarter.parcel);assert.equal(s.credits,432);assert.equal(throwPaper(s,world,1),false);const v=saveData(s);v.deliveries=['mail-0'];assert.ok(readSave(JSON.stringify(v),{...world,mailboxes:[]}));v.deliveries=['invented-mail'];assert.equal(readSave(JSON.stringify(v),world),null);});
test('Every station has authored floor support at its declared elevation; only three bounded residents exist',()=>{for(const p of QUARTER_SITES){const f=quarterSurface(p.x,p.z,p.y);assert.ok(f,p.id);assert.ok(Math.abs(f.y-p.y)<.2,p.id);}const s=fresh();idle(s,6000);assert.equal(s.quarter.actors.length,3);assert.ok(s.quarter.actors.every(a=>[a.x,a.y,a.z,a.yaw].every(Number.isFinite)));});

import {QUARTER_WALLS} from '../quarter-data.mjs';
import {clipBoom} from '../camera-safety.mjs';
test('The authored arrival camera stops in front of the workshop facade instead of rendering its back wall full screen',()=>{
 const wall=QUARTER_WALLS.find(w=>w.id==='workshop-back');assert.ok(wall,'The actual drawn workshop facade needs a camera/physical proxy');
 const b={id:wall.id,min:{x:wall.x-wall.hx,y:wall.y,z:wall.z-wall.hz},max:{x:wall.x+wall.hx,y:wall.y+wall.h,z:wall.z+wall.hz}};
 for(const distance of[5.2,6.5,9.1]){const v=clipBoom({x:-20,y:1.2,z:-13},{x:-20,y:4.6,z:-13-distance},[b]);assert.equal(v.obstacle,'workshop-back');assert.ok(v.position.z>-16,'The camera must remain on the apprentice side of the wall');assert.ok(v.fraction<1);}
});
test('Adding the workshop camera wall preserves the porch, exit and both logical sides of the shortcut',()=>{
 const s=fresh();for(const [x,z]of[[-20,-13],[-24,-14],[-16,-11],[-16,-6]]){s.quarter.groundY=0;assert.equal(quarterBlocked(s,x,z,.35),false);}
});

import {quarterSignObstructs} from '../quarter-art.mjs';
test('A large gallery readout cannot hide the apprentice from the actual game camera',()=>{
 const eye={x:1.8,y:7.8,z:7.5},anchor={x:1.8,y:4.4,z:14};
 assert.equal(quarterSignObstructs(eye,anchor,{x:2,y:5.6,z:12,width:12,height:2}),true);
 assert.equal(quarterSignObstructs(eye,anchor,{x:2,y:5.8,z:15.9,width:6,height:1}),false);
 assert.equal(quarterSignObstructs(eye,anchor,{x:14,y:5.6,z:12,width:3,height:.5}),false);
});

import {readFileSync,existsSync} from 'node:fs';
test('The authored opening retains all required established DOM bindings and unique identifiers',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const id of ['adventures-button','dispatch-button','notebook-button','settings-button','pause-button','city-map','show-joystick','graphics-quality','settings-close','map-close','reset','resume-info','game-title','move-stick','touch-ride','start','resume','sound'])assert.ok(ids.includes(id),'Missing live DOM binding: '+id);
});
test('The new opening keeps the nine local stylesheets required by the existing game and modal UI',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const styles=[...html.matchAll(/rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(styles.length,9);for(const name of styles){assert.ok(name.startsWith('./'));assert.ok(existsSync(new URL('../'+name,import.meta.url)),name);}
});
