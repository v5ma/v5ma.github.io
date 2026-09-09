/* Pure visual geometry and budgets. No game, DOM, audio, account or save access. */
(function(root){'use strict';
 const LIMITS=Object.freeze({jewels:40,pegs:16,stations:6,particles:112,lifetime:45});
 function preferences(value={}){value=value&&typeof value==='object'?value:{};return {look:['prismatic','refraction','classic'].includes(value.look)?value.look:'prismatic',motion:value.motion!==false,glow:value.glow!==false};}
 function diamond(sides=8){
  if(!Number.isInteger(sides)||sides<5||sides>16)throw new RangeError('Facet count must be between 5 and 16.');
  const p=[],n=[],rings=[[.35,.54],[.82,.10],[.79,.02],[0,-.80]].map(([r,y])=>Array.from({length:sides},(_,i)=>{const a=i/sides*Math.PI*2;return [Math.cos(a)*r,y,Math.sin(a)*r];}));
  function triangle(a,b,c,up=0){const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);let normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...normal);if(len<1e-9)return;const center=a.map((v,i)=>(v+b[i]+c[i])/3),out=up?normal[1]*up:normal[0]*center[0]+normal[2]*center[2];if(out<0){[b,c]=[c,b];normal=normal.map(v=>-v);}normal=normal.map(v=>v/len);p.push(...a,...b,...c);n.push(...normal,...normal,...normal);}
  for(let i=0;i<sides;i++){const j=(i+1)%sides;triangle([0,.54,0],rings[0][i],rings[0][j],1);for(let k=1;k<4;k++){triangle(rings[k-1][i],rings[k][i],rings[k][j]);triangle(rings[k-1][i],rings[k][j],rings[k-1][j]);}}
  return {positions:p,normals:n};
 }
 function ribbon(points,offset=-16,width=7,z=34.2){
  const p=[],uv=[];let distance=0;
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=-(b[1]-a[1]),l=Math.hypot(dx,dy);if(l<.01)continue;
   const nx=-dy/l,ny=dx/l,at=(q,o)=>[q[0]+nx*o,-q[1]+ny*o,z];
   const A=at(a,offset-width/2),B=at(a,offset+width/2),C=at(b,offset+width/2),D=at(b,offset-width/2);
   p.push(...A,...B,...C,...A,...C,...D);uv.push(distance/90,0,distance/90,1,(distance+l)/90,1,distance/90,0,(distance+l)/90,1,(distance+l)/90,0);distance+=l;
  }return {positions:p,uv};
 }
 class Particles{
  constructor(limit=LIMITS.particles){this.limit=limit;this.items=[];this.seed=719;}
  rand(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  burst(x,y,z,count,color,energy=1){for(let i=0;i<count;i++){const a=this.rand()*Math.PI*2,s=(.7+this.rand()*2.4)*energy;this.items.push({x,y,z,vx:Math.cos(a)*s,vy:Math.sin(a)*s+.6,life:20+Math.floor(this.rand()*24),age:0,size:1.4+this.rand()*3,color:[...color]});}if(this.items.length>this.limit)this.items.splice(0,this.items.length-this.limit);}
  advance(ticks){ticks=Math.max(0,Math.min(ticks,5));for(const p of this.items){p.age+=ticks;p.x+=p.vx*ticks;p.y+=p.vy*ticks;p.vy-=.035*ticks;}this.items=this.items.filter(p=>p.age<p.life);}
  clear(){this.items.length=0;}
 }
 root.PrismCore=Object.freeze({LIMITS,preferences,diamond,ribbon,Particles});if(typeof module!=='undefined')module.exports=root.PrismCore;
})(globalThis);
