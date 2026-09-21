'use strict';
const test=require('node:test'),a=require('node:assert/strict'),M=require('../threshold-model.js');
function run(points){const c=new M.Crossing();return points.map(p=>c.update(p));}
function path(x=0,y=1.65){return [1.25,1,.75,.5,.25,.08,-.06,-.2,-.35].map(z=>[x,y,z]);}
test('A forward continuous viewer crossing fires exactly once',()=>a.equal(run(path()).filter(Boolean).length,1));
test('The doorway never activates from spawning behind it',()=>a.equal(run([[-0.1,1.65,-.1],[0,1.65,-.3]]).some(Boolean),false));
test('A teleport-sized discontinuity is not a walking crossing',()=>a.equal(run([[0,1.65,1],[0,1.65,.8],[0,1.65,-.8]]).some(Boolean),false));
test('The arch sides and lintel reject outside passage',()=>{for(const p of[path(.7),path(0,.3),path(0,2.6)])a.equal(run(p).some(Boolean),false);});
test('Walking away from the doorway is not forward traversal',()=>a.equal(run(path().reverse()).some(Boolean),false));
test('Grazing the plane then stepping back does not fire',()=>a.equal(run([[0,1.65,.8],[0,1.65,.5],[0,1.65,.15],[0,1.65,-.06],[0,1.65,.2],[0,1.65,.4]]).some(Boolean),false));
test('Tracking loss resets rather than joining unrelated positions',()=>{const c=new M.Crossing();path().slice(0,6).forEach(p=>c.update(p));c.update(null,false);a.equal(c.update([0,1.65,-.4]),false);});
test('A new explicit doorway rearms an already consumed crossing',()=>{const c=new M.Crossing();a.equal(path().map(p=>c.update(p)).filter(Boolean).length,1);a.equal(path().map(p=>c.update(p)).some(Boolean),false);c.reset();a.equal(path().map(p=>c.update(p)).filter(Boolean).length,1);});
test('Desk preferences are bounded and malformed saved data is safe',()=>{a.deepEqual(M.settings(null),M.settings());a.deepEqual(M.settings({height:99,scale:-1,distance:Infinity,angle:999}),{height:1.65,scale:.75,distance:1.8,angle:.6});});
