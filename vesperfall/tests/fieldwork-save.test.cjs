/* Explicit audio-state unit fixture; not an end-to-end actor-state shortcut. */
'use strict';
const test=require('node:test'),a=require('node:assert/strict'),C=require('../core.js'),S=require('../pilgrim-save.js');
test('Near-miss audio metadata cannot prevent saving live enemy projectiles',()=>{
 const s=C.create('BELL-01',2,{pilgrimage:{stage:1,tier:0}});
 const bolt={p:[0,1.65,2],v:[0,0,-4],life:1,kind:'cantor',soundPassed:true};
 s.bolts.push(bolt);
 const cp=S.capture(s,{id:'audio-contract-fixture',banked:0,receipt:{},yaw:0,pitch:0,focus:1});
 a.equal(bolt.soundPassed,true);a.equal(Object.hasOwn(cp.state.bolts[0],'soundPassed'),false);
 const restored=S.restore(cp).game;
 for(const k of['p','v','life','kind'])a.deepEqual(restored.bolts[0][k],bolt[k]);
 cp.state.bolts[0].unexpectedGameplayField=true;
 a.throws(()=>S.restore(cp),/Unrecognized save field/);
});
