/* Currentworks Water Detail 0.1.0. Seeded, loading-time optical data.
 * Original spectrum/pebbles and CPU flux bake. Refracted-grid focusing is
 * inspired by Clearwater (MIT, Lumaris 2026); see CLEARWATER-NOTICE.txt.
 * This is NOT its FFT renderer. No external assets, renderer or animation loop.
 */
(function(root){'use strict';
 const VERSION='0.1.0',TILE=4,DEPTH=1.25,SLOPE_RANGE=.35,MOMENT_SCALE=.25,FLUX_SCALE=4;
 const SUN=Object.freeze([-.39,.78,.48]);
 const MODES=Object.freeze([[1,2,.075],[-3,1,.063],[2,5,.052],[-7,2,.044],[5,8,.035],[-11,-4,.030],[9,-9,.025],[-2,13,.024],[15,5,.019],[-17,8,.017],[7,19,.014],[-12,-17,.012]].map(Object.freeze));
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
 function random(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
 function sizeCheck(n){if(![32,64,128,256].includes(n))throw new RangeError('Optical texture size must be 32, 64, 128 or 256.');}
 function spectrum(seed=17041){const rand=random(seed);return MODES.map(([x,z,a])=>{const k=Math.hypot(x,z)*Math.PI*2/TILE;return {x,z,a,k,phase:rand()*Math.PI*2};});}
 function surface(x,z,modes,out=[0,0,0]){let h=0,sx=0,sz=0;for(const m of modes){const kx=m.x*Math.PI*2/TILE,kz=m.z*Math.PI*2/TILE,phase=kx*x+kz*z+m.phase;const a=m.a/m.k;h+=a*Math.sin(phase);const g=a*Math.cos(phase);sx+=g*kx;sz+=g*kz;}out[0]=h;out[1]=sx;out[2]=sz;return out;}
 // Unpolarized dielectric Fresnel, adapted from Clearwater's fresnel().
 function fresnel(ci,ior=1.3335){
  if(!Number.isFinite(ci)||!Number.isFinite(ior)||ior<=1)throw new TypeError('Finite incidence and IOR > 1 required.');
  ci=clamp(ci,0,1);const st2=(1-ci*ci)/(ior*ior),ct=Math.sqrt(1-st2);
  const rs=(ci-ior*ct)/(ci+ior*ct),rp=(ior*ci-ct)/(ior*ci+ct);return .5*(rs*rs+rp*rp);
 }
 function refract(sx,sz,sun=SUN,out=[0,0,0]){
  const sl=Math.hypot(...sun),nl=Math.hypot(sx,1,sz),nx=-sx/nl,ny=1/nl,nz=-sz/nl;
  const ix=-sun[0]/sl,iy=-sun[1]/sl,iz=-sun[2]/sl,eta=1/1.3335,d=ix*nx+iy*ny+iz*nz;
  const k=eta*d+Math.sqrt(Math.max(0,1-eta*eta*(1-d*d)));
  out[0]=eta*ix-k*nx;out[1]=eta*iy-k*ny;out[2]=eta*iz-k*nz;return out;
 }
 function bakeFlux(size,modes,sun=SUN){
  sizeCheck(size);const density=new Float32Array(size*size),ray=[0,0,0],v=[0,0,0],flat=refract(0,0,sun);
  const shift=[flat[0]*DEPTH/-flat[1],flat[2]*DEPTH/-flat[1]],rays=size*2,weight=.25;
  // Four source rays per destination texel; bilinear flux splats conserve total
  // incident energy before display clamping. No frame-dependent allocation.
  for(let j=0;j<rays;j++)for(let i=0;i<rays;i++){
   const x=(i+.5)/rays*TILE,z=(j+.5)/rays*TILE;surface(x,z,modes,v);refract(v[1],v[2],sun,ray);
   const t=(DEPTH+v[0])/Math.max(.05,-ray[1]);
   const fx=(x+ray[0]*t-shift[0])/TILE*size-.5,fz=(z+ray[2]*t-shift[1])/TILE*size-.5;
   const ix=Math.floor(fx),iz=Math.floor(fz),u=fx-ix,w=fz-iz;
   for(let a=0;a<2;a++)for(let b=0;b<2;b++)density[((iz+b)%size+size)%size*size+((ix+a)%size+size)%size]+=weight*(a?u:1-u)*(b?w:1-w);
  }
  return {density,shift};
 }
 function generate(size=128,seed=17041){
  sizeCheck(size);const modes=spectrum(seed),{density,shift}=bakeFlux(size,modes),data=new Uint8Array(size*size*4),v=[0,0,0];
  let energy=0,maxSlope=0,maxFlux=0;
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){
   const i=z*size+x;surface((x+.5)/size*TILE,(z+.5)/size*TILE,modes,v);
   data[i*4]=Math.round((clamp(v[1]/SLOPE_RANGE,-1,1)*.5+.5)*255);
   data[i*4+1]=Math.round((clamp(v[2]/SLOPE_RANGE,-1,1)*.5+.5)*255);
   data[i*4+2]=Math.round(clamp((v[1]*v[1]+v[2]*v[2])/MOMENT_SCALE,0,1)*255);
   data[i*4+3]=Math.round(clamp(density[i]/FLUX_SCALE,0,1)*255);
   energy+=density[i];maxFlux=Math.max(maxFlux,density[i]);maxSlope=Math.max(maxSlope,Math.hypot(v[1],v[2]));
  }
  return {data,size,shift,energy,meanFlux:energy/(size*size),maxFlux,maxSlope};
 }
 function pebbles(size=256,seed=7819){
  sizeCheck(size);const cells=16,rand=random(seed),stones=Array.from({length:cells*cells},()=>({x:rand()*.52+.24,z:rand()*.52+.24,rx:.32+rand()*.20,rz:.31+rand()*.20,tone:rand()}));
  const data=new Uint8Array(size*size*4);
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){
   const px=(x+.5)/size*cells,pz=(z+.5)/size*cells,ix=Math.floor(px),iz=Math.floor(pz);let closest=99,chosen=null,dx=0,dz=0;
   for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){
    const stone=stones[((iz+b+cells)%cells)*cells+(ix+a+cells)%cells];const ax=(px-ix-a-stone.x)/stone.rx,az=(pz-iz-b-stone.z)/stone.rz,d=ax*ax+az*az;
    if(d<closest){closest=d;chosen=stone;dx=ax;dz=az;}
   }
   const dome=Math.sqrt(Math.max(0,1-closest)),cover=1-smooth(.80,1.02,closest),height=dome*cover;
   const light=clamp(.55+.38*dome-.14*dx+.10*dz,.28,1),tone=chosen.tone,grit=(rand()-.5)*.025;
   const base=[.20,.22,.16],stone=[.31+.23*tone,.32+.22*tone,.27+.24*tone];const i=(z*size+x)*4;
   for(let k=0;k<3;k++)data[i+k]=Math.round(clamp(base[k]*(1-cover)+stone[k]*light*cover+grit,0,1)*255);
   data[i+3]=Math.round(height*255);
  }
  return data;
 }
 const api=Object.freeze({VERSION,TILE,DEPTH,SLOPE_RANGE,MOMENT_SCALE,FLUX_SCALE,SUN,MODES,spectrum,surface,fresnel,refract,bakeFlux,generate,pebbles});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SVGNWaterDetail=api;
})(globalThis);
