import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const coverage=JSON.parse(read('./production/workflow-coverage.json'));
test('All existing source, console and public journeys remain in the three current workflows',()=>{
 for(const [kind,key,count]of [['source','sourceSuites',19],['console','consoleModes',8],['public','publicSuites',21]]){
  const text=read('../.github/workflows/'+coverage[kind+'Workflow']);assert.equal(coverage[key].length,count);for(const name of coverage[key])assert.ok(text.includes(name),name);
  assert.ok(text.includes('contents: read'));assert.ok(!text.includes('contents: write'));assert.ok(text.includes('branches: [master]'));
 }
});
test('Fourteen obsolete writer or duplicate wrappers are not part of the current master process',()=>{
 assert.equal(coverage.removedObsoleteWorkflowFiles.length,14);for(const file of coverage.removedObsoleteWorkflowFiles)assert.equal(existsSync(new URL('../.github/workflows/'+file,import.meta.url)),false,file);
});
test('Original and authored district saves and eight native modes are not replaced by the alternative desk',()=>{
 const hub=read('./main-hub.mjs'),xr=read('./unified-xr.mjs');assert.ok(hub.includes('createSpatialConsole')||xr.includes('createSpatialConsole'));assert.ok(!xr.includes("from './field-desk.mjs'"));
 assert.ok(hub.includes("HUB_KEY='svgn.neighborhood-hub.v1'"));assert.ok(hub.includes('wardSpatial=spatialView'));assert.ok(read('./spatial-modes.mjs').includes('diorama-first'));
 assert.ok(!hub.includes("from './city-model.mjs'"));
});
test('Runtime uses the recovered vehicle selection only inside the existing active/ready riding path',()=>{
 const xr=read('./unified-xr.mjs');assert.ok(xr.includes('if(vehicleDrive&&!source.hand)'));assert.ok(xr.includes('vehicleTriggerSignal(consoleUI.prefs.driveHand'));assert.ok(xr.includes('if(!vehicleDrive&&edge(0))'));assert.ok(xr.includes('if(root()||!hooks.playing())clearXRInput()'));
});
