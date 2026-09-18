import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const hub=readFileSync(new URL('./main-hub.mjs',import.meta.url),'utf8');
const app=readFileSync(new URL('./main-app.mjs',import.meta.url),'utf8');
test('Lantern destination is intercepted before the original planet waypoint lookup',()=>{assert.ok(hub.includes("$('set-waypoint').onclick=e=>$('district-select').value==='lantern'?switchDistrict('lantern'):setWaypoint?.(e)"));});
test('The main city map has a genuine native canvas page and a destination return',()=>{assert.match(hub,/id="main-map-view" data-xr-map="1"/);assert.ok(hub.includes("dest.getContext('2d').drawImage(source,0,0)"));assert.ok(hub.includes("$('main-map-back').onclick=()=>open('map-dialog')"));});
test('A native menu district change cannot advance the old city during the same frame',()=>{assert.ok(app.includes('xr?.update(now,xrFrame);if(hub?.wardActive){acc=0;previousPose=null;last=0;return;}'));});
test('A native menu district change cannot advance the old ward during the same frame',()=>{assert.ok(hub.includes('xr.update(now,frame);if(!wardActive){last=0;return;}'));});
