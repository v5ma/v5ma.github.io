// Isolated test-harness checks, not a game playthrough or physical-device test.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./waterwheel-deliveries-browser.py',import.meta.url),'utf8');
const start=source.indexOf("approach=page.evaluate('''")+"approach=page.evaluate('''".length;
const callback=source.slice(start,source.indexOf("''',target)",start));
function fixture(onGround=true){
 let frame=0;const queue=[],events=[];
 const player=Object.freeze({x:100,w:26,y:200,vx:8,onGround});
 const buttons=new Proxy([],{set(target,key,value){events.push({frame,kind:'pad',key,pressed:value.pressed});target[key]=value;return true;}});
 const context=vm.createContext({player,testPad:{buttons},performance:{now:()=>frame*16},requestAnimationFrame:fn=>queue.push(fn),window:{dispatchEvent:e=>events.push({frame,kind:e.type,code:e.code})},KeyboardEvent:class{constructor(type,values){this.type=type;Object.assign(this,values);}}});
 const run=vm.runInContext(callback,context)(250);
 const pump=()=>{while(queue.length&&frame<1100){frame++;queue.shift()();}};
 return {player,events,run,pump};
}
test('Acceptance coasts four frames then holds the actual sampled B input for two',async()=>{
 const f=fixture();f.pump();const result=await f.run;
 assert.equal(result.distance,137);assert.equal(result.vx,8);
 assert.deepEqual(f.events,[{frame:0,kind:'keyup',code:'KeyD'},{frame:4,kind:'pad',key:'1',pressed:true},{frame:6,kind:'pad',key:'1',pressed:false}]);
 assert.equal(f.player.x,100);assert.equal(f.player.vx,8);
});
test('Acceptance rejects missing ground/approach without assigning a position or firing',async()=>{
 const f=fixture(false);const rejected=assert.rejects(f.run,/No ordinary forward throw window/);f.pump();await rejected;assert.deepEqual(f.events,[]);assert.equal(f.player.x,100);
});
test('Unobstructed controller playtest still requires the real B menu shortcut',()=>{
 const s=readFileSync(new URL('./xr-workspace-browser.py',import.meta.url),'utf8');
 assert(s.includes("press(5);page.wait_for_function('__delivery.paused && SkyCycleFlightDeck.topPanel()')"));
 assert(s.includes("!SkyCycleXR.diagnostics.uiVisible"));
});
