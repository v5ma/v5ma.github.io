/* Authored distance-parametrized presentation surface. No gameplay writes.
 * s is the existing horizontal coordinate. Up, gravity and all collisions remain
 * in the original simulation. A missing/unknown profile is exactly straight.
 */
export const PROFILE=Object.freeze({version:1,id:'market-sweep-v1',start:640,end:2840,amplitude:100,length:9216,samples:2049,depthLimit:180});
export function accepts(value){return value?.version===1&&value.id===PROFILE.id;}
export function depth(s){
 if(!Number.isFinite(s))throw new TypeError('Nonfinite route coordinate');
 if(s<=PROFILE.start||s>=PROFILE.end)return {z:0,dz:0};
 const a=2*Math.PI*(s-PROFILE.start)/(PROFILE.end-PROFILE.start),sin=Math.sin(a),cos=Math.cos(a);
 return {z:-PROFILE.amplitude*sin**3,dz:-3*PROFILE.amplitude*sin*sin*cos*2*Math.PI/(PROFILE.end-PROFILE.start)};
}
export function createPath(){
 const step=PROFILE.length/(PROFILE.samples-1),data=new Float32Array(PROFILE.samples*4);
 let x=0,prev=1;
 for(let i=0;i<PROFILE.samples;i++){
  const s=i*step,{z,dz}=depth(s),tx=Math.sqrt(1-dz*dz);
  if(i)x+=(prev+tx)*step/2;
  data.set([x-s,z,tx,dz],i*4);prev=tx;
 }
 function sample(s){
  if(!Number.isFinite(s))throw new TypeError('Nonfinite route coordinate');
  const f=Math.max(0,Math.min(PROFILE.samples-1,s/step)),i=Math.floor(f),j=Math.min(i+1,PROFILE.samples-1),u=f-i;
  const v=Array.from({length:4},(_,k)=>data[4*i+k]*(1-u)+data[4*j+k]*u),n=Math.hypot(v[2],v[3]);
  return {x:s+v[0],z:v[1],tx:v[2]/n,tz:v[3]/n};
 }
 function project(p){
  if(p.length!==3||!p.every(Number.isFinite))throw new TypeError('Invalid presentation point');
  const c=sample(p[0]),d=Math.max(-PROFILE.depthLimit,Math.min(PROFILE.depthLimit,p[2]));
  return [c.x-d*c.tz,p[1],c.z+d*c.tx+p[2]-d];
 }
 function rigid(p,anchor){
  const base=project([anchor[0],p[1],anchor[1]]),c=sample(anchor[0]),x=p[0]-anchor[0],z=p[2]-anchor[1];
  return [base[0]+x*c.tx-z*c.tz,p[1],base[2]+x*c.tz+z*c.tx];
 }
 return Object.freeze({data,step,sample,project,rigid});
}
