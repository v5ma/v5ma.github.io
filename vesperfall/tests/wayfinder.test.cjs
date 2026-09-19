'use strict';
const test=require('node:test'),a=require('node:assert/strict'),D=require('./pilgrimage-driver.cjs'),W=require('../wayfinder-model.js'),R=require('../returning-bell-model.js');
const {C,P,walk,path}=D;
test('Wrist objective names the required noncombat task at arrival',()=>{
 const s=C.create('BELL-01',1,{pilgrimage:{stage:0,tier:0}}),goal=W.goal(s,P,R);
 a.match(goal.text,/0\/2/);a.match(goal.detail,/Kills do not/);a.deepEqual(goal.point,s.world.pipeline.modules[0].targetPoint);a.equal(W.current(s,C,P,R),null);
});
test('Nearby winch accepts physical targeting but not through walls or with spoofed reach',()=>{
 const s=C.create('BELL-01',1,{pilgrimage:{stage:0,tier:0}}),m=s.world.pipeline.modules[0];path(s,[m.front,...m.paths.gallery.slice(1,3)]);walk(s,...[m.winch[0],m.winch[2]]);
 const c=W.current(s,C,P,R);a.equal(c.kind,'shutter');const p=C.add(s.p,[0,1.4,.2]),dir=C.unit(C.sub(c.point,p));
 a.equal(W.aimed(s,c,p,dir,C),true);a.equal(W.aimed(s,c,[900,1,900],dir,C),false);a.equal(W.aimed(s,c,p,dir,{...C,segmentBlocked:()=>true}),false);
 const signature=s.world.pipeline.signature;a.equal(C.interact(s),true);a.equal(s.pilgrimage.shutters[0],true);a.equal(s.world.pipeline.signature,signature);
});
test('Ready exit guidance and ordinary blessing preserve next-stage progression',()=>{
 const {s}=D.chapter('BELL-01',0,'gallery');a.match(W.goal(s,P,R).detail,/Ashen Archive/);a.equal(W.current(s,C,P,R),null);const n=C.reward(s,'power');a.equal(n.pilgrimage.stage,1);a.equal(n.sectors,1);a.match(W.goal(n,P,R).text,/archive lenses/);
});
test('Locked exit remains an informative interaction, not a win button',()=>{
 const s=C.create('BELL-01',1,{pilgrimage:{stage:0,tier:0}});
 for(const m of s.world.pipeline.modules){path(s,m.slot?s.world.pipeline.connector:[m.front]);path(s,m.paths.bypass.slice(1));}
 const exit=s.world.pipeline.controls.find(c=>c.kind==='exit');walk(s,exit.p[0],exit.p[2]);const c=W.current(s,C,P,R);a.equal(c.kind,'exit');a.match(W.status(s,c),/locked/);a.equal(C.interact(s),true);a.equal(s.phase,'playing');a.equal(s.sectors,0);
});

test('Older Endless exit keeps its warden requirement, not a relay requirement',()=>{
 const s=C.create('BELL-01',1);
 const c={kind:'exit',label:'Defeat the remaining wardens to open this exit'};
 a.equal(W.status(s,c),c.label);
});
