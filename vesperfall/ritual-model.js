/* Pure VR-gesture rules. Grip-space palm normals follow the WebXR convention:
 * back of right hand is +X, back of left hand is -X; the palm is opposite. */
(function(root){'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 function rotate(v,q){const [x,y,z]=v,[qx,qy,qz,qw]=Array.isArray(q)?q:[q.x,q.y,q.z,q.w],ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;return [ix*qw+iw*-qx+iy*-qz-iz*-qy,iy*qw+iw*-qy+iz*-qx-ix*-qz,iz*qw+iw*-qz+ix*-qy-iy*-qx];}
 function palmNormal(q,hand){return rotate([hand==='left'?1:-1,0,0],q);}
 function palmVisible(p,q,hand,eye,forward,wasVisible=false){if(!p||!q||!eye)return false;const n=palmNormal(q,hand),d=distance(p,eye),f=p.map((x,i)=>(x-eye[i])/(d||1));return n[1]>(wasVisible?.38:.58)&&d>.18&&d<1.35&&p[1]>eye[1]-.85&&f.reduce((s,x,i)=>s+x*forward[i],0)>.2;}
 function radialIndex(x,y,count,current){if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<.55)return current;const angle=(Math.atan2(x,-y)+Math.PI*2)%(Math.PI*2);return Math.round(angle/(Math.PI*2)*count)%count;}
 class ReloadGesture{
  constructor(){this.reset();}
  reset(){this.grabbed=false;this.armed=false;this.prev=false;this.progress=0;this.last=null;}
  update(local,pressed,allowed=true,short=false){if(!allowed||!local||!local.every(Number.isFinite)){this.reset();return {progress:0,active:false,complete:false};}if(!pressed&&!this.grabbed)this.armed=true;let start=false,complete=false;
   if(pressed&&!this.prev&&this.armed&&distance(local,[0,.04,.06])<.28){this.grabbed=true;this.origin=[...local];this.progress=0;start=true;}
   if(this.grabbed&&pressed){const delta=local.map((v,i)=>v-this.origin[i]);if(Math.hypot(delta[0],delta[1])>.38||Math.abs(delta[2])>.7){this.reset();this.prev=true;return {progress:0,active:false,complete:false};}this.progress=clamp(delta[2]/(short?.13:.22),0,1);}
   if(this.grabbed&&!pressed&&this.prev){complete=this.progress>=.96;this.grabbed=false;this.progress=0;this.armed=false;}
   this.prev=pressed;return {start,complete,active:this.grabbed,progress:this.progress};
  }
 }
 class Focus{
  constructor(){this.remaining=3;this.open=false;this.slow=true;}
  update(dt,active){dt=clamp(Number(dt)||0,0,.08);if(!active){this.open=false;return;}this.remaining=clamp(this.remaining+(this.open?-dt:dt*.45),0,3);}
  get scale(){return this.open&&this.slow&&this.remaining>0?.2:1;}
 }
 const api={palmNormal,palmVisible,radialIndex,ReloadGesture,Focus,rotate};root.RitualModel=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
