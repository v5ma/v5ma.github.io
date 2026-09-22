/* Isolated deterministic fixtures. No claim of headset/device approval. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('../field-kit-model.js'),C=require('../core.js');
const trace=[{t:0,p:[.49,1.009999976158142,-.06879999680519333]},
 {t:.1167,p:[.519175,1.0391749761581413,-.4188999968051846]},
 {t:.28,p:[.56,1.079999976158142,-.9087999968051934]}];
function world(){const s=C.create('KIT-READABILITY',1,{pilgrimage:{stage:0,tier:0}});s.head=C.add(s.p,[0,1.65,0]);return s;}
test('The retained public three-frame throw resolves the genuine sampled velocity',()=>{
 const m=new K.Motion();for(const f of trace.slice(0,-1))m.sample(f.p,f.t);
 const v=m.release(trace.at(-1).p,trace.at(-1).t);assert.ok(v,'The clear low-sample throw must not be silently stowed');
 for(const [i,x] of [.25,.25,-3].entries())assert.ok(Math.abs(v[i]-x)<1e-6);
});
test('The same deliberate stroke works at 8, 12, 36, 72 and 90 samples per second',()=>{
 for(const hz of [8,12,36,72,90]){const m=new K.Motion();for(let t=0;t<.28;t+=1/hz)m.sample([.4,1+t*.25,-t*3],t);
  const v=m.release([.4,1.07,-.84],.28);assert.ok(v,'rate '+hz);assert.ok(Math.abs(v[2]+3)<1e-8);}
});
test('Sparse throws still reject stationary drops, timestamp reversal, stale gaps and tracking jumps',()=>{
 const cases=[[[0,1,0],0,[0,1,0],.17],[[0,1,0],.2,[0,1,-.3],.1],[[0,1,0],0,[0,1,-.9],.7],[[0,1,0],0,[0,1,-3],.12]];
 for(const [a,t,b,u]of cases){const m=new K.Motion();m.sample(a,t);assert.equal(m.release(b,u),null);}
});
test('A two-sample slow release or small hand tremor does not spend a throw',()=>{
 for(const p of [[.01,1,0],[0,1,-.07]]){const m=new K.Motion();m.sample([0,1,0],0);assert.equal(m.release(p,.2),null);}
});
test('Visible field supplies explain their value before entering grip range',()=>{
 const s=world(),target=K.center(K.anchors(s)[0]),d=C.unit(C.sub(target,s.head));
 const h=K.hint(s,s.head,d,C);assert.equal(h.id,0);assert.ok(h.distance>1.8);assert.match(h.text,/Approach/);assert.match(h.label,/Ilyra/);
});
test('Cache hints never expose a cache behind masonry or another floor',()=>{
 for(const barrier of ['wall','floor']){const s=world(),target=K.center(K.anchors(s)[0]),d=C.unit(C.sub(target,s.head));
 if(barrier==='wall')s.world.solids.push({min:[.5,0,18],max:[.7,3,22]});
 else s.world.floors.push({x:1,z:19.5,w:8,d:8,y:1.1,type:'stone'});
 assert.equal(K.hint(s,s.head,d,C),null);}
});
test('Looking away, leaving the eight-metre range or emptying a cache removes the hint',()=>{
 for(const reason of ['away','far','empty']){const s=world(),target=K.center(K.anchors(s)[0]);if(reason==='far')s.head[2]+=10;if(reason==='empty')s.fieldkit.caches[0]=2;
 const d=reason==='away'?[0,0,1]:C.unit(C.sub(target,s.head));assert.equal(K.hint(s,s.head,d,C),null);}
});
test('A full satchel is described without granting or erasing anything',()=>{
 const s=world();s.fieldkit.stock={mend:3,frost:3};const before=JSON.stringify(s.fieldkit),p=K.center(K.anchors(s)[0]);
 assert.match(K.hint(s,s.head,C.unit(C.sub(p,s.head)),C).text,/full/i);assert.equal(JSON.stringify(s.fieldkit),before);
});
test('Close cache feedback reports usable stock and both existing interaction alternatives',()=>{
 const s=world();s.head=[.4,1,19.7];const p=K.center(K.anchors(s)[0]);
 const h=K.hint(s,s.head,C.unit(C.sub(p,s.head)),C);assert.match(h.text,/Grip/);assert.match(h.text,/frost/);assert.match(h.text,/healing/);
});
