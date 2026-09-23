import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adventureEntry} from '../adventure-entry.mjs';
import {installFieldControls,fieldControlHint} from '../field-controls.mjs';
import {fresh,parse,serialize} from '../lantern/core.mjs';
import {trackStory} from '../lantern/city.mjs';
const completed=()=>{const s=fresh();s.campaign={v:1,active:null,progress:{highline:6},completed:['highline'],credits:240,route:'stealth'};return s;};

test('Fresh adventure entry previews Sal without accepting the case or moving the courier',()=>{
 const s=fresh(),before=JSON.stringify(s),plan=adventureEntry(s);assert.equal(plan.mission,'campaign:highline');assert.match(plan.title,/Play Highline/);assert.match(plan.detail,/Sal/);assert.equal(JSON.stringify(s),before);
});
test('Saved Highline entry names the next task rather than sending a returning player to the beginning',()=>{
 const s=fresh();trackStory(s,'campaign:highline');s.campaign.progress.highline=4;const loaded=parse(serialize(s)),before=JSON.stringify(loaded),plan=adventureEntry(loaded);assert.match(plan.title,/Continue Highline/);assert.match(plan.detail,/recording/);assert.equal(JSON.stringify(loaded),before);
});
test('After Highline the entry offers the archive; selecting it grants no reward or previous campaign completion',()=>{
 const s=completed(),plan=adventureEntry(s);assert.equal(plan.mission,'campaign:unsent');assert.match(plan.title,/Play Archive/);const position=[s.x,s.y,s.z];trackStory(s,plan.mission);assert.equal(s.campaign.progress.unsent,0);assert.equal(s.campaign.credits,240);assert.deepEqual([s.x,s.y,s.z],position);assert.equal(s.watch.stage,0);assert.equal(s.campaign.progress.flight,undefined);
});
test('Mid-archive continue retains stage, coordinates and separate ledgers across actual serialization',()=>{
 const s=completed();trackStory(s,'campaign:unsent');s.campaign.progress.unsent=2;const before=serialize(s),plan=adventureEntry(parse(before));assert.match(plan.title,/Continue Archive/);assert.match(plan.detail,/service log/);assert.deepEqual(serialize(s),before);
});
test('Completed arcs offer exploration, not an invalid replay or repeated credit award',()=>{
 const s=completed();s.campaign.progress.unsent=4;s.campaign.completed.push('unsent');s.campaign.credits=360;const before=JSON.stringify(s),plan=adventureEntry(s);assert.equal(plan.mission,null);assert.match(plan.title,/Explore Highline/);assert.equal(JSON.stringify(s),before);
});
test('Recovery state never turns unknown saved progress into a fresh adventure selection',()=>{const p=adventureEntry(fresh(),true);assert.equal(p.mission,null);assert.match(p.title,/save recovery/);});

