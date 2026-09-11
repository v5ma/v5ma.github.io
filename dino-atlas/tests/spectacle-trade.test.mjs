import test from 'node:test';
import assert from 'node:assert/strict';
import * as base from '../frontier-data.js';
import {SPECIES,ALL_ANIMALS,BONUS_SPECIES,LIBRARY_TOTAL,sanitizeFrontier,operations} from '../frontier-data-expanded.js';
import {GOODS,MARKET_IDS,emptyEconomy,sanitizeEconomy,cargoUsed,priceFor,buy,sell,advanceMarket,acceptContract,completeContract} from '../frontier-economy-core.js';

test('expanded library preserves the original residents and reaches 30 species / 64 animals',()=>{
 assert.equal(base.SPECIES.length,14);assert.equal(base.ALL_ANIMALS.length,40);assert.equal(BONUS_SPECIES.length,16);assert.equal(LIBRARY_TOTAL,30);assert.equal(SPECIES.length,30);assert.equal(ALL_ANIMALS.length,64);
 assert.deepEqual(ALL_ANIMALS.slice(0,40).map(a=>a.uid),base.ALL_ANIMALS.map(a=>a.uid));
 assert.equal(new Set(ALL_ANIMALS.map(a=>a.uid)).size,64);
});

test('expanded observations survive sanitization and the survey operation uses the new total',()=>{
 const raw=base.emptyFrontier();raw.observed=['diplodocus','corythosaurus','deinonychus','not-a-species'];const s=sanitizeFrontier(raw);assert.deepEqual(s.observed,['diplodocus','corythosaurus','deinonychus']);const survey=operations(s).find(o=>o.id==='species');assert.equal(survey.total,30);assert.equal(survey.done,3);
});

test('market contains only ordinary park, research, food and mycology supplies',()=>{
 assert.equal(GOODS.length,12);const text=GOODS.map(g=>`${g.id} ${g.name} ${g.detail}`).join(' ').toLowerCase();for(const banned of ['cocaine','heroin','ludes','quaalude','speed','methamphetamine'])assert.equal(text.includes(banned),false);assert.equal(text.includes('mushroom'),true);
});

test('outpost prices vary and market state remains bounded',()=>{
 const g='battery-cells',prices=MARKET_IDS.map(id=>priceFor(g,id,3,.3));assert.ok(new Set(prices).size>2);assert.notEqual(priceFor(g,'north',3,.3),priceFor(g,'north',11,.3));const s=sanitizeEconomy({version:1,credits:1e12,capacity:999,tick:-5,cargo:{'battery-cells':999}});assert.equal(s.credits,9999999);assert.equal(s.capacity,80);assert.equal(s.tick,0);assert.equal(s.cargo['battery-cells'],99);
});

test('buying, selling, cargo capacity and price shifts form a trade loop',()=>{
 const s=emptyEconomy(),before=s.credits,r=buy(s,'rations','base',2);assert.equal(r.ok,true);assert.equal(s.cargo.rations,2);assert.equal(cargoUsed(s),2);const afterBuy=s.credits;assert.ok(afterBuy<before);const sold=sell(s,'rations','redwood',1);assert.equal(sold.ok,true);assert.equal(s.cargo.rations,1);assert.ok(s.credits>afterBuy);const p=priceFor('rations','base',s.tick,s.rivalPressure.base);advanceMarket(s,3);assert.notEqual(priceFor('rations','base',s.tick,s.rivalPressure.base),p);
});

test('delivery contracts consume cargo and pay a completion reward',()=>{
 const s=emptyEconomy();const accepted=acceptContract(s,'base');assert.equal(accepted.ok,true);const c=s.activeContract;s.cargo[c.good]=c.qty;const before=s.credits,done=completeContract(s,c.to);assert.equal(done.ok,true);assert.equal(s.activeContract,null);assert.equal(s.completed,1);assert.equal(s.cargo[c.good]||0,0);assert.equal(s.credits,before+c.reward);
});
