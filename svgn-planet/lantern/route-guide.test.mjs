import {test} from 'node:test';import assert from 'node:assert/strict';
import {fresh,serialize,parse,tick,action} from './core.mjs';
import {trackStory,storyTarget} from './city.mjs';
import {routeGuide,walkLink} from './route-guide.mjs';
import {navigation} from './navigation.mjs';
for(const story of ['press','kitchen','water','radio','garden','letters','lamps','watch'])test('Suggested '+story+' approach uses supported collision-clear floor segments and never accepts the task',()=>{
 const s=fresh();trackStory(s,story);const before=serialize(s),t=storyTarget(s),g=routeGuide(s,t);assert.ok(g.path.length>=2,story);
 for(let i=1;i<g.path.length;i++)assert.ok(walkLink(s,g.path[i-1],g.path[i]),story+' / '+g.path[i].label);
 assert.deepEqual(serialize(s),before);assert.deepEqual(g.target,t);
});
test('Radio cue leads to a public stair instead of pointing through the loft wall',()=>{const s=fresh();trackStory(s,'radio');const n=navigation(s);assert.equal(n.level,'UPSTAIRS');assert.ok(n.guide.path.some(p=>p.label.includes('stair')));assert.notDeepEqual(n.guide.cue,n.target);});
test('Bicycle guidance explains the stairs require dismounting without changing the ride',()=>{const s=fresh();action(s,'ride');trackStory(s,'radio');const g=routeGuide(s,storyTarget(s));assert.equal(s.ride,'bicycle');assert.equal(g.status,'dismount');assert.match(g.hint,/Dismount/);});
test('A closed blue door routes return travel around it; opening it preserves the shorter learned connection',()=>{
 const s={...fresh(),x:6,y:0,z:18};const t={label:'Depot return',x:-12,y:0,z:15};let g=routeGuide(s,t);const before=g.remaining;assert.ok(g.path.length>2);s.gate=true;g=routeGuide(s,t);assert.ok(g.remaining<before);assert.ok(g.remaining<20);assert.equal(s.credits,0);
});
test('High water never promises a walk through the channel; draining exposes the real bed and steps',()=>{
 const s=fresh();const a={x:-.5,y:-2,z:5},b={x:-.5,y:-2,z:-7};assert.equal(walkLink(s,a,b),false);s.water='low';assert.equal(walkLink(s,a,b),true);
 s.x=5.8;s.z=-13;trackStory(s,'water');s.city.progress.water=0;const g=routeGuide(s,storyTarget(s));assert.ok(g.path.some(p=>p.y<0));assert.ok(g.path.length>1);
});
test('Boarded skiff guidance goes to a real pier rather than drawing a walking route over the canal edge',()=>{const s={...fresh(),ride:'boat',x:-.5,y:-.72,z:5};const g=routeGuide(s,{label:'Greenhouse',x:18,y:0,z:-17});assert.equal(g.status,'dock');assert.equal(g.cue.z,-11.5);assert.match(g.hint,/dock/);});
test('Arrival requires the correct elevation and a clear sightline; no remote completion is awarded',()=>{
 const s=fresh(),t={label:'Nearby work',x:s.x,y:0,z:s.z-.4};assert.equal(routeGuide(s,t).status,'nearby');assert.notEqual(routeGuide(s,{...t,y:4.4}).status,'nearby');assert.equal(s.claimed,false);
});
test('No mission means no invented waypoint; unreachable unknown geometry falls back honestly',()=>{const s=fresh();assert.equal(routeGuide(s,null).cue,null);assert.equal(routeGuide(s,{label:'Unknown',x:200,y:20,z:100}).status,'explore');});
for(const story of ['press','radio','kitchen'])test('Fresh '+story+' route is traversed with real tick inputs and normal interaction',()=>{
 const s=fresh();trackStory(s,story);let reached=false;
 for(let i=0;i<12000;i++){
  const t=storyTarget(s),g=routeGuide(s,t);if(g.status==='nearby'){action(s,'interact');reached=s.city.progress[story]===0;break;}
  assert.ok(g.cue,'Missing cue '+JSON.stringify({x:s.x,y:s.y,z:s.z,g}));
  const dx=g.cue.x-s.x,dz=g.cue.z-s.z,d=Math.hypot(dx,dz),u=Math.min(1,d/.6);
  tick(s,{x:d?dx/d*u:0,z:d?dz/d*u:0},1/60);
 }
 assert.ok(reached,JSON.stringify({x:s.x,y:s.y,z:s.z,story}));assert.equal(s.city.credits,0);assert.equal(s.credits,0);
});
for(const [story,reward]of [['press',90],['radio',100],['kitchen',80],['garden',100],['letters',95]])test('Complete '+story+' via normal movement and interactions, then preserve exactly-once reward on reload',()=>{
 const s=fresh();trackStory(s,story);
 for(let i=0;i<24000&&!s.city.completed.includes(story);i++){
  const g=routeGuide(s,storyTarget(s));
  if(g.status==='nearby'){action(s,'interact');continue;}
  assert.ok(g.cue,'No suggested entrance for '+story);
  const dx=g.cue.x-s.x,dz=g.cue.z-s.z,d=Math.hypot(dx,dz),u=Math.min(1,d/.6);
  tick(s,{x:d?dx/d*u:0,z:d?dz/d*u:0},1/60);
 }
 assert.ok(s.city.completed.includes(story));assert.equal(s.city.credits,reward);assert.equal(s.credits,0);
 assert.ok(s.distance<250,'Must not oscillate at a landing');
 const restored=parse(JSON.parse(JSON.stringify(serialize(s))));
 action(restored,'interact');assert.equal(restored.city.credits,reward);assert.equal(restored.credits,0);
});
test('Guidance crosses the supported arcade landing while descending, instead of redirecting back upstairs',()=>{
 const s={...fresh(),x:-18.5,y:4.4,z:-4.46};
 const g=routeGuide(s,{label:'Replacement type case',x:-9,y:0,z:-17});
 assert.ok(g.cue.z<-5);assert.ok(walkLink(s,s,g.cue));
});
