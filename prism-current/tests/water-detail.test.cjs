'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const D=require('../modules/environment/water-detail');
test('Optical data is repeatable, bounded, and nonconstant',()=>{
 const a=D.generate(64,37),b=D.generate(64,37),c=D.generate(64,38);
 A.deepEqual(a,b);A.notDeepEqual(a.data,c.data);A.equal(a.data.length,64*64*4);
 A.ok(Math.abs(a.meanFlux-1)<1e-6);A.ok(a.maxSlope<D.SLOPE_RANGE);A.ok(a.maxFlux>2);
 for(let k=0;k<4;k++){const s=new Set();for(let i=k;i<a.data.length;i+=4)s.add(a.data[i]);A.ok(s.size>20);}
 A.throws(()=>D.generate(63),RangeError);
});
test('Refracted ray deposition conserves incident flux, including periodic edges',()=>{
 for(const seed of [1,16,83]){const {density}=D.bakeFlux(32,D.spectrum(seed));A.ok(Math.abs(density.reduce((a,b)=>a+b,0)-1024)<1e-4);}
 for(const v of D.bakeFlux(32,[]).density)A.equal(v,1);
});
test('The generated micro-wave derivatives and periodic boundary agree',()=>{
 const modes=D.spectrum(22),e=1e-5;
 for(let i=0;i<25;i++){const x=i*.171,z=-i*.113,a=D.surface(x,z,modes),b=D.surface(x+D.TILE,z-D.TILE,modes);
  for(let k=0;k<3;k++)A.ok(Math.abs(a[k]-b[k])<1e-10);
  A.ok(Math.abs(a[1]-(D.surface(x+e,z,modes)[0]-D.surface(x-e,z,modes)[0])/(2*e))<1e-7);
  A.ok(Math.abs(a[2]-(D.surface(x,z+e,modes)[0]-D.surface(x,z-e,modes)[0])/(2*e))<1e-7);
 }
});
test('Slope-moment filtering preserves unresolved variance rather than false flatness',()=>{
 const g=D.generate(64,37);let sx=0,sz=0,m=0;
 for(let i=0;i<g.data.length;i+=4){sx+=(g.data[i]/255-.5)*2*D.SLOPE_RANGE;sz+=(g.data[i+1]/255-.5)*2*D.SLOPE_RANGE;m+=g.data[i+2]/255*D.MOMENT_SCALE;}
 const n=64*64;sx/=n;sz/=n;m/=n;A.ok(m-sx*sx-sz*sz>.005);A.ok(Math.abs(sx)<.002&&Math.abs(sz)<.002);
});
test('Dielectric reflectance is finite, monotonic with grazing angle and bounded',()=>{
 A.ok(Math.abs(D.fresnel(1)-((1.3335-1)/(1.3335+1))**2)<1e-12);A.equal(D.fresnel(0),1);
 let prior=1;for(let i=0;i<=100;i++){const f=D.fresnel(i/100);A.ok(f>=0&&f<=prior+1e-12);prior=f;}
 A.throws(()=>D.fresnel(NaN),TypeError);A.throws(()=>D.fresnel(.5,0),TypeError);
});
test('Light rays remain normalized and travel down into the authored bed',()=>{
 for(const a of [-.25,0,.25])for(const b of [-.25,0,.25]){const r=D.refract(a,b);A.ok(Math.abs(Math.hypot(...r)-1)<1e-10);A.ok(r[1]<-.5);}
});
test('Original pebble data is seeded RGBA albedo/relief without imported assets',()=>{
 const a=D.pebbles(64,32);A.deepEqual(a,D.pebbles(64,32));A.notDeepEqual(a,D.pebbles(64,33));A.equal(a.length,64*64*4);
 A.ok(new Set(a).size>100);A.throws(()=>D.pebbles(0),RangeError);
});
test('ES entry supplies the same reusable optical generator',async()=>{A.equal((await import('../modules/environment/water-detail.mjs')).default,D);});
