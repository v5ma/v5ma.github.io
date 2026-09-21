import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from './vendor/three.module.js';
import {hideTrackedSources} from './xr-session-cleanup.mjs';
test('Ending tracking hides both rays, grips and all hand joints without disposing them',()=>{
 const slots=[0,1].map(()=>({ray:new T.Group(),grip:new T.Group(),joints:Array.from({length:25},()=>new T.Group()),source:{handedness:'left'},pinch:true}));
 const ui=new T.Group();for(const s of slots)ui.add(s.ray,s.grip,...s.joints);
 hideTrackedSources(slots);
 for(const s of slots){assert.equal(s.source,null);assert.equal(s.pinch,false);for(const o of [s.ray,s.grip,...s.joints]){assert.equal(o.visible,false);assert.equal(o.parent,ui);}}
});
test('End cleanup is idempotent and does not change scene transforms or external ledgers',()=>{
 const ray=new T.Group();ray.position.set(1,2,3);const slot={ray,grip:new T.Group(),joints:[],source:{},pinch:true,ledger:Object.freeze({credits:180})};
 hideTrackedSources([slot]);hideTrackedSources([slot]);assert.deepEqual(ray.position.toArray(),[1,2,3]);assert.equal(slot.ledger.credits,180);
});
test('Unified session cleanup clears old viewers and rows before returning to desktop',()=>{
 const s=readFileSync(new URL('./unified-xr.mjs',import.meta.url),'utf8');assert.ok(s.includes("import {hideTrackedSources} from './xr-session-cleanup.mjs'"));assert.ok(s.includes('clear();hideTrackedSources(slots);viewer=null;rows=[];rootBefore=null;lastPaint=0;last=0;'));
});
test('Browser exit waits for session end rather than demanding more XR frames',()=>{
 const s=readFileSync(new URL('./console-browser.py',import.meta.url),'utf8');assert.ok(s.includes("if expect_exit:await wait('!NeighborhoodMissions.inspect().xr.active')"));assert.ok(s.includes('if not expect_exit:await frames(4)'));assert.ok(s.includes("await trigger(row.get('id')=='xr-exit')"));assert.ok(s.includes("q['xr']['visibleRays']==0"));
});
