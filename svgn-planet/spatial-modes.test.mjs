import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from './vendor/three.module.js';
import {MODES,modeInfo,presentationMatrix} from './spatial-modes.mjs';
import {readFileSync} from 'node:fs';
const settings={scale:.04,height:-.9,distance:1.55,rotation:0};
test('Exactly eight distinct full-world/portal first/third AR/VR choices',()=>{assert.equal(MODES.length,8);assert.equal(new Set(MODES).size,8);for(const ar of [true,false])for(const portal of [true,false])for(const first of [true,false])assert.equal(MODES.filter(x=>{const m=modeInfo(x);return m.ar===ar&&m.portal===portal&&m.first===first;}).length,1);assert.throws(()=>modeInfo('theater'));});
for(const mode of MODES)test('Presentation transform preserves simulation and stereo contract: '+mode,()=>{
 const feet=new T.Vector3(723,444,-62),basis=new T.Matrix4().makeRotationY(.7),origin=new T.Vector3(.2,1.6,.1),before=feet.toArray();
 const p=presentationMatrix({feet,basis,origin,heading:.23,settings,mode});assert.deepEqual(feet.toArray(),before);
 assert.ok(feet.clone().applyMatrix4(p.matrix).distanceTo(p.target)<1e-9);assert.ok(p.matrix.elements.every(Number.isFinite));
 const inv=p.matrix.clone().invert();assert.ok(feet.clone().applyMatrix4(p.matrix).applyMatrix4(inv).distanceTo(feet)<1e-8);
 if(modeInfo(mode).first){const eyes=feet.clone().add(new T.Vector3(0,1.65,0).applyMatrix4(basis));assert.ok(eyes.applyMatrix4(p.matrix).distanceTo(origin)<1e-9);assert.equal(p.scale,1);}else if(modeInfo(mode).portal)assert.equal(p.scale,.08);
 const left=new T.Vector3(-.032,0,0).applyMatrix4(inv),right=new T.Vector3(.032,0,0).applyMatrix4(inv);assert.ok(left.distanceTo(right)>0);
});
test('Portal geometry scale and physical placement are independent of world coordinates',()=>{const args={feet:new T.Vector3(2,0,5),basis:new T.Matrix4(),origin:new T.Vector3(0,1.6,0),heading:0,settings,mode:'diorama-third-ar'},a=presentationMatrix(args),b=presentationMatrix({...args,feet:new T.Vector3(40,9,-100)});assert.deepEqual(a.anchor.toArray(),b.anchor.toArray());assert.notDeepEqual(a.matrix.elements,b.matrix.elements);});
test('Main entry boots main application and retains explicit recovery URLs without a chapter redirect',()=>{const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');assert.match(html,/main-app\.mjs/);assert.doesNotMatch(html,/location\.replace/);assert.match(html,/legacy\.html/);});
test('Main renderer suppresses flat postprocess during native XR',()=>{const source=readFileSync(new URL('./main-scene.mjs',import.meta.url),'utf8');assert.match(source,/alpha:true/);assert.match(source,/if\(!renderer\.xr\.isPresenting\)jewel\.render/);});
test('Unified runtime has no render-target or canvas-textured game screen',()=>{const s=readFileSync(new URL('./unified-xr.mjs',import.meta.url),'utf8');assert.doesNotMatch(s,/WebGLRenderTarget|target\.texture|flat-game-screen/);assert.match(s,/renderer\.render\(sv\.view\.scene,sv\.view\.camera\)/);});
test('Main district travel uses no browser navigation, iframe, storage clear or state graft',()=>{const s=readFileSync(new URL('./main-hub.mjs',import.meta.url),'utf8');assert.doesNotMatch(s,/location\.(?:href|assign|replace)|iframe|localStorage\.clear|store\.clear/);assert.match(s,/createDistrictView\(hooks\.canvas,renderer\)/);assert.match(s,/xr\.retarget\(\)/);});
