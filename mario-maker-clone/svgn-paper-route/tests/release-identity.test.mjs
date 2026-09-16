import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const release=JSON.parse(read('release.json')),status=read('release-status.js'),worker=read('sw.js');
test('Release manifest and visible runtime identify the same version and build',()=>{
 assert.match(release.version,/^\d+\.\d+\.\d+$/);
 assert.equal(status.match(/const VERSION='([^']+)',BUILD='([^']+)'/)[1],release.version);
 assert.equal(status.match(/const VERSION='([^']+)',BUILD='([^']+)'/)[2],release.build);
});
test('Release update keeps the Workshop dirty-draft guard and campaign error state',()=>{
 assert(status.includes('RouteWorkshop?.state.dirty'));
 assert(status.includes("status='error'"));
 assert(status.includes("status='ready'"));
 assert(!status.includes('localStorage.clear('));
});
test('Version-owned worker cache remains scoped to this game and uses current build',()=>{
 assert.equal(worker.match(/const CACHE='([^']+)'/)[1],'svgn-paper-route-'+release.build.replaceAll('.',''));
 assert(worker.includes("k.startsWith('svgn-paper-route-')&&k!==CACHE"));
 assert(!worker.includes('localStorage'));
});
