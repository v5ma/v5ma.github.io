import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const xr=readFileSync(new URL('../xr-play.js',import.meta.url),'utf8');
test('Pinned r177 captures the app callback before its XR camera/framebuffer wrapper',()=>{assert(xr.indexOf('await renderer.setAnimationLoop(frame)')<xr.indexOf('await renderer.xr.setSession(session)'));assert.equal((xr.match(/setAnimationLoop\(frame\)/g)||[]).length,1);});
