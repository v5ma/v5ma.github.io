// Execute the actual fallback bridge: no browser or device approval inferred.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../depth-path.mjs',import.meta.url),'utf8');
const start=source.indexOf('const draw=window.render;');
const bridge=source.slice(start,source.indexOf('window.SkyCycleDepth=',start));
for(const [name,testing,view,release] of [['curved 3D',true,'3d',false],['2D fallback',true,'2d',true],['returned editor',false,'3d',true],['non-preview',false,'2d',true]])test('Shared render bridge restores ownership for '+name,()=>{
 const calls=[],owner={};
 const window={RouteWorkshop:{testing},__delivery:{state:{view}},render:function(...args){assert.equal(this,owner);calls.push(['draw',...args]);return 71;}};
 vm.runInNewContext(bridge,{window,update:()=>calls.push(['restore'])});
 assert.equal(window.render.call(owner,1,2),71);
 assert.deepEqual(calls,release?[['restore'],['draw',1,2]]:[['draw',1,2]]);
});