class Node extends EventTarget{open=false;captured=null;setPointerCapture(id){this.captured=id;}hasPointerCapture(id){return this.captured===id;}releasePointerCapture(){this.captured=null;}}
function fixture(){const nodes=Object.fromEntries(['atlas','help','view','ward-loading'].map(k=>[k,new Node()])),document={getElementById:k=>nodes[k]},window=new Node(),canvas=new Node(),calls=[];let active=true,paused=false,xr=false;
 const hook=installFieldControls({document,window,canvas,active:()=>active,paused:()=>paused,inXR:()=>xr,map:()=>calls.push('map'),help:()=>calls.push('help'),recenter:()=>calls.push('recenter'),orbit:d=>calls.push(d),cancelTravel:()=>calls.push('cancel')});
 const fire=(node,name,values={})=>{const e=new Event(name,{cancelable:true});Object.assign(e,values);node.dispatchEvent(e);return e;};return {nodes,window,canvas,calls,hook,fire,setActive:v=>active=v,setPaused:v=>paused=v,setXR:v=>xr=v};
}
test('Shared Map, Help and Camera invoke ward controls and do not invoke original city handlers',()=>{
 const f=fixture();for(const name of ['atlas','help','view']){f.nodes[name].addEventListener('click',()=>f.calls.push('old-city'));assert.equal(f.fire(f.nodes[name],'click').defaultPrevented,true);}assert.deepEqual(f.calls,['map','help','recenter']);f.hook.dispose();
});
test('All original shared-control handlers remain available outside Lantern Ward',()=>{
 const f=fixture();f.setActive(false);for(const name of ['atlas','help','view']){f.nodes[name].addEventListener('click',()=>f.calls.push(name));assert.equal(f.fire(f.nodes[name],'click').defaultPrevented,false);}assert.deepEqual(f.calls,['atlas','help','view']);f.hook.dispose();
});
test('Scene dragging rotates only the active ward and ignores another pointer',()=>{
 const f=fixture();f.fire(f.canvas,'pointerdown',{pointerId:4,button:0,isPrimary:true,clientX:100});f.fire(f.canvas,'pointermove',{pointerId:5,clientX:190});assert.deepEqual(f.calls,[]);f.fire(f.canvas,'pointermove',{pointerId:4,clientX:180});assert.deepEqual(f.calls,[-.4]);f.fire(f.canvas,'pointerup',{pointerId:4});assert.equal(f.canvas.captured,null);f.fire(f.canvas,'pointermove',{pointerId:4,clientX:200});assert.equal(f.calls.length,1);f.hook.dispose();
});
test('Paused, XR, nonprimary and lost-tracking drags cannot move the desktop camera',()=>{
 const f=fixture();const start=()=>f.fire(f.canvas,'pointerdown',{pointerId:1,button:0,isPrimary:true,clientX:0});f.setPaused(true);start();f.fire(f.canvas,'pointermove',{pointerId:1,clientX:40});f.setPaused(false);f.setXR(true);start();f.setXR(false);f.fire(f.canvas,'pointerdown',{pointerId:2,button:0,isPrimary:false,clientX:0});start();f.fire(f.window,'blur');f.fire(f.canvas,'pointermove',{pointerId:1,clientX:60});assert.deepEqual(f.calls,[]);f.hook.dispose();
});
test('Escape and P cancel outstanding preparation before the old generic resume handler can run',()=>{
 const f=fixture();f.nodes['ward-loading'].open=true;f.window.addEventListener('keydown',()=>f.calls.push('old-resume'));f.fire(f.window,'keydown',{code:'Escape',repeat:false});f.fire(f.window,'keydown',{code:'KeyP',repeat:true});assert.deepEqual(f.calls,['cancel']);f.nodes['ward-loading'].open=false;f.fire(f.window,'keydown',{code:'Escape'});assert.deepEqual(f.calls,['cancel','old-resume']);f.hook.dispose();
});
test('Disposal removes interceptors and leaves host controls intact',()=>{const f=fixture();f.hook.dispose();f.hook.dispose();assert.equal(f.fire(f.nodes.atlas,'click').defaultPrevented,false);assert.deepEqual(f.calls,[]);});
test('Hints match Xbox on-foot combat and actual riding acceleration, braking and docking',()=>{
 assert.match(fieldControlHint({gamepad:true,combat:true}),/L3 run/);assert.match(fieldControlHint({gamepad:true}),/RT run/);assert.match(fieldControlHint({gamepad:true,ride:'boat',combat:true}),/RT accelerate.*dock at a pier/);assert.match(fieldControlHint({gamepad:true,canGlide:true}),/LB\+RB/);
});
test('Keyboard and touch hints do not instruct players to use nonexistent Xbox buttons',()=>{assert.match(fieldControlHint(),/E interact.*M map/);assert.match(fieldControlHint({touch:true}),/Drag the scene/);assert.doesNotMatch(fieldControlHint({touch:true}),/LB|RT|LS/);assert.match(fieldControlHint({touch:true,gamepad:true}),/X interact/);});
test('Main entry persists explicit case selection and applies the same route guidance as XR',()=>{
 const hub=readFileSync(new URL('../main-hub.mjs',import.meta.url),'utf8');assert.ok(hub.includes("if(wardActive&&!blocked)persistWard();close();"));assert.ok(hub.includes("$('objective-text').textContent=field.detail"));assert.ok(hub.includes("highline.disabled=false;$('enter-ward').disabled=false;refreshAdventureEntry()"));assert.ok(hub.includes("if(travelToken!==travelGeneration)return false;error="));
});
