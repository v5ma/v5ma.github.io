import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from '../vendor/three.module.js';
import {createWardEnvironment,WARD_TREES,WARD_CLOUDS} from '../environment/ward-environment.mjs';
import {DEFAULT_ENVIRONMENT,environmentPreferences,readEnvironmentPreferences,writeEnvironmentPreferences,ENVIRONMENT_KEY} from '../environment/preferences.mjs';
import {PortalMaterials} from '../lantern/portal.mjs';
import {fresh,serialize,blocked,support,floorHeight} from '../lantern/core.mjs';
import {ARCHIVE_CASE,ARCHIVE_GUIDE,archiveIsolated} from '../lantern/archive.mjs';
import {campaignAvailable,trackCampaign,parseCampaign} from '../lantern/campaign.mjs';
import {walkLink,routeGuide} from '../lantern/route-guide.mjs';
const make=()=>{const world=new T.Group(),env=createWardEnvironment(T,{world});return {world,env};};

test('Pinned modules match the inspected Prism blobs and use the host r177, not a second Three copy',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../environment/currentworks/provenance.json',import.meta.url)));
 for(const [name,sha]of Object.entries(manifest.files)){const b=readFileSync(new URL('../environment/currentworks/'+name,import.meta.url));assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),sha,name);}
 const {env}=make();assert.equal(T.REVISION,'177');assert.equal(env.inspect().hostThree,'177');assert.equal(env.water.mesh.isMesh,true);env.dispose();
});
test('Environment never mutates game state and follows the real canal and skiff observations',()=>{
 const {env}=make(),s=fresh(),before=JSON.stringify(s);env.update(s,{viewer:[0,2,15]});assert.equal(JSON.stringify(s),before);assert.equal(env.water.stats.level,-.75);assert.equal(env.water.stats.bodies,0);
 // Explicit visual fixture. Game physics still owns all these coordinates.
 s.ride='boat';s.x=-.5;s.z=12;for(let i=0;i<40;i++){s.time+=1/60;s.z-=.02;env.update(s,{viewer:[0,2,15]});}
 assert.ok(env.water.stats.emitted>0);assert.equal(env.water.stats.bodies,1);assert.equal(env.water.stats.effectCapacity,12);
 s.water='low';s.ride='foot';env.update(s);assert.equal(env.water.stats.visible,false);assert.equal(env.water.stats.level,-2);assert.equal(env.water.stats.liveDisturbances,0);env.dispose();
});
test('Pausable time, quiet motion and explicit minimal scenery stay independent of mission state',()=>{
 const {env}=make(),s=fresh();s.time=12;env.update(s,{viewer:[0,2,15]});const previous=env.clouds.group.children.map(m=>m.position.toArray()),amplitudes=Array.from(env.forest.uniforms.cwAmplitude.value);
 for(let i=0;i<5;i++)env.update(s,{viewer:[0,2,15]});assert.deepEqual(env.clouds.group.children.map(m=>m.position.toArray()),previous);assert.deepEqual(Array.from(env.forest.uniforms.cwAmplitude.value),amplitudes);
 env.setPreferences({...DEFAULT_ENVIRONMENT,quiet:true,scenery:false});env.update(s);assert.equal(env.water.uniforms.motion.value,0);assert.ok(Array.from(env.forest.uniforms.cwAmplitude.value).every(v=>v===0));assert.equal(env.forest.group.visible,false);assert.equal(env.clouds.group.visible,false);assert.equal(env.water.mesh.visible,true);env.dispose();
});
test('AR keeps bounded scenery, caps detail and uses center-world viewer without synthetic wakes',()=>{
 const {env,world}=make(),s=fresh();s.ride='boat';s.time=1;env.update(s,{viewer:[0,1,3]});const emitted=env.water.stats.emitted;
 world.position.set(2,0,-3);world.scale.setScalar(.08);world.updateMatrixWorld(true);env.update(s,{viewer:[0,1.6,0],xr:true,ar:true});
 assert.equal(env.water.stats.quality,'light');assert.equal(env.forest.stats.xr,true);assert.equal(env.forest.stats.ar,true);assert.equal(env.forest.group.visible,true);assert.equal(env.clouds.group.visible,true);assert.equal(env.water.stats.emitted,emitted);assert.equal(env.inspect().optics.ar,true);assert.ok(env.water.stats.opacity<1);assert.ok(env.clouds.stats.selectedTriangles<=3*448);assert.equal(env.inspect().extraGameplayRenderPasses,0);env.dispose();
});
test('Library shader hooks compose with the real portal in standard, toon, lambert and custom water shaders',()=>{
 const {env,world}=make(),portal=new PortalMaterials();portal.collect(world);
 const cases=[[env.water.material,{vertexShader:env.water.material.vertexShader,fragmentShader:env.water.material.fragmentShader,uniforms:{}}],
 [env.controls.teal,{...T.ShaderLib.toon,uniforms:{}}],[env.clouds.group.children[0].material,{...T.ShaderLib.lambert,uniforms:{}}]];
 for(const m of new Set(env.forest.group.children.flatMap(n=>n.children.flatMap(l=>l.children.map(m=>m.material)))))cases.push([m,{...T.ShaderLib.standard,uniforms:{}}]);
 // Toon controls are borrowed by the host archive mesh, attach explicitly here.
 portal.attach(env.controls.teal);
 for(const [material,shader] of cases){material.onBeforeCompile(shader,{});assert.ok(shader.vertexShader.includes('wardVertex'));assert.ok(shader.fragmentShader.includes('wardVisible'));assert.ok(shader.uniforms.wardPortalEnabled);if(material===env.water.material)assert.ok(shader.fragmentShader.includes('nearRoom'));}
 assert.ok(cases.slice(3).every(([,s])=>s.vertexShader.includes('cwBend')));env.dispose();
});
test('Prepared resources are host-owned, concurrent preparation shares work, disposal is idempotent',async()=>{
 const {env,world}=make(),scene=new T.Scene(),camera=new T.PerspectiveCamera();scene.add(world);let calls=0;
 const renderer={async compileAsync(){calls++;}};await Promise.all([env.prepare(renderer,camera,scene),env.prepare(renderer,camera,scene)]);assert.equal(env.inspect().prepared,true);assert.equal(calls,3);
 let frees=0;env.water.material.addEventListener('dispose',()=>frees++);env.dispose();env.dispose();assert.equal(frees,1);assert.equal(world.children.length,0);assert.equal(env.inspect().water.textures,0);assert.equal(env.update(fresh()),false);
});
test('Only visual preferences are saved; unfamiliar versions are retained rather than cleared',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};assert.deepEqual(readEnvironmentPreferences(storage).value,DEFAULT_ENVIRONMENT);
 writeEnvironmentPreferences(storage,{...DEFAULT_ENVIRONMENT,quiet:true});assert.equal(readEnvironmentPreferences(storage).value.quiet,true);assert.deepEqual([...store.keys()],[ENVIRONMENT_KEY]);
 store.set(ENVIRONMENT_KEY,'{"v":9}');assert.equal(readEnvironmentPreferences(storage).blocked,true);assert.throws(()=>writeEnvironmentPreferences(storage,DEFAULT_ENVIRONMENT));assert.equal(store.get(ENVIRONMENT_KEY),'{"v":9}');assert.throws(()=>environmentPreferences({v:1,quality:'ultra'}));
});
test('Archive sequel is gated behind Highline and preserves old reward validation',()=>{
 const s=fresh();assert.equal(campaignAvailable(s,'unsent'),false);assert.match(trackCampaign(s,'unsent'),/not available/);assert.equal(s.campaign.active,null);
 const c={v:1,active:null,progress:{highline:6},completed:['highline'],credits:240,route:'stealth'};s.campaign=parseCampaign(c);assert.equal(campaignAvailable(s,'unsent'),true);assert.equal(campaignAvailable(s,'flight'),false);
 assert.throws(()=>parseCampaign({...c,credits:360}));assert.equal(archiveIsolated(s),false);assert.equal(serialize(s).campaign.credits,240);
});
test('Archive room has genuine support, doorway collision and guidance, not a decorative closed box',()=>{
 const s=fresh();for(const p of [...ARCHIVE_GUIDE,...ARCHIVE_CASE.steps]){assert.equal(blocked(s,p.x,p.y,p.z),false,p.id||p.label);assert.ok(Math.abs(floorHeight(support(s,p.x,p.z,p.y),p.z)-p.y)<.02);}
 assert.ok(walkLink(s,{x:-12.5,y:10.8,z:-5.05},{x:-21.5,y:10.8,z:-5.05}));
 assert.equal(blocked(s,-17.48,17.2,-5.05),false); // above the facade top is open; old top route retained.
 assert.equal(blocked(s,-17.48,14.2,-5.05),true); // the wall above the doorway remains solid.
 const g=routeGuide(s,ARCHIVE_CASE.steps[2]);assert.ok(g.path.length>2);assert.ok(g.path.some(p=>p.y>10));
});
