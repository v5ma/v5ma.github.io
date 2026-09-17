/* Isolated production-handler fixture; not native XR or physical hardware. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../xr-play.js',import.meta.url),'utf8');
function handler(name,next){
 const begin=source.indexOf(`function ${name}(`),end=source.indexOf(`function ${next}(`,begin);
 assert(begin>=0&&end>begin);return source.slice(begin,end);
}
function fixture(){
 const log=[],delivery={state:{menu:false},paused:false,act(action){log.push(action);if(action==='pause')this.paused=true;}};
 const c=vm.createContext({window:{__delivery:delivery},__delivery:delivery,log});
 vm.runInContext(`let presenting=true,held=new Set(['right']),presses=new Map(),suppressed=new Set(),ctxDown=false,neutral=false,lastUI=42,lastFrame=null;
 let target={action:'pause'},generation=null;
 const panel=()=>generation,fd=()=>({resetInput(){log.push('release');}}),hit=()=>target;
 ${handler('release','pause')}${handler('pause','disposeObject')}${handler('selectStart','selectEnd')}${handler('selectEnd','frame')}
 globalThis.api={start:selectStart,end:selectEnd,setup(action,p=null,active=true){target={action};generation=p;presenting=active;},snapshot(){return {held:[...held],presses:presses.size,suppressed:suppressed.size,neutral,lastUI};}};`,c);
 return {c,delivery,log,api:c.api};
}
test('A pause pinch beginning and ending before any frame invokes the real pause command',()=>{
 const {api,delivery,log}=fixture(),e={inputSource:{handedness:'right'}};
 api.start(e);api.end(e);assert.equal(delivery.paused,true);assert.deepEqual(log,['pause','release']);
 const s=api.snapshot();assert.equal(s.held.length,0);assert.equal(s.presses,0);assert.equal(s.suppressed,0);assert.equal(s.neutral,true);
});
test('Repeated pause selection does not toggle the game back to running',()=>{
 const {api,delivery,log}=fixture(),e={inputSource:{}};
 api.start(e);api.start(e);api.end(e);assert.equal(delivery.paused,true);assert.equal(log.filter(x=>x==='pause').length,1);
});
test('Stale riding Pause rectangle cannot act behind an already-open panel',()=>{
 const {api,delivery,log}=fixture();api.setup('pause',{});api.start({inputSource:{}});assert.equal(delivery.paused,false);assert.equal(log.length,0);
});
test('An ended XR session does not accept a late pause selection',()=>{
 const {api,delivery,log}=fixture();api.setup('pause',null,false);api.start({inputSource:{}});assert.equal(delivery.paused,false);assert.equal(log.length,0);
});
test('Held movement still releases on native selectend without altering gameplay values',()=>{
 const {api,log}=fixture(),e={inputSource:{}};api.setup('left');api.start(e);assert(api.snapshot().held.includes('left'));api.end(e);assert(!api.snapshot().held.includes('left'));assert.equal(log.length,0);
});
