// Original distance-driven grounding utilities. Units are explicit: contacts in
// world metres, the two-bone solve in the character's local coordinates.
export const GROUNDED_BUILD='grounded-xr-20260914.1';
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const delta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const copy=(a,b)=>{a[0]=b[0];a[1]=b[1];a[2]=b[2];return a;};
const gap=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
export function solveLimb(target,upper,lower,bend=[0,0,1],out={knee:[0,0,0],end:[0,0,0]}){
 if(!(upper>0&&lower>0&&Number.isFinite(upper+lower)))throw new RangeError('Positive finite bone lengths required');
 let [x,y,z]=target;if(![x,y,z].every(Number.isFinite)){x=0;y=-1;z=0;}
 let raw=Math.hypot(x,y,z);if(raw<1e-9){x=0;y=-1;z=0;raw=1;}
 x/=raw;y/=raw;z/=raw;
 const maximum=(upper+lower)*.9999,minimum=Math.abs(upper-lower)+1e-7,soft=Math.min(upper,lower)*.04;
 const softened=raw>maximum-soft?maximum-soft*Math.exp(-(raw-maximum+soft)/soft):raw;
 const d=clamp(softened,minimum,maximum),along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 let dot=bend[0]*x+bend[1]*y+bend[2]*z,bx=bend[0]-dot*x,by=bend[1]-dot*y,bz=bend[2]-dot*z,n=Math.hypot(bx,by,bz);
 if(n<1e-7){const seed=Math.abs(x)<.8?[1,0,0]:[0,1,0];dot=seed[0]*x+seed[1]*y;bx=seed[0]-dot*x;by=seed[1]-dot*y;bz=-dot*z;n=Math.hypot(bx,by,bz);}
 out.knee[0]=x*along+bx/n*height;out.knee[1]=y*along+by/n*height;out.knee[2]=z*along+bz/n*height;
 out.end[0]=x*d;out.end[1]=y*d;out.end[2]=z*d;return out;
}
export class FootContact{
 constructor(){this.position=[0,0,0];this.anchor=[0,0,0];this.start=[0,0,0];this.yaw=0;this.startYaw=0;this.locked=false;this.initialized=false;this.swing=0;this.wait=false;this.steps=0;}
 reset(point,yaw=0,grounded=true){copy(this.position,point);copy(this.anchor,point);copy(this.start,point);this.yaw=yaw;this.startYaw=yaw;this.locked=grounded;this.initialized=true;this.swing=0;this.wait=false;}
 update({point,hip,yaw=0,stance=true,grounded=true,dt=0,reset=false,reach=1,release=.4,lift=.15,duration=.18}){
  if(!this.initialized||reset){this.reset(point,yaw,grounded);return this.position;}
  if(dt<=0)return this.position;
  dt=clamp(dt,0,.1);
  if(!grounded){copy(this.position,point);this.locked=false;this.swing=0;this.wait=false;this.yaw=yaw;return this.position;}
  if(this.wait&&stance)this.wait=false;
  const strained=gap(this.anchor,hip)>reach||Math.hypot(point[0]-this.anchor[0],point[2]-this.anchor[2])>release;
  if(this.locked&&((!stance&&!this.wait)||strained)){
   this.locked=false;copy(this.start,this.position);this.startYaw=this.yaw;this.swing=0;
  }
  if(!this.locked){
   if(this.swing===0)copy(this.start,this.position);
   this.swing+=dt;const t=clamp(this.swing/Math.max(.06,duration),0,1),s=t*t*(3-2*t),arc=16*t*t*(1-t)*(1-t);
   for(let i=0;i<3;i++)this.position[i]=this.start[i]+(point[i]-this.start[i])*s;
   this.position[1]+=arc*(lift+Math.max(0,point[1]-this.start[1])*.65);
   this.yaw=this.startYaw+delta(this.startYaw,yaw)*s;
   if(t===1){copy(this.anchor,point);copy(this.position,point);this.yaw=yaw;this.locked=true;this.wait=!stance;this.steps++;}
  }else copy(this.position,this.anchor);
  return this.position;
 }
}
