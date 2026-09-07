/* Surface coordinates are unit vectors, not a wrapped flat x/z map. */
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const add=(a,b)=>a.map((x,i)=>x+b[i]);
export const sub=(a,b)=>a.map((x,i)=>x-b[i]);
export const mul=(a,t)=>a.map(x=>x*t);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const length=a=>Math.hypot(...a);
export function unit(v){const m=length(v);if(!Number.isFinite(m)||m<1e-10)throw Error('A surface direction must be finite and nonzero.');return mul(v,1/m);}
export const angle=(a,b)=>Math.acos(clamp(dot(a,b),-1,1));
export const geo=(a,b,r)=>angle(a,b)*r;
export const at=(u,v=0)=>[Math.sin(u)*Math.cos(v),Math.cos(u)*Math.cos(v),Math.sin(v)];
export function tangent(n){const u=Math.atan2(n[0],n[1]);return [Math.cos(u),-Math.sin(u),0];}
export function rotate(v,n,a){return add(add(mul(v,Math.cos(a)),mul(cross(n,v),Math.sin(a))),mul(n,dot(n,v)*(1-Math.cos(a))));}
export function projected(v,n){const p=sub(v,mul(n,dot(v,n)));return length(p)>1e-9?unit(p):tangent(n);}
export function move(n,f,distance,radius){
 const a=distance/radius,co=Math.cos(a),si=Math.sin(a);
 // Parallel transport the heading while following a great-circle step. This
 // works on the back and at the poles, without longitude seams or Euler flips.
 const next=unit(add(mul(n,co),mul(f,si)));
 return {n:next,f:projected(sub(mul(f,co),mul(n,si)),next)};
}
export function slerp(a,b,t){const k=angle(a,b);if(k<1e-8)return [...a];if(k>Math.PI-1e-5)return move(a,tangent(a),k*t,1).n;return unit(add(mul(a,Math.sin((1-t)*k)),mul(b,Math.sin(t*k))));}
export function segmentDistance(p,a,b){const ab=sub(b,a),d=dot(ab,ab),t=d?clamp(dot(sub(p,a),ab)/d,0,1):0;return length(sub(p,add(a,mul(ab,t))));}
export const hash=n=>{const s=Math.sin(n*17.23+59.42)*47843.728;return s-Math.floor(s);};
