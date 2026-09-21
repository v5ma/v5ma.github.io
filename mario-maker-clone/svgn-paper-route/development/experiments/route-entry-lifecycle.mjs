// Isolated session/DOM fixtures executing the actual route-entry functions.
// Not a browser playthrough, native WebXR test or physical-device approval.
// Run: node mario-maker-clone/svgn-paper-route/development/experiments/route-entry-lifecycle.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {entryGate} from '../../route-entry-core.mjs';
const source=readFileSync(new URL('../../route-entry.js',import.meta.url),'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
function fixture(){
 let resolve;const events=[];
 const request=new Promise(r=>resolve=r);
 const session={presenting:false,diagnostics:{mode:'immersive-ar'},requestMode:async mode=>{events.push(['request',mode]);const ok=await request;session.presenting=ok;return ok;},leaveMode:async()=>{events.push(['leave']);session.presenting=false;return true;}};
 const dialog={open:false,close(){this.open=false;events.push(['dialog-close']);}};
 const delivery={state:{route:0,view:'3d'},startRoute(i){this.state.route=i;events.push(['route',i]);},act(k){if(k==='view')this.state.view=this.state.view==='3d'?'2d':'3d';}};
 const w={SkyCycleXR:session,DeliveryCampaign:{routes:[{id:'old',name:'Old route'},{id:'next',name:'Next route'}]},PaperDeliveryCampaign:{status:'ready'},RouteWorkshop:{active:false,testing:false,state:{dirty:false}},__merged:{renderer:{backend:{isWebGLBackend:true}}},__gpuReady:true};
 const c=vm.createContext({window:w,__delivery:delivery,dialog,busy:false,serial:0,lastOutcome:'ready',lastRoute:null,supported:{ar:true,vr:true},checked:true,entryGate,xr:()=>session,fd:()=>({releaseForTravel:()=>events.push(['release']),resetInput:()=>events.push(['reset'])}),document:{querySelectorAll:()=>dialog.open?[dialog]:[]},clearURL:()=>events.push(['url-clear']),persist:mode=>events.push(['persist',mode]),message:(title,body)=>{dialog.open=true;events.push(['message',title,body]);}});
 vm.runInContext(section('function dismiss(){',"dialog.addEventListener('cancel'")+section('function currentGate(', 'async function beginSession(')+section('async function beginSession(', 'function confirmEntry('),c);
 return {c,events,dialog,delivery,w,session,resolve};
}
test('Pending or rejected session cannot replace the route or remember success',async()=>{
 const f=fixture(),run=f.c.beginSession('next','ar');
 assert.equal(f.delivery.state.route,0);assert.equal(f.c.busy,true);
 f.resolve(false);await run;
 assert.equal(f.delivery.state.route,0);assert.equal(f.c.lastOutcome,'denied');assert.equal(f.c.busy,false);
 assert(!f.events.some(e=>e[0]==='route'||e[0]==='persist'));
});
test('Cancellation followed by late approval closes only that acquired session',async()=>{
 const f=fixture(),run=f.c.beginSession('next','ar');f.c.dismiss();f.resolve(true);await run;
 assert.equal(f.delivery.state.route,0);assert.equal(f.session.presenting,false);assert.equal(f.c.lastOutcome,'cancelled');
 assert.equal(f.events.filter(e=>e[0]==='leave').length,1);assert(!f.events.some(e=>e[0]==='route'||e[0]==='persist'));
});
test('Successful session commits the exact current stable route once',async()=>{
 const f=fixture(),run=f.c.beginSession('next','ar');f.resolve(true);await run;
 assert.equal(f.delivery.state.route,1);assert.equal(f.c.lastOutcome,'started');assert.equal(f.c.lastRoute,'next');
 assert.equal(f.events.filter(e=>e[0]==='route').length,1);assert.deepEqual(f.events.find(e=>e[0]==='persist'),['persist','ar']);
});
test('A draft opened while permission is pending blocks the delayed route replacement',async()=>{
 const f=fixture(),run=f.c.beginSession('next','ar');f.w.RouteWorkshop.active=true;f.w.RouteWorkshop.state.dirty=true;f.resolve(true);await run;
 assert.equal(f.delivery.state.route,0);assert.equal(f.c.lastOutcome,'blocked');assert.equal(f.w.RouteWorkshop.state.dirty,true);
 assert(!f.events.some(e=>e[0]==='route'||e[0]==='persist'));
});
test('Reordered campaign indices are resolved again after entry succeeds',async()=>{
 const f=fixture(),run=f.c.beginSession('next','ar');f.w.DeliveryCampaign.routes.reverse();f.resolve(true);await run;
 assert.equal(f.delivery.state.route,0);assert.equal(f.c.lastRoute,'next');assert.equal(f.c.lastOutcome,'started');
});
test('Repeated launch does not issue a second hardware request while pending',async()=>{
 const f=fixture(),first=f.c.beginSession('next','ar');await f.c.beginSession('next','vr');f.resolve(true);await first;
 assert.equal(f.events.filter(e=>e[0]==='request').length,1);assert.equal(f.events.filter(e=>e[0]==='route').length,1);
});
