/* Explicit geometry/model fixtures, not physical devices or ordinary-input missions. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as W from '../world.mjs';
import * as M from '../model.mjs';
import {throwSmoke} from '../survival.mjs';
import {predictThrow,throwPosition,throwReadiness,THROW_LIMITS} from '../throw-path.mjs';
import {createThrowGuide} from '../throw-guide.mjs';
import * as T from '../vendor/three.module.js';
const world=(obstacles=[],height=()=>0)=>({bounds:{x0:-30,x1:30,z0:-30,z1:30},obstacles,height});
const player=(extra={})=>({x:0,z:0,stance:'stand',...extra});
const box=(x,z,w,d,h,bottom=0)=>({x,z,w,d,h,bottom});
const fixture=()=>{const s=M.createGame();s.enemies=[];s.player.bottles=2;s.player.smoke=1;return s;};
test('Open throws retain the existing finite ranges and flight duration; prediction is read-only',()=>{
 const p=player(),before=JSON.stringify(p);
 for(const kind of ['bottle','smoke']){const plan=predictThrow(p,0,kind,world());assert.ok(plan.valid);assert.equal(plan.range,THROW_LIMITS[kind]);assert.equal(plan.shortened,false);assert.deepEqual(throwPosition(plan.path,0),plan.path.from);assert.deepEqual(throwPosition(plan.path,1),plan.path.to);assert.equal(THROW_LIMITS.duration,.65);}
 assert.equal(JSON.stringify(p),before);
});
test('A solid distant landing shortens the throw instead of rejecting a clear nearer patch',()=>{
 const p=player(),o=box(0,-8,3,3,4),plan=predictThrow(p,0,'smoke',world([o]));assert.ok(plan.valid&&plan.shortened);assert.ok(plan.path.to.z>-6.4);assert.ok(plan.range>=.6);assert.ok(plan.points.every(q=>q.z>-6.5));
});
test('A low barrier can be lobbed over, but a full wall cannot be thrown through',()=>{
 const low=predictThrow(player(),0,'bottle',world([box(0,-5,4,1,1)]));assert.ok(low.valid&&!low.shortened);assert.ok(low.points.filter(q=>Math.abs(q.z+5)<.6).every(q=>q.y>1.08));
 const high=predictThrow(player(),0,'bottle',world([box(0,-5,4,1,8)]));assert.ok(high.valid&&high.shortened);assert.ok(high.path.to.z>-4.4);
});
test('Indoor throws reduce arc height to stay below a real ceiling; prone start stays under crawl cover',()=>{
 const roof=box(0,-4,6,12,.3,1.8),plan=predictThrow(player(),0,'smoke',world([roof]));assert.ok(plan.valid);assert.ok(plan.path.arc<2);assert.ok(plan.points.every(q=>q.y<1.72));
 const crawl=box(0,-3,4,10,.5,.67),prone=predictThrow(player({stance:'prone'}),0,'smoke',world([crawl]));assert.ok(prone.valid);assert.ok(prone.points.filter(q=>q.z>-8).every(q=>q.y<.59));
 assert.equal(predictThrow(player(),0,'smoke',world([box(0,0,2,2,3)])).valid,false);
});
test('A narrow wall between sample points is checked as a swept segment, not skipped',()=>{
 const obstacle=box(0,-4.013,3,.005,9),plan=predictThrow(player(),0,'bottle',world([obstacle]));assert.ok(plan.valid&&plan.shortened);assert.ok(plan.points.every(q=>q.z>-3.93));
});
test('Closed and opened authored shutters change the predicted route without changing player state',()=>{
 const gate={...box(0,-4,4,1,8),disabled:false},w=world([gate]);assert.ok(predictThrow(player(),0,'bottle',w).shortened);gate.disabled=true;assert.equal(predictThrow(player(),0,'bottle',w).shortened,false);
});
test('Boundary throws shorten along the aim direction instead of bending toward a corner',()=>{
 const p=player({x:27,z:27}),yaw=-Math.PI*.75,plan=predictThrow(p,yaw,'bottle',world());assert.ok(plan.valid&&plan.shortened);for(const q of plan.points){assert.ok(q.x<=29.92&&q.z<=29.92);assert.ok(Math.abs((q.x-p.x)-(q.z-p.z))<1e-8);}
 assert.equal(predictThrow(player({x:29.8}),-Math.PI/2,'smoke',world()).valid,false);
});
test('Terrain-aware plans never tunnel through a raised berm and all points stay finite',()=>{
 const height=(x,z)=>z<-3&&z>-6?5:0,plan=predictThrow(player(),0,'bottle',world([],height));assert.ok(plan.valid&&plan.shortened);assert.ok(plan.points.every(q=>Object.values(q).every(Number.isFinite)&&q.y>=height(q.x,q.z)+.08));
});
test('NaN, infinities, invalid tools and out-of-bounds origins cannot generate a launch',()=>{
 for(const [p,yaw,kind]of [[player(),NaN,'bottle'],[player(),Infinity,'smoke'],[player({x:NaN}),0,'smoke'],[player({z:99}),0,'smoke'],[player(),0,'unknown']])assert.equal(predictThrow(p,yaw,kind,world()).valid,false);
});
test('Both real actions consume one tool and emit exactly the predicted endpoint',()=>{
 for(const kind of ['bottle','smoke']){const s=fixture(),field=kind==='bottle'?'bottles':'smoke',before=s.player[field],plan=predictThrow(s.player,Math.PI/2,kind);assert.ok(plan.valid&&plan.shortened);assert.ok((kind==='bottle'?M.bottle:throwSmoke)(s,Math.PI/2));assert.equal(s.player[field],before-1);assert.equal(s.projectiles.length,1);assert.deepEqual(s.projectiles[0].trajectory,plan.path);assert.deepEqual(s.events.at(-1).to,plan.path.to);for(let i=0;i<40;i++)M.update(s,{},1/60);assert.equal(s.projectiles.length,0);if(kind==='smoke'){assert.equal(s.smokes.length,1);assert.equal(s.smokes[0].x,plan.path.to.x);}else assert.ok(s.sounds.some(n=>n.type==='bottle'&&n.x===plan.path.to.x));}
});
test('Failed, empty, busy and underwater throws preserve inventory and do not emit projectile/noise',()=>{
 for(const kind of ['bottle','smoke'])for(const reason of ['empty','craft','healing','melee','swim','dead','invalid']){const s=fixture(),field=kind==='bottle'?'bottles':'smoke';if(reason==='empty')s.player[field]=0;else if(reason==='swim')s.player.waterMode='swim';else if(reason==='dead')s.status='dead';else if(reason!=='invalid')s.player[reason]={};const count=s.player[field],noise=s.sounds.length;assert.equal((kind==='bottle'?M.bottle:throwSmoke)(s,reason==='invalid'?NaN:0),false,kind+'/'+reason);assert.equal(s.player[field],count);assert.equal(s.projectiles.length,0);assert.equal(s.sounds.length,noise);assert.ok(s.hint.length);}
});
test('All seven chapter starts can predict legal paths without changing active saves or objective state',()=>{
 for(const id of Object.keys(W.LEVELS)){const s=M.createGame(id),before=M.checkpoint(s);let valid=0;for(let i=0;i<12;i++)for(const kind of ['bottle','smoke']){const plan=predictThrow(s.player,i*Math.PI/6,kind);if(plan.valid){valid++;for(const q of plan.points)assert.ok(q.y>=W.heightAt(q.x,q.z)+.08-1e-8);}}assert.ok(valid>0,id);assert.equal(M.checkpoint(s),before);}
});
test('No new transient trajectory is serialized into old checkpoint schemas',()=>{
 const s=fixture();assert.ok(throwSmoke(s,0));const saved=M.checkpoint(s),r=M.restore(saved);assert.ok(r);assert.equal(saved.includes('trajectory'),false);assert.equal(r.player.smoke,0);assert.equal(r.projectiles.length,0);
});
test('Aim guide uses the actual plan, stows on pause/weapon changes, and reuses geometry buffers',()=>{
 const scene=new T.Scene(),guide=createThrowGuide(scene),s=fixture();s.player.survival=true;s.player.equipped='smoke';
 try{guide.update(s,true,Math.PI/2);const stat=guide.stats(),plan=predictThrow(s.player,Math.PI/2,'smoke');assert.ok(stat.visible&&stat.valid);assert.deepEqual(stat.landing,plan.path.to);const line=guide.root.children.find(o=>o.isLine&&!o.isLineSegments),pos=line.geometry.attributes.position,distances=line.geometry.attributes.lineDistance;
  for(let i=0;i<80;i++)guide.update(s,true,i*.03);assert.equal(line.geometry.attributes.position,pos);assert.equal(line.geometry.attributes.lineDistance,distances);assert.ok([...pos.array,...distances.array].every(Number.isFinite));assert.equal(stat.extraRenderTargets,0);
  guide.update(s,false,0);assert.equal(guide.stats().visible,false);s.player.equipped='rifle';guide.update(s,true,0);assert.equal(guide.stats().visible,false);s.player.equipped='smoke';s.player.smoke=0;guide.update(s,true,0);assert.ok(guide.stats().visible&&!guide.stats().valid);assert.match(guide.stats().reason,/No smoke/);s.player.waterMode='swim';guide.update(s,true,0);assert.equal(guide.stats().visible,false);
 }finally{guide.dispose();assert.equal(scene.children.length,0);}
});
