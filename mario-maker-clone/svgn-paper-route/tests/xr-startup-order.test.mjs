import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const xr=readFileSync(new URL('../xr-play.js',import.meta.url),'utf8');
test('Pinned r177 captures the app callback before its XR camera/framebuffer wrapper',()=>{assert(xr.indexOf('await renderer.setAnimationLoop(frame)')<xr.indexOf('await renderer.xr.setSession(session)'));assert.equal((xr.match(/setAnimationLoop\(frame\)/g)||[]).length,1);});
test('Root menu cancels rather than approving pending prompts and remains simulation-paused',()=>{assert(xr.includes("for(const d of document.querySelectorAll('dialog[open]'))d.close()"));assert(xr.includes("if(virtualRoot&&!__delivery.paused&&!__delivery.state.menu)__delivery.act('pause')"));});
test('Controller focus reveals the page and exposes a native exit control',()=>{assert(xr.includes('function focusControl(el)'));assert(xr.includes('focusEntry(entries,el,page)'));assert(xr.includes('id="xr-stage-exit"'));assert(xr.includes("document.addEventListener('focusin'"));});
test('Editor tools expose Resume editing separately from Back to game',()=>{assert(xr.includes("screenMode==='workshop'?'Resume editing':'Back'"));});
