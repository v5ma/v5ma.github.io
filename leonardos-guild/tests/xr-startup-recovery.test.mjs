import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createXRStartupWatch,bindGraphicsRecovery} from '../xr-startup-recovery.mjs';

function clock(){let id=0;const jobs=new Map();return {setTimeout(fn){jobs.set(++id,fn);return id;},clearTimeout(i){jobs.delete(i);},fire(){for(const [id,fn]of [...jobs]){jobs.delete(id);fn();}},jobs};}
for(const phase of ['reference-space','renderer','scene','first-frame'])test('Startup deadline covers '+phase+' before gameplay begins',()=>{
 const timers=clock(),session={},calls=[];let current=session;
 const watch=createXRStartupWatch({current:()=>current,timeout:p=>calls.push(p),timers});
 watch.stage(session,phase);assert.equal(watch.inspect().armed,true);timers.fire();
 assert.deepEqual(calls,[phase]);assert.equal(watch.inspect().expired,true);timers.fire();assert.equal(calls.length,1);
});
test('Late startup timers cannot end a newer XR session',()=>{
 const timers=clock(),old={},next={},calls=[];let current=old;
 const watch=createXRStartupWatch({current:()=>current,timeout:p=>calls.push(p),timers});
 watch.stage(old,'renderer');const stale=[...timers.jobs.values()][0];current=next;watch.stage(next,'first-frame');stale();assert.deepEqual(calls,[]);
 timers.fire();assert.deepEqual(calls,['first-frame']);
});
test('Completed first frame and session exit cancel startup deadlines',()=>{
 const timers=clock(),session={},watch=createXRStartupWatch({current:()=>session,timeout:()=>assert.fail('stale deadline'),timers});
 watch.stage(session,'renderer');watch.stage(session,'first-frame');assert.equal(timers.jobs.size,1);watch.stop();timers.fire();assert.equal(watch.inspect().armed,false);
});
function graphics(){const canvas=new EventTarget(),failure={hidden:true},detail={textContent:''},calls=[];
 const recovery=bindGraphicsRecovery({canvas,failure,detail,pause:()=>calls.push('pause'),release:()=>calls.push('release'),restore:()=>calls.push('restore')});
 const lose=()=>{const e=new Event('webglcontextlost',{cancelable:true});canvas.dispatchEvent(e);assert.equal(e.defaultPrevented,true);};
 return {canvas,failure,detail,calls,recovery,lose,restore:()=>canvas.dispatchEvent(new Event('webglcontextrestored'))};}
test('Recovered graphics remove the blocking failure root and do not auto-resume movement',()=>{
 const f=graphics();f.lose();assert.equal(f.failure.hidden,false);f.restore();assert.equal(f.failure.hidden,true);
 assert.deepEqual(f.calls,['release','pause','release','restore']);assert.deepEqual(f.recovery.inspect(),{lost:false,interruptions:1,restorations:1});
});
test('Duplicate context events do not duplicate pauses; repeated real interruptions recover',()=>{
 const f=graphics();f.lose();f.lose();f.restore();f.restore();assert.equal(f.calls.filter(x=>x==='pause').length,1);f.lose();f.restore();assert.equal(f.failure.hidden,true);assert.equal(f.recovery.inspect().restorations,2);
});
test('Graphics restoration never hides a different fatal application error',()=>{
 const f=graphics();f.lose();f.detail.textContent='Unrelated fatal error';f.restore();assert.equal(f.failure.hidden,false);assert.equal(f.detail.textContent,'Unrelated fatal error');
 const g=graphics();g.failure.hidden=false;g.detail.textContent='Already failed';g.lose();g.restore();assert.equal(g.failure.hidden,false);assert.equal(g.detail.textContent,'Already failed');
});
test('Recovery-handler failure is visible, not incorrectly reported as success',()=>{
 const canvas=new EventTarget(),failure={hidden:true},detail={textContent:''};bindGraphicsRecovery({canvas,failure,detail,pause(){},release(){},restore(){throw Error('test allocation failed');}});
 canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));canvas.dispatchEvent(new Event('webglcontextrestored'));assert.equal(failure.hidden,false);assert.match(detail.textContent,/test allocation failed/);
});
test('Removing the recovery binding removes both event listeners',()=>{const f=graphics();f.recovery.dispose();f.canvas.dispatchEvent(new Event('webglcontextlost'));assert.deepEqual(f.calls,[]);});
test('The actual application binds recovery and XR arms deadlines before each initialization await',()=>{
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8'),xr=readFileSync(new URL('../guild-xr.mjs',import.meta.url),'utf8');
 assert.match(app,/graphics=bindGraphicsRecovery/);assert.match(app,/graphics\?\.isLost\(\)/);assert.match(app,/graphics:graphics\?\.inspect\(\)/);
 for(const [phase,operation]of [['reference-space',"requested.requestReferenceSpace('local-floor')"],['renderer','renderer.xr.setSession(requested)'],['scene','spatial?.begin(']]){
  assert.ok(xr.indexOf("startup.stage(requested,'"+phase+"')")<xr.indexOf(operation));assert.ok(xr.includes("startup.stage(requested,'"+phase+"')"));
 }
 assert.match(xr,/epoch!==entryEpoch/);assert.match(xr,/if\(ended\|\|session!==requested\)/);assert.match(xr,/startup\.stop\(\);requesting=false/);
});
