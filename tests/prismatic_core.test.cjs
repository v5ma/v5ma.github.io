const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../mario-maker-clone/svgn-paper-route/prismatic-core.js');
test('Crystal geometry is finite, flat-faceted and closed with unit face normals',()=>{
 const d=P.diamond(),edges=new Map();assert.equal(d.positions.length,d.normals.length);assert.ok(d.positions.every(Number.isFinite));
 const key=v=>v.map(a=>a.toFixed(7)).join(',');
 for(let i=0;i<d.positions.length;i+=9){const a=d.positions.slice(i,i+3),b=d.positions.slice(i+3,i+6),c=d.positions.slice(i+6,i+9);assert.ok(Math.abs(Math.hypot(...d.normals.slice(i,i+3))-1)<1e-6);for(const [u,v]of[[a,b],[b,c],[c,a]]){const k=[key(u),key(v)].sort().join('|');edges.set(k,(edges.get(k)||0)+1);}}
 assert.ok([...edges.values()].every(n=>n===2));assert.throws(()=>P.diamond(200),RangeError);
});
test('Fascia strips follow the input path without mutating collisions',()=>{const points=[[10,20],[60,-20],[60,-20],[90,10]],before=JSON.stringify(points);const r=P.ribbon(points);assert.equal(JSON.stringify(points),before);assert.equal(r.positions.length,36);assert.equal(r.uv.length,24);assert.ok(r.positions.every(Number.isFinite));assert.equal(P.ribbon([]).positions.length,0);});
test('Particle simulation is bounded and never advances on a frozen frame',()=>{const p=new P.Particles();for(let i=0;i<100;i++)p.burst(0,0,0,30,[1,.5,0]);assert.equal(p.items.length,P.LIMITS.particles);const before=JSON.stringify(p.items);p.advance(0);assert.equal(JSON.stringify(p.items),before);for(let i=0;i<50;i++)p.advance(2);assert.equal(p.items.length,0);});
test('Invalid preferences safely normalize; classic and reduced options survive',()=>{assert.equal(P.preferences(null).look,'prismatic');assert.equal(P.preferences({look:'<script>'}).look,'prismatic');assert.deepEqual(P.preferences({look:'classic',motion:false,glow:false}),{look:'classic',motion:false,glow:false});});
test('Procedural accent randomness does not consume the gameplay Math.random stream',()=>{const a=new P.Particles(),b=new P.Particles();a.burst(1,2,3,10,[1,1,1]);b.burst(1,2,3,10,[1,1,1]);assert.deepEqual(a.items,b.items);const text=fs.readFileSync(require.resolve('../mario-maker-clone/svgn-paper-route/prismatic-renderer.js'),'utf8');assert.ok(!text.includes('Math.random('));assert.ok(!/player\.\w+\s*=(?!=)/.test(text));});
