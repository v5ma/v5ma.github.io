/* Actual game rules and input-edge contracts; these fixtures are not a headset. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),C=require('../river/core'),X=require('../river/xr'),fs=require('node:fs');
function target(type='fruit',hand=0,difficulty='easy',combo=0){
 const s=C.create('duck-armada',false,difficulty);s.mode='playing';s.time=1;s.combo=combo;s.cursor=s.timeline.length;
 s.entities=[{id:1,type,at:0,travel:10,start:[0,1.4,-1],end:[0,1.4,-1],r:.3,hp:1,maxHP:1,dead:false,hand,dir:0,heal:30}];return s;
}
function cut(s,hand=0,up=false){return C.slice(s,hand,{a:[0,up?1.15:1.95,-.35],b:[0,up?1.15:1.95,-1.5]},{a:[0,up?1.95:1.15,-.35],b:[0,up?1.95:1.15,-1.5]},.96,1.04);}
test('Each encounter owns independent left/right colors and immutable named symbols',()=>{
 const a=C.create(),b=C.create();A.deepEqual(a.bladeColors,[0,1]);A.notEqual(a.bladeColors,b.bladeColors);A.ok(Object.isFrozen(C.PALETTES));A.ok(C.PALETTES.every(Object.isFrozen));A.deepEqual(C.PALETTES.map(p=>p.symbol),['O','<>']);
});
test('Color switching is a zero-cost playing-only hand action, not a score or resume operation',()=>{
 for(const phase of ['ready','paused','failed','complete']){const s=C.create();s.mode=phase;A.equal(C.cycleColor(s,0),false);A.deepEqual(s.bladeColors,[0,1]);}
 const s=target();const before=C.result(s),entities=JSON.stringify(s.entities);for(const h of [-1,2,NaN,'0'])A.equal(C.cycleColor(s,h),false);
 A.ok(C.cycleColor(s,0));A.deepEqual(s.bladeColors,[1,1]);A.deepEqual(C.result(s),before);A.equal(JSON.stringify(s.entities),entities);A.equal(s.events[0].type,'blade-color');A.equal(s.events[0].hand,0);
 A.ok(C.cycleColor(s,1));A.deepEqual(s.bladeColors,[1,0]);A.ok(C.cycleColor(s,0));A.deepEqual(s.bladeColors,[0,0]);
});
for(const difficulty of C.DIFFICULTIES.ORDER)test(difficulty+': either physical hand earns the exact base; a color match only adds a bonus',()=>{
 for(const h of [0,1])for(const palette of [0,1]){
  const s=target('fruit',palette,difficulty);s.bladeColors[h]=1-palette;A.equal(cut(s,h),1);A.equal(s.score,120);A.equal(s.stats.colorBonus,0);A.equal(s.stats.slices,1);
  const match=target('fruit',palette,difficulty);match.bladeColors[h]=palette;A.equal(cut(match,h),1);A.equal(match.score,160);A.equal(match.stats.colorMatches,1);A.equal(match.stats.colorBonus,40);
  const e=match.events.at(-1);A.equal(e.basePoints+e.bonusPoints,e.points);A.equal(e.points,match.score);A.equal(e.hand,h);A.equal(e.matched,true);A.equal(cut(match,h),0);A.equal(match.score,160);
 }
});
test('Combo tiers multiply base and bonus independently without incrementing combo twice',()=>{
 for(const combo of [0,7,15,23,32]){
  const s=target('fruit',0,'easy',combo),m=1+Math.min(3,Math.floor((combo+1)/8))*.25;cut(s);A.equal(s.combo,combo+1);A.equal(s.score,Math.round(120*m)+Math.round(40*m));A.equal(s.stats.colorBonus,Math.round(40*m));
 }
});
test('Matching color does not bypass Hard direction or physical swing validity',()=>{
 const wrong=target('fruit',0,'hard');A.equal(cut(wrong,0,true),0);A.equal(wrong.score,0);A.equal(wrong.stats.colorMatches,0);
 const still=target();A.equal(C.slice(still,0,{a:[0,1.4,0],b:[0,1.4,-1]},{a:[0,1.4,0],b:[0,1.4,-1]},.9,1),0);A.equal(still.score,0);
});
test('Lasers retain original fruit points and carry actual firing-hand feedback, never a cut bonus',()=>{
 const s=target('fruit',0);A.ok(C.shoot(s,1,[0,1.62,0],[0,0,-1]));A.equal(s.score,120);A.equal(s.stats.colorMatches,0);A.equal(s.events.at(-1).hand,1);A.equal(s.events.at(-1).bonusPoints,0);
});
test('Blocks, health cases and spiked bombs retain their original interactions with either palette',()=>{
 const block=target('block');cut(block);A.equal(block.score,180);A.equal(block.stats.colorMatches,0);
 const supply=target('health');supply.health=60;cut(supply);A.equal(supply.health,90);A.equal(supply.score,50);A.equal(supply.stats.colorBonus,0);
 const bomb=target('bomb');cut(bomb);A.equal(bomb.health,92);A.equal(bomb.score,0);A.equal(bomb.stats.colorMatches,0);
});
test('Color Match records are isolated; previous difficulty scores retain their exact parser and namespace',()=>{
 A.equal(C.PACING_KEY,'prism-current.river.pacing.records.v1');A.equal(C.KEY,'prism-current.river.chromatic.records.v1');A.notEqual(C.KEY,C.LEGACY_KEY);
 const previous='{"duck-armada/ar/easy/arcade":{"score":18000,"wins":3}}';A.deepEqual(C.records(previous),{'duck-armada/ar/easy/arcade':{score:18000,wins:3}});
 const app=fs.readFileSync(__dirname+'/../river/app.js','utf8');A.match(app,/localStorage.getItem\(C.PACING_KEY\)/);A.doesNotMatch(app,/localStorage.(?:setItem|removeItem)\(C.PACING_KEY/);
});
test('XR color edge excludes held input, new sources, lost tracking and menu-to-play transitions',()=>{
 const old={playing:true,tracked:true,btn:[false,false,false,false,false,false]},down=[false,false,false,false,true,false];
 A.equal(X.colorEdge('playing',old,down),true);
 for(const changed of [null,{...old,playing:false},{...old,tracked:false},{...old,btn:down}])A.equal(X.colorEdge('playing',changed,down),false);
 A.equal(X.colorEdge('paused',old,down),false);A.equal(X.colorEdge('playing',old,down,false),false);A.equal(X.colorEdge('playing',old,[]),false);
});
test('The actual XR, pad and keyboard paths feed distinct gameplay color changes',()=>{
 const app=fs.readFileSync(__dirname+'/../river/app.js','utf8'),xr=fs.readFileSync(__dirname+'/../river/xr.js','utf8');
 A.match(xr,/swapColor:colorEdge\(g.phase,old,btn\)/);A.match(xr,/tracked:!src.hand&&!!pose&&!pose.emulatedPosition/);
 A.match(app,/if\(hand.swapColor\)C.cycleColor\(this.state,h\)/);A.match(app,/swapColor:\[edge\[10\],edge\[11\]\]/);A.match(app,/e.code==='Digit1'\|\|e.code==='Digit2'/);
 A.match(app,/t-this.lastTime>\.35/);A.match(app,/if\(edge\[0\]\)this.slash\(0\);if\(edge\[2\]\)this.slash\(1\)/);
});
