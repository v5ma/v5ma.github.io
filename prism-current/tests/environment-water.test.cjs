/* Pure mathematics, contracts and integration tests; not GPU/device acceptance. */
'use strict';
const {test}=require('node:test'), A=require('node:assert/strict'), fs=require('node:fs'),path=require('node:path');
const W=require('../modules/environment/water');
const close=(a,b,t=1e-6)=>A.ok(Math.abs(a-b)<=t,`${a} != ${b}`);
test('Water presets, wave data and quality budgets are immutable',()=>{
 A.equal(W.VERSION,'0.1.0');for(const p of Object.values(W.PRESETS)){A.ok(Object.isFrozen(p));for(const v of [p.flow,p.deep,p.absorption])A.ok(Object.isFrozen(v));}
 A.throws(()=>W.WAVES[0][2]=900,TypeError);A.throws(()=>W.PRESETS.river.flow[0]=9,TypeError);
});
test('Options bound nonfinite, excessive and unknown configuration',()=>{
 for(const input of [null,undefined,[],42,'bad'])A.equal(W.options(input).preset,'river');
 const c=W.options({preset:'__proto__',quality:'bad',width:Infinity,length:1e9,level:NaN,opacity:4,depth:-4,seed:NaN});
 A.equal(c.quality,'balanced');A.equal(c.width,10.5);A.equal(c.length,512);A.equal(c.level,-.18);A.equal(c.opacity,1);A.equal(c.depth,.1);
 A.throws(()=>W.create({}),/THREE/);
});
test('Analytic Gerstner derivatives match centered finite differences',()=>{
 for(const preset of Object.keys(W.PRESETS))for(const time of [0,.04,7,84.2])for(const [x,z]of [[0,-2],[2.8,-19],[-4.2,-31]]){
  const c=W.options({preset}),a=W.evaluate(x,z,time,c),e=1e-5;
  const x0=W.evaluate(x-e,z,time,c),x1=W.evaluate(x+e,z,time,c),z0=W.evaluate(x,z-e,time,c),z1=W.evaluate(x,z+e,time,c);
  for(let k=0;k<3;k++){close(a.dx[k],(x1.position[k]-x0.position[k])/(2*e),1e-7);close(a.dz[k],(z1.position[k]-z0.position[k])/(2*e),1e-7);}
  close(Math.hypot(...a.normal),1,1e-12);A.ok(a.normal[1]>.80);
 }
});
test('Wave steepness cannot overturn the surface for any preset',()=>{
 for(const p of Object.values(W.PRESETS)){
  const bound=W.WAVES.reduce((sum,w)=>sum+w[2]*p.amplitude*(2*Math.PI/w[3])*p.chop,0);A.ok(bound<.5);
  for(let i=0;i<500;i++){
   const a=W.evaluate(Math.sin(i)*5,-i*.17,i*.31,W.options({preset:Object.keys(W.PRESETS).find(k=>W.PRESETS[k]===p)}),.001);
   A.ok(a.dx[0]*a.dz[2]-a.dz[0]*a.dx[2]>.5);
  }
 }
});
test('Quiet mode has a level stationary surface and an up normal',()=>{
 for(const t of [0,12,1e6]){
  const a=W.evaluate(2,-4,t,W.options({quiet:true,level:.67}));A.deepEqual(a.position,[2,.67,-4]);A.deepEqual(a.normal,[0,1,0]);
 }
});
test('Coarse geometry filters sub-grid waves rather than aliasing them',()=>{
 const c=W.options({level:.3});A.deepEqual(W.evaluate(2,-5,8,c,3).position,[2,.3,-5]);
 A.notDeepEqual(W.evaluate(2,-5,8,c,.1).position,[2,.3,-5]);
});
test('Host time and tide are pure inputs, not a wall-clock owner',()=>{
 const c=Object.freeze(W.options({level:.2})),a=W.evaluate(0,-8,4,c),b=W.evaluate(0,-8,4,c);A.deepEqual(a,b);
 const up=W.evaluate(0,-8,4,{...c,level:.7});close(up.position[1]-a.position[1],.5);A.equal(up.position[0],a.position[0]);
});
test('Disturbances reuse twelve slots under prolonged emission',()=>{
 const p=new W.Disturbances(),slots=p.items.slice();for(let i=0;i<10000;i++)p.add(0,-2,i*.1,0,1,.4,.5,0);
 A.equal(p.items.length,12);A.ok(p.items.every((v,i)=>v===slots[i]));A.equal(p.emitted,10000);A.ok(p.count(999.9)<=12);
 p.clear();A.equal(p.count(999.9),0);A.equal(p.emitted,0);A.ok(p.items.every((v,i)=>v===slots[i]));
});
test('Invalid disturbance observations never create visible effects',()=>{
 const p=new W.Disturbances();for(const row of [[NaN,0,0,0,0,.4,.5,0],[0,0,-1,0,0,.4,.5,0],[0,0,0,Infinity,0,.4,.5,0],[0,0,0,0,0,.4,0,0]])A.equal(p.add(...row),false);
 A.equal(p.emitted,0);A.equal(p.add(0,0,0,900,-900,900,900,7),true);A.equal(p.items[0].radius,2.5);A.equal(p.items[0].vx,10);A.equal(p.items[0].vz,-10);A.equal(p.items[0].kind,0);
});
test('Effects expire and no old history resurrects after reset',()=>{
 const p=new W.Disturbances();p.add(0,0,1,0,0,.4,.5,1);A.equal(p.count(.9),0);A.equal(p.count(1.1),1);A.equal(p.count(4.3),0);p.clear();A.equal(p.count(1.1),0);
});
test('Seeded data texture is reproducible, nonconstant and bounded',()=>{
 const a=W.noiseData(128,17),b=W.noiseData(128,17),c=W.noiseData(128,18);A.deepEqual(a,b);A.notDeepEqual(a,c);
 A.equal(a.length,128*128*4);for(let channel=0;channel<4;channel++){const set=new Set();for(let i=channel;i<a.length;i+=4)set.add(a[i]);A.ok(set.size>30);}
 A.throws(()=>W.noiseData(63),RangeError);
});
test('Wave constants in GLSL are generated from the CPU table',()=>{
 for(const w of W.WAVES)A.ok(W.shaders.vertexShader.includes(w[0].toFixed(9)+','+w[1].toFixed(9)));
 A.match(W.shaders.vertexShader,/smoothstep\(meshStep\*2\.,meshStep\*4\.,lambda\)/);
});
test('Stereo-safe shader shading uses per-eye view data, no screen-space sampling',()=>{
 A.match(W.shaders.vertexShader,/vEye=-view.xyz/);A.match(W.shaders.fragmentShader,/normalize\(vEye\)/);
 A.doesNotMatch(Object.values(W.shaders).join('\n'),/gl_FragCoord|cameraPosition|sampler2D\s+(?:screen|depth)|textureLod/);
 A.match(W.shaders.fragmentShader,/float alpha=opacity\*/);A.match(W.shaders.fragmentShader,/if\(opacity<.002\)discard/);
});
test('Reusable module owns no renderer, input, storage, network or animation loop',()=>{
 const src=fs.readFileSync(path.join(__dirname,'../modules/environment/water.js'),'utf8');
 A.doesNotMatch(src,/requestAnimationFrame|performance\.now|Date\.now|localStorage|new T\.WebGLRenderer|new T\.WebGLRenderTarget|document\.|fetch\(/);
});
test('Main Prism loads water before art and keeps the game and UI scripts',()=>{
 const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 A.ok(html.indexOf('modules/environment/water.js')<html.indexOf('src="./river/art.js'));
 A.match(html,/river\/rotunda\.js/);A.match(html,/river\/xr\.js/);A.match(html,/river\/app\.js\?v=0.11.1/);
 const art=fs.readFileSync(path.join(root,'river/art.js'),'utf8');A.match(art,/SVGNWater.create/);A.match(art,/waterSystem\.dispose\(\)/);A.match(art,/waterSystem\.reset\(\)/);
 A.doesNotMatch(art,/function wave\(/);A.match(art,/water:waterSystem.stats/);
});
test('ES-module facade exposes the same independent implementation',async()=>{
 const esm=await import('../modules/environment/water.mjs');A.equal(esm.VERSION,W.VERSION);A.equal(esm.default.create,W.create);A.equal(esm.evaluate,W.evaluate);
});
