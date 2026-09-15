import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyEconomy,sanitizeEconomy,ECONOMY_KEY} from '../frontier-economy-core.js';
test('All existing paid mission IDs survive save/reload without granting new credits',()=>{
 const ids=['ranch:school','aaa:storm-response','aaa:living-herds','aaa:pelagic-recovery'];
 const s=emptyEconomy();s.rewardLedger=[...ids,ids[2],'other:untrusted',null,42];s.credits=5250;s.cargo.rations=3;
 const restored=sanitizeEconomy(JSON.parse(JSON.stringify(sanitizeEconomy(s))));
 assert.deepEqual(restored.rewardLedger,ids);assert.equal(restored.credits,5250);assert.equal(restored.cargo.rations,3);
 assert.equal(restored.version,1);assert.equal(ECONOMY_KEY,'dino-atlas.market.v1');
 for(const id of ids)assert.ok(restored.rewardLedger.includes(id),'The existing grant guard must see '+id);
});
