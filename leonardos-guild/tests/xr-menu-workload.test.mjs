/* Actual panel/toolbar and scene-gate modules with a small DOM/canvas fixture.
 * Counters test redundant work and paint consistency, not device frame rate. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createXRPanel,createXRToolbar} from '../xr-panel.mjs';
import {createFrameGate} from '../frame-gate.mjs';
import {readFileSync} from 'node:fs';
function fixture(t){
 const saved=new Map(['document','MutationObserver'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 t.after(()=>{for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}});
 let clock=0,clones=0,root=null,paints=0;const activated=[],observers=[];
 const context=new Proxy({},{get:(_t,k)=>k==='fillRect'?()=>paints++:()=>{}});
 const nodes=new Map();const make=(id,i=0)=>({id,tagName:'BUTTON',textContent:'Choice '+i,getAttribute:()=>null});
 const items=Array.from({length:20},(_,i)=>make('choice-'+i,i));
 const dialog={id:'dialog',tagName:'DIALOG',open:true,textContent:'Original page',getAttribute:()=>null,
  querySelector:()=>null,cloneNode(){clones++;return {textContent:this.textContent,querySelectorAll:()=>[]};}};
 class Observer{constructor(fn){this.fn=fn;this.records=[];this.target=null;observers.push(this);}observe(target){this.target=target;}takeRecords(){return this.records.splice(0);}disconnect(){this.target=null;this.records=[];}}
 const document={activeElement:null,createElement:()=>({getContext:()=>context}),getElementById:id=>nodes.get(id)||null};
 Object.defineProperty(globalThis,'document',{configurable:true,value:document});Object.defineProperty(globalThis,'MutationObserver',{configurable:true,value:Observer});
 const ui={root:()=>root,choices:()=>items.filter(e=>!e.disabled),activate:e=>activated.push(e.id),adjust:(e,d)=>{e.value+=d;},back(){root=null;}};
 const actions={wheelActive:()=>null};const state={mode:'foot',resonance:{tool:'sling',ready:6,reserve:36},health:100,credits:0};
 return {ui,actions,document,dialog,items,activated,observers,root(v){root=v;},clock(v){clock=v;},clones:()=>clones,paints:()=>paints,
  mutate(){for(const o of observers)if(o.target)o.records.push({type:'childList'});},
  panel:()=>createXRPanel({ui,actions,getState:()=>state,consoleUI:{inspect:()=>({})},exit(){},clock:()=>clock})};
}
test('Idle hand toolbar does not upload the same texture every XR frame',t=>{
 fixture(t);const p=createXRToolbar({});const version=p.texture.version;
 for(let i=0;i<180;i++)p.draw('');assert.equal(p.texture.version,version,'Neutral hover must be cached, not treated as uninitialized');p.dispose();
});
test('Toolbar hover and return to neutral each repaint once, then remain cached',t=>{
 fixture(t);const p=createXRToolbar({}),v=p.texture.version;p.draw('forward');assert.equal(p.texture.version,v+1);p.draw('forward');assert.equal(p.texture.version,v+1);
 p.draw('');assert.equal(p.texture.version,v+2);p.draw('');assert.equal(p.texture.version,v+2);assert.equal(p.hit(.25, .6)?.hold,'forward');p.dispose();
});
test('Two controller rays reuse a paused dialog between bounded content refreshes',t=>{
 const f=fixture(t);f.root(f.dialog);const p=f.panel(),start=f.clones();
 for(let i=1;i<=144;i++){f.clock(i*1000/72);p.hit(.5,.5);p.hit(.6,.5);p.draw(i*1000/72);}
 t.diagnostic('Unchanged dialog clones in the 2-second fixture: '+(f.clones()-start));assert.ok(f.clones()-start<=21,'Two seconds at 72 Hz must not clone the same dialog hundreds of times: '+(f.clones()-start));p.dispose();
});
test('A thumbstick focus/page change repaints immediately instead of leaving stale click targets',t=>{
 const f=fixture(t);f.root(f.dialog);const p=f.panel();p.draw(1000);const version=p.texture.version;
 f.document.activeElement=f.items[17];p.draw(1001);
 assert.equal(p.inspect().page,2);assert.equal(p.hit(.5,1-760/1536)?.element,f.items[16]);
 assert.ok(p.texture.version>version,'The visible page must match the page used by hit testing in this same frame');p.dispose();
});
test('Synchronous dialog mutations invalidate the cached model before a ray or paint',t=>{
 const f=fixture(t);f.root(f.dialog);const p=f.panel();p.draw(1000);const v=p.texture.version;
 f.items[0].disabled=true;f.dialog.textContent='Changed explanation';f.mutate();
 assert.equal(p.hit(.5,1-760/1536)?.element,f.items[1]);p.draw(1001);assert.ok(p.texture.version>v);p.dispose();
});
test('Changing to a different parent dialog invalidates immediately',t=>{
 const f=fixture(t);f.root(f.dialog);const p=f.panel();p.draw(1000);const v=p.texture.version;
 const next={...f.dialog,id:'another',textContent:'Another parent'};f.root(next);p.draw(1001);assert.ok(p.texture.version>v);p.dispose();
});
test('Property-only changes still refresh within 100 ms without a mutation event',t=>{
 const f=fixture(t);f.root(f.dialog);const p=f.panel();const before=f.clones();f.items[0].disabled=true;f.clock(101);
 assert.equal(p.hit(.5,1-760/1536)?.element,f.items[1]);assert.equal(f.clones(),before+1);p.dispose();
});
test('Invoking a page action invalidates immediately and still uses the original DOM handler',t=>{
 const f=fixture(t);f.root(f.dialog);const p=f.panel();assert.equal(p.invoke('page-next'),true);p.draw(1);assert.equal(p.inspect().page,1);
 assert.equal(p.invoke('dom8'),true);assert.deepEqual(f.activated,['choice-8']);p.dispose();
});
test('Panel disposal detaches its observer',t=>{
 const f=fixture(t);f.root(f.dialog);const p=f.panel();assert.ok(f.observers.some(o=>o.target===f.dialog));p.dispose();assert.ok(f.observers.every(o=>o.target===null));
});
test('Paused scene work is cached even while the independent headset renderer is presenting',()=>{
 const source=readFileSync(new URL('../scene.mjs',import.meta.url),'utf8');assert.doesNotMatch(source,/if\(!renderer\.xr\.isPresenting&&!shouldDraw/);
 assert.match(source,/\[viewportRevision,renderer\.xr\.isPresenting,/);
 const gate=createFrameGate(),state={time:2,items:new Set(['letter'])};
 assert.equal(gate(0,state,[false]),true);assert.equal(gate(0,state,[false]),false);assert.equal(gate(0,state,[true]),true);
 for(let i=0;i<100;i++)assert.equal(gate(0,state,[true]),false);
 state.items.add('map');assert.equal(gate(0,state,[true]),true);assert.equal(gate(1/72,state,[true]),true);
 assert.ok(gate.inspect().skipped>=101);assert.equal(state.time,2);
});
