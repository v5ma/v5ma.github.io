import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {XR_MODES,xrEnvironmentProblem,xrFailureText,supportText,probeXRMode,bindXREntry} from '../xr-entry.mjs';

test('Four explicit viewpoint/session combinations remain distinct from optional theatre',()=>{
 assert.deepEqual(Object.values(XR_MODES).map(v=>[v.session,v.presentation]),[['immersive-vr','first-person'],['immersive-vr','diorama'],['immersive-ar','first-person'],['immersive-ar','diorama'],['immersive-vr','theatre']]);
});
test('XR launcher exists in the original HTML before game or support loading',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const mode of ['first-person','diorama-vr','first-person-ar','diorama-ar'])assert.equal(html.split('data-xr-entry="'+mode+'"').length-1,2,'One title and one pause button for '+mode);
 const title=html.indexOf('id="xr-launcher"');assert.ok(title>0&&title<html.indexOf('class="story-intro"'));assert.ok(html.indexOf('id="start"')<title);
});
test('Missing API, insecure context and embedding policy each produce a useful visible reason',()=>{
 assert.match(xrEnvironmentProblem({isSecureContext:false}),/HTTPS/);
 assert.match(xrEnvironmentProblem({navigator:{}}),/headset browser/);
 const env={navigator:{xr:{requestSession(){}}},document:{permissionsPolicy:{allowsFeature:()=>false}}};assert.match(xrEnvironmentProblem(env),/embedded page/);
 env.document.permissionsPolicy.allowsFeature=()=>true;assert.equal(xrEnvironmentProblem(env),'');
});
test('Each common request failure preserves its name and gives an actionable retry path',()=>{
 for(const name of ['NotAllowedError','NotSupportedError','SecurityError','InvalidStateError','AbortError','Error']){const text=xrFailureText({name,message:'fixture'});assert.ok(text.includes(name));assert.ok(text.includes('fixture'));assert.ok(text.length>80);}
});
test('AR and VR support probes are independent and never request sessions',async()=>{
 let requests=0;const xr={requestSession:()=>requests++,isSessionSupported:async mode=>mode==='immersive-vr'};
 assert.equal(await probeXRMode(xr,'immersive-vr'),true);assert.equal(await probeXRMode(xr,'immersive-ar'),false);assert.equal(requests,0);
});
test('A failed availability probe is unknown, not a false unsupported verdict',async()=>{
 assert.equal(await probeXRMode({isSessionSupported:async()=>{throw Error('Temporary support error');}},'immersive-ar'),'unknown');
 assert.equal(await probeXRMode({},'immersive-vr'),'unknown');assert.match(supportText('ar','unknown'),/ask the headset/);
});
test('Visible direct buttons call the selected mode synchronously, without a selector or support await',()=>{
 const modes=['first-person','diorama-vr','first-person-ar','diorama-ar'];
 const buttons=modes.map(mode=>({dataset:{xrEntry:mode},setAttribute(){}})),statuses=[{dataset:{xrSupport:'vr'}},{dataset:{xrSupport:'ar'}}],feedback=[{}],retry=[{}],calls=[];
 const doc={querySelectorAll:s=>({'[data-xr-entry]':buttons,'[data-xr-support]':statuses,'[data-xr-entry-status]':feedback,'[data-xr-recheck]':retry}[s]||[])};
 const ui=bindXREntry({enter:(...v)=>calls.push(v),recheck:()=>calls.push('check'),doc});ui.render({vr:true,ar:false,status:'Ready'});
 assert.equal(buttons[0].disabled,false);assert.equal(buttons[2].disabled,true);assert.match(statuses[1].textContent,/unavailable/);
 buttons[0].onclick();assert.deepEqual(calls[0],['first-person',true]);assert.equal(feedback[0].textContent,'Ready');
 ui.render({vr:true,ar:true,busy:true});assert.ok(buttons.every(b=>b.disabled));
 ui.render({vr:'unknown',ar:'checking'});assert.ok(buttons.every(b=>!b.disabled));retry[0].onclick();assert.equal(calls[1],'check');
});
