/* Pure rule/actor fixtures: not native input, hardware comfort, or enjoyment certification. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),C=require('../river/core'),D=C.DIFFICULTIES,fs=require('node:fs'),vm=require('node:vm');
function fixture(type,extra={},difficulty='easy'){
 const s=C.create('duck-armada',false,difficulty);s.mode='playing';s.cursor=s.timeline.length;s.time=1;
 s.entities=[{id:1,type,at:0,travel:10,start:[0,1.4,-1],end:[0,1.4,-1],r:.30,hp:1,maxHP:1,dead:false,hand:0,dir:0,...extra}];return s;
}
const swipe=s=>C.slice(s,1,{a:[0,1.65,-.35],b:[0,1.65,-1.5]},{a:[0,1.15,-.35],b:[0,1.15,-1.5]},.96,1.04);
for(const chapter of ['duck-armada','mothership'])test(chapter+': more pressure at each level, no red bolts and a real finale entrance',()=>{
 let last=0;
 for(const difficulty of D.ORDER){const s=C.create(chapter,true,difficulty),seen=new Map();s.mode='playing';
  for(let t=0;t<C.DURATION;t+=.05){C.advance(s,t);for(const n of s.entities){seen.set(n.id,n.type);A.notEqual(n.type,'bolt');if(t<C.BOSS_BEAT*C.BEAT)A.notEqual(n.type,'boss');}A.ok(s.entities.length<=80);A.ok(s.events.length<=100);}
  const pressure=[...seen.values()].filter(v=>['fruit','block','bomb'].includes(v)).length;A.ok(pressure>last,`${difficulty}: ${pressure} <= ${last}`);last=pressure;
  const boss=s.timeline.find(n=>n.type==='boss');A.equal(boss.at,C.BOSS_BEAT*C.BEAT);A.equal(s.entities.filter(n=>n.type==='boss').length,1);A.equal(s.bossDefeated,false);
  A.equal(s.timeline.filter(n=>n.type==='health').length,D.get(difficulty).healthBeats.length);
 }
});
for(const type of ['catapult','plane','fighter','boat'])test(type+': slow resident launches repeated fruit AND blocks, never bolts',()=>{
 for(const difficulty of D.ORDER){const s=fixture(type,{x:1.5,y:1.8,life:D.get(difficulty).lifeBeats*C.BEAT,volley:0,hp:4,maxHP:4},difficulty);s.time=0;let fruit=0,blocks=0,last=0;
  for(let t=0;t<D.get(difficulty).lifeBeats*C.BEAT;t+=.025){C.advance(s,t);for(const e of s.events){if(e.id<=last)continue;last=e.id;if(e.type==='throw'){if(e.kind==='fruit')fruit++;if(e.kind==='block')blocks++;A.notEqual(e.kind,'bolt');}}}
  A.ok(fruit>=2&&blocks>=1,`${difficulty} ${fruit}/${blocks}`);A.ok(D.get(difficulty).lifeBeats>10);
 }
});
for(const method of ['slice','laser','contact'])test('Health pickup by '+method+' heals once, never above 100',()=>{
 for(const initial of [40,95,100]){const s=fixture('health',{heal:30});s.health=initial;
  if(method==='slice'){A.equal(swipe(s),1);A.equal(swipe(s),0);}
  if(method==='laser'){A.ok(C.shoot(s,0,[0,1.4,0],[0,0,-1]));s.time+=.2;C.shoot(s,0,[0,1.4,0],[0,0,-1]);}
  if(method==='contact'){C.advance(s,1.05,[0,1.4,-1]);C.advance(s,1.1,[0,1.4,-1]);}
  A.equal(s.health,Math.min(100,initial+30));A.equal(s.stats.pickups,1);A.equal(s.stats.healed,Math.min(30,100-initial));A.equal(s.events.filter(e=>e.type==='heal').length,1);
 }
});
test('Expired health supplies are harmless; failed runs cannot heal back into life',()=>{
 const s=fixture('health',{travel:.5});s.health=35;C.advance(s,1.05,[4,1.4,0]);A.equal(s.health,35);A.equal(s.stats.pickups,0);
 const f=fixture('block',{start:[0,1.4,-.2],end:[0,1.4,.1]});f.health=2;f.entities.push({id:2,type:'health',at:0,travel:10,start:[0,1.4,0],end:[0,1.4,0],r:.3,heal:30,dead:false});C.advance(f,1.01,[0,1.4,0]);A.equal(f.mode,'failed');A.equal(f.health,0);A.equal(f.stats.pickups,0);
});
for(const type of ['block','bolt'])test(type+': actual blades, lasers and shields all work, with no invulnerable incoming shot',()=>{
 const s=fixture(type);A.equal(swipe(s),1);A.equal(s.stats.cutBlocks,1);
 const l=fixture(type);A.ok(C.shoot(l,0,[0,1.4,0],[0,0,-1]));A.ok(l.entities[0].dead);
 const b=fixture(type,{at:0,travel:2,start:[0,1.4,-2],end:[0,1.4,1]});b.time=.8;C.advance(b,1,[0,1.4,0],[{active:true,center:[0,1.4,-.7],normal:[0,0,-1],raised:.85,hand:0}]);A.equal(b.stats.blocks,1);A.equal(b.health,100);
});
test('Hard directions remain meaningful, but either blade earns a base cut in every mode',()=>{
 for(const difficulty of D.ORDER){const s=fixture('fruit',{},difficulty);A.equal(swipe(s),1);A.equal(s.stats.slices,1);}
 for(const difficulty of ['hard','ultra-hard']){const s=fixture('fruit',{dir:1},difficulty);A.equal(swipe(s),0);A.equal(s.stats.slices,0);}
});
test('Difficulty is immutable on the run and score keys cannot mix old or new profiles',()=>{
 const s=C.create('duck-armada',false,'hard');A.throws(()=>s.difficulty='easy',TypeError);A.equal(s.difficulty,'hard');
 const values={};for(const d of D.ORDER)values[`duck-armada/vr/${d}/arcade`]={score:17,wins:1};
 values['duck-armada/vr/arcade']={score:999,wins:7};A.equal(Object.keys(C.records(JSON.stringify(values))).length,4);A.notEqual(C.KEY,C.LEGACY_KEY);
});
test('Actual component rejects mid-battle difficulty changes instead of relabeling a score',()=>{
 let methods;const context={RiverCore:C,document:{getElementById:()=>({})},AFRAME:{registerComponent:(n,v)=>methods=v}};vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../river/app.js','utf8'),context);
 const g={...methods,state:C.create(),difficulty:'easy',busy:false,notice(){},sync(){}};g.setDifficulty('ultra-hard');A.equal(g.difficulty,'easy');g.state=null;g.setDifficulty('normal');A.equal(g.difficulty,'normal');g.busy=true;g.setDifficulty('hard');A.equal(g.difficulty,'normal');
});
for(const chapter of ['duck-armada','mothership'])for(const difficulty of D.ORDER)test(`${chapter}/${difficulty}: ordinary rule calls can complete the boss within the music`,()=>{
 const s=C.create(chapter,false,difficulty);s.mode='playing';
 for(let t=0;t<C.DURATION;t+=.025){C.advance(s,t,[0,1.4,0],[{active:true,center:[-.3,1.36,-.72],normal:[0,0,-1],raised:t-.1,hand:0},{active:true,center:[.3,1.36,-.72],normal:[0,0,-1],raised:t-.1,hand:1}]);
  for(const n of s.entities){const p=C.position(s,n);if(['fruit','block','health'].includes(n.type)&&p[2]>-1.5&&p[2]<-.6){const v=C.DIRS[n.dir]||C.DIRS[0],pose=a=>({a:[p[0]+v[0]*a,p[1]+v[1]*a,-.35],b:[p[0]+v[0]*a,p[1]+v[1]*a,-1.6]});C.slice(s,n.hand||0,pose(-.2),pose(.2),t-.04,t+.04);}if(n.type==='boss'&&C.open(s,n))for(const h of [0,1])C.shoot(s,h,[0,1.4,0],[p[0],p[1]-1.4,p[2]]);}
 }
 C.advance(s,C.DURATION);A.equal(s.mode,'complete');A.ok(s.bossDefeated);A.ok(s.stats.slices>10);A.ok(s.stats.bossDamage>0);A.equal(C.result(s).difficulty,difficulty);
});
