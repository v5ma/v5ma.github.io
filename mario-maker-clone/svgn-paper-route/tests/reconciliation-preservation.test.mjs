// Frozen v0.27 document contracts: the recovery changes one optional receiver,
// not the road, the other six curves or the newer twelve-delivery intention ledger.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {build} from '../waterwheel-layout-core.mjs';
const require=createRequire(import.meta.url),{T}=require('../../../tests/helpers/flow-fixture.cjs');
const document=build(T),hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
test('Canal recovery preserves the existing ground, targets, checkpoints and encounter placement',()=>{
 const ground=Object.fromEntries(Object.entries(document).filter(([key])=>!['ct','gp'].includes(key)));
 assert.equal(hash(ground),'384972b5f93b4acd128a68b0f00933c9ccd2d412eb4222de0e384d989267f3bd');
});
test('The unrelated six rail curves retain their v0.27 geometry and stable identities',()=>{
 assert.equal(document.ct.length,7);
 assert.equal(hash(document.ct.filter(rail=>rail.sky.id!=='ww-collector')),'ba607c0dfa2798bbe5783bad777fb334c9a4fa7d315e23249d1761c1dac6f8fe');
});
test('The latest twelve-delivery intention ledger is retained rather than the older branch wording',()=>{
 assert.equal(hash(document.gp.waterwheel.deliveries),'71e10e67b04b092d9a284c1159a66a7873569ac3d63fbb0e5e97b8971951fd18');
});
