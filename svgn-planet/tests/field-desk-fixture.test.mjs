import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';
test('Floor fixture preserves the synthetic session and local reference objects',async()=>{
 const session={requestReferenceSpace:async type=>({type})};
 const context=createContext({navigator:{xr:{requestSession:async()=>session}}});
 new Script(readFileSync(new URL('./field-desk-fixture.js',import.meta.url),'utf8')).runInContext(context);
 const actual=await context.navigator.xr.requestSession('immersive-ar');assert.equal(actual,session);
 const floor=await actual.requestReferenceSpace('local-floor');assert.equal(floor.pose.position.y,-1.65);
 const local=await actual.requestReferenceSpace('local');assert.equal(local.pose,undefined);
});
