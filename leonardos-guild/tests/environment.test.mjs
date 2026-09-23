/* Actual bundled-r177 object and shader-hook fixtures. No GPU/device claim. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from '../vendor/three.module.js';
import {createGuildVegetation,townSpecimens,environmentOptions,environmentQuality} from '../environment.mjs';
import {createCisternArt} from '../cistern-art.mjs';
import {POOL,poolFloor,cisternState} from '../cistern-core.mjs';
import {makeWorld,heightAt,newState,saveData} from '../model.mjs';
import {attachFrontier} from '../frontier-core.mjs';
import {PortalMaterials} from '../world-portal.mjs';
import {vaultInstrumentHint,vaultState} from '../vault-core.mjs';
import {VAULT_NODES} from '../vault-data.mjs';
const world=makeWorld(),fresh=()=>attachFrontier(newState(world));
function pool(){const root=new T.Group(),art=createCisternArt(root),s=fresh();s.frontier.zone='badlands';s.x=POOL.x;s.z=16;const renderer={xr:{isPresenting:false},render(){throw Error('Unexpected extra scene pass');}};return {root,art,s,render:(mode={})=>art.render(s,new T.Scene(),new T.PerspectiveCamera(),renderer,'high',mode)};}
test('Shared library files match reviewed hashes and the host keeps Three r177',()=>{
 assert.equal(T.REVISION,'177');const spec=JSON.parse(readFileSync(new URL('../environment-library.json',import.meta.url)));
 for(const [path,sha]of Object.entries(spec.files))assert.equal(createHash('sha256').update(readFileSync(new URL('../../'+path,import.meta.url))).digest('hex'),sha,path);
});
test('Visual preferences reject invalid values and do not expose gameplay fields',()=>{
 assert.deepEqual(environmentOptions({quiet:1,arWaterOpacity:NaN,credits:999}),{quiet:false,arWaterOpacity:.65});
 assert.equal(environmentOptions({arWaterOpacity:-2}).arWaterOpacity,0);assert.equal(environmentOptions({arWaterOpacity:20}).arWaterOpacity,1);
 assert.equal(environmentQuality('high',true),'light');assert.equal(environmentQuality('high',false),'balanced');
});
test('Six trees replace existing central placements without creating new collision footprints',()=>{
 const selected=townSpecimens(world.trees);assert.equal(selected.length,6);for(const tree of selected)assert.ok(world.trees.includes(tree));
 const root=new T.Group(),art=createGuildVegetation(root,world.trees,heightAt);assert.equal(art.inspect().trees.trees,6);assert.equal(art.inspect().trees.materials,2);assert.equal(art.inspect().trees.geometries,36);art.dispose();
});
test('New near-ground tree geometry stays outside the central road and leaves doors unobstructed',()=>{
 const root=new T.Group(),art=createGuildVegetation(root,world.trees,heightAt);root.traverse(o=>{const p=o.geometry?.attributes?.position;if(!p)return;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i);if(y-heightAt(x,z)<2.4)assert.ok(Math.abs(x)>9,'Trunk or low foliage intrudes into travel corridor');}});art.dispose();
});
test('Vegetation observes the host clock without modifying adventure or savings',()=>{
 const root=new T.Group(),art=createGuildVegetation(root,world.trees,heightAt),s=fresh(),before=JSON.stringify(saveData(s));art.update(s,'high');art.update(s,'high');assert.equal(JSON.stringify(saveData(s)),before);assert.equal(art.inspect().time,s.time);assert.equal(art.inspect().trees.renderTargets,0);art.dispose();
});
test('Quiet vegetation, stereo detail limits and restored ordinary detail are explicit',()=>{
 const root=new T.Group(),art=createGuildVegetation(root,world.trees,heightAt),s=fresh();s.x=11.8;s.z=34;art.configure({quiet:true});art.update(s,'high',true);const result=art.inspect();assert.equal(result.trees.quiet,true);assert.equal(result.trees.xr,true);assert.equal(result.trees.lod[0],0);art.configure({quiet:false});art.update(s,'high',false);assert.equal(art.inspect().trees.xr,false);art.dispose();
});
test('Indoor, Quarter and badlands transitions hide town specimens without moving their roots',()=>{
 const root=new T.Group(),art=createGuildVegetation(root,world.trees,heightAt),s=fresh(),before=root.children[0].matrix.clone();s.frontier.zone='badlands';art.update(s,'low');assert.equal(art.inspect().trees.visible,false);s.frontier.zone='town';s.life.inside='workshop';art.update(s,'low');assert.equal(art.inspect().trees.visible,false);s.life.inside=null;art.update(s,'low');assert.equal(art.inspect().trees.visible,true);assert.deepEqual(root.children[0].matrix.elements,before.elements);art.dispose();
});
test('Forest preparation uses the supplied renderer and retains host ownership',async()=>{
 const scene=new T.Scene(),art=createGuildVegetation(scene,world.trees,heightAt),camera=new T.PerspectiveCamera();let calls=0;await art.prepare({compileAsync:async(w,c)=>{calls++;assert.notEqual(w,scene);assert.notEqual(c,camera);assert.ok(w.children.some(m=>m.isMesh));}},camera,scene);assert.equal(calls,1);await art.prepare({},camera,scene);assert.equal(calls,1);assert.equal(art.inspect().trees.prepared,true);art.dispose();
});
test('Water aligns its local origin, real ramp bed and existing hydraulic level',()=>{
 const {art,s,render}=pool();render();assert.deepEqual(art.water.mesh.position.toArray(),[POOL.x,0,POOL.z]);assert.equal(art.water.stats.level,s.frontier.cistern.surface);const g=art.water.mesh.geometry,p=g.attributes.position,b=g.attributes.bedHeight;for(let i=0;i<p.count;i+=47)assert.ok(Math.abs(b.getX(i)-(poolFloor(p.getX(i)+POOL.x,p.getZ(i)+POOL.z)??0))<1e-6);art.dispose();
});
test('Stillwater draws no extra scene pass or persistent render target',()=>{
 const {art,render}=pool();render();assert.equal(art.inspect().passes,0);assert.equal(art.water.stats.renderTargets,0);assert.equal(art.water.stats.textures,1);art.dispose();
});
test('Hydraulic state, reward history and save shape remain authoritative',()=>{
 const {art,s,render}=pool();s.frontier.cistern=cisternState({version:1,phase:3,mask:6});const before=JSON.stringify(saveData(s));render();assert.equal(art.water.stats.level,POOL.low);assert.equal(JSON.stringify(saveData(s)),before);assert.equal(art.inspect().actorGround,0);art.dispose();
});
test('AR water opacity is independent of screen opacity and zero is respected',()=>{
 const {art,render}=pool();art.configure({arWaterOpacity:0});render({xr:true,ar:true});assert.equal(art.water.stats.opacity,0);assert.equal(art.water.stats.quality,'light');render();assert.equal(art.water.stats.opacity,.86);art.dispose();
});
test('Paused and quiet water freeze decoration but retain the actual sluice height',()=>{
 const {art,s,render}=pool();s.time=4;render();const a=art.water.sample(0,0);render();assert.deepEqual(art.water.sample(0,0),a);art.configure({quiet:true});s.frontier.cistern.surface=POOL.low;render();assert.equal(art.inspect().shaderTime,0);assert.equal(art.water.sample(0,0).height,POOL.low);art.dispose();
});
test('Only physically wading actors produce bounded local wake observations',()=>{
 const {art,s,render}=pool();s.mode='foot';s.frontier.cistern.surface=POOL.low;s.z=30;s.time=2;render();assert.equal(art.water.stats.bodies,1);for(let i=1;i<12;i++){s.time+=.05;s.x+=.1;render();}assert.ok(art.water.stats.emitted>0);assert.ok(art.water.stats.liveDisturbances<=12);s.lift=1;render();assert.equal(art.water.stats.bodies,0);art.dispose();
});
test('Leaving the basin hides water and clears obsolete wake tracking',()=>{
 const {art,s,render}=pool();s.x=330;render();assert.equal(art.water.stats.visible,false);s.x=POOL.x;render();assert.equal(art.water.stats.visible,true);assert.equal(art.water.stats.bodies,0);art.dispose();
});
test('Portal wrapping preserves both water shader and existing tree wind hooks on r177',()=>{
 const {art}=pool(),root=new T.Group(),forest=createGuildVegetation(root,world.trees,heightAt),portal=new PortalMaterials();portal.collect(art.group);portal.collect(root);
 const shader={uniforms:{},vertexShader:art.water.material.vertexShader,fragmentShader:art.water.material.fragmentShader};art.water.material.onBeforeCompile(shader,{});assert.ok(shader.vertexShader.includes('guildOriginalVertex'));assert.ok(shader.vertexShader.includes('wave'));assert.ok(shader.fragmentShader.includes('guildVisible'));
 let count=0;root.traverse(o=>{if(!o.material||count)return;count++;const sh={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};o.material.onBeforeCompile(sh,{});assert.ok(sh.vertexShader.includes('cwBend'));assert.ok(sh.fragmentShader.includes('guildVisible'));});assert.equal(count,1);portal.dispose();forest.dispose();art.dispose();
});
test('Disposing environment ownership does not dispose the host scene or unrelated objects',()=>{
 const {art,root}=pool();const unrelated=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial());root.add(unrelated);let count=0;art.water.material.addEventListener('dispose',()=>count++);art.dispose();art.dispose();assert.equal(count,1);assert.equal(unrelated.parent,root);
});
test('Survey hints expose tool custody before an unsuccessful socket action',()=>{
 const v=vaultState({version:1,layout:'lantern-vault-1',accepted:true,weight:'service',lens:'emitter'}),before=JSON.stringify(v);
 assert.match(vaultInstrumentHint(v,VAULT_NODES.find(n=>n.id==='shutter')),/at the service socket/);assert.match(vaultInstrumentHint(v,VAULT_NODES.find(n=>n.id==='emitter')),/retrieve/);assert.equal(JSON.stringify(v),before);
});
test('Reflector and permanent-latch hints report current mechanism state rather than generic INTERACT',()=>{
 const v={accepted:true,lens:'emitter',weight:'shutter',mirror:1,shortcut:true};assert.match(vaultInstrumentHint(v,VAULT_NODES.find(n=>n.id==='mirror')),/EAST.*Records gate open/);assert.match(vaultInstrumentHint(v,VAULT_NODES.find(n=>n.id==='latch')),/already unlatched/);
});
